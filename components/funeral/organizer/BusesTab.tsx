'use client';
import { useState } from 'react';
import { Bus as BusIcon, Check, ExternalLink, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Bus, FuneralState, Reservation, Status } from '@/lib/funeral/types';
import { fmtMoney } from '@/lib/funeral/types';
import { frDateTime, telHref } from '@/lib/funeral/format';
import type { funeralApi } from '@/lib/funeral/client';
import { STATUS_CLS, STATUS_LABEL, V, VField, VModal } from '../ui';
import { newId, PayMethodsEditor } from './shared';

type Api = ReturnType<typeof funeralApi>;
const blank = (): Bus => ({ id: newId(), name: '', plate: '', capacity: 50, departureLocation: '', departureAt: '', destination: '', driverName: '', driverPhone: '', captainName: '', captainPhone: '', notes: '', fare: 0, paymentMethods: [], reservationsOpen: true });

function BusForm({ initial, onSave, onClose }: { initial: Bus; onSave: (b: Bus) => Promise<void>; onClose: () => void }) {
  const [b, setB] = useState(initial), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const set = <K extends keyof Bus>(k: K, v: Bus[K]) => setB((p) => ({ ...p, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await onSave(b); onClose(); } catch (x) { setError(x instanceof Error ? x.message : 'Enregistrement impossible.'); } finally { setBusy(false); }
  };
  return (
    <VModal wide title={initial.name ? 'Modifier le bus' : 'Nouveau bus'} kicker="Convoi" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <div className="p-3 rounded-lg text-xs bg-red-500/15 border border-red-300/30 text-red-100">{error}</div>}
        <div className="grid sm:grid-cols-2 gap-3">
          <VField label="Nom *"><input required className={V.input} value={b.name} onChange={(e) => set('name', e.target.value)} placeholder="Bus 1 — Douala → village" /></VField>
          <VField label="Immatriculation"><input className={V.input} value={b.plate} onChange={(e) => set('plate', e.target.value)} /></VField>
          <VField label="Places *"><input required type="number" min={1} max={200} className={V.input} value={b.capacity} onChange={(e) => set('capacity', Number(e.target.value))} /></VField>
          <VField label="Tarif par place (0 = gratuit)"><input type="number" min={0} className={V.input} value={b.fare} onChange={(e) => set('fare', Number(e.target.value))} /></VField>
          <VField label="Lieu de départ"><input className={V.input} value={b.departureLocation} onChange={(e) => set('departureLocation', e.target.value)} /></VField>
          <VField label="Départ le"><input type="datetime-local" className={V.input} value={b.departureAt} onChange={(e) => set('departureAt', e.target.value)} /></VField>
          <VField label="Destination"><input className={V.input} value={b.destination} onChange={(e) => set('destination', e.target.value)} /></VField>
          <VField label="Chauffeur"><input className={V.input} value={b.driverName} onChange={(e) => set('driverName', e.target.value)} /></VField>
          <VField label="Tél. chauffeur" hint="Jamais affiché au public."><input type="tel" className={V.input} value={b.driverPhone} onChange={(e) => set('driverPhone', e.target.value)} /></VField>
          <VField label="Chef de convoi"><input className={V.input} value={b.captainName} onChange={(e) => set('captainName', e.target.value)} /></VField>
          <VField label="Tél. chef de convoi" hint="Affiché au public."><input type="tel" className={V.input} value={b.captainPhone} onChange={(e) => set('captainPhone', e.target.value)} /></VField>
        </div>
        <VField label="Consignes"><textarea rows={2} className={V.input} value={b.notes} onChange={(e) => set('notes', e.target.value)} /></VField>
        {b.fare > 0 && <PayMethodsEditor value={b.paymentMethods} onChange={(v) => set('paymentMethods', v)} />}
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={b.reservationsOpen} onChange={(e) => set('reservationsOpen', e.target.checked)} />Réservations ouvertes</label>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className={V.btnGhost}>Annuler</button><button disabled={busy} className={V.btn}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>
      </form>
    </VModal>
  );
}

