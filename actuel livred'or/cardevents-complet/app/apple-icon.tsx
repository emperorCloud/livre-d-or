import { ImageResponse } from 'next/og';
import { BRAND_INITIALS } from '@/lib/brand';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c1917', color: '#fcd34d', fontSize: 88, fontWeight: 700 }}>
        {BRAND_INITIALS}
      </div>
    ),
    { ...size },
  );
}
