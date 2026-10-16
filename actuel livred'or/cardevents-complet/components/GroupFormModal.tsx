'use client';
import { useState } from 'react';
import type { Ceremony } from '@/lib/types';
import { Modal, Field, inputCls, btnPrimary, btnGhost } from './ui';

interface Props { ceremony: Ceremony; onClose: () => void; onSubmit: (v: Record<string, unknown>) => Promise<void> }

export default function GroupFormModal({ ceremony, onClose, onSubmit }: Props) {
  const [v, setV] = useState({
    name: '', managerName: '', managerEmail: '', allowPhotos: true,
    customIntro: `Bienvenue sur la page dédiée à ${ceremony.honoreeName}. Vos messages et vos souvenirs seront conservés dans le livre d'or.`,
    customPrompt: 'Partagez un souvenir, une anecdote ou vos vœux les plus sincères.',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof v, val: string | boolean) => setV((p) => ({ ...p, [k]: val }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await onSubmit({ ...v, ceremonyId: ceremony.id }); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Création impossible.'); }
    finally { setBusy(false); }
  };

  return (
    <Modal onClose={onClose} kicker={ceremony.title} title="Nouveau groupe">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}
        <Field label="Nom du groupe *"><input required className={inputCls} value={v.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex : Famille élargie, Collègues, Amis…" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Responsable"><input className={inputCls} value={v.managerName} onChange={(e) => set('managerName', e.target.value)} placeholder="Prénom & Nom" /></Field>
          <Field label="E-mail du responsable"><input type="email" className={inputCls} value={v.managerEmail} onChange={(e) => set('managerEmail', e.target.value)} /></Field>
        </div>
        <Field label="Mot d'accueil des invités"><textarea rows={3} className={inputCls} value={v.customIntro} onChange={(e) => set('customIntro', e.target.value)} /></Field>
        <Field label="Suggestion pour guider les messages"><input className={inputCls} value={v.customPrompt} onChange={(e) => set('customPrompt', e.target.value)} /></Field>
        <label className="flex items-center gap-2 text-xs text-stone-700"><input type="checkbox" checked={v.allowPhotos} onChange={(e) => set('allowPhotos', e.target.checked)} />Autoriser l'envoi de photos souvenirs (jusqu'à 6 par invité)</label>
        <p className="text-[11px] text-stone-500">Un code d'accès responsable sera généré. Il ne sera affiché <b>qu'une seule fois</b> : notez-le pour le transmettre.</p>
        <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
          <button type="button" onClick={onClose} className={btnGhost}>Annuler</button>
          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Création…' : 'Créer le groupe'}</button>
        </div>
      </form>
    </Modal>
  );
}
