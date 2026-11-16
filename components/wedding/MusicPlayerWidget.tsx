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
    <div className="fixed bottom-[6.75rem] right-3 z-40 no-print">
      <button
        onClick={toggleWeddingMusic}
        className="flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-lg border border-[#F3D0DB] backdrop-blur-md transition-all hover:scale-105 cursor-pointer group"
        title={isPlaying ? "Mettre l'ambiance musicale en pause" : "Écouter la musique d'ambiance du mariage"}
      >
        {/* Animated equalizer waves */}
        <div className="flex items-end gap-0.5 h-4 w-4 justify-center">
          <span
            className={`w-0.5 bg-[#C65E7E] rounded-full transition-all duration-300 ${
              isPlaying ? 'h-3 animate-pulse' : 'h-1.5'
            }`}
          />
          <span
            className={`w-0.5 bg-[#C65E7E] rounded-full transition-all duration-300 ${
              isPlaying ? 'h-4 animate-bounce' : 'h-2.5'
            }`}
            style={{ animationDelay: '150ms' }}
          />
          <span
            className={`w-0.5 bg-[#C65E7E] rounded-full transition-all duration-300 ${
              isPlaying ? 'h-2.5 animate-pulse' : 'h-1'
            }`}
            style={{ animationDelay: '300ms' }}
          />
          <span
            className={`w-0.5 bg-[#C65E7E] rounded-full transition-all duration-300 ${
              isPlaying ? 'h-3.5 animate-bounce' : 'h-2'
            }`}
            style={{ animationDelay: '75ms' }}
          />
        </div>

        <div className="text-left">
          <span className="block text-xs font-semibold text-[#A94566] leading-tight">
            {isPlaying ? 'Pause' : 'Écouter'}
          </span>
        </div>
      </button>
    </div>
  );
};
