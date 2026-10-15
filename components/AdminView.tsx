'use client';
import { useMemo, useState } from 'react';
import { BookOpen, Copy, Image as ImageIcon, KeyRound, MessageSquare, Pencil, Plus, QrCode, Search, Settings, Trash2, Users } from 'lucide-react';
import { getEntryPhotos, type Ceremony, type Group, type GuestEntry } from '@/lib/types';
import { typeBadge } from '@/lib/client/themeStyles';
import { copyText, inviteUrl } from '@/lib/client/links';
import { btnGhost, btnPrimary } from './ui';

interface Props {
  ceremonies: Ceremony[]; groups: Group[]; entries: GuestEntry[];
  onNewCeremony: () => void; onEditCeremony: (c: Ceremony) => void; onDeleteCeremony: (c: Ceremony) => void;
  onNewGroup: (c: Ceremony) => void; onOpenGroup: (g: Group) => void; onDeleteGroup: (g: Group) => void;
  onResetCode: (g: Group) => void; onQr: (g: Group, c: Ceremony) => void; onPdf: (c: Ceremony) => void; onSettings: () => void;
}

export default function AdminView(p: Props) {
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState('');
  const photoCount = useMemo(() => p.entries.reduce((n, e) => n + getEntryPhotos(e).length, 0), [p.entries]);
  const countIn = (gid: string) => p.entries.filter((e) => e.groupId === gid).length;
  const list = p.ceremonies.filter((c) => `${c.title} ${c.honoreeName}`.toLowerCase().includes(q.toLowerCase()));

  const stat = (icon: React.ReactNode, label: string, value: number) => (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">{icon}</div>
      <div><div className="text-2xl font-bold font-serif-cormorant leading-none">{value}</div><div className="text-[11px] uppercase tracking-wide text-stone-500 mt-1">{label}</div></div>
    </div>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] font-serif-cinzel font-semibold text-amber-900">Administration</span>
          <h1 className="text-3xl font-serif-cormorant font-bold">Cérémonies & groupes</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={p.onSettings} className={btnGhost}><Settings className="w-4 h-4" />Paramètres du site</button>
          <button onClick={p.onNewCeremony} className={btnPrimary}><Plus className="w-4 h-4" />Nouvelle cérémonie</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stat(<BookOpen className="w-5 h-5" />, 'Cérémonies', p.ceremonies.length)}
        {stat(<Users className="w-5 h-5" />, 'Groupes', p.groups.length)}
        {stat(<MessageSquare className="w-5 h-5" />, 'Témoignages', p.entries.length)}
        {stat(<ImageIcon className="w-5 h-5" />, 'Photos souvenirs', photoCount)}
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une cérémonie…" className="w-full text-sm bg-white border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>

      {list.length === 0 && <div className="text-center text-sm text-stone-500 py-16 bg-white border border-dashed border-stone-300 rounded-2xl">Aucune cérémonie. Créez-en une pour commencer.</div>}

      <div className="space-y-5">
        {list.map((c) => {
          const badge = typeBadge(c.type);
          const gs = p.groups.filter((g) => g.ceremonyId === c.id);
          return (
            <section key={c.id} className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-5 flex flex-wrap items-start justify-between gap-3 border-b border-stone-100">
                <div className="space-y-1">
                  <span className={`inline-block text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                  <h2 className="text-xl font-serif-cormorant font-bold">{c.title}</h2>
                  <p className="text-xs text-stone-600">{c.honoreeName}{c.date ? ` · ${c.date}` : ''}{c.location ? ` · ${c.location}` : ''}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => p.onNewGroup(c)} className={btnGhost}><Plus className="w-3.5 h-3.5" />Ajouter un groupe</button>
                  <button onClick={() => p.onPdf(c)} className={btnGhost}><BookOpen className="w-3.5 h-3.5" />Livre PDF</button>
                  <button onClick={() => p.onEditCeremony(c)} className={btnGhost} title="Modifier"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => p.onDeleteCeremony(c)} className={`${btnGhost} text-red-700`} title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <ul className="divide-y divide-stone-100">
                {gs.length === 0 && <li className="p-5 text-xs text-stone-500">Aucun groupe pour cette cérémonie.</li>}
                {gs.map((g) => (
                  <li key={g.id} className="p-4 sm:px-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm flex items-center gap-2">{g.name}
                        {g.isClosed && <span className="text-[10px] uppercase bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full">Clos</span>}
                      </div>
                      <div className="text-xs text-stone-500">{g.managerName || 'Responsable non renseigné'} · {countIn(g.id)} témoignage{countIn(g.id) > 1 ? 's' : ''} · {g.hasManagerCode ? 'code actif' : <span className="text-amber-800 font-medium">aucun code : à générer</span>}</div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button className={btnGhost} onClick={() => p.onOpenGroup(g)}>Gérer</button>
                      <button className={btnGhost} title="Copier le lien d'invitation" onClick={async () => { if (await copyText(inviteUrl(g.inviteSlug))) { setCopied(g.id); setTimeout(() => setCopied(''), 1500); } }}>
                        <Copy className="w-3.5 h-3.5" />{copied === g.id ? 'Copié' : 'Lien'}
                      </button>
                      <button className={btnGhost} title="QR code" onClick={() => p.onQr(g, c)}><QrCode className="w-3.5 h-3.5" /></button>
                      <button className={btnGhost} title="Nouveau code responsable" onClick={() => p.onResetCode(g)}><KeyRound className="w-3.5 h-3.5" /></button>
                      <button className={`${btnGhost} text-red-700`} title="Supprimer le groupe" onClick={() => p.onDeleteGroup(g)}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
