'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Check, Copy, ExternalLink, Pin, QrCode, Trash2, Eye, EyeOff } from 'lucide-react';
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
  onDeleteEntry: (e: GuestEntry) => Promise<void>;
  onQr: () => void; onPdf: () => void;
}

export default function GroupManagerView({ ceremony, group, entries, onBack, onSave, onModerate, onDeleteEntry, onQr, onPdf }: Props) {
  const [draft, setDraft] = useState<Group>(group);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => setDraft(group), [group]);
  const patch = (p: Partial<Group>) => { setSaved(false); setDraft((d) => ({ ...d, ...p })); };
  const overrides = (draft.themeOverrides || {}) as Partial<ThemeConfig>;
  const setOverride = (k: 'fontStyle' | 'paperTexture', v: string) => patch({ themeOverrides: { ...overrides, [k]: v } as Partial<ThemeConfig> });
  const url = typeof window === 'undefined' ? '' : inviteUrl(group.inviteSlug);
  const mine = entries.filter((e) => e.groupId === group.id);
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
      setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Enregistrement impossible.'); } finally { setBusy(false); }
  };

  const section = 'bg-white border border-stone-200 rounded-2xl shadow-xs p-5 space-y-4';
  const title = 'font-serif-cinzel font-semibold text-base text-stone-900';

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-2">
        {onBack && <button onClick={onBack} className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" />Retour à l'administration</button>}
        <span className="text-[11px] uppercase tracking-[0.25em] font-serif-cinzel font-semibold text-amber-900">{ceremony.title}</span>
        <h1 className="text-3xl font-serif-cormorant font-bold">{group.name}</h1>
        <p className="text-xs text-stone-600">{mine.length} témoignage{mine.length > 1 ? 's' : ''} · {photos} photo{photos > 1 ? 's' : ''}{group.isClosed ? ' · clos' : ''}</p>
      </div>

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

      <section className={section}>
        <h2 className={title}>Photo du concerné à la une</h2>
        <FeaturedPhotoEditor group={draft} onChange={patch} />
      </section>

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

      <div className="flex items-center gap-3 sticky bottom-4">
        <button onClick={save} disabled={busy} className={`${btnPrimary} shadow-lg`}>{busy ? 'Enregistrement…' : 'Enregistrer les modifications'}</button>
        {saved && <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">Modifications enregistrées</span>}
        {error && <span className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">{error}</span>}
      </div>

      <section className={section}>
        <h2 className={title}>Messages reçus ({mine.length})</h2>
        {mine.length === 0 && <p className="text-xs text-stone-500">Aucun message pour le moment. Partagez le lien d'invitation !</p>}
        <ul className="divide-y divide-stone-100">
          {mine.map((e) => {
            const n = getEntryPhotos(e).length;
            return (
              <li key={e.id} className={`py-3 flex flex-wrap items-start justify-between gap-3 ${e.isApproved === false ? 'opacity-60' : ''}`}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{e.firstName} {e.lastName} <span className="text-xs font-normal text-stone-500">· {e.relationship}</span>
                    {e.isPinned && <Pin className="inline w-3 h-3 ml-1 text-amber-700" />}{e.isApproved === false && <span className="ml-2 text-[10px] uppercase bg-stone-200 px-1.5 py-0.5 rounded-full">Masqué du livre</span>}
                  </div>
                  <p className="text-xs text-stone-600 line-clamp-2 mt-0.5">{e.message}</p>
                  {n > 0 && <p className="text-[11px] text-stone-400 mt-0.5">{n} photo{n > 1 ? 's' : ''}</p>}
                </div>
                <div className="flex gap-1.5">
                  <button className={btnGhost} title={e.isPinned ? 'Désépingler' : 'Épingler en tête du livre'} onClick={() => onModerate(e.id, { isPinned: !e.isPinned })}><Pin className="w-3.5 h-3.5" /></button>
                  <button className={btnGhost} title={e.isApproved === false ? 'Remettre dans le livre' : 'Retirer du livre'} onClick={() => onModerate(e.id, { isApproved: e.isApproved === false })}>{e.isApproved === false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</button>
                  <button className={`${btnGhost} text-red-700`} title="Supprimer" onClick={() => onDeleteEntry(e)}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
