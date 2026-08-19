'use client';

import React from 'react';
import { Award, Heart, ShieldCheck, BookmarkCheck, User, Plus } from 'lucide-react';

interface NavbarProps {
  onOpenWriter: () => void;
  onOpenGuestDashboard: () => void;
  onOpenAdmin: () => void;
  onOpenVIP: () => void;
  guestToken: string | null;
  hasAdminToken: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenWriter,
  onOpenGuestDashboard,
  onOpenAdmin,
  onOpenVIP,
  guestToken,
  hasAdminToken,
}) => {
  return (
    <nav className="sticky top-0 z-40 bg-stone-900/90 border-b border-amber-600/30 backdrop-blur-md text-amber-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand logo */}
        <a href="#" className="flex items-center gap-2.5 font-serif font-bold text-base sm:text-lg text-amber-100 hover:text-amber-300 transition-colors">
          <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Award className="w-5 h-5" />
          </span>
          <span className="truncate">Livre d'Or — J.M. Edimo</span>
        </a>

        {/* Action controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenWriter}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ajouter mon message</span>
            <span className="sm:hidden">Écrire</span>
          </button>

          {guestToken && (
            <button
              onClick={onOpenGuestDashboard}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-amber-500/40 text-amber-200 text-xs font-medium transition-colors flex items-center gap-1"
              title="Mon Espace Invité"
            >
              <User className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Mon Espace</span>
            </button>
          )}

          <button
            onClick={onOpenVIP}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-amber-500/30 text-amber-300 text-xs font-medium transition-colors hidden sm:flex items-center gap-1"
            title="Album Hommage Jean-Michel"
          >
            <BookmarkCheck className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">Mode Album</span>
          </button>

          <button
            onClick={onOpenAdmin}
            className={`p-2 rounded-xl border transition-colors ${
              hasAdminToken
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-300'
            }`}
            title="Dashboard Administrateur"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};
