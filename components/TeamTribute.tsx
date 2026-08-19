'use client';

import React from 'react';
import { Heart, Quote, Sparkles, Ribbon } from 'lucide-react';
import { motion } from 'motion/react';

export const TeamTribute: React.FC = () => {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 my-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative bg-gradient-to-br from-amber-50 via-yellow-50/80 to-amber-100/60 dark:from-stone-900 dark:via-amber-950/40 dark:to-stone-900 border-2 border-amber-300/80 dark:border-amber-600/50 rounded-3xl p-8 sm:p-12 shadow-xl shadow-amber-900/10 text-stone-800 dark:text-amber-100 overflow-hidden"
      >
        {/* Background Vintage Watermark Accent */}
        <div className="absolute -right-8 -bottom-8 opacity-5 text-amber-900 dark:text-amber-300 pointer-events-none select-none">
          <Quote className="w-80 h-80" />
        </div>

        {/* Top Header Badge */}
        <div className="flex items-center gap-3 mb-6">
          <span className="p-2.5 rounded-2xl bg-amber-200/80 dark:bg-amber-800/50 text-amber-900 dark:text-amber-200 shadow-sm">
            💐
          </span>
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-950 dark:text-amber-100">
              Le Mot de l'Équipe & Hommage Général
            </h2>
            <p className="text-xs sm:text-sm text-amber-800/80 dark:text-amber-300/80 font-medium">
              Message d'inauguration du Livre d'Or
            </p>
          </div>
        </div>

        {/* Content Block with exact requested text */}
        <div className="relative z-10 font-serif text-base sm:text-lg lg:text-xl leading-relaxed text-stone-800 dark:text-amber-100/95 space-y-5 italic border-l-4 border-amber-500/80 pl-6 my-6">
          <p className="font-semibold text-amber-900 dark:text-amber-200 not-italic text-xl sm:text-2xl">
            Cher Jean-Michel,
          </p>

          <p>
            Le moment est venu pour toi de tourner une page importante et d'ouvrir ce nouveau chapitre tant mérité qu'est la retraite. Durant toutes ces années à nos côtés, tu as su marquer les esprits par ton professionnalisme, ta rigueur, mais aussi ta bienveillance et ton esprit d'équipe.
          </p>

          <p>
            Ce livre d'or est le témoignage collectif de notre gratitude, de notre amitié et de tous les excellents moments partagés. Que cette nouvelle aventure te soit douce, remplie de projets, de santé et de moments précieux entouré de tes proches.
          </p>

          <p className="font-bold text-amber-950 dark:text-amber-200 not-italic text-lg sm:text-xl pt-2">
            Merci pour tout, Jean-Michel !
          </p>
        </div>

        {/* Signature */}
        <div className="flex items-center justify-between pt-6 border-t border-amber-300/60 dark:border-amber-800/50 mt-8">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-serif font-bold text-base sm:text-lg">
            <Ribbon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>— Tes collègues et amis</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-400 font-sans font-medium bg-amber-200/50 dark:bg-amber-900/40 py-1.5 px-3 rounded-full border border-amber-300/50 dark:border-amber-700/50">
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>Août 2026</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
