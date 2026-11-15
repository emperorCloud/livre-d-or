'use client';
import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, ChevronDown, Clock, Copy, Edit2, Ellipsis, Eye, MessageCircle, QrCode, Trash2, XCircle } from 'lucide-react';
import type { Guest, RsvpStatus } from '@/lib/wedding/types';
import { confirmedPersons } from '@/lib/wedding/rsvp';
import { displayName, guestUrl } from './links';

const DIET: Record<string, string> = { classic: 'Classique', vegetarian: 'Végétarien', halal: 'Halal', kosher: 'Casher', gluten_free: 'Sans gluten', other: 'Autre' };

const Chip = ({ who, status }: { who: string; status: RsvpStatus }) => {
  const m = status === 'confirmed'
    ? { cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" />, txt: 'présent(e)' }
    : status === 'declined'
      ? { cls: 'bg-rose-50 text-rose-800 border-rose-200', icon: <XCircle className="w-3.5 h-3.5" />, txt: 'absent(e)' }
      : { cls: 'bg-amber-50 text-amber-800 border-amber-200', icon: <Clock className="w-3.5 h-3.5" />, txt: 'sans réponse' };
  return <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${m.cls}`}>{m.icon}<span className="max-w-[9rem] truncate">{who}</span><span className="opacity-70">· {m.txt}</span></span>;
};

interface Props {
  guest: Guest;
  onEdit: () => void; onDelete: () => void; onPreview: () => void; onToggleCheckIn: () => void;
  onCopyLink: () => Promise<void> | void; whatsappUrl: string; inviteWhatsappUrl: string; reminder: boolean;
  onRepresentative: (status: 'approved' | 'rejected') => void;
}

export const GuestRow: React.FC<Props> = ({ guest: g, onEdit, onDelete, onPreview, onToggleCheckIn, onCopyLink, whatsappUrl, inviteWhatsappUrl, reminder, onRepresentative }) => {
  const [open, setOpen] = useState(false), [menu, setMenu] = useState(false), [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent | KeyboardEvent) => { if (e instanceof KeyboardEvent ? e.key === 'Escape' : !menuRef.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
  }, [menu]);

  const first = g.firstName || 'Invité';
  const second = (g.plusOneName || '').split(' ')[0] || 'Conjoint(e)';
  const persons = confirmedPersons(g);
  const rep = g.representativeRequest;
  const item = 'w-full text-left px-3.5 py-2.5 text-sm flex items-center gap-2.5 hover:bg-slate-50 cursor-pointer';

  return (
    <li className={`px-3 sm:px-5 py-4 ${g.isCheckedIn ? 'bg-emerald-50/40' : ''}`}>
      <div className="flex items-start gap-3">
        <div aria-hidden className="hidden sm:flex w-10 h-10 shrink-0 rounded-full bg-[#F2ECE4] text-[#8A4B38] font-bold items-center justify-center text-sm">{(g.firstName[0] || g.lastName[0] || '?').toUpperCase()}</div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h4 className="font-semibold text-slate-900 text-base leading-tight">{displayName(g)}</h4>
            <span className="text-xs text-slate-500">{[g.category, g.phone].filter(Boolean).join(' · ')}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Chip who={first} status={g.guestRsvp} />
            {g.plusOneAllowed && <Chip who={second} status={g.partnerRsvp} />}
            {g.isCheckedIn && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-600 text-white"><QrCode className="w-3.5 h-3.5" />Émargé{g.checkedInAt ? ` ${new Date(g.checkedInAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>}
            {rep?.hasRequested && rep.status === 'pending' && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-violet-100 text-violet-800 border border-violet-200">Représentant proposé</span>}
          </div>

          <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
            <span>Table : <b className="text-slate-700">{g.tableNumber || 'non assignée'}</b></span>
            {persons > 0 && <span>{persons} personne{persons > 1 ? 's' : ''}{g.childrenCount > 0 ? ` + ${g.childrenCount} enfant(s)` : ''}</span>}
            {g.allergies && <span className="text-rose-700 inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{g.allergies}</span>}
          </div>
        </div>

        {/* Actions : une action principale visible, le reste dans le menu */}
        <div className="shrink-0 flex items-center gap-1.5">
          {reminder ? (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-xs font-bold text-white bg-[#25A244] hover:bg-[#1E8A39] rounded-lg flex items-center gap-1.5" title="Relancer sur WhatsApp"><MessageCircle className="w-4 h-4" /><span className="hidden sm:inline">Relancer</span></a>
          ) : (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 text-[#25A244] hover:bg-emerald-50 rounded-lg" title="Envoyer l’invitation sur WhatsApp" aria-label="Envoyer l’invitation sur WhatsApp"><MessageCircle className="w-4 h-4" /></a>
          )}
          <button onClick={async () => { await onCopyLink(); setCopied(true); setTimeout(() => setCopied(false), 1800); }} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer" title="Copier le lien personnel" aria-label="Copier le lien personnel">{copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}</button>
          <div ref={menuRef} className="relative">
            <button onClick={() => setMenu((v) => !v)} aria-haspopup="menu" aria-expanded={menu} aria-label="Plus d’actions" className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"><Ellipsis className="w-4 h-4" /></button>
            {menu && (
              <div role="menu" className="absolute right-0 top-full mt-1 z-20 w-60 bg-white border border-slate-200 rounded-xl shadow-xl py-1">
                <button role="menuitem" className={item} onClick={() => { setMenu(false); onEdit(); }}><Edit2 className="w-4 h-4 text-slate-500" />Modifier l’invitation</button>
                <button role="menuitem" className={item} onClick={() => { setMenu(false); onPreview(); }}><Eye className="w-4 h-4 text-slate-500" />Voir la page de l’invité</button>
                <button role="menuitem" className={item} onClick={() => { setMenu(false); onToggleCheckIn(); }}><QrCode className="w-4 h-4 text-slate-500" />{g.isCheckedIn ? 'Annuler l’émargement' : 'Émarger manuellement'}</button>
                {reminder && <a role="menuitem" className={item} href={inviteWhatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => setMenu(false)}><MessageCircle className="w-4 h-4 text-slate-500" />Renvoyer l’invitation (WhatsApp)</a>}
                <div className="my-1 border-t border-slate-100" />
                <button role="menuitem" className={`${item} text-rose-700 hover:bg-rose-50`} onClick={() => { setMenu(false); onDelete(); }}><Trash2 className="w-4 h-4" />Supprimer</button>
              </div>
            )}
          </div>
          <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? 'Masquer les détails' : 'Afficher les détails'} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"><ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} /></button>
        </div>
      </div>

      {open && (
        <div className="mt-3 sm:ml-[3.25rem] grid gap-3 md:grid-cols-2 text-sm">
          <div className="rounded-xl border border-slate-200 p-3 space-y-1.5 bg-slate-50/60">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Lien personnel</p>
            <input readOnly value={guestUrl(g)} onFocus={(e) => e.currentTarget.select()} className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-2.5 py-2" aria-label="Lien personnel de l’invité" />
            <p className="text-[11px] text-slate-500">Menu : <b>{DIET[g.dietaryPreference] || g.dietaryPreference}</b>{g.email && <> · {g.email}</>}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 space-y-1.5 bg-slate-50/60">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Mots pour les mariés</p>
            {g.personalNote || g.partnerNote ? (
              <>
                {g.personalNote && <p className="text-slate-700"><b>{first} :</b> {g.personalNote}</p>}
                {g.partnerNote && <p className="text-slate-700"><b>{second} :</b> {g.partnerNote}</p>}
              </>
            ) : <p className="text-slate-400 text-xs">Aucun message pour le moment.</p>}
          </div>
          {rep?.hasRequested && (
            <div className="md:col-span-2 rounded-xl border border-violet-200 bg-violet-50 p-3 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-violet-800">Représentant proposé · {rep.status === 'approved' ? 'accepté' : rep.status === 'rejected' ? 'refusé' : 'à valider'}</p>
              <p className="text-slate-800"><b>{rep.name}</b>{rep.contact ? ` · ${rep.contact}` : ''}{rep.reason ? ` — ${rep.reason}` : ''}</p>
              {rep.status === 'pending' && (
                <div className="flex gap-2"><button onClick={() => onRepresentative('approved')} className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer">Accepter</button><button onClick={() => onRepresentative('rejected')} className="px-3 py-1.5 text-xs font-bold text-rose-800 bg-white border border-rose-300 hover:bg-rose-50 rounded-lg cursor-pointer">Refuser</button></div>
              )}
            </div>
          )}
          {g.notes && <p className="md:col-span-2 text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"><b>Note privée :</b> {g.notes}</p>}
        </div>
      )}
    </li>
  );
};
