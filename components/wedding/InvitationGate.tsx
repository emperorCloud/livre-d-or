'use client';
import React, { useState } from 'react';
import { Music } from 'lucide-react';
import type { WeddingConfig } from '@/lib/wedding/types';
import { FloralCorner, FloralDivider } from '../decor/Flowers';

/**
 * Écran d'ouverture de l'invitation. Le toucher sur « Ouvrir » est le geste que les navigateurs exigent pour jouer du son :
 * la musique d'ambiance démarre donc à coup sûr, sans réglage à faire pour l'invité.
 */
export const InvitationGate: React.FC<{ config: WeddingConfig; greeting: string; onOpen: () => Promise<void> | void }> = ({ config, greeting, onOpen }) => {
  const [busy, setBusy] = useState(false);
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#FFE1E9] via-[#FFF0F4] to-[#FFF7F9] flex items-center justify-center p-6 text-center">
      <FloralCorner className="pointer-events-none absolute -top-8 -left-10 w-56 sm:w-96" />
      <FloralCorner className="pointer-events-none absolute -top-8 -right-10 w-56 sm:w-96 scale-x-[-1]" />
      <FloralCorner className="pointer-events-none absolute -bottom-12 -left-12 w-48 sm:w-80 scale-y-[-1] opacity-90" />
      <FloralCorner className="pointer-events-none absolute -bottom-12 -right-12 w-48 sm:w-80 scale-[-1] opacity-90" />
      <div className="relative z-10 max-w-md space-y-5">
        <p className="text-[11px] tracking-[0.4em] uppercase font-semibold text-[#B04C6B]">{config.loadingScreenTitle || 'Vous êtes invité(e)'}</p>
        <h1 className="font-script text-6xl sm:text-7xl text-[#A94566] leading-[1.05]">{config.coupleNames}</h1>
        <FloralDivider className="w-52 mx-auto" />
        <p className="font-serif text-xl text-[#5E4450]">{greeting}</p>
        <button
          onClick={async () => { setBusy(true); try { await onOpen(); } finally { setBusy(false); } }}
          disabled={busy}
          className="mt-2 inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#C65E7E] hover:bg-[#B04C6B] disabled:opacity-70 text-white text-sm font-bold tracking-wide shadow-lg shadow-[#C65E7E]/30 transition cursor-pointer"
        >
          Ouvrir mon invitation
        </button>
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#9A8490]"><Music className="w-3.5 h-3.5" aria-hidden="true" />Avec une musique d’ambiance · le son se règle en bas à droite</p>
      </div>
    </div>
  );
};
