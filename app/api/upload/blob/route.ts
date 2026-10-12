import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { authorizeUpload } from '@/lib/uploadAuth';
import { UPLOAD_CONTENT_TYPE, UPLOAD_MAX_BYTES, UPLOAD_PATH } from '@/lib/storage';

// Téléversement DIRECT navigateur → Vercel Blob : la photo ne transite pas par la fonction
// (pas de limite de 4,5 Mo, pas de base64). Ici on ne fait qu'autoriser et borner le jeton.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!UPLOAD_PATH.test(pathname)) throw new Error('Chemin de fichier invalide.');
        let inviteSlug: string | undefined;
        try { inviteSlug = JSON.parse(clientPayload || '{}').inviteSlug; } catch { /* ignoré */ }
        const kind = pathname.startsWith('featured/') ? 'featured' : pathname.startsWith('thumbs/') ? 'thumb' : 'photo';
        const auth = await authorizeUpload(req, { inviteSlug, kind });
        if (!auth.ok) throw new Error(auth.error);
        return { allowedContentTypes: [UPLOAD_CONTENT_TYPE], maximumSizeInBytes: UPLOAD_MAX_BYTES, addRandomSuffix: false };
      },
    });
    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Téléversement refusé.' }, { status: 400 });
  }
}
