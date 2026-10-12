import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type { SessionInfo } from '@/lib/types';

export async function GET() {
  const s = await getSession();
  const info: SessionInfo = {
    role: s?.role ?? 'none',
    groupId: s?.role === 'manager' ? s.groupId : undefined,
    isAdmin: s?.role === 'admin',
  };
  return NextResponse.json(info, { headers: { 'Cache-Control': 'no-store' } });
}
