'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

type Kind = 'ok' | 'error';
interface Toast { id: number; text: string; kind: Kind }

/**
 * Notifications éphémères : elles disparaissent seules (3,5 s ; 7 s pour une erreur) et peuvent être fermées.
 * Usage :  const { push, node } = useToasts();  push('Invité ajouté');  push('Échec', 'error');  …  {node}
 */
export function useToasts() {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id); if (t) clearTimeout(t); timers.current.delete(id);
    setItems((p) => p.filter((x) => x.id !== id));
  }, []);
  const push = useCallback((text: string, kind: Kind = 'ok') => {
    const id = ++seq.current;
    setItems((p) => [...p.slice(-2), { id, text, kind }]);
    timers.current.set(id, setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 3500));
  }, [dismiss]);
  useEffect(() => { const m = timers.current; return () => { m.forEach(clearTimeout); m.clear(); }; }, []);

  const node = (
    <div aria-live="polite" role="status" className="fixed z-[60] inset-x-0 bottom-4 flex flex-col items-center gap-2 px-4 pointer-events-none no-print">
      {items.map((t) => (
        <div key={t.id} className={`pointer-events-auto max-w-md w-full sm:w-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg ${t.kind === 'error' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
          {t.kind === 'error' ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
          <span className="flex-1">{t.text}</span>
          <button type="button" onClick={() => dismiss(t.id)} aria-label="Fermer la notification" className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      ))}
    </div>
  );
  return { push, node };
}
