import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { eq, desc, and, ilike } from 'drizzle-orm';
import { encrypt, decrypt, maskKey } from '@/lib/crypto';
import { auth } from '@/auth';

const VAULT_PASSPHRASE: string = (() => {
  const v = process.env.GENUI_VAULT_PASSPHRASE;
  if (!v) throw new Error('GENUI_VAULT_PASSPHRASE env var is required to encrypt/decrypt the key vault');
  return v;
})();

// GET /api/keys — list all keys (values masked)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const service = searchParams.get('service');
  
  const conditions = [eq(apiKeys.userId, session.user.id)];
  if (service) {
    conditions.push(ilike(apiKeys.service, `%${service}%`));
  }
  
  const rows = await db
    .select()
    .from(apiKeys)
    .where(and(...conditions))
    .orderBy(desc(apiKeys.createdAt));
  
  // Decrypt to get actual values then re-mask for display
  const masked = rows.map(row => {
    let displayValue = '••••••••';
    try {
      const decrypted = decrypt(row.valueEnc, VAULT_PASSPHRASE);
      displayValue = maskKey(decrypted);
    } catch {}
    
    return {
      id: row.id,
      label: row.label,
      service: row.service,
      domain: row.domain,
      value_masked: displayValue,
      notes: row.notes,
      is_active: row.isActive,
      last_tested: row.lastTested,
      test_status: row.testStatus,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    };
  });
  
  return NextResponse.json({ keys: masked });
}

// POST /api/keys — create a new key
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    label: string;
    service: string;
    domain?: string;
    value: string;
    notes?: string;
  };
  
  const { label, service, domain, value, notes } = body;
  
  if (!label || !service || !value) {
    return NextResponse.json({ error: 'label, service, and value are required' }, { status: 400 });
  }
  
  const encrypted = encrypt(value, VAULT_PASSPHRASE);
  
  const [result] = await db
    .insert(apiKeys)
    .values({
      userId: session.user.id,
      label,
      service,
      domain: domain ?? null,
      valueEnc: encrypted,
      notes: notes ?? null,
    })
    .returning({ id: apiKeys.id });
  
  return NextResponse.json({
    success: true,
    id: result.id,
  });
}

// PUT /api/keys/:id — update a key
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    id: string;
    label?: string;
    value?: string;
    notes?: string;
    is_active?: boolean;
  };
  
  const { id, label, value, notes, is_active } = body;
  
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const updateData: any = {
    updatedAt: Math.floor(Date.now() / 1000),
  };
  if (label !== undefined) updateData.label = label;
  if (value !== undefined) updateData.valueEnc = encrypt(value, VAULT_PASSPHRASE);
  if (notes !== undefined) updateData.notes = notes;
  if (is_active !== undefined) updateData.isActive = is_active ? 1 : 0;
  
  await db
    .update(apiKeys)
    .set(updateData)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, session.user.id)));
  
  return NextResponse.json({ success: true });
}

// DELETE /api/keys/:id
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  
  await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, session.user.id)));

  return NextResponse.json({ success: true });
}
