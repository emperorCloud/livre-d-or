'use client';
import React from 'react';
import {
  Heart,
  QrCode,
  LayoutDashboard,
  Smartphone,
  Bell,
  MessageSquare,
  FileSpreadsheet,
  Settings,
  UserPlus,
  Wifi,
  WifiOff,
  Shield,
  Send,
  Link as LinkIcon
} from 'lucide-react';
import type { WeddingConfig } from '@/lib/wedding/types';

export type CurrentSpace = 'organizer' | 'guest';
export type OrganizerTab = 'dashboard' | 'customizer' | 'checkin' | 'announcements' | 'chat';

interface HeaderProps {
  config: WeddingConfig;
  currentSpace: CurrentSpace;
  onSpaceChange: (space: CurrentSpace) => void;
  organizerTab: OrganizerTab;
  onOrganizerTabChange: (tab: OrganizerTab) => void;
  isWsConnected: boolean;
  unreadAnnouncementsCount: number;
  onOpenExportModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenAddGuestModal: () => void;
  checkedInRatio: { checked: number; totalConfirmed: number };
}

export const Header: React.FC<HeaderProps> = ({
  config,
  currentSpace,
  onSpaceChange,
  organizerTab,
  onOrganizerTabChange,
  isWsConnected,
  unreadAnnouncementsCount,
  onOpenExportModal,
  onOpenSettingsModal,
  onOpenAddGuestModal,
  checkedInRatio
}) => {
  const formattedDate = new Date(config.eventDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-amber-900/10 no-print transition-all">
      {/* Space Switcher Top Bar */}
      <div className="bg-[#FAF7F2] border-b border-[#EAE2D7] px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div />

        {/* Live sync badge */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] rounded-full border ${
              isWsConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isWsConnected ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <Wifi className="w-3 h-3" />
                <span>Actualisation automatique</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>Connexion perdue…</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Brand & Actions Row (When in Organizer Space) */}
      {currentSpace === 'organizer' && (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1B382B] to-emerald-700 text-white flex items-center justify-center font-serif text-lg font-bold shadow-sm">
                {config.coupleNames.split('&').map((n) => n.trim()[0]).join('&')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    {config.coupleNames}
                  </h1>
                  <span className="text-rose-500 inline-block animate-pulse">
                    <Heart className="w-4 h-4 fill-rose-500" />
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{formattedDate}</span>
                  <span aria-hidden="true">·</span>
                  <span>{config.venueCity}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-800 font-medium font-mono">
                    Émargement : {checkedInRatio.checked} / {checkedInRatio.totalConfirmed} arrivés
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAddGuestModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Ajouter un invité</span>
              </button>

              <button
                onClick={onOpenExportModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                title="Exporter PDF / CSV de la liste d'émargement"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Émargement / Export</span>
              </button>

              <button
                onClick={onOpenSettingsModal}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                title="Paramètres de l'événement"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Organizer Navigation Tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
              <button
                onClick={() => onOrganizerTabChange('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap cursor-pointer ${
                  organizerTab === 'dashboard'
                    ? 'bg-emerald-50 text-[#1B382B] font-bold border border-emerald-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-[#1B382B]" />
                <span>Tableau de Bord & Liens</span>
              </button>

              <button
                onClick={() => onOrganizerTabChange('customizer')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap cursor-pointer ${
                  organizerTab === 'customizer'
                    ? 'bg-[#1B382B] text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Settings className={`w-4 h-4 ${organizerTab === 'customizer' ? 'text-white' : 'text-[#8A4B38]'}`} />
                <span>Personnalisation & Paramètres</span>
              </button>

              <button
                onClick={() => onOrganizerTabChange('checkin')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap cursor-pointer relative ${
                  organizerTab === 'checkin'
                    ? 'bg-[#1B382B] text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <QrCode className={`w-4 h-4 ${organizerTab === 'checkin' ? 'text-white' : 'text-emerald-700'}`} />
                <span>Scanner Jour J (Contrôle d'Accès)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${organizerTab === 'checkin' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'}`}>
                  {checkedInRatio.checked}
                </span>
              </button>

              <button
                onClick={() => onOrganizerTabChange('announcements')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap cursor-pointer relative ${
                  organizerTab === 'announcements'
                    ? 'bg-emerald-50 text-[#1B382B] font-bold border border-emerald-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Bell className="w-4 h-4 text-emerald-700" />
                <span>Annonces & Mises à jour</span>
                {unreadAnnouncementsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => onOrganizerTabChange('chat')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap cursor-pointer ${
                  organizerTab === 'chat'
                    ? 'bg-emerald-50 text-[#1B382B] font-bold border border-emerald-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <span>Messagerie Logistique</span>
              </button>
            </nav>
          </div>
        </>
      )}
    </header>
  );
};
