import { ImageResponse } from 'next/og';
import { getPublicProgramme } from '@/lib/funeral/db';
import { frDate } from '@/lib/funeral/format';
import { pageThemeVars } from '@/lib/funeral/theme';

export const dynamic = 'force-dynamic';
export const alt = 'Programme des obsèques';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Carte d'aperçu violette (WhatsApp, Facebook, Google) quand aucune photo n'est utilisée : nom, dates, lieu.
export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublicProgramme(slug).catch(() => null);
  const name = p ? [p.config.profile.titles, p.ceremony.honoreeName].filter(Boolean).join(' ') : 'Programme des obsèques';
  const years = p ? [frDate(p.config.profile.birthDate), frDate(p.config.profile.deathDate)].filter(Boolean).join('  —  ') : '';
  const where = p ? p.ceremony.location || p.config.profile.hometown : '';
  const bg = pageThemeVars(p?.config.profile.pageColor ?? '');
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(160deg, ${bg['--pg-via']}, #0B0612)`, color: '#F5EEFF', padding: 70, textAlign: 'center' }}>
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 10, textTransform: 'uppercase', color: '#D8B4FE' }}>Programme des obsèques</div>
        <div style={{ display: 'flex', width: 120, height: 2, background: '#E9D5A1', marginTop: 34, marginBottom: 40 }} />
        <div style={{ display: 'flex', fontSize: 78, fontWeight: 700, lineHeight: 1.1, justifyContent: 'center' }}>{name}</div>
        {years && <div style={{ display: 'flex', marginTop: 30, fontSize: 34, color: '#E9D5A1' }}>{years}</div>}
        {where && <div style={{ display: 'flex', marginTop: 18, fontSize: 30, color: '#C4B5FD' }}>{where}</div>}
      </div>
    ),
    { ...size },
  );
}
