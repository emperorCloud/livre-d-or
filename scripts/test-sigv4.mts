import assert from 'node:assert/strict';
import { presignUrl } from '../lib/storage/sigv4.ts';

// Vecteur de test officiel AWS (« Authenticating Requests: Using Query Parameters », GET presigné)
const url = presignUrl({
  method: 'GET', host: 'examplebucket.s3.amazonaws.com', path: '/test.txt', region: 'us-east-1',
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  expires: 86400, now: new Date('2013-05-24T00:00:00Z'),
});
assert.ok(url.endsWith('X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404'), 'signature AWS attendue : ' + url);

// PUT avec Content-Type signé : l'en-tête figure dans SignedHeaders, et une autre valeur donne une autre signature
const put = (ct: string) => presignUrl({ method: 'PUT', host: 'acc.r2.cloudflarestorage.com', path: '/bucket/photos/a b.jpg', region: 'auto',
  accessKeyId: 'AK', secretAccessKey: 'SK', headers: { 'Content-Type': ct }, now: new Date('2026-10-12T10:00:00Z') });
assert.ok(put('image/jpeg').includes('X-Amz-SignedHeaders=content-type%3Bhost'));
assert.ok(put('image/jpeg').includes('/bucket/photos/a%20b.jpg?'));
assert.notEqual(put('image/jpeg').split('Signature=')[1], put('text/html').split('Signature=')[1]);

console.log('OK — signature S3 conforme au vecteur de test officiel AWS');
