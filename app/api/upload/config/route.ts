import { NextResponse } from 'next/server';
import { activeDriver, MAX_PHOTOS_PER_ENTRY } from '@/lib/storage';

export async function GET() {
  return NextResponse.json({ driver: activeDriver(), maxPhotosPerEntry: MAX_PHOTOS_PER_ENTRY }, { headers: { 'Cache-Control': 'no-store' } });
}
