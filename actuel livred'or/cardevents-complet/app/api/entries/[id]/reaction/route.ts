import { NextRequest, NextResponse } from 'next/server';
import { addReaction } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/ratelimit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await rateLimit(`react:${clientIp(req)}`, 200, 3600))) {
    return NextResponse.json({ error: 'Trop de réactions, réessayez plus tard.' }, { status: 429 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const emoji = body.emoji || '❤️';

  const result = await addReaction(id, emoji);
  if (!result) {
    return NextResponse.json({ error: 'Témoignage non trouvé.' }, { status: 404 });
  }
  return NextResponse.json({ success: true, ...result });
}
