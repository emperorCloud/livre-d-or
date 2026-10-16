'use client';
import { useRef, useState } from 'react';
import { Upload, Smartphone, Monitor } from 'lucide-react';
import { FEATURED_SPECS, type FeaturedRatio } from '@/lib/client/images';
import { uploadFeaturedPhoto } from '@/lib/client/upload';
import type { Group } from '@/lib/types';
import { btnGhost } from './ui';

interface Props { group: Group; onChange: (patch: Partial<Group>) => void }

/** Photo du concerné à la une : format, dimensions exactes demandées, point focal, aperçus mobile + ordinateur. */
export default function FeaturedPhotoEditor({ group, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ratio = group.featuredPhotoAspectRatio as FeaturedRatio;
  const pos = `${group.featuredFocalX * 100}% ${group.featuredFocalY * 100}%`;

  const upload = async (file: File) => {
    setBusy(true); setError('');
    try {
      const r = await uploadFeaturedPhoto(file, ratio);
      onChange({ featuredPhotoUrl: r.url, featuredWidth: r.width, featuredHeight: r.height, featuredFocalX: 0.5, featuredFocalY: 0.4 });
    } catch (e) { setError(e instanceof Error ? e.message : 'Envoi impossible.'); } finally { setBusy(false); if (input.current) input.current.value = ''; }
  };

  const pickFocal = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onChange({ featuredFocalX: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), featuredFocalY: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(FEATURED_SPECS) as FeaturedRatio[]).map((r) => (
          <button key={r} type="button" onClick={() => onChange({ featuredPhotoAspectRatio: r })}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${ratio === r ? 'border-amber-600 bg-amber-50' : 'border-stone-300 bg-white hover:border-stone-400'}`}>
            <span className="font-semibold block">{FEATURED_SPECS[r].label}</span>
            <span className="text-stone-500">idéal {FEATURED_SPECS[r].ideal.join(' × ')} px</span>
            <span className="block text-stone-400">minimum {FEATURED_SPECS[r].min.join(' × ')} px</span>
          </button>
        ))}
      </div>

      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className={btnGhost}>
        <Upload className="w-4 h-4" />{busy ? 'Envoi en cours…' : group.featuredPhotoUrl ? 'Changer la photo à la une' : 'Choisir la photo à la une'}
      </button>
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}
      {group.featuredWidth && group.featuredHeight && <p className="text-[11px] text-stone-500">Photo actuelle : {group.featuredWidth} × {group.featuredHeight} px.</p>}

      {group.featuredPhotoUrl && (
        <div className="space-y-3">
          <p className="text-xs text-stone-600"><b>Cliquez sur le visage</b> pour définir le point focal : le recadrage mobile et ordinateur restera centré dessus.</p>
          <div onClick={pickFocal} className="relative cursor-crosshair rounded-xl overflow-hidden border border-stone-300 max-w-md bg-stone-200">
            <img src={group.featuredPhotoUrl} alt="Photo à la une" className="w-full h-auto block select-none" draggable={false} />
            <span className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,.5)] bg-amber-400/40 pointer-events-none" style={{ left: `${group.featuredFocalX * 100}%`, top: `${group.featuredFocalY * 100}%` }} />
          </div>
          <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-start">
            <Preview icon={<Monitor className="w-3.5 h-3.5" />} label="Ordinateur" cls={ratio === '16:9' ? 'aspect-[16/9]' : ratio === '4:5' ? 'aspect-[4/5] max-w-[220px]' : 'aspect-square max-w-[260px]'} url={group.featuredPhotoUrl} pos={pos} />
            <Preview icon={<Smartphone className="w-3.5 h-3.5" />} label="Mobile" cls={ratio === '1:1' ? 'aspect-square w-[150px]' : 'aspect-[4/5] w-[150px]'} url={group.featuredPhotoUrl} pos={pos} />
          </div>
        </div>
      )}
    </div>
  );
}

function Preview({ icon, label, cls, url, pos }: { icon: React.ReactNode; label: string; cls: string; url: string; pos: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] uppercase font-semibold text-stone-500 mb-1">{icon}{label}</div>
      <div className={`relative overflow-hidden rounded-xl border border-stone-300 ${cls}`}>
        <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: pos }} />
      </div>
    </div>
  );
}
