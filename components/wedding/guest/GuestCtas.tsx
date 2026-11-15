'use client';
import React from 'react';
import { ArrowRight, CheckCircle2, Lock, Ticket } from 'lucide-react';
import type { Guest } from '@/lib/wedding/types';
import { everyoneAnswered, hasTicket } from '@/lib/wedding/rsvp';

type Props = { guest: Guest; onRsvp: () => void; onTicket: () => void; onRepresentative?: () => void };

/** Statut de la réponse en une phrase, pour l'invité. */
export function rsvpHeadline(g: Guest): { tone: 'todo' | 'yes' | 'no'; title: string; text: string } {
  if (!everyoneAnswered(g)) {
    return {
      tone: 'todo',
      title: g.plusOneAllowed ? 'Votre réponse à tous les deux est attendue' : 'Votre réponse est attendue',
      text: 'Confirmez votre présence : votre billet d’accès vous sera remis dès que vous aurez répondu.',
    };
  }
  if (hasTicket(g)) return { tone: 'yes', title: 'Merci, votre réponse est enregistrée', text: 'Votre billet d’accès est prêt. Vous pouvez modifier votre réponse à tout moment.' };
  return { tone: 'no', title: 'Votre absence est bien notée', text: 'Si vos projets changent, vous pouvez modifier votre réponse ici.' };
}

/** Les deux actions principales : la RÉPONSE d'abord ; le billet n'apparaît comme action que lorsqu'il existe. */
export const GuestCtas: React.FC<Props> = ({ guest, onRsvp, onTicket, onRepresentative }) => {
  const h = rsvpHeadline(guest);
  return (
    <div className="space-y-3">
      <div className={`rounded-xl px-3.5 py-3 text-xs leading-relaxed border ${h.tone === 'todo' ? 'bg-[#FFF4E8] border-[#F0C9A0] text-[#7A4A1E]' : h.tone === 'yes' ? 'bg-[#EBF3EE] border-[#BFD9C9] text-[#1B382B]' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
        <p className="font-bold text-sm flex items-center gap-1.5">{h.tone === 'yes' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}{h.title}</p>
        <p className="mt-0.5">{h.text}</p>
      </div>

      {h.tone === 'todo' && (
        <>
          <button onClick={onRsvp} className="w-full px-4 py-3.5 bg-[#B2502F] hover:bg-[#9A4326] text-white text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
            <span>Répondre à l’invitation</span><ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={onTicket} className="w-full px-4 py-2 text-[11px] text-[#8A7968] hover:text-[#4A3B32] flex items-center justify-center gap-1.5 cursor-pointer" aria-label="Billet verrouillé : disponible après votre réponse">
            <Lock className="w-3 h-3" /><span>Billet d’accès disponible après votre réponse</span>
          </button>
        </>
      )}

      {h.tone === 'yes' && (
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={onTicket} className="flex-1 px-4 py-3 bg-[#234A38] hover:bg-[#1B382B] text-white text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"><Ticket className="w-4 h-4" /><span>Voir mon billet</span></button>
          <button onClick={onRsvp} className="flex-1 px-4 py-3 bg-transparent hover:bg-slate-50 border border-[#C5B3A2] text-[#2D2424] text-xs font-semibold rounded-xl transition cursor-pointer">Modifier ma réponse</button>
        </div>
      )}

      {h.tone === 'no' && (
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={onRsvp} className="flex-1 px-4 py-3 bg-[#3A2D28] hover:bg-[#2D221D] text-white text-xs font-bold rounded-xl transition cursor-pointer">Modifier ma réponse</button>
          {onRepresentative && <button onClick={onRepresentative} className="flex-1 px-4 py-3 bg-transparent hover:bg-slate-50 border border-[#C5B3A2] text-[#2D2424] text-xs font-semibold rounded-xl transition cursor-pointer">Proposer un représentant</button>}
        </div>
      )}
    </div>
  );
};
