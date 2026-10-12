import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToBlob } from '@/lib/blob';
import { getSession } from '@/lib/auth';
import { getGroupIdBySlug, getLegacyGroupAccess } from '@/lib/ceremonies';
import { rateLimit, clientIp } from '@/lib/ratelimit';

// TRANSITION : tant que l'ancienne interface n'envoie pas inviteSlug, on retombe sur le
// groupe historique. À SUPPRIMER une fois la nouvelle interface (phase 2) déployée.
const LEGACY_SLUG_FALLBACK = true;

export async function POST(req: NextRequest) {
  if (!(await rateLimit(`upload:${clientIp(req)}`, 30, 600))) {
    return NextResponse.json({ error: 'Trop de téléversements, réessayez dans quelques minutes.' }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const { imageBase64, inviteSlug } = body;
  if (!imageBase64) return NextResponse.json({ error: 'Aucune image fournie.' }, { status: 400 });

  const session = await getSession();
  if (!session) {
    let group = typeof inviteSlug === 'string' && inviteSlug ? await getGroupIdBySlug(inviteSlug) : null;
    if (!group && LEGACY_SLUG_FALLBACK && !inviteSlug) {
      group = await getLegacyGroupAccess();
    }
    if (!group || group.isClosed || !group.allowPhotos) {
      return NextResponse.json({ error: "Le téléversement n'est pas autorisé." }, { status: 403 });
    }
  }

  try {
    const url = await uploadImageToBlob(imageBase64);
    return NextResponse.json({ success: true, url });
  } catch (err: any) {
    console.error('Erreur upload Blob:', err);
    return NextResponse.json({ error: err?.message || "Échec de l'upload de l'image." }, { status: 400 });
  }
}
