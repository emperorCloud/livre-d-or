'use client';
import React, { useEffect, useState } from 'react';
import type { WeddingStoreState } from '@/lib/wedding/types';
import { setWeddingContext, startWeddingPolling, sendChatMessage } from '@/lib/wedding/api';
import { GuestInvitationExperience, type GuestActiveTab } from './wedding/GuestInvitationExperience';
import { MusicPlayerWidget } from './wedding/MusicPlayerWidget';
import { LoadingSplash } from './wedding/LoadingSplash';

const HASH_TO_TAB: Record<string, GuestActiveTab> = {
  celebration: 'grand_jour', grand_jour: 'grand_jour', programme: 'programme', story: 'story', histoire: 'story',
  gifts: 'gifts', cadeaux: 'gifts', infos: 'infos', billet: 'billet', rsvp: 'rsvp', reponse: 'rsvp',
};

/** Page personnelle d'un invité (/inv/<jeton>) : l'expérience complète du modèle, alimentée par SA fiche uniquement. */
export default function InvitationPage({ initial, token }: { initial: WeddingStoreState; token: string }) {
  const [state, setState] = useState(initial);
  const [splash, setSplash] = useState(true);
  const [tab, setTab] = useState<GuestActiveTab>('grand_jour');
  // Contexte d'appel posé AVANT le premier rendu des écrans enfants.
  useState(() => { setWeddingContext({ token }); return null; });

  useEffect(() => {
    const h = window.location.hash.replace('#', '');
    if (HASH_TO_TAB[h]) setTab(HASH_TO_TAB[h]);
    const t = setTimeout(() => setSplash(false), 1400);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => startWeddingPolling(setState, undefined, 10000), []);

  const guest = state.guests[0];
  if (!guest) return null;
  if (splash) return <LoadingSplash config={state.config} />;
  return (
    <div className="min-h-screen bg-[#FAF8F5] font-sans">
      <GuestInvitationExperience
        config={state.config} guests={state.guests} currentGuest={guest} initialTab={tab}
        announcements={state.announcements} messages={state.messages} onSendMessage={sendChatMessage}
      />
      <MusicPlayerWidget />
    </div>
  );
}
