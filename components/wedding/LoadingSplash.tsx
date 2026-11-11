'use client';
import React from 'react';
import { Heart } from 'lucide-react';
import type { WeddingConfig } from '@/lib/wedding/types';

/** Écran d'ouverture affiché quelques instants avant l'invitation (repris du modèle). */
export const LoadingSplash: React.FC<{ config: WeddingConfig }> = ({ config }) => {
  return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-[#E8DFD5] max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#B26955] shadow-xs">
            <Heart className="w-5 h-5 fill-[#B26955] animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#B26955] block">
              {config.loadingScreenTitle || 'NOTRE MARIAGE'}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2D2424]">
              {config.coupleNames}
            </h1>
            <div className="w-16 h-px bg-amber-200 mx-auto mt-2" />
          </div>

          <div className="space-y-3 pt-2">
            <p className="font-serif italic text-sm text-[#7A695B]">
              {config.loadingScreenSubtitle || 'Votre invitation se prépare…'}
            </p>
            <div className="w-40 h-1.5 bg-[#F0E8DE] rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#B26955] via-[#234A38] to-[#B26955] rounded-full animate-pulse w-3/4 mx-auto" />
            </div>
          </div>
        </div>
      </div>
  );
};
