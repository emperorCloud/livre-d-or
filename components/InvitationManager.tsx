'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, MessageCircle, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Ceremony, InvitationGuest, RsvpStatus } from '@/lib/types';
import { api } from '@/lib/client/api';
import { copyText } from '@/lib/client/links';
import { Field, inputCls, btnGhost, btnPrimary } from './ui';

const personalLink = (token: string) => `${window.location.origin}/inv/${token}`;
const STATUS: Record<RsvpStatus, { label: string; cls: string }> = {
  pending: { label: 'En attente', cls: 'bg-stone-200 text-stone-700' },
  yes: { label: 'Présent(e)', cls: 'bg-emerald-100 text-emerald-800' },
  maybe: { label: 'Peut-être', cls: 'bg-amber-100 text-amber-800' },
  no: { label: 'Absent(e)', cls: 'bg-red-100 text-red-800' },
};
const EMPTY = { greeting: '', category: '', maxGuests: 1, tableNumber: '', phone: '', email: '' };

/** Invités d'un mariage : ajout, lien personnel, suivi des réponses. Le responsable ne voit que son mariage (contrôlé côté serveur). */
export default function InvitationManager({ ceremony, isAdmin }: { ceremony: Ceremony; isAdmin: boolean }) {
  const [guests, setGuests] = useState<InvitationGuest[] | null>(null);
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | RsvpStatus>('all');
  const [copied, setCopied] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const cid = isAdmin ? ceremony.id : undefined;

  const load = useCallback(async () => {
    try { setGuests(await api.invitations(cid)); } catch (e) { setError(e instanceof Error ? e.message : 'Chargement impossible.'); setGuests([]); }
  }, [cid]);
  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const g = guests || [];
    const c = (s: RsvpStatus) => g.filter((x) => x.rsvpStatus === s).length;
    return { total: g.length, yes: c('yes'), maybe: c('maybe'), no: c('no'), pending: c('pending'),
      people: g.filter((x) => x.rsvpStatus === 'yes').reduce((n, x) => n + x.rsvpGuests, 0), capacity: g.reduce((n, x) => n + x.maxGuests, 0) };
  }, [guests]);
  const categories = useMemo(() => [...new Set((guests || []).map((g) => g.category).filter(Boolean))], [guests]);
  const shown = (guests || []).filter((g) => (filter === 'all' || g.rsvpStatus === filter) && `${g.greeting} ${g.category}`.toLowerCase().includes(q.toLowerCase()));

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form) return; setBusy(true); setError('');
    try {
      if (editId) await api.updateGuest(editId, form); else await api.createGuest(form, cid);
      setForm(null); setEditId(null); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Enregistrement impossible.'); } finally { setBusy(false); }
  };
  const remove = async (g: InvitationGuest) => {
    if (!window.confirm(`Supprimer l'invitation de « ${g.greeting} » ? Son lien cessera de fonctionner.`)) return;
    try { await api.deleteGuest(g.id); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Suppression impossible.'); }
  };
  const message = (g: InvitationGuest) =>
    `${g.greeting}, vous êtes invité(e) à ${ceremony.title}${ceremony.date ? ` — ${ceremony.date}` : ''}.\nVotre invitation personnelle (réponse et billet) : ${personalLink(g.token)}`;
  const whatsapp = (g: InvitationGuest) => {
    const digits = g.phone.replace(/\D/g, '').replace(/^00/, '');
    return `https://wa.me/${digits}?text=${encodeURIComponent(message(g))}`;
  };

  const section = 'bg-white border border-stone-200 rounded-2xl shadow-xs p-5 space-y-4';
  const stat = (label: string, value: string | number) => (
    <div className="bg-stone-50 rounded-xl py-3 px-2 text-center"><div className="text-xl font-bold font-serif-cormorant">{value}</div><div className="text-[10px] uppercase text-stone-500">{label}</div></div>
  );

  return (
    <section className={section}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif-cinzel font-semibold text-base text-stone-900">Invitations ({stats.total})</h2>
        <button className={btnPrimary} onClick={() => { setEditId(null); setForm({ ...EMPTY }); }}><Plus className="w-4 h-4" />Ajouter un invité</button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {stat('Invitations', stats.total)}{stat('Présents', stats.yes)}{stat('Peut-être', stats.maybe)}{stat('Absents', stats.no)}{stat('En attente', stats.pending)}{stat('Personnes', `${stats.people}/${stats.capacity}`)}
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

      {form && (
        <form onSubmit={save} className="border border-amber-200 bg-amber-50/40 rounded-xl p-4 space-y-3">
          <div className="flex justify-between"><h3 className="text-sm font-semibold">{editId ? "Modifier l'invité" : 'Nouvel invité'}</h3><button type="button" onClick={() => { setForm(null); setEditId(null); }} aria-label="Fermer"><X className="w-4 h-4" /></button></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nom d'invitation *" hint="Tel qu'il apparaîtra : « Prénom Nom », « M. et Mme Nom »…"><input required className={inputCls} maxLength={120} value={form.greeting} onChange={(e) => setForm({ ...form, greeting: e.target.value })} /></Field>
            <Field label="Catégorie" hint="Libre : famille, amis, collègues…"><input list="inv-cats" className={inputCls} maxLength={60} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /><datalist id="inv-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></Field>
            <Field label="Personnes prévues (invité inclus)"><select className={inputCls} value={form.maxGuests} onChange={(e) => setForm({ ...form, maxGuests: Number(e.target.value) })}>{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}</select></Field>
            <Field label="Table"><input className={inputCls} maxLength={20} value={form.tableNumber} onChange={(e) => setForm({ ...form, tableNumber: e.target.value })} /></Field>
            <Field label="Téléphone (pour WhatsApp)"><input className={inputCls} maxLength={30} placeholder="+237…" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="E-mail"><input type="email" className={inputCls} maxLength={200} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2"><button type="button" className={btnGhost} onClick={() => { setForm(null); setEditId(null); }}>Annuler</button><button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Enregistrement…' : editId ? 'Enregistrer' : "Créer l'invitation"}</button></div>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        <input className={`${inputCls} max-w-xs`} placeholder="Rechercher un invité…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${inputCls} max-w-[11rem]`} value={filter} onChange={(e) => setFilter(e.target.value as 'all' | RsvpStatus)}>
          <option value="all">Toutes les réponses</option>{(Object.keys(STATUS) as RsvpStatus[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </select>
      </div>

      {guests === null && <p className="text-xs text-stone-500">Chargement…</p>}
      {guests && guests.length === 0 && <p className="text-xs text-stone-500">Aucun invité. Ajoutez le premier : un lien personnel est créé pour chacun.</p>}
      <ul className="divide-y divide-stone-100">
        {shown.map((g) => (
          <li key={g.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{g.greeting} {g.category && <span className="text-xs font-normal text-stone-500">· {g.category}</span>}</div>
              <div className="text-xs text-stone-500 flex flex-wrap items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS[g.rsvpStatus].cls}`}>{STATUS[g.rsvpStatus].label}</span>
                <span>{g.rsvpStatus === 'yes' ? `${g.rsvpGuests}/${g.maxGuests}` : `jusqu'à ${g.maxGuests}`} pers.</span>
                {g.tableNumber && <span>Table {g.tableNumber}</span>}
                {(g.diet || g.allergies) && <span title={`${g.diet} ${g.allergies}`.trim()}>Régime/allergies</span>}
              </div>
              {g.note && <p className="text-xs text-stone-600 italic mt-1 line-clamp-2">« {g.note} »</p>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button className={btnGhost} title="Copier le lien personnel" onClick={async () => { if (await copyText(personalLink(g.token))) { setCopied(g.id); setTimeout(() => setCopied(''), 1500); } }}>{copied === g.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied === g.id ? 'Copié' : 'Lien'}</button>
              <a className={btnGhost} title="Envoyer par WhatsApp" href={whatsapp(g)} target="_blank" rel="noreferrer"><MessageCircle className="w-3.5 h-3.5" /></a>
              <a className={btnGhost} title="Ouvrir la page de l'invité" href={`/inv/${g.token}`} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5" /></a>
              <button className={btnGhost} title="Modifier" onClick={() => { setEditId(g.id); setForm({ greeting: g.greeting, category: g.category, maxGuests: g.maxGuests, tableNumber: g.tableNumber, phone: g.phone, email: g.email }); }}><Pencil className="w-3.5 h-3.5" /></button>
              <button className={`${btnGhost} text-red-700`} title="Supprimer" onClick={() => remove(g)}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
