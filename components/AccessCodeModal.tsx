'use client';
import { useState } from 'react';
import { Check, Copy, KeyRound } from 'lucide-react';
import { copyText } from '@/lib/client/links';
import { Modal, btnPrimary } from './ui';

export default function AccessCodeModal({ code, groupName, onClose }: { code: string; groupName: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <Modal onClose={onClose} kicker={groupName} title="Code d'accès responsable">
      <div className="space-y-4 text-center">
        <KeyRound className="w-8 h-8 text-amber-700 mx-auto" />
        <div className="font-mono text-2xl font-bold tracking-wider bg-white border-2 border-amber-300 rounded-xl py-4 select-all">{code}</div>
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          Ce code n'est affiché <b>qu'une seule fois</b> et n'est pas conservé en clair. Copiez-le maintenant et transmettez-le au responsable. S'il est perdu, générez-en un nouveau (l'ancien cessera de fonctionner).
        </p>
        <div className="flex justify-center gap-2">
          <button className={btnPrimary} onClick={async () => { setCopied(await copyText(code)); }}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copié' : 'Copier le code'}
          </button>
          <button className="px-4 py-2.5 text-xs font-medium border border-stone-300 rounded-xl bg-white hover:bg-stone-50" onClick={onClose}>J'ai noté le code</button>
        </div>
      </div>
    </Modal>
  );
}
