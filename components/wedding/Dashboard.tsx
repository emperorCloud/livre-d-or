'use client';
import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Copy, FileSpreadsheet, Plus, QrCode, Search, UserPlus, Users, Utensils, XCircle } from 'lucide-react';
import type { DietaryOption, Guest, WeddingConfig } from '@/lib/wedding/types';
import { addGuest, checkInGuest, removeGuest, undoCheckIn, updateGuest } from '@/lib/wedding/api';
import { confirmedPersons, everyoneAnswered } from '@/lib/wedding/rsvp';
import { copyText } from '@/lib/client/links';
import { useToasts } from '../Toasts';
import { GuestFormModal } from './dashboard/GuestFormModal';
import { GuestRow } from './dashboard/GuestRow';
import { displayName, guestUrl, inviteMessage, reminderMessage, whatsappHref } from './dashboard/links';

interface DashboardProps {
  config: WeddingConfig;
  guests: Guest[];
  onOpenGuestPass: (guest: Guest) => void;
  onOpenExportModal: () => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

type Filter = 'all' | 'confirmed' | 'pending' | 'declined' | 'checked_in' | 'not_checked_in';
type Sort = 'recent' | 'name' | 'table';

const DIET_LABEL: Record<DietaryOption, string> = { classic: 'Classique', vegetarian: 'Végétarien', halal: 'Halal', kosher: 'Casher', gluten_free: 'Sans gluten', other: 'Autre' };

export const Dashboard: React.FC<DashboardProps> = ({ config, guests, onOpenGuestPass, onOpenExportModal, isAddModalOpen, setIsAddModalOpen }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<Sort>('recent');
  const [editing, setEditing] = useState<Guest | null>(null);
  const { push, node: toasts } = useToasts();

  const fail = (e: unknown, fallback: string) => push(e instanceof Error ? e.message : fallback, 'error');

  // ---------- Chiffres ----------
  const stats = useMemo(() => {
    let invitedPersons = 0, present = 0, kids = 0, absentPersons = 0, checkedIn = 0, confirmedInvites = 0;
    const diet: Record<DietaryOption, number> = { classic: 0, vegetarian: 0, halal: 0, kosher: 0, gluten_free: 0, other: 0 };
    const tables: Record<string, { people: number; arrived: number }> = {};
    const allergies: { name: string; allergy: string; table: string }[] = [];
    for (const g of guests) {
      invitedPersons += g.plusOneAllowed ? 2 : 1;
      const n = confirmedPersons(g);
      present += n;
      absentPersons += (g.guestRsvp === 'declined' ? 1 : 0) + (g.plusOneAllowed && g.partnerRsvp === 'declined' ? 1 : 0);
      if (g.isCheckedIn) checkedIn++;
      if (n > 0) {
        confirmedInvites++; kids += g.childrenCount;
        diet[g.dietaryPreference] = (diet[g.dietaryPreference] || 0) + n;
        if (g.allergies?.trim()) allergies.push({ name: displayName(g), allergy: g.allergies, table: g.tableNumber });
        const t = g.tableNumber || 'Non assignée';
        tables[t] = tables[t] || { people: 0, arrived: 0 };
        tables[t].people += n; if (g.isCheckedIn) tables[t].arrived += n;
      }
    }
    return {
      foyers: guests.length, invitedPersons, present, kids, absentPersons, checkedIn, confirmedInvites,
      toChase: guests.filter((g) => !everyoneAnswered(g)).length,
      diet, tables, allergies,
    };
  }, [guests]);

  const counts = useMemo(() => ({
    all: guests.length,
    confirmed: guests.filter((g) => g.rsvpStatus === 'confirmed').length,
    pending: guests.filter((g) => !everyoneAnswered(g)).length,
    declined: guests.filter((g) => g.rsvpStatus === 'declined').length,
    checked_in: guests.filter((g) => g.isCheckedIn).length,
    not_checked_in: guests.filter((g) => g.rsvpStatus === 'confirmed' && !g.isCheckedIn).length,
  }), [guests]);

  const categories = useMemo(() => [...new Set(guests.map((g) => g.category).filter(Boolean))].sort(), [guests]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = guests.filter((g) => {
      if (q && !`${g.firstName} ${g.lastName} ${g.greetingTitle || ''} ${g.plusOneName || ''} ${g.tableNumber} ${g.email || ''} ${g.phone || ''}`.toLowerCase().includes(q)) return false;
      if (category !== 'all' && g.category !== category) return false;
      switch (filter) {
        case 'confirmed': return g.rsvpStatus === 'confirmed';
        case 'pending': return !everyoneAnswered(g);
        case 'declined': return g.rsvpStatus === 'declined';
        case 'checked_in': return g.isCheckedIn;
        case 'not_checked_in': return g.rsvpStatus === 'confirmed' && !g.isCheckedIn;
        default: return true;
      }
    });
    if (sort === 'name') out.sort((a, b) => (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName, 'fr'));
    if (sort === 'table') out.sort((a, b) => (a.tableNumber || '~').localeCompare(b.tableNumber || '~', 'fr', { numeric: true }));
    return out;
  }, [guests, search, filter, category, sort]);

