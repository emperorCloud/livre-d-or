import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { authorizeUpload, type UploadKind } from '@/lib/uploadAuth';
import { activeDriver, UPLOAD_CONTENT_TYPE } from '@/lib/storage';
import { presignPut } from '@/lib/storage/r2';

const FOLDER: Record<UploadKind, string> = { photo: 'photos', thumb: 'thumbs', featured: 'featured' };

// Renvoie une URL signée : le navigateur envoie la photo directement à R2.
export async function POST(req: NextRequest) {
  if (activeDriver() !== 'r2') return NextResponse.json({ error: 'Stockage R2 non activé.' }, { status: 404 });
  const { inviteSlug, kind, contentType } = await req.json().catch(() => ({}));
  if (!(kind in FOLDER) || contentType !== UPLOAD_CONTENT_TYPE) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  const auth = await authorizeUpload(req, { inviteSlug, kind });
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const key = `${FOLDER[kind as UploadKind]}/${randomUUID()}.jpg`;
  return NextResponse.json(await presignPut(key, UPLOAD_CONTENT_TYPE));
}
