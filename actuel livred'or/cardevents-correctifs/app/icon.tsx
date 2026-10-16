import { ImageResponse } from 'next/og';
import { BRAND_INITIALS } from '@/lib/brand';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c1917', color: '#fcd34d', fontSize: 32, fontWeight: 700, borderRadius: 14, border: '2px solid #b45309' }}>
        {BRAND_INITIALS}
      </div>
    ),
    { ...size },
  );
}
