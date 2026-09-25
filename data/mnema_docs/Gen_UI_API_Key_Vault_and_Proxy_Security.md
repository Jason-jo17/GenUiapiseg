# Gen UI — API Key Vault & CORS Proxy Security Specification

## 1. Security Philosophy
Storing third-party API credentials in single-page apps or exposing raw secret keys to client-side code introduces significant security vulnerabilities. Gen UI enforces a **Zero-Client-Secrets Policy**:
1. All secret API keys are encrypted at rest using industry-standard symmetric cryptography.
2. Raw key values are never returned to client applications in API responses.
3. Third-party API calls requiring secret keys are proxied strictly through server-side handlers (`/api/proxy`), where credentials are decrypted and auto-injected into outgoing headers.

---

## 2. Encryption Implementation (`src/lib/crypto.ts`)
Gen UI uses Node.js native `crypto` module with the **AES-256-GCM** cipher algorithm.

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = Buffer.from(process.env.ENCRYPTION_KEY || 'default-secret-key-32-chars-long!', 'utf-8');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(cipherText: string): string {
  const [ivHex, authTagHex, encryptedText] = cipherText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

## 3. Server-side Proxy Architecture (`/api/proxy`)
- **Route Handler**: `src/app/api/proxy/route.ts`
- **Request Flow**:
  1. Frontend submits target URL, method, query params, headers, and optional `keyService` tag.
  2. Proxy checks authentication session via NextAuth.js.
  3. If `keyService` is provided, proxy fetches active encrypted key record from PostgreSQL for the user.
  4. Proxy decrypts key value server-side in memory.
  5. Proxy injects header (e.g., `Authorization: Bearer <key>` or `X-API-Key: <key>`).
  6. Proxy executes server-to-server `fetch()` request, measuring latency in milliseconds.
  7. Proxy strips sensitive headers and returns status, headers, latency, and response payload to frontend client.

---

## 4. Key Management API Endpoints (`/api/keys`)
- `GET /api/keys`: List user's key metadata (id, label, service, domain, isActive, lastTested, testStatus). Masked preview string returned (e.g. `sk-****1234`).
- `POST /api/keys`: Encrypt and insert new key entry into `api_keys` table.
- `PATCH /api/keys`: Toggle active status or update label/notes.
- `DELETE /api/keys?id=<id>`: Hard delete key entry from user's vault.
- `POST /api/keys/test`: Trigger a proxy health check call using stored key to verify service connectivity and record test status (`ok` or `fail`).
