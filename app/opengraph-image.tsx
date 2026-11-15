import { ImageResponse } from 'next/og';
import { getSettings } from '@/lib/settingsDb';
import { brandInitials } from '@/lib/brand';

export const dynamic = 'force-dynamic';
export const alt = "Agence d'événementiels";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Image d'aperçu (WhatsApp, Facebook, LinkedIn…) générée à partir des paramètres du site.
export default async function OgImage() {
  const s = await getSettings();
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg,#FFE4EB,#FFF7F9)', color: '#4A2F38', padding: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 140, height: 140, borderRadius: 70, border: '4px solid #EFA3B6', background: '#FFFFFF', color: '#C65E7E', fontSize: 64, fontWeight: 700 }}>
          {brandInitials(s.brandName)}
        </div>
        <div style={{ display: 'flex', marginTop: 40, fontSize: 84, fontWeight: 700, color: '#A94566' }}>{s.brandName}</div>
        <div style={{ display: 'flex', width: 140, height: 3, background: '#E3B5C3', marginTop: 24 }} />
        <div style={{ display: 'flex', marginTop: 24, fontSize: 36, color: '#6E5560', textAlign: 'center', maxWidth: 900, justifyContent: 'center' }}>{s.brandTagline}</div>
      </div>
    ),
    { ...size },
  );
}
