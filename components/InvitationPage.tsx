'use client';
import React, { useEffect, useState } from 'react';
import type { WeddingStoreState } from '@/lib/wedding/types';
import { setWeddingContext, startWeddingPolling, sendChatMessage } from '@/lib/wedding/api';
import { GuestInvitationExperience, type GuestActiveTab } from './wedding/GuestInvitationExperience';
import { MusicPlayerWidget } from './wedding/MusicPlayerWidget';
import { InvitationGate } from './wedding/InvitationGate';
import { autoPlayWeddingMusic, configureMusicSettings, startWeddingMusic } from '@/lib/wedding/weddingMusic';

const HASH_TO_TAB: Record<string, GuestActiveTab> = {
  celebration: 'grand_jour', grand_jour: 'grand_jour', programme: 'programme', story: 'story', histoire: 'story',
  gifts: 'gifts', cadeaux: 'gifts', infos: 'infos', billet: 'billet', rsvp: 'rsvp', reponse: 'rsvp',
};

/** Page personnelle d'un invité (/inv/<jeton>) : l'expérience complète du modèle, alimentée par SA fiche uniquement. */
export default function InvitationPage({ initial, token }: { initial: WeddingStoreState; token: string }) {
  const [state, setState] = useState(initial);
  const [opened, setOpened] = useState(false);
  const [tab, setTab] = useState<GuestActiveTab>('grand_jour');
  // Contexte d'appel posé AVANT le premier rendu des écrans enfants.
  useState(() => { setWeddingContext({ token }); return null; });

  useEffect(() => {
    const h = window.location.hash.replace('#', '');
    if (HASH_TO_TAB[h]) setTab(HASH_TO_TAB[h]);
    // Déjà ouverte dans cet onglet (rechargement) : pas de nouvel écran d'ouverture.
    try { if (sessionStorage.getItem(`inv-open:${token}`) === '1') setOpened(true); } catch { /* stockage indisponible */ }
  }, [token]);
  // La musique choisie par les mariés (jusqu'ici jamais appliquée côté invité) puis lancement automatique :
  // direct si le navigateur l'autorise, sinon au premier toucher.
  useEffect(() => { configureMusicSettings(state.config.musicTrack, state.config.customMusicUrl); }, [state.config.musicTrack, state.config.customMusicUrl]);
  useEffect(() => autoPlayWeddingMusic(), []);
  const openInvitation = async () => {
    try { sessionStorage.setItem(`inv-open:${token}`, '1'); } catch { /* ignoré */ }
    await startWeddingMusic();
    setOpened(true);
  };
  useEffect(() => startWeddingPolling(setState, undefined, 10000), []);

  const guest = state.guests[0];
  if (!guest) return null;
  if (!opened) return <InvitationGate config={state.config} greeting={guest.greetingTitle || `${guest.firstName} ${guest.lastName}`.trim()} onOpen={openInvitation} />;
  return (
    <div className="min-h-screen bg-[#FFF7F9] font-sans">
      <GuestInvitationExperience
        config={state.config} guests={state.guests} currentGuest={guest} initialTab={tab}
        announcements={state.announcements} messages={state.messages} onSendMessage={sendChatMessage}
      />
      <MusicPlayerWidget />
    </div>
  );
}
