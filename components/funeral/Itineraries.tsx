'use client';
import { useEffect, useState } from 'react';
import { Expand, ExternalLink, Route } from 'lucide-react';
import type { Itinerary } from '@/lib/funeral/types';
import { V, VModal } from './ui';

/** Plans d'accès fournis en images : aperçu dans la page, agrandissement au toucher, ouverture en plein format pour zoomer. */
export function ItinerarySection({ items, honoree }: { items: Itinerary[]; honoree: string }) {
  const [open, setOpen] = useState<Itinerary | null>(null);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [open]);
  if (items.length === 0) return null;
  return (
    <div className="space-y-3" id="itineraires">
      <h3 className="text-sm uppercase tracking-widest text-violet-300 flex items-center gap-2"><Route className="w-4 h-4" />Itinéraires & plans d’accès</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((it) => (
          <figure key={it.id} className={`${V.card} overflow-hidden`}>
            <button type="button" onClick={() => setOpen(it)} className="block w-full relative group bg-white" aria-label={`Agrandir : ${it.title || 'plan d’accès'}`}>
              <img src={it.imageUrl} alt={`Plan d’accès${it.title ? ` : ${it.title}` : ''} — obsèques de ${honoree}`} loading="lazy" className="w-full h-auto" />
              <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-black/60 text-white"><Expand className="w-3 h-3" />Agrandir</span>
            </button>
            {(it.title || it.description) && <figcaption className="p-4 space-y-1">{it.title && <p className="font-semibold">{it.title}</p>}{it.description && <p className={`text-sm ${V.muted} whitespace-pre-line`}>{it.description}</p>}</figcaption>}
          </figure>
        ))}
      </div>
      {open && (
        <VModal wide title={open.title || 'Plan d’accès'} kicker="Itinéraire" onClose={() => setOpen(null)}>
          <div className="space-y-3">
            <div className="bg-white rounded-xl overflow-auto max-h-[70vh]"><img src={open.imageUrl} alt={`Plan d’accès${open.title ? ` : ${open.title}` : ''}`} className="w-full h-auto" /></div>
            {open.description && <p className={`text-sm ${V.muted} whitespace-pre-line`}>{open.description}</p>}
            <a href={open.imageUrl} target="_blank" rel="noopener noreferrer" className={V.btnGhost}><ExternalLink className="w-3.5 h-3.5" />Ouvrir en plein format (zoom)</a>
          </div>
        </VModal>
      )}
    </div>
  );
}