  // ---------- Actions (chacune confirme ou signale l'erreur) ----------
  const copyLink = async (g: Guest) => push((await copyText(guestUrl(g))) ? 'Lien personnel copié' : 'Copie impossible : copiez le lien manuellement.', 'ok');
  const copyAll = async () => {
    const text = guests.map((g) => `${displayName(g)} (${g.tableNumber || 'sans table'}) : ${guestUrl(g)}`).join('\n');
    push((await copyText(text)) ? `${guests.length} liens copiés` : 'Copie impossible.', 'ok');
  };
  const del = async (g: Guest) => {
    if (!confirm(`Supprimer définitivement l’invitation de ${displayName(g)} ?`)) return;
    try { await removeGuest(g.id); push('Invitation supprimée'); } catch (e) { fail(e, 'Suppression impossible.'); }
  };
  const toggleCheckIn = async (g: Guest) => {
    try {
      if (g.isCheckedIn) { await undoCheckIn(g.id); push('Émargement annulé'); }
      else { await checkInGuest({ guestId: g.id, checkedInBy: 'Tableau de bord' }); push(`${displayName(g)} émargé(e)`); }
    } catch (e) { fail(e, 'Émargement impossible.'); }
  };
  const decideRepresentative = async (g: Guest, status: 'approved' | 'rejected') => {
    if (!g.representativeRequest) return;
    try { await updateGuest(g.id, { representativeRequest: { ...g.representativeRequest, status } }); push(status === 'approved' ? 'Représentant accepté' : 'Représentant refusé'); } catch (e) { fail(e, 'Action impossible.'); }
  };

  const tile = 'rounded-2xl border bg-white p-4 text-left transition';
  const chip = (on: boolean) => `shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold border transition cursor-pointer ${on ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`;

