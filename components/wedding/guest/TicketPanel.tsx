'use client';
import React from 'react';
import { CheckCircle2, Download, Lock, Maximize2, Printer } from 'lucide-react';
import type { Guest, WeddingConfig } from '@/lib/wedding/types';
import { confirmedPersons, hasTicket } from '@/lib/wedding/rsvp';
import { QrCodeDisplay } from '../QrCodeDisplay';
import { FloralCorner } from '../../decor/Flowers';

const formatEventDate = (d: string) => {
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? '' : t.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

type Props = { config: WeddingConfig; guest: Guest; displayName: string; onRsvp: () => void };

/** Onglet « Billet » : n'existe qu'après une réponse positive. Tant qu'aucune personne n'a confirmé, le QR n'est même pas envoyé par le serveur. */
export const TicketPanel: React.FC<Props> = ({ config, guest, displayName, onRsvp }) => {
  if (!hasTicket(guest) || !guest.qrCodeToken) {
    const declinedAll = guest.rsvpStatus === 'declined';
    return (
      <div className="max-w-xl mx-auto px-4 py-14 text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-full bg-[#FDEBF0] border border-[#F3D0DB] flex items-center justify-center"><Lock className="w-7 h-7 text-[#B04C6B]" /></div>
        <h2 className="font-serif text-3xl font-bold text-[#4A2F38]">{declinedAll ? 'Pas de billet pour le moment' : 'Votre billet vous attend'}</h2>
        <p className="text-sm text-[#8C7480] leading-relaxed">
          {declinedAll
            ? 'Vous avez indiqué ne pas pouvoir venir. Si vos projets changent, modifiez votre réponse : votre billet sera généré aussitôt.'
            : 'Le billet d’accès (QR code) est remis dès que vous avez confirmé votre présence. Répondez à l’invitation, cela ne prend qu’une minute.'}
        </p>
        <button onClick={onRsvp} className="px-6 py-3.5 bg-[#C65E7E] hover:bg-[#B04C6B] text-white text-sm font-bold rounded-xl shadow-md transition cursor-pointer">
          {declinedAll ? 'Modifier ma réponse' : 'Répondre à l’invitation'}
        </button>
      </div>
    );
  }

  const n = confirmedPersons(guest);
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-b from-[#FFE3EA] to-[#FFF7F9] text-[#4A2F38] py-12 relative overflow-hidden px-4 sm:px-6">
        <FloralCorner className="pointer-events-none absolute -top-4 -left-6 w-44 opacity-90" /><FloralCorner className="pointer-events-none absolute -top-4 -right-6 w-44 scale-x-[-1] opacity-90" />
        <div className="relative max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 space-y-4">
            <div className="text-[#B04C6B] text-[10px] uppercase font-bold tracking-widest">BILLET ACTIF · {n} PERSONNE{n > 1 ? 'S' : ''}</div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#A94566]">Votre billet</h2>
            <p className="text-xs sm:text-sm text-[#7C6470] leading-relaxed">Présentez ce QR à l’accueil{n > 1 ? ' : il est valable pour vous deux' : ''}. Les noms et les places restent à jour en direct.</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={() => window.print()} className="px-3.5 py-1.5 bg-[#C65E7E] text-white hover:bg-[#B04C6B] text-xs font-semibold rounded-full shadow-sm transition flex items-center gap-1.5 cursor-pointer"><Download className="w-3.5 h-3.5" /><span>Télécharger</span></button>
              <button onClick={() => window.print()} className="px-3.5 py-1.5 bg-white border border-[#F3D0DB] hover:bg-[#FBE9EE] text-[#5E4450] text-xs font-medium rounded-full transition flex items-center gap-1.5 cursor-pointer"><Printer className="w-3.5 h-3.5" /><span>Imprimer</span></button>
              <button onClick={() => document.getElementById('pass-card-node')?.requestFullscreen?.()} className="px-3.5 py-1.5 bg-white border border-[#F3D0DB] hover:bg-[#FBE9EE] text-[#5E4450] text-xs font-medium rounded-full transition flex items-center gap-1.5 cursor-pointer"><Maximize2 className="w-3.5 h-3.5" /><span>Plein écran</span></button>
            </div>
            <button onClick={onRsvp} className="text-[11px] text-[#B04C6B] underline underline-offset-2 cursor-pointer">Modifier ma réponse</button>
          </div>

          <div className="md:col-span-7 flex justify-center">
            <div id="pass-card-node" className="w-full max-w-sm bg-white text-[#4A2F38] rounded-t-3xl rounded-b-2xl shadow-2xl overflow-hidden border border-amber-900/10">
              <div className="h-36 relative overflow-hidden bg-slate-900">
                <img src={config.ticketImageUrl || config.heroImageUrl || undefined} alt={config.coupleNames} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-4 text-white"><span className="font-serif text-lg font-bold">{config.coupleNames}</span><span className="text-[10px] text-amber-200 block">{formatEventDate(config.eventDate)}</span></div>
              </div>
              <div className="p-6 text-center space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8A3AD]">Pass d’accès invité</span>
                  <h3 className="font-serif text-xl font-bold text-[#4A2F38] mt-0.5">{displayName}</h3>
                  {guest.plusOneAllowed && <p className="text-[11px] text-[#8C7480] mt-0.5">{n === 2 ? '2 personnes attendues' : `1 personne attendue${guest.partnerRsvp === 'declined' ? ' (conjoint absent)' : guest.guestRsvp === 'declined' ? ' (invité absent)' : ''}`}</p>}
                </div>
                <div className="p-4 bg-[#FFF7F9] rounded-2xl inline-block shadow-inner border border-[#F6DCE4]">
                  <QrCodeDisplay value={guest.qrCodeToken} size={180} />
                  <span className="text-[10px] text-[#B8A3AD] block mt-1.5 font-medium">QR personnel</span>
                </div>
                {guest.isCheckedIn ? (
                  <div className="bg-emerald-100 text-emerald-800 text-xs font-bold py-1.5 px-3 rounded-full flex items-center justify-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span>Émargé à l’entrée ({new Date(guest.checkedInAt || '').toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})</span></div>
                ) : (
                  <div className="bg-amber-50 text-amber-900 text-[11px] font-medium py-1 px-3 rounded-full border border-amber-200">À présenter à l’accueil le jour J</div>
                )}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 text-left text-xs">
                  <div><span className="text-[10px] text-[#B8A3AD] uppercase font-bold block">Statut</span><span className="font-semibold text-[#C65E7E]">Présence confirmée</span><span className="text-[10px] text-[#8C7480] block">{n} personne{n > 1 ? 's' : ''}</span></div>
                  <div className="text-right"><span className="text-[10px] text-[#B8A3AD] uppercase font-bold block">Table</span><span className="font-bold text-[#B04C6B]">{guest.tableNumber || 'À venir'}</span><span className="text-[10px] text-[#8C7480] block">{config.venueCity}</span></div>
                </div>
                <div className="pt-2 text-[10px] text-[#B8A3AD] font-serif italic border-t border-slate-100">{config.coupleNames}{config.venueCity ? ` · ${config.venueCity}` : ''}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
