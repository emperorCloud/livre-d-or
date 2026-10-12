import type { NextConfig } from 'next';

// Le domaine public R2 (si utilisé) est autorisé en plus de Vercel Blob.
const r2 = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL) : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      ...(r2 ? [{ protocol: 'https' as const, hostname: r2.hostname }] : []),
    ],
  },
};

export default nextConfig;
