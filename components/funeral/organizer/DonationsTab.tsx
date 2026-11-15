'use client';
import { useState } from 'react';
import { Check, Download, Plus, Printer, Trash2, X } from 'lucide-react';
import { DONATION_METHODS, fmtMoney, type Donation, type DonationMethod, type FuneralState, type Status } from '@/lib/funeral/types';
import { frDate } from '@/lib/funeral/format';
import { printReceipt } from '@/lib/funeral/print';
import type { funeralApi } from '@/lib/funeral/client';
import { STATUS_CLS, STATUS_LABEL, V, VField, VModal } from '../ui';

type Api = ReturnType<typeof funeralApi>;
const methodLabel = (m: DonationMethod) => DONATION_METHODS.find((x) => x.value === m)?.label || m;
// Une cellule qui commence par = + - @ serait exécutée comme formule par Excel : on la neutralise.
const cell = (v: unknown) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };

export function DonationsTab({ api, state, reload, honoree }: { api: Api; state: FuneralState; reload: () => Promise<void>; honoree: string }) {
  const [adding, setAdding] = useState(false), [error, setError] = useState('');
  const [f, setF] = useState({ donorName: '', donorPhone: '', amount: '', paymentMethod: 'cash', paymentReference: '', purpose: '', blessing: '', isAnonymous: false });
  const cur = state.config.profile.currency;
  const sum = (s: Status) => state.donations.filter((d) => d.status === s).reduce((n, d) => n + d.amount, 0);
  const run = async (fn: () => Promise<unknown>) => { setError(''); try { await fn(); await reload(); } catch (e) { setError(e instanceof Error ? e.message : 'Action impossible.'); } };

  const exportCsv = () => {
    const head = ['Reçu', 'Date', 'Donateur', 'Téléphone', 'Montant', 'Moyen', 'Référence', 'Objet', 'Message', 'Statut'];
    const rows = state.donations.map((d) => [d.receiptNumber, d.date, d.donorName, d.donorPhone, d.amount, methodLabel(d.paymentMethod), d.paymentReference, d.purpose, d.blessing, STATUS_LABEL[d.status]]);
    const csv = '\uFEFF' + [head, ...rows].map((r) => r.map(cell).join(';')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'dons.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try { await api.addDonation({ ...f, amount: Number(f.amount), paymentMethod: f.paymentMethod as DonationMethod }); setAdding(false); setF({ ...f, donorName: '', donorPhone: '', amount: '', paymentReference: '', purpose: '', blessing: '' }); await reload(); }
    catch (x) { setError(x instanceof Error ? x.message : 'Enregistrement impossible.'); }
  };

  return (
    <div className="space-y-5">
      {error && <div className="p-3 rounded-lg text-xs bg-red-500/15 border border-red-300/30 text-red-100">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div className={`${V.card} p-4`}><p className={`text-[11px] uppercase ${V.muted}`}>Confirmé</p><p className="text-xl font-semibold text-emerald-200">{fmtMoney(sum('confirmed'), cur)}</p></div>
        <div className={`${V.card} p-4`}><p className={`text-[11px] uppercase ${V.muted}`}>À vérifier</p><p className="text-xl font-semibold text-amber-200">{fmtMoney(sum('pending'), cur)}</p></div>
      </div>
      <div className="flex flex-wrap gap-2"><button className={V.btn} onClick={() => setAdding(true)}><Plus className="w-4 h-4" />Saisir un don reçu</button><button className={V.btnGhost} onClick={exportCsv} disabled={!state.donations.length}><Download className="w-3.5 h-3.5" />Exporter (Excel)</button></div>
      {state.donations.length === 0 && <p className={`text-sm ${V.muted}`}>Aucun don pour le moment.</p>}
      <div className="space-y-2">{state.donations.map((d: Donation) => (
        <div key={d.id} className={`${V.card} p-4 flex flex-wrap items-center justify-between gap-3`}>
          <div className="min-w-0"><p className="font-semibold">{d.donorName} <span className="text-amber-200">· {fmtMoney(d.amount, cur)}</span></p>
            <p className={`text-xs ${V.muted}`}>{[d.receiptNumber, frDate(d.date), methodLabel(d.paymentMethod), d.paymentReference && `réf. ${d.paymentReference}`, d.donorPhone, d.isAnonymous && 'anonyme'].filter(Boolean).join(' · ')}</p>
            {d.blessing && <p className="text-xs italic text-violet-200/80 mt-1">« {d.blessing} »</p>}</div>
          <div className="flex items-center gap-1.5"><span className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS_CLS[d.status]}`}>{STATUS_LABEL[d.status]}</span>
            {d.status !== 'confirmed' && <button aria-label="Confirmer la réception" title="Confirmer la réception" className={V.btnGhost} onClick={() => run(() => api.patchDonation(d.id, 'confirmed'))}><Check className="w-3.5 h-3.5" /></button>}
            {d.status !== 'rejected' && <button aria-label="Refuser" title="Refuser" className={V.btnGhost} onClick={() => run(() => api.patchDonation(d.id, 'rejected'))}><X className="w-3.5 h-3.5" /></button>}
            {d.status === 'confirmed' && <button aria-label="Imprimer le reçu" title="Imprimer le reçu" className={V.btnGhost} onClick={() => printReceipt(d, honoree, cur, state.config.profile.contactPhone)}><Printer className="w-3.5 h-3.5" /></button>}
            <button aria-label="Supprimer" title="Supprimer" className={V.danger} onClick={() => confirm('Supprimer ce don ?') && run(() => api.deleteDonation(d.id))}><Trash2 className="w-3.5 h-3.5" /></button></div>
        </div>))}</div>
      {adding && (
        <VModal title="Saisir un don reçu" kicker="Enregistré comme confirmé" onClose={() => setAdding(false)}>
          <form onSubmit={submit} className="space-y-3">
            <VField label="Nom *"><input required className={V.input} value={f.donorName} onChange={(e) => setF({ ...f, donorName: e.target.value })} /></VField>
            <div className="grid grid-cols-2 gap-3">
              <VField label={`Montant (${cur}) *`}><input required type="number" min={1} className={V.input} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></VField>
              <VField label="Moyen"><select className={V.input} value={f.paymentMethod} onChange={(e) => setF({ ...f, paymentMethod: e.target.value })}>{DONATION_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></VField>
            </div>
            <VField label="Téléphone"><input type="tel" className={V.input} value={f.donorPhone} onChange={(e) => setF({ ...f, donorPhone: e.target.value })} /></VField>
            <VField label="Référence"><input className={V.input} value={f.paymentReference} onChange={(e) => setF({ ...f, paymentReference: e.target.value })} /></VField>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={f.isAnonymous} onChange={(e) => setF({ ...f, isAnonymous: e.target.checked })} />Anonyme (nom non affiché publiquement)</label>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setAdding(false)} className={V.btnGhost}>Annuler</button><button className={V.btn}>Enregistrer</button></div>
          </form>
        </VModal>
      )}
    </div>
  );
}
