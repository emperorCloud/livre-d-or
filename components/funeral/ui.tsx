'use client';
import { X } from 'lucide-react';

// Palette « violet profond » du programme de deuil. Tout le visuel du module passe par ces classes.
export const V = {
  page: 'min-h-screen bg-gradient-to-b from-[var(--pg-from,#1A0B2E)] via-[var(--pg-via,#22103F)] to-[var(--pg-to,#12081F)] text-violet-50',
  card: 'rounded-2xl border border-white/10 bg-white/[0.06]',
  cardKey: 'rounded-2xl border border-amber-200/40 bg-gradient-to-br from-amber-200/10 to-white/[0.06]',
  muted: 'text-violet-200/70',
  accent: 'text-violet-300',
  gold: 'text-amber-200',
  input: 'w-full text-sm rounded-xl px-3 py-2.5 bg-white/10 border border-white/20 text-violet-50 placeholder:text-violet-300/40 focus:outline-none focus:ring-2 focus:ring-violet-300/60 [&>option]:text-stone-900',
  btn: 'px-4 py-2.5 text-xs font-semibold text-violet-950 bg-violet-200 hover:bg-violet-100 disabled:opacity-50 rounded-xl transition-all inline-flex items-center justify-center gap-2',
  btnGhost: 'px-3 py-2 text-xs font-medium text-violet-100 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl transition-all inline-flex items-center justify-center gap-1.5',
  danger: 'px-3 py-2 text-xs font-medium text-red-200 bg-red-500/10 hover:bg-red-500/20 border border-red-300/30 rounded-xl transition-all inline-flex items-center justify-center gap-1.5',
};

export function VField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-violet-200/80 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-violet-300/60 mt-1">{hint}</span>}
    </label>
  );
}

export function VModal({ title, kicker, onClose, children, wide }: { title: string; kicker?: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} my-auto rounded-2xl border border-white/15 bg-[var(--pg-surface,#1E0F36)] text-violet-50 shadow-2xl`}>
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-3">
          <div>
            {kicker && <span className="text-[11px] uppercase tracking-[0.2em] text-violet-300 font-semibold block">{kicker}</span>}
            <h3 className="text-xl font-semibold">{title}</h3>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-1 rounded-lg text-violet-200 hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

import { pageThemeVars } from '@/lib/funeral/theme';
/** Style à poser sur le conteneur : applique la couleur choisie par le responsable à toute la page, fenêtres comprises. */
export const themeStyle = (color: string) => pageThemeVars(color) as React.CSSProperties;

export const STATUS_LABEL = { pending: 'En attente', confirmed: 'Confirmé', rejected: 'Refusé' } as const;
export const STATUS_CLS = {
  pending: 'bg-amber-300/15 text-amber-200 border-amber-200/30',
  confirmed: 'bg-emerald-300/15 text-emerald-200 border-emerald-200/30',
  rejected: 'bg-red-300/15 text-red-200 border-red-200/30',
} as const;
