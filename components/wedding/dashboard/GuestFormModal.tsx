'use client';
import React, { useState } from 'react';
import { AlertCircle, Loader2, User, Users, X } from 'lucide-react';
import type { Guest, RsvpStatus, WeddingConfig } from '@/lib/wedding/types';

type Mode = 'add' | 'edit';
const CATEGORIES = ['Famille', 'Amis', 'Collègues', 'Témoins', 'Honneur'];
const label = 'block text-xs font-semibold text-slate-700 mb-1';
const input = 'w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500';

const splitName = (full: string) => { const p = full.trim().split(/\s+/); return { first: p[0] || '', last: p.slice(1).join(' ') }; };

/** Titre affiché par défaut : « Jean et Marie Mbarga » pour un couple, « Jean Mbarga » pour une personne seule. */
function autoTitle(couple: boolean, f1: string, l1: string, f2: string, l2: string) {
  if (!couple) return `${f1} ${l1}`.trim();
  if (f2 && (!l2 || l2 === l1)) return `${f1} et ${f2} ${l1}`.trim();
  if (f2) return `${f1} ${l1} et ${f2} ${l2}`.trim();
  return `M. et Mme ${l1}`.trim();
}

interface Props { mode: Mode; guest?: Guest; config: WeddingConfig; onSave: (data: Partial<Guest>) => Promise<void>; onClose: () => void }

