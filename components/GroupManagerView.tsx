'use client';
import { useEffect, useState } from 'react';
import WeddingOrganizer from './WeddingOrganizer';
import ProgrammeOrganizer from './funeral/ProgrammeOrganizer';
import { useToasts } from './Toasts';
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, Check, ChevronsUp, Copy, ExternalLink, GripVertical, QrCode, Trash2, Eye, EyeOff } from 'lucide-react';
import { moveBefore, moveId, moveToTop, sortEntries } from '@/lib/entryOrder';
import { getEntryPhotos, type Ceremony, type Group, type GuestEntry, type ThemeConfig } from '@/lib/types';
import { FONTS, PAPERS } from '@/lib/client/themeStyles';
import { copyText, inviteUrl } from '@/lib/client/links';
import FeaturedPhotoEditor from './FeaturedPhotoEditor';
import { Field, inputCls, btnGhost, btnPrimary } from './ui';

interface Props {
  ceremony: Ceremony; group: Group; entries: GuestEntry[];
  onBack?: () => void; // présent = vue ouverte par l'administrateur
  onSave: (patch: Partial<Group>) => Promise<void>;
  onModerate: (id: string, patch: { isPinned?: boolean; isApproved?: boolean }) => Promise<void>;
  onReorder: (groupId: string, ids: string[]) => Promise<void>;
  onDeleteEntry: (e: GuestEntry) => Promise<void>;
  onQr: () => void; onPdf: () => void;
}

