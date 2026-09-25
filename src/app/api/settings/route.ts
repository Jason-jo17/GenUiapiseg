import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appSettings } from '@/db/schema';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.userId, session.user.id));
    
  const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: JSON.parse(row.value) }), {});
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  
  for (const [key, value] of Object.entries(body)) {
    await db.insert(appSettings)
      .values({ 
        key, 
        userId: session.user.id, 
        value: JSON.stringify(value) 
      })
      .onConflictDoUpdate({
        target: [appSettings.userId, appSettings.key],
        set: { value: JSON.stringify(value), updatedAt: Math.floor(Date.now() / 1000) }
      });
  }

  return NextResponse.json({ success: true });
}
