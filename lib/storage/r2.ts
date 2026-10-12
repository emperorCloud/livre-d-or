import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
//import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Cloudflare R2 (compatible S3). Variables : R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
// R2_BUCKET, R2_PUBLIC_URL (domaine public du bucket, sans / final).

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} n'est pas définie (variables d'environnement Vercel).`);
  return v;
}

export function r2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env('R2_ACCESS_KEY_ID'), secretAccessKey: env('R2_SECRET_ACCESS_KEY') },
  });
}

export function r2PublicUrl(key: string): string {
  return `${env('R2_PUBLIC_URL').replace(/\/$/, '')}/${key}`;
}

/** URL signée (5 min) : le navigateur envoie la photo DIRECTEMENT à R2, sans passer par Vercel. */
export async function presignPut(key: string, contentType: string) {
  const cmd = new PutObjectCommand({
    Bucket: env('R2_BUCKET'),
    Key: key,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });
  //return { uploadUrl: await getSignedUrl(r2Client(), cmd, { expiresIn: 300 }), publicUrl: r2PublicUrl(key) };
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<string> {
  await r2Client().send(new PutObjectCommand({
    Bucket: env('R2_BUCKET'), Key: key, Body: body, ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  return r2PublicUrl(key);
}
