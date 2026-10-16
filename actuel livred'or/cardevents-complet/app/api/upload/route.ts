import { NextResponse } from 'next/server';

// Ancienne route (base64 via la fonction serveur) supprimée : les photos partent désormais directement
// du navigateur vers le stockage (voir /api/upload/blob et /api/upload/r2).
export async function POST() {
  return NextResponse.json({ error: 'Route obsolète : mettez à jour la page.' }, { status: 410 });
}
