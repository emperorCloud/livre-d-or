'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, ExternalLink } from 'lucide-react';
import type { Ceremony, Group } from '@/lib/types';
import { copyText, inviteUrl } from '@/lib/client/links';
import { Modal, btnGhost, btnPrimary } from './ui';

export default function QrCodeModal({ group, ceremony, onClose }: { group: Group; ceremony: Ceremony; onClose: () => void }) {
  const url = inviteUrl(group.inviteSlug);
  const [png, setPng] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => { QRCode.toDataURL(url, { width: 640, margin: 2, color: { dark: '#1C1917', light: '#FFFFFF' } }).then(setPng).catch(() => setPng('')); }, [url]);

  return (
    <Modal onClose={onClose} kicker={ceremony.title} title={`Inviter : ${group.name}`}>
      <div className="space-y-4 text-center">
        {png ? <img src={png} alt={`QR code ${group.name}`} className="w-56 h-56 mx-auto rounded-xl border border-stone-200 bg-white p-2" /> : <div className="w-56 h-56 mx-auto rounded-xl bg-stone-200 animate-pulse" />}
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="w-full text-xs font-mono bg-white border border-stone-300 rounded-xl px-3 py-2" />
        <div className="flex flex-wrap justify-center gap-2">
          <button className={btnPrimary} onClick={async () => setCopied(await copyText(url))}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Lien copié' : 'Copier le lien'}</button>
          {png && <a className={btnGhost} href={png} download={`qr-${group.name.replace(/\W+/g, '-').toLowerCase()}.png`}><Download className="w-4 h-4" />Télécharger le PNG</a>}
          <a className={btnGhost} href={url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" />Voir la page invité</a>
        </div>
        {group.isClosed && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">Ce groupe est clos : les invités ne peuvent plus envoyer de messages.</p>}
      </div>
    </Modal>
  );
}
