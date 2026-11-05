'use client';
import { useState } from 'react';
import type { Ceremony, CeremonyMode, CeremonyType, ThemeConfig } from '@/lib/types';
import { THEME_PRESETS } from '@/lib/themePresets';
import { CEREMONY_TYPES, FONTS, PAPERS, SYMBOLS } from '@/lib/client/themeStyles';
import { Modal, Field, inputCls, btnPrimary, btnGhost } from './ui';

export interface CeremonyFormValues {
  type: CeremonyType; mode: CeremonyMode; title: string; subtitle: string; honoreeName: string; date: string; location: string; theme: ThemeConfig;
}
interface Props {
  ceremony?: Ceremony;                                   // présent = modification
  onClose: () => void;
  onSubmit: (v: CeremonyFormValues, initialGroupName?: string) => Promise<void>;
}

export default function CeremonyFormModal({ ceremony, onClose, onSubmit }: Props) {
  const editing = !!ceremony;
  const [v, setV] = useState<CeremonyFormValues>(ceremony
    ? { type: ceremony.type, mode: ceremony.mode, title: ceremony.title, subtitle: ceremony.subtitle, honoreeName: ceremony.honoreeName, date: ceremony.date, location: ceremony.location, theme: ceremony.theme }
    : { type: 'retraite', mode: 'guestbook', title: '', subtitle: '', honoreeName: '', date: '', location: '', theme: THEME_PRESETS.retraite });
  const [groupName, setGroupName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof CeremonyFormValues>(k: K, val: CeremonyFormValues[K]) => setV((p) => ({ ...p, [k]: val }));
  const setTheme = <K extends keyof ThemeConfig>(k: K, val: ThemeConfig[K]) => setV((p) => ({ ...p, theme: { ...p.theme, [k]: val } }));

  // La formule (livre d'or / invitation / les deux) n'existe que pour le mariage ; les autres types gardent le livre d'or.
  const pickType = (type: CeremonyType) => setV((p) => ({ ...p, type, mode: type === 'mariage' ? (p.type === 'mariage' ? p.mode : 'both') : 'guestbook', theme: { ...THEME_PRESETS[type], footerText: p.theme.footerText, coverImage: p.theme.coverImage } }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await onSubmit({ ...v, mode: v.type === 'mariage' ? v.mode : 'guestbook' }, editing ? undefined : groupName.trim() || undefined); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Enregistrement impossible.'); }
    finally { setBusy(false); }
  };

  return (
    <Modal wide onClose={onClose} kicker="Cérémonie" title={editing ? 'Modifier la cérémonie' : 'Nouvelle cérémonie'}>
      <form onSubmit={submit} className="space-y-5">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

        <div className="grid grid-cols-2 gap-2">
          {CEREMONY_TYPES.map((t) => (
            <button type="button" key={t.type} onClick={() => pickType(t.type)}
              className={`text-left p-3 rounded-xl border text-xs transition-all ${v.type === t.type ? 'border-amber-600 bg-amber-50 shadow-sm' : 'border-stone-300 bg-white hover:border-stone-400'}`}>
              <span className="font-semibold block text-stone-900">{t.label}</span><span className="text-stone-500">{t.mood}</span>
            </button>
          ))}
        </div>

        {v.type === 'mariage' && (
          <div className="space-y-2">
            <span className="block text-xs font-semibold uppercase text-stone-700">Formule du mariage</span>
            <div className="grid sm:grid-cols-3 gap-2">
              {([
                { m: 'guestbook', label: "Livre d'or", d: 'Messages et photos des invités, livre PDF.' },
                { m: 'invitation', label: 'Invitation', d: 'Lien personnel par invité, réponses, billet QR, émargement.' },
                { m: 'both', label: 'Les deux', d: "Invitations et livre d'or dans le même espace." },
              ] as { m: CeremonyMode; label: string; d: string }[]).map((o) => (
                <button type="button" key={o.m} onClick={() => set('mode', o.m)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all ${v.mode === o.m ? 'border-amber-600 bg-amber-50 shadow-sm' : 'border-stone-300 bg-white hover:border-stone-400'}`}>
                  <span className="font-semibold block text-stone-900">{o.label}</span><span className="text-stone-500">{o.d}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Titre *"><input required className={inputCls} value={v.title} onChange={(e) => set('title', e.target.value)} placeholder="Titre de la cérémonie" /></Field>
          <Field label="Nom du ou des concerné(s) *"><input required className={inputCls} value={v.honoreeName} onChange={(e) => set('honoreeName', e.target.value)} placeholder="Nom de la ou des personnes concernées" /></Field>
          <Field label="Sous-titre"><input className={inputCls} value={v.subtitle} onChange={(e) => set('subtitle', e.target.value)} /></Field>
          <Field label="Date"><input className={inputCls} value={v.date} onChange={(e) => set('date', e.target.value)} placeholder="Ex : 28 août 2026" /></Field>
          <Field label="Lieu"><input className={inputCls} value={v.location} onChange={(e) => set('location', e.target.value)} /></Field>
          <Field label="Pied de page de la page invité" hint="Laisser vide pour utiliser le pied de page du site.">
            <input className={inputCls} value={v.theme.footerText || ''} onChange={(e) => setTheme('footerText', e.target.value)} />
          </Field>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Police"><select className={inputCls} value={v.theme.fontStyle} onChange={(e) => setTheme('fontStyle', e.target.value as ThemeConfig['fontStyle'])}>{FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select></Field>
          <Field label="Papier"><select className={inputCls} value={v.theme.paperTexture} onChange={(e) => setTheme('paperTexture', e.target.value as ThemeConfig['paperTexture'])}>{PAPERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select></Field>
          <Field label="Emblème"><select className={inputCls} value={v.theme.symbol} onChange={(e) => setTheme('symbol', e.target.value as ThemeConfig['symbol'])}>{SYMBOLS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select></Field>
          <Field label="Couleur principale"><input type="color" className="h-10 w-full rounded-xl border border-stone-300 bg-white" value={v.theme.primaryColor} onChange={(e) => setTheme('primaryColor', e.target.value)} /></Field>
          <Field label="Couleur d'accent"><input type="color" className="h-10 w-full rounded-xl border border-stone-300 bg-white" value={v.theme.accentColor} onChange={(e) => setTheme('accentColor', e.target.value)} /></Field>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2"><Field label="Citation de couverture"><textarea rows={2} className={inputCls} value={v.theme.coverQuote} onChange={(e) => setTheme('coverQuote', e.target.value)} /></Field></div>
          <Field label="Auteur de la citation"><input className={inputCls} value={v.theme.coverQuoteAuthor || ''} onChange={(e) => setTheme('coverQuoteAuthor', e.target.value)} /></Field>
        </div>

        {!editing && (
          <Field label={v.type === 'mariage' ? 'Dossier du mariage (accès du responsable)' : 'Premier groupe (facultatif)'} hint={v.type === 'mariage' ? "Un seul responsable par mariage : son code d'accès est généré à la création et affiché une seule fois." : "Ex : Famille proche, Collègues, Amis d'enfance… Vous pourrez en ajouter d'autres ensuite."}>
            <input className={inputCls} value={groupName} onChange={(e) => setGroupName(e.target.value)} />
          </Field>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
          <button type="button" onClick={onClose} className={btnGhost}>Annuler</button>
          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer la cérémonie'}</button>
        </div>
      </form>
    </Modal>
  );
}
