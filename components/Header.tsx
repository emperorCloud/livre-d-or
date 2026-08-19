'use client';

import React from 'react';
import { Award, Heart, Sparkles, Calendar, ShieldCheck, BookmarkCheck, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  onOpenWriter: () => void;
  onOpenVIP: () => void;
  totalCount: number;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenWriter, onOpenVIP, totalCount, isAdmin }) => {
  return (
    <header className="relative overflow-hidden bg-gradient-to-b from-amber-900 via-amber-950 to-stone-900 text-amber-50 pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-amber-600/30 shadow-2xl">
      {/* Decorative ambient lighting & background graphics */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 text-center">
        {/* Top Celebration Badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs sm:text-sm font-medium backdrop-blur-sm mb-6 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Livre d'Or & Hommage Numérique</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Départ à la Retraite</span>
        </motion.div>

        {/* Main Title Header */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-yellow-400 tracking-tight leading-tight mb-4"
        >
          Livre d'Or & Hommage Numérique
        </motion.h1>

        {/* Subtitle with Name */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-xl sm:text-2xl lg:text-3xl font-medium text-amber-200/95 mb-3 flex items-center justify-center gap-3 flex-wrap"
        >
          <Award className="w-7 h-7 text-amber-400 inline-block" />
          <span>Départ à la Retraite de M. Jean-Michel Edimo</span>
        </motion.div>

        {/* Date & Gratitude Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-base sm:text-lg text-amber-100/80 max-w-2xl mx-auto font-sans leading-relaxed mb-8 flex items-center justify-center gap-2"
        >
          <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Août 2026 — Un grand merci pour toutes ces années de collaboration et de dévouement !</span>
        </motion.p>

        {/* Action Bar inside Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-2"
        >
          <button
            onClick={onOpenWriter}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold text-sm sm:text-base shadow-lg shadow-amber-900/40 hover:shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 group cursor-pointer"
          >
            <Heart className="w-5 h-5 text-stone-950 fill-stone-950/20 group-hover:scale-110 transition-transform" />
            <span>Déposer mon message pour Jean-Michel</span>
          </button>

          <button
            onClick={onOpenVIP}
            className="px-5 py-3.5 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-amber-200 border border-amber-500/30 font-medium text-sm sm:text-base backdrop-blur-sm transition-all hover:border-amber-400 flex items-center gap-2 cursor-pointer"
          >
            <BookmarkCheck className="w-5 h-5 text-amber-400" />
            <span>Album Hommage</span>
          </button>
        </motion.div>

        {/* Confidentiality Notice Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-10 pt-6 border-t border-amber-500/20 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-amber-300/80"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Hommages privés et confidentiels (consultables uniquement par l'administrateur)</span>
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-amber-500/40" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Livre d'Or remis personnellement à Jean-Michel pour sa retraite</span>
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