  return (
    <div className="space-y-5">
      {/* ---- Chiffres clés ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button onClick={() => setFilter('all')} className={`${tile} border-slate-200 hover:border-slate-300`}>
          <div className="flex items-center justify-between text-xs font-medium text-slate-500"><span>Invitations</span><Users className="w-4 h-4" /></div>
          <p className="mt-1.5 text-3xl font-bold text-slate-900">{stats.foyers}</p>
          <p className="text-xs text-slate-500">{stats.invitedPersons} personnes invitées</p>
        </button>
        <button onClick={() => setFilter('confirmed')} className={`${tile} border-emerald-200 hover:border-emerald-300`}>
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800"><span>Présents</span><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
          <p className="mt-1.5 text-3xl font-bold text-emerald-700">{stats.present}</p>
          <p className="text-xs text-emerald-800/80">personnes{stats.kids > 0 ? ` + ${stats.kids} enfant(s)` : ''}</p>
        </button>
        <button onClick={() => setFilter('pending')} className={`${tile} ${stats.toChase > 0 ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200'} hover:border-amber-400`}>
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900"><span>À relancer</span><Clock className="w-4 h-4 text-amber-600" /></div>
          <p className="mt-1.5 text-3xl font-bold text-amber-700">{stats.toChase}</p>
          <p className="text-xs text-amber-800/80">{stats.toChase > 0 ? 'invitation(s) sans réponse complète' : 'tout le monde a répondu'}</p>
        </button>
        <button onClick={() => setFilter('declined')} className={`${tile} border-slate-200 hover:border-slate-300`}>
          <div className="flex items-center justify-between text-xs font-medium text-slate-500"><span>Absents</span><XCircle className="w-4 h-4 text-rose-500" /></div>
          <p className="mt-1.5 text-3xl font-bold text-slate-700">{stats.absentPersons}</p>
          <p className="text-xs text-slate-500">personnes ne viendront pas</p>
        </button>
      </div>

      {/* ---- Liste des invités ---- */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3 sticky top-0 z-10 bg-white/95 backdrop-blur rounded-t-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[12rem]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un invité, une table, un téléphone…" aria-label="Rechercher un invité"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
            <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-2 cursor-pointer"><Plus className="w-4 h-4" />Ajouter un invité</button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none" role="group" aria-label="Filtrer par statut">
            {([['all', 'Tous'], ['confirmed', 'Présents'], ['pending', 'À relancer'], ['declined', 'Absents'], ['checked_in', 'Émargés'], ['not_checked_in', 'Attendus']] as [Filter, string][]).map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} aria-pressed={filter === k} className={chip(filter === k)}>{l} <span className="opacity-60">{counts[k]}</span></button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Catégorie" className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
                <option value="all">Toutes catégories</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Trier" className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
                <option value="recent">Plus récents</option><option value="name">Nom (A–Z)</option><option value="table">Table</option>
              </select>
              <span>{list.length} résultat{list.length > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={copyAll} disabled={!guests.length} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 text-slate-700 cursor-pointer disabled:opacity-40"><Copy className="w-3.5 h-3.5" />Copier tous les liens</button>
              <button onClick={onOpenExportModal} className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 text-slate-700 cursor-pointer"><FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />Exporter / imprimer</button>
            </div>
          </div>
        </div>

        {guests.length === 0 ? (
          <div className="px-6 py-14 text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-[#F2ECE4] flex items-center justify-center"><UserPlus className="w-6 h-6 text-[#8A4B38]" /></div>
            <h3 className="font-serif text-2xl font-bold text-slate-900">Ajoutez votre premier invité</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">Chaque invité reçoit un lien personnel, sans mot de passe : il y répond à l’invitation, puis son billet d’accès (QR code) lui est remis. Pour un couple, chacun des deux répond.</p>
            <button onClick={() => setIsAddModalOpen(true)} className="px-5 py-3 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer">Ajouter un invité</button>
          </div>
        ) : list.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">Aucun invité ne correspond à ces critères. <button className="underline" onClick={() => { setSearch(''); setFilter('all'); setCategory('all'); }}>Tout afficher</button></p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((g) => (
              <GuestRow key={g.id} guest={g} reminder={!everyoneAnswered(g)}
                whatsappUrl={whatsappHref(g.phone, everyoneAnswered(g) ? inviteMessage(g, config) : reminderMessage(g, config))}
                inviteWhatsappUrl={whatsappHref(g.phone, inviteMessage(g, config))}
                onCopyLink={() => copyLink(g)} onEdit={() => setEditing(g)} onDelete={() => del(g)} onPreview={() => onOpenGuestPass(g)}
                onToggleCheckIn={() => toggleCheckIn(g)} onRepresentative={(s) => decideRepresentative(g, s)} />
            ))}
          </ul>
        )}
      </section>

      {/* ---- Traiteur & tables (repliable) ---- */}
      {stats.present > 0 && (
        <details className="bg-white rounded-2xl border border-slate-200 group">
          <summary className="px-5 py-4 cursor-pointer flex items-center justify-between list-none">
            <span className="font-semibold text-slate-800 text-sm flex items-center gap-2"><Utensils className="w-4 h-4 text-amber-700" />Traiteur &amp; plan de tables <span className="font-normal text-slate-500">· {stats.present} repas</span></span>
            <span className="text-xs text-slate-400 group-open:hidden">Afficher</span><span className="text-xs text-slate-400 hidden group-open:inline">Masquer</span>
          </summary>
          <div className="px-5 pb-5 grid md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Régimes alimentaires</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(DIET_LABEL) as DietaryOption[]).map((k) => (
                  <div key={k} className="rounded-xl bg-slate-50 border border-slate-100 p-2.5"><p className="text-[10px] uppercase text-slate-500 font-medium">{DIET_LABEL[k]}</p><p className="text-lg font-bold text-slate-800">{stats.diet[k]}</p></div>
                ))}
              </div>
              {stats.allergies.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-rose-800 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Allergies signalées ({stats.allergies.length})</p>
                  {stats.allergies.map((a, i) => <p key={i} className="text-xs bg-rose-50 text-rose-900 rounded-lg px-2.5 py-1.5"><b>{a.name}</b>{a.table ? ` (${a.table})` : ''} : {a.allergy}</p>)}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tables ({Object.keys(stats.tables).length})</p>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {Object.entries(stats.tables).map(([name, t]) => (
                  <div key={name} className="rounded-xl bg-slate-50 border border-slate-100 p-2.5"><p className="text-sm font-medium text-slate-800 truncate" title={name}>{name}</p><p className="text-[11px] text-slate-500">{t.people} personne(s){t.arrived > 0 && <span className="text-emerald-700 font-medium"> · {t.arrived} arrivée(s)</span>}</p></div>
                ))}
              </div>
              {stats.checkedIn > 0 && <p className="text-xs text-slate-500 flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5" />{stats.checkedIn} invitation(s) émargée(s) sur {stats.confirmedInvites}</p>}
            </div>
          </div>
        </details>
      )}

      {isAddModalOpen && <GuestFormModal mode="add" config={config} onClose={() => setIsAddModalOpen(false)} onSave={async (d) => { await addGuest(d); push('Invité ajouté'); }} />}
      {editing && <GuestFormModal mode="edit" guest={editing} config={config} onClose={() => setEditing(null)} onSave={async (d) => { await updateGuest(editing.id, d); push('Invitation mise à jour'); }} />}
      {toasts}
    </div>
  );
};