export function BusesTab({ api, state, reload, currency }: { api: Api; state: FuneralState; reload: () => Promise<void>; currency: string }) {
  const [edit, setEdit] = useState<Bus | null>(null), [error, setError] = useState('');
  const run = async (fn: () => Promise<unknown>) => { setError(''); try { await fn(); await reload(); } catch (e) { setError(e instanceof Error ? e.message : 'Action impossible.'); } };
  const setStatus = (r: Reservation, s: Status) => run(() => api.patchReservation(r.id, { status: s }));

  return (
    <div className="space-y-5">
      {error && <div className="p-3 rounded-lg text-xs bg-red-500/15 border border-red-300/30 text-red-100">{error}</div>}
      <button className={V.btn} onClick={() => setEdit(blank())}><Plus className="w-4 h-4" />Ajouter un bus</button>
      {state.buses.length === 0 && <p className={`text-sm ${V.muted}`}>Aucun bus. Les visiteurs ne verront pas d'onglet de réservation rempli tant que vous n'en avez pas ajouté.</p>}
      {state.buses.map((b) => {
        const rs = state.reservations.filter((r) => r.busId === b.id), taken = rs.filter((r) => r.status !== 'rejected').length;
        return (
          <section key={b.id} className={`${V.card} p-5 space-y-3`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="font-semibold flex items-center gap-2"><BusIcon className="w-4 h-4 text-violet-300" />{b.name}</h3>
                <p className={`text-xs ${V.muted}`}>{[b.departureAt && frDateTime(b.departureAt), b.departureLocation, b.fare > 0 ? fmtMoney(b.fare, currency) : 'Gratuit', `${taken}/${b.capacity} places`].filter(Boolean).join(' · ')}</p></div>
              <div className="flex gap-2"><button className={V.btnGhost} onClick={() => setEdit(b)}><Pencil className="w-3.5 h-3.5" />Modifier</button>
                <button className={V.danger} onClick={() => confirm(`Supprimer « ${b.name} » et ses ${rs.length} réservation(s) ?`) && run(() => api.deleteBus(b.id))}><Trash2 className="w-3.5 h-3.5" /></button></div>
            </div>
            {rs.length === 0 ? <p className={`text-xs ${V.muted}`}>Aucune réservation.</p> : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className={`text-left text-[11px] uppercase ${V.muted}`}><th className="py-1 pr-3">N°</th><th className="pr-3">Passager</th><th className="pr-3">Paiement</th><th className="pr-3">Statut</th><th /></tr></thead>
                <tbody>{rs.map((r) => (
                  <tr key={r.id} className="border-t border-white/10 align-top">
                    <td className="py-2 pr-3 font-semibold text-amber-200">{r.orderNumber}</td>
                    <td className="pr-3"><b>{r.passengerName}</b><br /><a className="text-xs text-violet-200 underline" href={telHref(r.passengerPhone)}>{r.passengerPhone}</a>{r.category && <span className={`text-xs ${V.muted}`}> · {r.category}</span>}</td>
                    <td className="pr-3 text-xs">{r.paymentMethod || '—'}{r.proofUrl && <a href={r.proofUrl} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center gap-0.5 text-violet-200 underline">preuve<ExternalLink className="w-3 h-3" /></a>}</td>
                    <td className="pr-3"><span className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS_CLS[r.status]}`}>{STATUS_LABEL[r.status]}</span></td>
                    <td className="py-2"><div className="flex gap-1 justify-end">
                      {r.status !== 'confirmed' && <button title="Confirmer" aria-label="Confirmer" className={V.btnGhost} onClick={() => setStatus(r, 'confirmed')}><Check className="w-3.5 h-3.5" /></button>}
                      {r.status !== 'rejected' && <button title="Refuser (libère la place)" aria-label="Refuser" className={V.btnGhost} onClick={() => setStatus(r, 'rejected')}><X className="w-3.5 h-3.5" /></button>}
                      <button title="Supprimer" aria-label="Supprimer" className={V.danger} onClick={() => confirm('Supprimer cette réservation ?') && run(() => api.deleteReservation(r.id))}><Trash2 className="w-3.5 h-3.5" /></button></div></td>
                  </tr>))}</tbody></table></div>
            )}
          </section>
        );
      })}
      {edit && <BusForm initial={edit} onClose={() => setEdit(null)} onSave={async (b) => { await api.saveBus(b); await reload(); }} />}
    </div>
  );
}
