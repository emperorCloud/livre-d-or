'use client';
import React, { useEffect, useMemo, useState } from 'react';
import type { Ceremony } from '@/lib/types';
import type { WeddingStoreState } from '@/lib/wedding/types';
import { setWeddingContext, startWeddingPolling } from '@/lib/wedding/api';
import { Header, type OrganizerTab } from './wedding/Header';
import { Dashboard } from './wedding/Dashboard';
import { WeddingCustomizer } from './wedding/WeddingCustomizer';
import { CheckInScanner } from './wedding/CheckInScanner';
import { AnnouncementsView } from './wedding/AnnouncementsView';
import { LogisticsChatView } from './wedding/LogisticsChatView';
import { ExportModal } from './wedding/ExportModal';
import { WeddingSettingsModal } from './wedding/WeddingSettingsModal';
import { PrintableEmargementSheet } from './wedding/PrintableEmargementSheet';

/**
 * Gestionnaire d'invitations d'un mariage (tableau de bord du responsable), repris du projet modèle :
 * liste des invités, personnalisation, émargement, annonces, discussions, exports, feuille imprimable.
 * Les données viennent du serveur, limitées au mariage de la session ; l'actualisation est automatique.
 */
export default function WeddingOrganizer({ ceremony, isAdmin }: { ceremony: Ceremony; isAdmin: boolean }) {
  const [state, setState] = useState<WeddingStoreState | null>(null);
  const [connected, setConnected] = useState(true);
  const [tab, setTab] = useState<OrganizerTab>('dashboard');
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // Le responsable est limité à son mariage côté serveur ; l'admin précise lequel.
  useMemo(() => setWeddingContext(isAdmin ? { ceremonyId: ceremony.id } : {}), [isAdmin, ceremony.id]);
  useEffect(() => startWeddingPolling(setState, setConnected, 5000), []);

  const guests = state?.guests ?? [];
  const checkedCount = guests.filter((g) => g.isCheckedIn).length;
  const confirmedCount = guests.filter((g) => g.rsvpStatus === 'confirmed').length;
  const openGuestPage = (token?: string) => { if (token) window.open(`/inv/${token}`, '_blank', 'noopener'); };

  if (!state) return <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">Chargement du gestionnaire d'invitations…</div>;
  const { config, announcements, messages } = state;

  return (
    <div className="rounded-2xl border border-stone-200 overflow-hidden bg-[#FAF8F5] font-sans text-[#2D2424]">
      <Header
        config={config} currentSpace="organizer" onSpaceChange={() => {}} organizerTab={tab} onOrganizerTabChange={setTab}
        isWsConnected={connected} unreadAnnouncementsCount={announcements.length}
        onOpenExportModal={() => setExportOpen(true)} onOpenSettingsModal={() => setSettingsOpen(true)} onOpenAddGuestModal={() => { setTab('dashboard'); setAddOpen(true); }}
        checkedInRatio={{ checked: checkedCount, totalConfirmed: confirmedCount }}
      />
      <div className="p-3 sm:p-6">
        {tab === 'dashboard' && (
          <Dashboard config={config} guests={guests} onOpenGuestPass={(g) => openGuestPage(g.inviteToken)} onOpenExportModal={() => setExportOpen(true)} isAddModalOpen={addOpen} setIsAddModalOpen={setAddOpen} />
        )}
        {tab === 'customizer' && <WeddingCustomizer config={config} onConfigSaved={(c) => setState({ ...state, config: c })} />}
        {tab === 'checkin' && <CheckInScanner guests={guests} onGuestSelectedForView={(g) => openGuestPage(g.inviteToken)} />}
        {tab === 'announcements' && <AnnouncementsView announcements={announcements} />}
        {tab === 'chat' && <LogisticsChatView messages={messages} guests={guests} currentUserRole="organizer" currentUserName="Organisateur" layout="page" />}
      </div>
      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} guests={guests} config={config} />
      <WeddingSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} config={config} />
      <PrintableEmargementSheet guests={guests} config={config} />
    </div>
  );
}
