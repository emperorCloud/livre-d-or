'use client';
import { useMemo, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { getEntryPhotos, type Ceremony, type Group, type GuestEntry } from '@/lib/types';
import { PDF_DEFAULTS } from '@/lib/client/themeStyles';
import type { PdfBookOptions } from '@/lib/generatePdfBook';
import { Modal, Field, inputCls, btnPrimary, btnGhost } from './ui';

interface Props { ceremony: Ceremony; groups: Group[]; entries: GuestEntry[]; defaultGroupId?: string; onClose: () => void }

const PALETTES: { value: PdfBookOptions['theme']; label: string }[] = [
  { value: 'royal_navy', label: 'Bleu royal & or' }, { value: 'burgundy_gold', label: 'Bordeaux & or' },
  { value: 'emerald_prestige', label: 'Émeraude & or' }, { value: 'classic_parchment', label: 'Parchemin classique' },
];

export default function BookPdfModal({ ceremony, groups, entries, defaultGroupId, onClose }: Props) {
  const d = PDF_DEFAULTS[ceremony.type];
  const [scope, setScope] = useState(defaultGroupId || 'all');
  const [theme, setTheme] = useState<PdfBookOptions['theme']>('royal_navy');
  const [quality, setQuality] = useState<'print' | 'screen'>('print');
  const [includePhotos, setIncludePhotos] = useState(true);
  const [preface, setPreface] = useState(d.preface);
  const [closing, setClosing] = useState(d.closing);
  const [signature, setSignature] = useState(d.signature);
  const [progress, setProgress] = useState<{ p: number; s: string } | null>(null);
  const [blobUrl, setBlobUrl] = useState('');
  const [error, setError] = useState('');

  const selected = useMemo(() => {
    const ids = new Set(groups.filter((g) => g.ceremonyId === ceremony.id && (scope === 'all' || g.id === scope)).map((g) => g.id));
    return entries.filter((e) => e.groupId && ids.has(e.groupId));
  }, [entries, groups, ceremony.id, scope]);
  const included = selected.filter((e) => e.isApproved !== false);
  const photoCount = included.reduce((n, e) => n + getEntryPhotos(e).length, 0);
  const fileName = `livre-or-${ceremony.honoreeName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\W+/g, '-').toLowerCase()}.pdf`;

  const generate = async () => {
    setError(''); setBlobUrl(''); setProgress({ p: 1, s: 'Démarrage…' });
    try {
      const scopeGroup = groups.find((g) => g.id === scope);
      const cover = (scopeGroup || groups.find((g) => g.ceremonyId === ceremony.id && g.featuredPhotoUrl))?.featuredPhotoUrl || ceremony.theme.coverImage || undefined;
      const { generateGoldenBookPdf } = await import('@/lib/generatePdfBook');
      const blob = await generateGoldenBookPdf(selected, {
        theme, bookTitle: ceremony.title, recipientName: ceremony.honoreeName, dedicationSubtitle: ceremony.theme.coverQuote || ceremony.subtitle,
        eventDate: ceremony.date, includePhotos, imageQuality: quality, prefaceText: preface, closingMessage: closing, closingSignature: signature,
        wishLabel: d.wishLabel, coverPhotoUrl: cover, onProgress: (p, s) => setProgress({ p, s }),
      });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
    } catch (e) { setError(e instanceof Error ? e.message : 'Génération impossible.'); setProgress(null); }
  };

  const running = !!progress && progress.p < 100 && !blobUrl && !error;
  return (
    <Modal wide onClose={onClose} kicker={ceremony.title} title="Livre PDF">
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Groupes inclus"><select className={inputCls} value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="all">Tous les groupes de la cérémonie</option>
            {groups.filter((g) => g.ceremonyId === ceremony.id).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select></Field>
          <Field label="Couleurs de couverture"><select className={inputCls} value={theme} onChange={(e) => setTheme(e.target.value as PdfBookOptions['theme'])}>{PALETTES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></Field>
          <Field label="Qualité des photos" hint="Impression : ~200 dpi. Écran : plus léger à envoyer.">
            <select className={inputCls} value={quality} onChange={(e) => setQuality(e.target.value as 'print' | 'screen')}><option value="print">Impression (haute définition)</option><option value="screen">Écran (léger)</option></select>
          </Field>
          <label className="flex items-center gap-2 text-xs text-stone-700 self-end pb-3"><input type="checkbox" checked={includePhotos} onChange={(e) => setIncludePhotos(e.target.checked)} />Inclure toutes les photos souvenirs</label>
        </div>
        <Field label="Préface (facultatif)"><textarea rows={3} className={inputCls} value={preface} onChange={(e) => setPreface(e.target.value)} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Mot de la fin"><textarea rows={2} className={inputCls} value={closing} onChange={(e) => setClosing(e.target.value)} /></Field>
          <Field label="Signature"><input className={inputCls} value={signature} onChange={(e) => setSignature(e.target.value)} /></Field>
        </div>

        <p className="text-xs text-stone-600 bg-stone-100 rounded-xl p-3">{included.length} témoignage{included.length > 1 ? 's' : ''} dans le livre{selected.length > included.length ? ` (${selected.length - included.length} masqué${selected.length - included.length > 1 ? 's' : ''})` : ''} · {includePhotos ? photoCount : 0} photo{photoCount > 1 ? 's' : ''}. Les témoignages masqués ne sont pas imprimés.</p>

        {progress && (
          <div className="space-y-1">
            <div className="h-2 bg-stone-200 rounded-full overflow-hidden"><div className="h-full bg-amber-500 transition-all" style={{ width: `${progress.p}%` }} /></div>
            <p className="text-xs text-stone-600">{progress.s}</p>
          </div>
        )}
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-stone-200">
          <button className={btnGhost} onClick={onClose}>Fermer</button>
          {blobUrl && <a className={btnGhost} href={blobUrl} download={fileName}><Download className="w-4 h-4" />Télécharger à nouveau</a>}
          <button className={btnPrimary} disabled={running || included.length === 0} onClick={generate}>{running ? <><Loader2 className="w-4 h-4 animate-spin" />Génération…</> : 'Générer le livre PDF'}</button>
        </div>
      </div>
    </Modal>
  );
}
