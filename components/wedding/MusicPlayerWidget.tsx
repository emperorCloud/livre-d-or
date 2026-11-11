'use client';
import React, { useEffect, useState } from 'react';
import { subscribeToMusicState, toggleWeddingMusic } from '@/lib/wedding/weddingMusic';

export const MusicPlayerWidget: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToMusicState((playing) => {
      setIsPlaying(playing);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-40 no-print">
      <button
        onClick={toggleWeddingMusic}
        className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-lg border border-amber-900/10 backdrop-blur-md transition-all hover:scale-105 cursor-pointer group"
        title={isPlaying ? "Mettre l'ambiance musicale en pause" : "Écouter la musique d'ambiance du mariage"}
      >
        {/* Animated equalizer waves */}
        <div className="flex items-end gap-0.5 h-4 w-4 justify-center">
          <span
            className={`w-0.5 bg-slate-900 rounded-full transition-all duration-300 ${
              isPlaying ? 'h-3 animate-pulse' : 'h-1.5'
            }`}
          />
          <span
            className={`w-0.5 bg-slate-900 rounded-full transition-all duration-300 ${
              isPlaying ? 'h-4 animate-bounce' : 'h-2.5'
            }`}
            style={{ animationDelay: '150ms' }}
          />
          <span
            className={`w-0.5 bg-slate-900 rounded-full transition-all duration-300 ${
              isPlaying ? 'h-2.5 animate-pulse' : 'h-1'
            }`}
            style={{ animationDelay: '300ms' }}
          />
          <span
            className={`w-0.5 bg-slate-900 rounded-full transition-all duration-300 ${
              isPlaying ? 'h-3.5 animate-bounce' : 'h-2'
            }`}
            style={{ animationDelay: '75ms' }}
          />
        </div>

        <div className="text-left">
          <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-amber-900">
            Ambiance Musicale
          </span>
          <span className="block text-xs font-semibold text-slate-900 leading-tight">
            {isPlaying ? 'Pause' : 'Écouter'}
          </span>
        </div>
      </button>
    </div>
  );
};
