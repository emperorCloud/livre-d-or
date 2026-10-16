import { ImageResponse } from 'next/og';
import { getSettings } from '@/lib/settingsDb';
import { brandInitials } from '@/lib/brand';

export const dynamic = 'force-dynamic';
export const alt = "Livres d'or en ligne";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Image d'aperçu (WhatsApp, Facebook, LinkedIn…) générée à partir des paramètres du site.
export default async function OgImage() {
  const s = await getSettings();
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1c1917', color: '#fef3c7', padding: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 150, height: 150, borderRadius: 32, border: '4px solid #b45309', background: '#292524', color: '#fcd34d', fontSize: 72, fontWeight: 700 }}>
          {brandInitials(s.brandName)}
        </div>
        <div style={{ display: 'flex', marginTop: 44, fontSize: 76, fontWeight: 700, letterSpacing: 8, textTransform: 'uppercase' }}>{s.brandName}</div>
        <div style={{ display: 'flex', marginTop: 20, fontSize: 34, color: '#d6d3d1', textAlign: 'center' }}>{s.brandTagline}</div>
      </div>
    ),
    { ...size },
  );
}
