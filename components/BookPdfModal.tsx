'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, ExternalLink, Eye, Loader2 } from 'lucide-react';
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
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'preview' | 'final' | null>(null);
  const [preview, setPreview] = useState<{ url: string; key: string } | null>(null);
  const [finalPdf, setFinalPdf] = useState<{ url: string; key: string } | null>(null);
  const [auto, setAuto] = useState(false);
  const previewUrlRef = useRef('');
  const finalUrlRef = useRef('');
  useEffect(() => () => { URL.revokeObjectURL(previewUrlRef.current); URL.revokeObjectURL(finalUrlRef.current); }, []);

  const selected = useMemo(() => {
    const ids = new Set(groups.filter((g) => g.ceremonyId === ceremony.id && (scope === 'all' || g.id === scope)).map((g) => g.id));
    return entries.filter((e) => e.groupId && ids.has(e.groupId));
  }, [entries, groups, ceremony.id, scope]);
  const included = selected.filter((e) => e.isApproved !== false);
  const photoCount = included.reduce((n, e) => n + getEntryPhotos(e).length, 0);
  const fileName = `livre-or-${ceremony.honoreeName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\W+/g, '-').toLowerCase()}.pdf`;

  // Empreinte des réglages : si elle change après l'aperçu, celui-ci est « obsolète ».
  const optionsKey = JSON.stringify([scope, theme, includePhotos, preface, closing, signature, included.map((e) => `${e.id}${e.isPinned ? '*' : ''}`)]);
  const stale = !!preview && preview.key !== optionsKey;

  const build = async (q: 'print' | 'screen') => {
    const scopeGroup = groups.find((g) => g.id === scope);
    const cover = (scopeGroup || groups.find((g) => g.ceremonyId === ceremony.id && g.featuredPhotoUrl))?.featuredPhotoUrl || ceremony.theme.coverImage || undefined;
    const { generateGoldenBookPdf } = await import('@/lib/generatePdfBook');
    return generateGoldenBookPdf(selected, {
      theme, bookTitle: ceremony.title, recipientName: ceremony.honoreeName, dedicationSubtitle: ceremony.theme.coverQuote || ceremony.subtitle,
      eventDate: ceremony.date, includePhotos, imageQuality: q, prefaceText: preface, closingMessage: closing, closingSignature: signature,
      wishLabel: d.wishLabel, coverPhotoUrl: cover, onProgress: (p, st) => setProgress({ p, s: st }),
    });
  };

  const saveAs = (url: string) => { const a = document.createElement('a'); a.href = url; a.download = fileName; a.click(); };

  const run = async (mode: 'preview' | 'final') => {
    setError(''); setBusy(mode); setProgress({ p: 1, s: 'Démarrage…' });
    const key = optionsKey;
    try {
      // L'aperçu est toujours en qualité « écran » (rapide) : la mise en page est identique à celle du fichier final.
      const blob = await build(mode === 'preview' ? 'screen' : quality);
      const url = URL.createObjectURL(blob);
      if (mode === 'preview') { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = url; setPreview({ url, key }); }
      else { URL.revokeObjectURL(finalUrlRef.current); finalUrlRef.current = url; setFinalPdf({ url, key: `${key}|${quality}` }); saveAs(url); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Génération impossible.'); setProgress(null); }
    finally { setBusy(null); }
  };

  const download = async () => {
    if (quality === 'screen' && preview && !stale) return saveAs(preview.url); // l'aperçu EST déjà le fichier final
    if (finalPdf && finalPdf.key === `${optionsKey}|${quality}`) return saveAs(finalPdf.url);
    await run('final');
  };

  // Actualisation automatique (optionnelle) : 1,5 s après la dernière modification.
  useEffect(() => {
    if (!auto || busy || error || included.length === 0 || (preview && !stale)) return;
    const t = setTimeout(() => run('preview'), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, stale, busy, error, optionsKey]);

  return (
    <Modal xl onClose={onClose} kicker={ceremony.title} title="Livre PDF">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-6">
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

        <label className="flex items-center gap-2 text-xs text-stone-700"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />Actualiser l'aperçu automatiquement après chaque modification</label>

        {progress && (
          <div className="space-y-1">
            <div className="h-2 bg-stone-200 rounded-full overflow-hidden"><div className="h-full bg-amber-500 transition-all" style={{ width: `${progress.p}%` }} /></div>
            <p className="text-xs text-stone-600">{progress.s}</p>
          </div>
        )}
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-stone-200">
          <button className={btnGhost} onClick={onClose}>Fermer</button>
          <button className={btnGhost} disabled={!!busy || included.length === 0} onClick={() => run('preview')}>
            {busy === 'preview' ? <><Loader2 className="w-4 h-4 animate-spin" />Aperçu…</> : <><Eye className="w-4 h-4" />{preview ? "Actualiser l'aperçu" : "Voir l'aperçu"}</>}
          </button>
          <button className={btnPrimary} disabled={!!busy || included.length === 0} onClick={download}>
            {busy === 'final' ? <><Loader2 className="w-4 h-4 animate-spin" />Génération…</> : <><Download className="w-4 h-4" />Télécharger le livre PDF</>}
          </button>
        </div>
      </div>

      <div className="space-y-2 lg:sticky lg:top-0 self-start">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase text-stone-700">Aperçu du livre</span>
          {stale && <span className="text-[11px] text-amber-900 bg-amber-100 rounded-full px-2 py-0.5">Obsolète : réglages modifiés</span>}
        </div>
        {preview ? (
          <iframe title="Aperçu du livre PDF" src={`${preview.url}#view=FitH&navpanes=0`} className="w-full h-[70vh] rounded-xl border border-stone-300 bg-white" />
        ) : (
          <div className="h-[40vh] lg:h-[70vh] rounded-xl border-2 border-dashed border-stone-300 flex items-center justify-center text-center text-xs text-stone-500 p-6">
            {busy === 'preview' ? 'Composition du livre…' : "Cliquez sur « Voir l'aperçu » : le livre s'affichera ici, page par page, avant tout téléchargement."}
          </div>
        )}
        {preview && <a className={btnGhost} href={preview.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" />Ouvrir en plein écran</a>}
        <p className="text-[11px] text-stone-500">L'aperçu est en qualité écran pour rester rapide ; le fichier téléchargé utilise la qualité choisie, avec la même mise en page. Sur téléphone, ouvrez l'aperçu en plein écran.</p>
      </div>
      </div>
    </Modal>
  );
}
