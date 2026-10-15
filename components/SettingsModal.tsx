'use client';
import { useState } from 'react';
import type { SiteSettings } from '@/lib/siteSettings';
import { Modal, Field, inputCls, btnPrimary, btnGhost } from './ui';

const FIELDS: { key: keyof SiteSettings; label: string; hint?: string; area?: boolean }[] = [
  { key: 'brandName', label: "Nom du site (en-tête)", hint: 'Affiché en haut de chaque page et dans l’onglet du navigateur.' },
  { key: 'brandTagline', label: "Sous-titre de l'en-tête" },
  { key: 'loginLabel', label: 'Libellé du bouton de connexion' },
  { key: 'welcomeKicker', label: "Accroche de la page d'accueil" },
  { key: 'welcomeTitle', label: "Titre de la page d'accueil" },
  { key: 'welcomeText', label: "Texte de la page d'accueil", area: true },
  { key: 'footerLeft', label: 'Pied de page — gauche' },
  { key: 'footerRight', label: 'Pied de page — droite' },
];

export default function SettingsModal({ settings, onClose, onSave }: { settings: SiteSettings; onClose: () => void; onSave: (s: SiteSettings) => Promise<void> }) {
  const [v, setV] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await onSave(v); onClose(); } catch (err) { setError(err instanceof Error ? err.message : 'Enregistrement impossible.'); } finally { setBusy(false); }
  };
  return (
    <Modal wide onClose={onClose} kicker="Administration" title="Paramètres du site">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}
        <p className="text-xs text-stone-600">Ces textes sont affichés sur la page d'accueil, dans l'en-tête et le pied de page. Un champ vidé reprend sa valeur par défaut. Le pied de page d'une page invité peut aussi être défini par cérémonie.</p>
        {FIELDS.map((f) => (
          <Field key={f.key} label={f.label} hint={f.hint}>
            {f.area ? <textarea rows={3} className={inputCls} value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
              : <input className={inputCls} value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}
          </Field>
        ))}
        <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
          <button type="button" onClick={onClose} className={btnGhost}>Annuler</button>
          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  );
}
