import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chatMessages, chatThreads } from '@/db/schema';
import { auth } from '@/auth';
import { eq, asc, and } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  
  // Verify thread belongs to user
  const [thread] = await db.select().from(chatThreads).where(eq(chatThreads.id, id));
  if (!thread || thread.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.threadId, id))
    .orderBy(asc(chatMessages.createdAt));
  
  // Transform DB format back to Vercel AI SDK format
  const messages = rows.map(row => {
    const msg: any = {
      id: row.id,
      role: row.role,
      content: row.content,
    };
    
    if (row.toolCalls) {
      try {
        const parsed = JSON.parse(row.toolCalls);
        // Map to toolInvocations format for UI
        msg.toolInvocations = parsed;
      } catch (e) {}
    }
    
    return msg;
  });

  return NextResponse.json({ messages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  
  // Verify thread belongs to user
  const [thread] = await db.select().from(chatThreads).where(eq(chatThreads.id, id));
  if (!thread || thread.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json() as {
    role: 'user' | 'assistant' | 'tool';
    content: string;
    toolInvocations?: any[];
  };

  const toolCalls = body.toolInvocations ? JSON.stringify(body.toolInvocations) : null;

  const [result] = await db.insert(chatMessages).values({
    threadId: id,
    userId: session.user.id,
    role: body.role,
    content: body.content || '',
    toolCalls,
  }).returning({ id: chatMessages.id });

  // Update thread updated_at
  await db.update(chatThreads)
    .set({ updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(chatThreads.id, id));

  return NextResponse.json({ success: true, id: result.id });
}

// PATCH /api/threads/:id/messages — record thumbs up/down feedback (and optional correction) on a message
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Verify thread belongs to user
  const [thread] = await db.select().from(chatThreads).where(eq(chatThreads.id, id));
  if (!thread || thread.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json() as {
    messageId: string;
    feedback: 'up' | 'down';
    correction?: string;
  };

  if (!body.messageId || (body.feedback !== 'up' && body.feedback !== 'down')) {
    return NextResponse.json({ error: 'messageId and feedback (up|down) are required' }, { status: 400 });
  }

  await db.update(chatMessages)
    .set({ feedback: body.feedback, correction: body.correction ?? null })
    .where(and(eq(chatMessages.id, body.messageId), eq(chatMessages.threadId, id)));

  return NextResponse.json({ success: true });
}
