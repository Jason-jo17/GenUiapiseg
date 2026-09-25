import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chatThreads } from '@/db/schema';
import { auth } from '@/auth';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select()
    .from(chatThreads)
    .where(eq(chatThreads.userId, session.user.id))
    .orderBy(desc(chatThreads.updatedAt));
    
  return NextResponse.json({ threads: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { id?: string; title?: string };
  const id = body.id || `thread-${Date.now()}`;
  const title = body.title || 'New Chat';

  // Guard against IDOR: a client-supplied id may collide with another user's thread.
  const [existing] = await db.select().from(chatThreads).where(eq(chatThreads.id, id));
  if (existing && existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Thread id already in use' }, { status: 409 });
  }

  await db.insert(chatThreads)
    .values({ id, userId: session.user.id, title })
    .onConflictDoUpdate({
      target: chatThreads.id,
      set: { title, updatedAt: Math.floor(Date.now() / 1000) }
    });

  return NextResponse.json({ success: true, id });
}
