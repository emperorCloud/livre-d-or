import { createHmac, createHash } from 'node:crypto';

// Signature AWS SigV4 « presigned URL » pour les API compatibles S3 (Cloudflare R2), sans SDK ni dépendance.
// Vérifiée contre le vecteur de test officiel d'AWS : scripts/test-sigv4.mts.

const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
const hmac = (key: Buffer | string, data: string) => createHmac('sha256', key).update(data).digest();
const sha256hex = (data: string) => createHash('sha256').update(data).digest('hex');

export interface PresignInput {
  method: 'GET' | 'PUT' | 'HEAD';
  host: string;
  path: string;                       // commence par « / », non encodé
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  headers?: Record<string, string>;   // en-têtes SIGNÉS : le client doit les renvoyer à l'identique
  expires?: number;                   // secondes (défaut 300)
  now?: Date;
}

export function presignUrl(i: PresignInput): string {
  const now = i.now ?? new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // 20130524T000000Z
  const date = amzDate.slice(0, 8);
  const scope = `${date}/${i.region}/s3/aws4_request`;

  const headers: Record<string, string> = { host: i.host };
  for (const [k, v] of Object.entries(i.headers ?? {})) headers[k.toLowerCase()] = v.trim().replace(/\s+/g, ' ');
  const names = Object.keys(headers).sort();
  const signedHeaders = names.join(';');

  const query: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${i.accessKeyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(i.expires ?? 300),
    'X-Amz-SignedHeaders': signedHeaders,
  };
  const canonicalQuery = Object.keys(query).sort().map((k) => `${enc(k)}=${enc(query[k])}`).join('&');
  const canonicalPath = i.path.split('/').map(enc).join('/');
  const canonicalRequest = [
    i.method, canonicalPath, canonicalQuery,
    names.map((n) => `${n}:${headers[n]}\n`).join(''),
    signedHeaders, 'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256hex(canonicalRequest)].join('\n');
  const kSigning = hmac(hmac(hmac(hmac('AWS4' + i.secretAccessKey, date), i.region), 's3'), 'aws4_request');
  const signature = hmac(kSigning, stringToSign).toString('hex');
  return `https://${i.host}${canonicalPath}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
