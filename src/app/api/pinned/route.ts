import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pinnedPanels } from '@/db/schema';
import { auth } from '@/auth';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select()
    .from(pinnedPanels)
    .where(eq(pinnedPanels.userId, session.user.id))
    .orderBy(desc(pinnedPanels.pinnedAt));
    
  return NextResponse.json({ panels: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    title: string;
    tool_name: string;
    props_json: string;
    width?: number;
    height?: number;
  };
  
  if (!body.title || !body.tool_name || !body.props_json) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const width = body.width || 400;
  const height = body.height || 300;

  const [result] = await db.insert(pinnedPanels).values({
    userId: session.user.id,
    title: body.title,
    toolName: body.tool_name,
    propsJson: body.props_json,
    width,
    height
  }).returning({ id: pinnedPanels.id });

  return NextResponse.json({ success: true, id: result.id });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  
  await db.delete(pinnedPanels)
    .where(and(eq(pinnedPanels.id, id), eq(pinnedPanels.userId, session.user.id)));
    
  return NextResponse.json({ success: true });
}