export default function GroupManagerView({ ceremony, group, entries, onBack, onSave, onModerate, onReorder, onDeleteEntry, onQr, onPdf }: Props) {
  const [draft, setDraft] = useState<Group>(group);
  const [busy, setBusy] = useState(false);
  const { push: toast, node: toasts } = useToasts();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  // Formule du mariage : livre d'or, invitations, ou les deux (onglets)
  const hasBook = ceremony.mode !== 'invitation';
  const hasInv = ceremony.mode !== 'guestbook';
  const [tab, setTab] = useState<'book' | 'inv'>(hasBook ? 'book' : 'inv');
  const showBook = hasBook && tab === 'book';
  useEffect(() => setDraft(group), [group]);
  const patch = (p: Partial<Group>) => setDraft((d) => ({ ...d, ...p }));
  const overrides = (draft.themeOverrides || {}) as Partial<ThemeConfig>;
  const setOverride = (k: 'fontStyle' | 'paperTexture', v: string) => patch({ themeOverrides: { ...overrides, [k]: v } as Partial<ThemeConfig> });
  const url = typeof window === 'undefined' ? '' : inviteUrl(group.inviteSlug);
  // Les messages dans l'ORDRE DU LIVRE (même règle que le PDF : lib/entryOrder.ts).
  const mine = sortEntries(entries.filter((e) => e.groupId === group.id));
  const ids = mine.map((e) => e.id);
  const bookNumber = new Map(mine.filter((e) => e.isApproved !== false).map((e, i) => [e.id, i + 1] as const));
  const someRanked = mine.some((e) => e.sortOrder != null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [lastMoved, setLastMoved] = useState<string | null>(null);
  const reorder = (next: string[], movedId: string) => { if (next === ids || next.join() === ids.join()) return; setLastMoved(movedId); void onReorder(group.id, next); };
  useEffect(() => { if (lastMoved) document.getElementById(`msg-${lastMoved}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [lastMoved, entries]);
  const photos = mine.reduce((n, e) => n + getEntryPhotos(e).length, 0);

  const save = async () => {
    setBusy(true); setError('');
    try {
      await onSave({
        ...(onBack ? { name: draft.name, managerName: draft.managerName, managerEmail: draft.managerEmail } : {}),
        customIntro: draft.customIntro, customPrompt: draft.customPrompt, allowPhotos: draft.allowPhotos, isClosed: draft.isClosed,
        featuredPhotoUrl: draft.featuredPhotoUrl, featuredPhotoAspectRatio: draft.featuredPhotoAspectRatio,
        featuredFocalX: draft.featuredFocalX, featuredFocalY: draft.featuredFocalY, featuredWidth: draft.featuredWidth, featuredHeight: draft.featuredHeight,
        themeOverrides: draft.themeOverrides,
      } as Partial<Group>);
      toast('Modifications enregistrées');
    } catch (e) { const m = e instanceof Error ? e.message : 'Enregistrement impossible.'; setError(m); toast(m, 'error'); } finally { setBusy(false); }
  };

  const section = 'bg-white border border-stone-200 rounded-2xl shadow-xs p-5 space-y-4';
  const title = 'font-serif-cinzel font-semibold text-base text-stone-900';

  return (
    <main className={`${hasInv && tab === 'inv' ? 'max-w-7xl' : 'max-w-5xl'} mx-auto px-4 sm:px-6 py-8 space-y-6`}>
      <div className="space-y-2">
        {onBack && <button onClick={onBack} className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" />Retour à l'administration</button>}
        <span className="text-[11px] uppercase tracking-[0.25em] font-serif-cinzel font-semibold text-amber-900">{ceremony.title}</span>
        <h1 className="text-3xl font-serif-cormorant font-bold">{group.name}</h1>
        {hasBook && <p className="text-xs text-stone-600">{mine.length} témoignage{mine.length > 1 ? 's' : ''} · {photos} photo{photos > 1 ? 's' : ''}{group.isClosed ? ' · clos' : ''}</p>}
      </div>

      {hasBook && hasInv && (
        <div className="flex gap-2 border-b border-stone-200">
          {([['book', "Livre d'or"], ['inv', ceremony.type === 'deuil' ? 'Programme' : 'Invitations']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 -mb-px transition-colors ${tab === id ? 'border-amber-600 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'}`}>{label}</button>
          ))}
        </div>
      )}

      {onBack && (
        <section className={section}>
          <h2 className={title}>Informations du groupe (administrateur)</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Nom du groupe"><input className={inputCls} value={draft.name} onChange={(e) => patch({ name: e.target.value })} /></Field>
            <Field label="Responsable"><input className={inputCls} value={draft.managerName} onChange={(e) => patch({ managerName: e.target.value })} /></Field>
            <Field label="E-mail du responsable"><input type="email" className={inputCls} value={draft.managerEmail} onChange={(e) => patch({ managerEmail: e.target.value })} /></Field>
          </div>
        </section>
      )}

      {showBook && (
      <section className={section}>
        <h2 className={title}>Lien d'invitation pour vos invités</h2>
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="w-full text-xs font-mono bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5" />
        <div className="flex flex-wrap gap-2">
          <button className={btnPrimary} onClick={async () => { setCopied(await copyText(url)); setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Lien copié' : 'Copier le lien'}</button>
          <button className={btnGhost} onClick={onQr}><QrCode className="w-4 h-4" />QR code</button>
          <a className={btnGhost} href={url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" />Tester la vue invité</a>
          <button className={btnGhost} onClick={onPdf}><BookOpen className="w-4 h-4" />Télécharger le livre en PDF</button>
        </div>
      </section>
      )}

      {showBook && (
      <section className={section}>
        <h2 className={title}>Photo du concerné à la une</h2>
        <FeaturedPhotoEditor group={draft} onChange={patch} />
      </section>
      )}

      {hasInv && tab === 'inv' && (ceremony.type === 'deuil' ? <ProgrammeOrganizer ceremony={ceremony} group={group} /> : <WeddingOrganizer ceremony={ceremony} isAdmin={!!onBack} />)}

      {showBook && (
      <section className={section}>
        <h2 className={title}>Personnalisation de la page</h2>
        <Field label="Mot d'accueil des invités"><textarea rows={3} className={inputCls} value={draft.customIntro} onChange={(e) => patch({ customIntro: e.target.value })} /></Field>
        <Field label="Suggestion pour guider les messages"><input className={inputCls} value={draft.customPrompt} onChange={(e) => patch({ customPrompt: e.target.value })} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Police d'écriture"><select className={inputCls} value={overrides.fontStyle || ceremony.theme.fontStyle} onChange={(e) => setOverride('fontStyle', e.target.value)}>{FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select></Field>
          <Field label="Texture de papier"><select className={inputCls} value={overrides.paperTexture || ceremony.theme.paperTexture} onChange={(e) => setOverride('paperTexture', e.target.value)}>{PAPERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select></Field>
        </div>
        <label className="flex items-center gap-2 text-xs text-stone-700"><input type="checkbox" checked={draft.allowPhotos} onChange={(e) => patch({ allowPhotos: e.target.checked })} />Autoriser l'envoi de photos souvenirs (jusqu'à 6 par invité)</label>
        <label className="flex items-center gap-2 text-xs text-stone-700"><input type="checkbox" checked={draft.isClosed} onChange={(e) => patch({ isClosed: e.target.checked })} />Clôturer les signatures (verrouiller le livre avant impression)</label>
      </section>
      )}

      {(showBook || onBack) && (
        <div className="flex items-center gap-3 sticky bottom-4 z-10">
          <button onClick={save} disabled={busy} className={`${btnPrimary} shadow-lg`}>{busy ? 'Enregistrement…' : 'Enregistrer les modifications'}</button>
          {error && <span role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">{error}</span>}
        </div>
      )}

      {showBook && (
      <section className={section}>
        <h2 className={title}>Messages reçus ({mine.length})</h2>
        {mine.length === 0 && <p className="text-xs text-stone-500">Aucun message pour le moment. Partagez le lien d'invitation !</p>}
        {mine.length > 1 && (
          <p className="text-xs text-stone-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            <b>Ordre du livre :</b> le livre PDF (messages, sommaire, pages) suit exactement l'ordre ci-dessous. Montez ou descendez un message avec les flèches, placez-le <b>en premier</b>, ou glissez-le (ordinateur). Les nouveaux messages arrivent en bas.
          </p>
        )}
        <ul className="divide-y divide-stone-100">
          {mine.map((e, idx) => {
            const n = getEntryPhotos(e).length;
            const isNew = someRanked && e.sortOrder == null;
            return (
              <li key={e.id} id={`msg-${e.id}`}
                draggable onDragStart={(ev) => { setDragId(e.id); ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', e.id); }}
                onDragOver={(ev) => { if (dragId && dragId !== e.id) { ev.preventDefault(); setOverId(e.id); } }}
                onDrop={(ev) => { ev.preventDefault(); if (dragId) reorder(moveBefore(ids, dragId, e.id), dragId); setDragId(null); setOverId(null); }}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                className={`py-3 flex flex-wrap items-start justify-between gap-3 transition ${e.isApproved === false ? 'opacity-60' : ''} ${dragId === e.id ? 'opacity-40' : ''} ${overId === e.id ? 'border-t-2 border-amber-500' : ''}`}>
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="flex flex-col items-center pt-0.5 w-7 shrink-0 text-stone-400 cursor-grab active:cursor-grabbing" title="Glisser pour déplacer">
                    <GripVertical className="w-4 h-4 hidden sm:block" aria-hidden="true" />
                    <span className="text-xs font-bold text-stone-700 tabular-nums" aria-label={bookNumber.has(e.id) ? `Position ${bookNumber.get(e.id)} dans le livre` : 'Hors du livre'}>{bookNumber.get(e.id) ?? '–'}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{e.firstName} {e.lastName} <span className="text-xs font-normal text-stone-500">· {e.relationship}</span>
                      {isNew && <span className="ml-2 text-[10px] uppercase bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full font-semibold">Nouveau</span>}
                      {e.isApproved === false && <span className="ml-2 text-[10px] uppercase bg-stone-200 px-1.5 py-0.5 rounded-full">Retiré du livre</span>}
                    </div>
                    <p className="text-xs text-stone-600 line-clamp-2 mt-0.5">{e.message}</p>
                    {n > 0 && <p className="text-[11px] text-stone-400 mt-0.5">{n} photo{n > 1 ? 's' : ''}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button className={btnGhost} disabled={idx === 0} aria-label="Mettre en premier" title="Mettre en premier dans le livre" onClick={() => reorder(moveToTop(ids, e.id), e.id)}><ChevronsUp className="w-3.5 h-3.5" /></button>
                  <button className={btnGhost} disabled={idx === 0} aria-label="Monter d'un rang" title="Monter d'un rang" onClick={() => reorder(moveId(ids, e.id, -1), e.id)}><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button className={btnGhost} disabled={idx === mine.length - 1} aria-label="Descendre d'un rang" title="Descendre d'un rang" onClick={() => reorder(moveId(ids, e.id, 1), e.id)}><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button className={btnGhost} title={e.isApproved === false ? 'Remettre dans le livre' : 'Retirer du livre'} onClick={() => onModerate(e.id, { isApproved: e.isApproved === false })}>{e.isApproved === false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</button>
                  <button className={`${btnGhost} text-red-700`} title="Supprimer" onClick={() => onDeleteEntry(e)}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      )}
      {toasts}
    </main>
  );
}
