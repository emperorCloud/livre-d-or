'use client';
import { Plus, Trash2 } from 'lucide-react';
import type { PayMethod } from '@/lib/funeral/types';
import { V, VField } from '../ui';

export const newId = () => crypto.randomUUID().slice(0, 12);

export function PayMethodsEditor({ value, onChange }: { value: PayMethod[]; onChange: (v: PayMethod[]) => void }) {
  const upd = (i: number, k: keyof PayMethod, v: string) => onChange(value.map((m, j) => (j === i ? { ...m, [k]: v } : m)));
  return (
    <div className="space-y-3">
      {value.map((m, i) => (
        <div key={i} className="grid sm:grid-cols-2 gap-2 p-3 rounded-xl border border-white/10 bg-white/[0.04]">
          <VField label="Moyen"><input className={V.input} value={m.label} onChange={(e) => upd(i, 'label', e.target.value)} placeholder="Orange Money, MTN MoMo, Virement…" /></VField>
          <VField label="Numéro / compte"><input className={V.input} value={m.accountNumber} onChange={(e) => upd(i, 'accountNumber', e.target.value)} /></VField>
          <VField label="Au nom de"><input className={V.input} value={m.accountName} onChange={(e) => upd(i, 'accountName', e.target.value)} /></VField>
          <VField label="Instructions"><input className={V.input} value={m.instructions} onChange={(e) => upd(i, 'instructions', e.target.value)} /></VField>
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className={`${V.danger} sm:col-span-2 justify-self-end`}><Trash2 className="w-3.5 h-3.5" />Retirer</button>
        </div>
      ))}
      {value.length < 6 && <button type="button" onClick={() => onChange([...value, { label: '', accountNumber: '', accountName: '', instructions: '' }])} className={V.btnGhost}><Plus className="w-3.5 h-3.5" />Ajouter un moyen de paiement</button>}
    </div>
  );
}

export const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <section className={`${V.card} p-5 space-y-4`}>
    <div><h3 className="text-base font-semibold">{title}</h3>{hint && <p className={`text-xs ${V.muted} mt-0.5`}>{hint}</p>}</div>
    {children}
  </section>
);