export const GuestFormModal: React.FC<Props> = ({ mode, guest, config, onSave, onClose }) => {
  const p2 = splitName(guest?.plusOneName || '');
  const [couple, setCouple] = useState(guest ? guest.plusOneAllowed : false);
  const [first1, setFirst1] = useState(guest?.firstName || ''), [last1, setLast1] = useState(guest?.lastName || '');
  const [first2, setFirst2] = useState(p2.first), [last2, setLast2] = useState(p2.last);
  const [title, setTitle] = useState(guest?.greetingTitle || ''), [titleTouched, setTitleTouched] = useState(!!guest?.greetingTitle);
  const [phone, setPhone] = useState(guest?.phone || ''), [email, setEmail] = useState(guest?.email || '');
  const [category, setCategory] = useState(guest?.category || 'Amis'), [table, setTable] = useState(guest?.tableNumber || '');
  const [r1, setR1] = useState<RsvpStatus>(guest?.guestRsvp || 'pending'), [r2, setR2] = useState<RsvpStatus>(guest?.partnerRsvp || 'pending');
  const [notes, setNotes] = useState(guest?.notes || '');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');

  const suggested = autoTitle(couple, first1.trim(), last1.trim(), first2.trim(), last2.trim());
  const shownTitle = titleTouched ? title : suggested;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!first1.trim() && !last1.trim()) { setError('Indiquez au moins le prénom ou le nom de l’invité.'); return; }
    setBusy(true); setError('');
    const partnerFull = `${first2.trim()} ${last2.trim() && last2.trim() !== last1.trim() ? last2.trim() : last1.trim()}`.trim();
    try {
      await onSave({
        firstName: first1.trim(), lastName: last1.trim(), greetingTitle: (shownTitle || suggested).trim(),
        phone: phone.trim(), email: email.trim(), category: category.trim() || 'Amis', tableNumber: table.trim(),
        plusOneAllowed: couple, plusOneName: couple ? (first2.trim() ? partnerFull : '') : '',
        ...(mode === 'edit' ? { guestRsvp: r1, partnerRsvp: couple ? r2 : 'pending', notes } : {}),
      });
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Enregistrement impossible.'); setBusy(false); }
  };

  const seg = (on: boolean) => `flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition cursor-pointer ${on ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`;
  const RsvpSelect = ({ value, onChange }: { value: RsvpStatus; onChange: (v: RsvpStatus) => void }) => (
    <select value={value} onChange={(e) => onChange(e.target.value as RsvpStatus)} className={input}>
      <option value="pending">Sans réponse</option><option value="confirmed">Présent(e)</option><option value="declined">Absent(e)</option>
    </select>
  );

  return (
    <div role="dialog" aria-modal="true" aria-label={mode === 'add' ? 'Ajouter un invité' : 'Modifier l’invité'} className="fixed inset-0 z-50 bg-black/55 flex items-end sm:items-center justify-center sm:p-4">
      <form onSubmit={submit} className="bg-white w-full sm:max-w-xl max-h-[94dvh] sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col">
        <div className="shrink-0 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-serif text-xl font-bold text-slate-900">{mode === 'add' ? 'Ajouter un invité' : 'Modifier l’invitation'}</h3>
          <button type="button" onClick={onClose} aria-label="Fermer" className="p-2 -mr-2 rounded-full text-slate-500 hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {error && <p role="alert" className="flex items-start gap-2 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</p>}

          <div>
            <span className={label}>Type d’invitation</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCouple(false)} className={seg(!couple)}><User className="w-4 h-4" />Une personne</button>
              <button type="button" onClick={() => setCouple(true)} className={seg(couple)}><Users className="w-4 h-4" />Un couple</button>
            </div>
            {couple && <p className="text-xs text-slate-500 mt-1.5">Chacune des deux personnes répondra elle-même dans le même formulaire.</p>}
          </div>

          <section className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">{couple ? 'Personne 1' : 'Invité'}</h4>
            <div className="grid grid-cols-2 gap-3">
              <label><span className={label}>Prénom</span><input className={input} value={first1} onChange={(e) => setFirst1(e.target.value)} autoComplete="off" autoFocus /></label>
              <label><span className={label}>Nom</span><input className={input} value={last1} onChange={(e) => setLast1(e.target.value)} autoComplete="off" /></label>
            </div>
          </section>

          {couple && (
            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">Personne 2</h4>
              <div className="grid grid-cols-2 gap-3">
                <label><span className={label}>Prénom</span><input className={input} value={first2} onChange={(e) => setFirst2(e.target.value)} autoComplete="off" /></label>
                <label><span className={label}>Nom <span className="font-normal text-slate-400">(si différent)</span></span><input className={input} value={last2} onChange={(e) => setLast2(e.target.value)} placeholder={last1} autoComplete="off" /></label>
              </div>
            </section>
          )}

          <label className="block"><span className={label}>Titre affiché sur l’invitation</span>
            <input className={input} value={shownTitle} onChange={(e) => { setTitle(e.target.value); setTitleTouched(true); }} />
            <span className="text-[11px] text-slate-400">Proposé automatiquement ; modifiez-le si besoin (ex. « Dr Mbarga et famille »).</span></label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label><span className={label}>Téléphone (WhatsApp)</span><input type="tel" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6XX XX XX XX" /></label>
            <label><span className={label}>E-mail</span><input type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label><span className={label}>Catégorie</span><input list="guest-categories" className={input} value={category} onChange={(e) => setCategory(e.target.value)} />
              <datalist id="guest-categories">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist></label>
            <label><span className={label}>Table</span><input list="guest-tables" className={input} value={table} onChange={(e) => setTable(e.target.value)} placeholder="Non assignée" />
              <datalist id="guest-tables">{(config.tablesList || []).map((t) => <option key={t.id} value={t.name} />)}</datalist></label>
          </div>

          {mode === 'edit' && (
            <section className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">Réponses (correction manuelle)</h4>
              <div className={`grid gap-3 ${couple ? 'sm:grid-cols-2' : ''}`}>
                <label><span className={label}>{couple ? (first1 || 'Personne 1') : 'Réponse'}</span><RsvpSelect value={r1} onChange={setR1} /></label>
                {couple && <label><span className={label}>{first2 || 'Personne 2'}</span><RsvpSelect value={r2} onChange={setR2} /></label>}
              </div>
              <label className="block"><span className={label}>Notes privées <span className="font-normal text-slate-400">(jamais visibles par l’invité)</span></span>
                <textarea rows={2} className={input} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
            </section>
          )}
        </div>

        <div className="shrink-0 px-5 py-3 border-t border-slate-100 flex justify-end gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer">Annuler</button>
          <button disabled={busy} className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl flex items-center gap-2 cursor-pointer">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}{mode === 'add' ? 'Ajouter l’invité' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
};
