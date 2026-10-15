import { presignUrl } from './sigv4';

// Cloudflare R2 (compatible S3), SANS SDK AWS. Variables : R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
// R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL (domaine public du bucket).

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} n'est pas définie (variables d'environnement Vercel).`);
  return v;
}

function sign(method: 'PUT' | 'HEAD', key: string, headers: Record<string, string>, expires: number) {
  return presignUrl({
    method, host: `${env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`, path: `/${env('R2_BUCKET')}/${key}`,
    region: 'auto', accessKeyId: env('R2_ACCESS_KEY_ID'), secretAccessKey: env('R2_SECRET_ACCESS_KEY'), headers, expires,
  });
}

export function r2PublicUrl(key: string): string {
  return `${env('R2_PUBLIC_URL').replace(/\/$/, '')}/${key}`;
}

/** URL signée (5 min) : le navigateur envoie la photo DIRECTEMENT à R2, sans passer par Vercel.
 *  Le Content-Type est signé : impossible d'y déposer autre chose qu'un JPEG. */
export async function presignPut(key: string, contentType: string) {
  return { uploadUrl: sign('PUT', key, { 'content-type': contentType }, 300), publicUrl: r2PublicUrl(key) };
}

export async function r2Exists(key: string): Promise<boolean> {
  return (await fetch(sign('HEAD', key, {}, 60), { method: 'HEAD' })).ok;
}

export async function putObject(key: string, body: Uint8Array, contentType: string): Promise<string> {
  const headers = { 'content-type': contentType, 'cache-control': 'public, max-age=31536000, immutable' };
  const res = await fetch(sign('PUT', key, headers, 300), { method: 'PUT', headers, body: body as unknown as BodyInit });
  if (!res.ok) throw new Error(`R2 a refusé l'écriture (${res.status}).`);
  return r2PublicUrl(key);
}
