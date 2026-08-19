import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToBlob } from '@/lib/blob';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { imageBase64 } = body;

  if (!imageBase64) {
    return NextResponse.json({ error: 'Aucune image fournie.' }, { status: 400 });
  }

  try {
    const url = await uploadImageToBlob(imageBase64);
    return NextResponse.json({ success: true, url });
  } catch (err) {
    console.error('Erreur upload Blob:', err);
    return NextResponse.json({ error: "Échec de l'upload de l'image." }, { status: 500 });
  }
}
