'use client';

import React from 'react';
import { Heart, ShieldCheck, Award } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenVIP: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onOpenVIP }) => {
  return (
    <footer className="bg-stone-950 text-amber-200/80 border-t border-amber-800/40 py-10 px-4 sm:px-6 mt-16">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left text-xs sm:text-sm">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2 text-amber-100 font-serif font-bold text-base mb-1">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Livre d'Or & Hommage Numérique</span>
          </div>
          <p className="text-amber-300/60 text-xs">
            Départ en Retraite de M. Jean-Michel Edimo — Août 2026
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
          <button
            onClick={onOpenVIP}
            className="hover:text-amber-300 transition-colors underline decoration-amber-500/40"
          >
            Album VIP Jean-Michel
          </button>
          <span>·</span>
          <button
            onClick={onOpenAdmin}
            className="hover:text-amber-300 transition-colors flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Accès Administrateur</span>
          </button>
        </div>

        <p className="text-[11px] text-amber-400/50">
          Réalisé avec bienveillance par ses collègues et amis © 2026
        </p>
      </div>
    </footer>
  );
};
