'use client';
import { X } from 'lucide-react';

export function Modal({ title, kicker, onClose, children, wide }: { title: string; kicker?: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className={`bg-stone-50 border border-stone-200 rounded-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} shadow-2xl text-stone-900 my-auto`}>
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-100/70 rounded-t-2xl">
          <div>
            {kicker && <span className="text-[11px] font-serif-cinzel uppercase tracking-widest text-amber-800 font-bold block">{kicker}</span>}
            <h3 className="text-xl font-serif-cinzel font-semibold">{title}</h3>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-1 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export const inputCls = 'w-full text-sm bg-white border border-stone-300 rounded-xl px-3 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400';
export const btnPrimary = 'px-4 py-2.5 text-xs font-semibold text-stone-950 bg-amber-300 hover:bg-amber-200 disabled:opacity-60 rounded-xl shadow-sm transition-all inline-flex items-center justify-center gap-2';
export const btnGhost = 'px-3 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl transition-all inline-flex items-center justify-center gap-1.5';

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase text-stone-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-stone-500 mt-1">{hint}</span>}
    </label>
  );
}
