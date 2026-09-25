import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { auth } from '@/auth';
import { eq, and, ilike } from 'drizzle-orm';
import { decrypt } from '@/lib/crypto';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import dns from 'dns';

export const runtime = 'nodejs';

const ENCRYPTION_KEY: string = (() => {
  const v = process.env.GENUI_VAULT_PASSPHRASE;
  if (!v) throw new Error('GENUI_VAULT_PASSPHRASE env var is required to encrypt/decrypt the key vault');
  return v;
})();

/**
 * Blocks loopback, private, link-local (incl. cloud metadata 169.254.169.254),
 * and unspecified addresses for both IPv4 and IPv6.
 */
function isBlockedIP(ip: string): boolean {
  // IPv4-mapped IPv6, e.g. ::ffff:169.254.169.254
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  const v4 = mapped ? mapped[1] : ip;

  if (/^\d+\.\d+\.\d+\.\d+$/.test(v4)) {
    return (
      /^127\./.test(v4) ||        // loopback
      /^10\./.test(v4) ||         // private
      /^192\.168\./.test(v4) ||   // private
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(v4) || // private
      /^169\.254\./.test(v4) ||   // link-local, incl. cloud metadata
      /^0\./.test(v4)             // "this network"
    );
  }

  const lower = ip.toLowerCase();
  return (
    lower === '::1' ||                    // loopback
    lower === '::' ||                     // unspecified
    /^fe80:/.test(lower) ||               // link-local
    /^f[cd][0-9a-f]{2}:/.test(lower)      // unique local (fc00::/7)
  );
}

/** Resolves the hostname and checks every returned address against the blocklist. */
async function resolvesToBlockedAddress(hostname: string): Promise<boolean> {
  if (isBlockedIP(hostname)) return true; // literal IP in the URL
  try {
    const records = await dns.promises.lookup(hostname, { all: true });
    return records.some(r => isBlockedIP(r.address));
  } catch {
    // DNS lookup failure — let the subsequent fetch() surface the real error
    return false;
  }
}

// Upstash Redis rate limiter setup (graceful fallback if env vars missing)
let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, '1 m'), // Max 30 req/min
    analytics: true,
  });
}

// Fallback in-memory map for local dev without Redis
const fallbackRequestCounts = new Map<string, { count: number; resetAt: number }>();

async function checkRateLimit(domain: string, userId: string): Promise<boolean> {
  const identifier = `${userId}:${domain}`;
  
  if (ratelimit) {
    const { success } = await ratelimit.limit(identifier);
    return success;
  }
  
  // Fallback to in-memory rate limiting
  const now = Date.now();
  const entry = fallbackRequestCounts.get(identifier);
  
  if (!entry || entry.resetAt < now) {
    fallbackRequestCounts.set(identifier, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  
  if (entry.count >= 30) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id; // Optional for proxy if we allow public, but wait, API keys belong to users.
  // Actually, proxy might be called by the client component. It MUST have a session to access keys.
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  
  try {
    const body = await req.json() as {
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: string;
      keyId?: string;
    };
    
    const { url, method = 'GET', headers = {}, body: reqBody, keyId } = body;
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    // Parse domain for rate limiting
    let domain: string;
    let protocol: string;
    try {
      const parsed = new URL(url);
      domain = parsed.hostname;
      protocol = parsed.protocol;
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // SSRF Protection: only allow http(s), and block loopback/private/link-local
    // targets by resolved IP (not just hostname string) to prevent DNS-rebinding bypass.
    if (protocol !== 'http:' && protocol !== 'https:') {
      return NextResponse.json({ error: 'Only http(s) URLs are allowed' }, { status: 403 });
    }
    if (domain === 'localhost' || (await resolvesToBlockedAddress(domain))) {
      return NextResponse.json({ error: 'Access to local networks is forbidden' }, { status: 403 });
    }
    
    // Rate limit check
    const isAllowed = await checkRateLimit(domain, userId);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Rate limit exceeded for this domain' }, { status: 429 });
    }
    
    // Build request headers
    const finalHeaders: Record<string, string> = {
      'User-Agent': 'GenUI-API-Explorer/1.0',
      'Accept': 'application/json',
      ...headers,
    };
    
    // Auto-inject API key if keyId provided or domain matches
    if (keyId) {
      const [keyRow] = await db.select().from(apiKeys).where(
        and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId), eq(apiKeys.isActive, 1))
      );
      if (keyRow) {
        try {
          const keyValue = decrypt(keyRow.valueEnc, ENCRYPTION_KEY);
          // Common API key header patterns
          finalHeaders['X-API-Key'] = keyValue;
          // Also try Authorization header for Bearer tokens
          if (!finalHeaders['Authorization']) {
            finalHeaders['Authorization'] = `Bearer ${keyValue}`;
          }
        } catch {
          console.warn('[proxy] Failed to decrypt key', keyId);
        }
      }
    } else {
      // Auto-match by domain
      const [matchingKey] = await db.select().from(apiKeys).where(
        and(
          ilike(apiKeys.domain, `%${domain}%`),
          eq(apiKeys.userId, userId),
          eq(apiKeys.isActive, 1)
        )
      ).limit(1);
      
      if (matchingKey) {
        try {
          const keyValue = decrypt(matchingKey.valueEnc, ENCRYPTION_KEY);
          finalHeaders['X-API-Key'] = keyValue;
        } catch {
          // Ignore decryption errors
        }
      }
    }
    
    // Make the actual request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    
    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: finalHeaders,
        body: method !== 'GET' && method !== 'HEAD' ? reqBody : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    
    const latencyMs = Date.now() - start;
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((v, k) => { responseHeaders[k] = v; });
    
    // Try to parse as JSON, fall back to text
    let data: unknown;
    const contentType = response.headers.get('content-type') ?? '';
    try {
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch {
      data = null;
    }
    
    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      data,
      headers: responseHeaders,
      latencyMs,
      url,
      method,
    });
    
  } catch (err) {
    const latencyMs = Date.now() - start;
    const error = err instanceof Error ? err.message : 'Unknown error';
    
    return NextResponse.json({
      status: 0,
      ok: false,
      data: null,
      error,
      latencyMs,
    }, { status: 500 });
  }
}
