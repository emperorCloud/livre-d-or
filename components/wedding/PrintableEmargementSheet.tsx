'use client';
import React from 'react';
import type { Guest, WeddingConfig } from '@/lib/wedding/types';
import { confirmedPersons } from '@/lib/wedding/rsvp';

interface PrintableEmargementSheetProps {
  guests: Guest[];
  config: WeddingConfig;
}

export const PrintableEmargementSheet: React.FC<PrintableEmargementSheetProps> = ({
  guests,
  config
}) => {
  // Sort alphabetically by last name for ease of reception lookup
  const sortedGuests = [...guests].sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr'));

  const confirmedCount = sortedGuests.filter((g) => g.rsvpStatus === 'confirmed').length;
  const totalWithExtra = sortedGuests.reduce((acc, g) => {
    if (g.rsvpStatus === 'confirmed') {
      return acc + confirmedPersons(g) + g.childrenCount;
    }
    return acc;
  }, 0);

  return (
    <div className="print-only p-6 text-black bg-white">
      {/* Official Header */}
      <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider font-serif">
            {config.coupleNames}
          </h1>
          <p className="text-sm font-semibold mt-0.5">
            Feuille d'Émargement Officielle & Contrôle d'Accès
          </p>
          <p className="text-xs text-gray-700 mt-1">
            Date : {new Date(config.eventDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {config.venueName} ({config.venueCity})
          </p>
        </div>

        <div className="text-right text-xs border border-black p-2 rounded">
          <div><strong>Total Foyer(s) :</strong> {sortedGuests.length}</div>
          <div><strong>Total Confirmés :</strong> {confirmedCount}</div>
          <div><strong>Total Convives Présents :</strong> {totalWithExtra}</div>
        </div>
      </div>

      {/* Main Table */}
      <table className="w-full text-left text-xs border-collapse border border-gray-400">
        <thead>
          <tr className="bg-gray-100 text-black border-b border-gray-400 font-bold">
            <th className="p-1.5 border border-gray-300 w-10 text-center">N°</th>
            <th className="p-1.5 border border-gray-300 w-24">Code Billet</th>
            <th className="p-1.5 border border-gray-300">Nom & Prénom</th>
            <th className="p-1.5 border border-gray-300 w-32">Table</th>
            <th className="p-1.5 border border-gray-300 w-20">RSVP</th>
            <th className="p-1.5 border border-gray-300 w-36">Accompagnant (+1)</th>
            <th className="p-1.5 border border-gray-300 w-28">Régime / Allergies</th>
            <th className="p-1.5 border border-gray-300 w-20 text-center">Émargé</th>
            <th className="p-1.5 border border-gray-300 w-32 text-center">Signature / Visa</th>
          </tr>
        </thead>
        <tbody>
          {sortedGuests.map((guest, index) => {
            return (
              <tr key={guest.id} className="border-b border-gray-300 print-break-inside-avoid">
                <td className="p-1.5 border border-gray-300 text-center font-mono text-[10px]">
                  {index + 1}
                </td>
                <td className="p-1.5 border border-gray-300 font-mono text-[10px]">
                  {guest.qrCodeToken}
                </td>
                <td className="p-1.5 border border-gray-300 font-bold">
                  {guest.lastName.toUpperCase()} {guest.firstName}
                  {guest.category && (
                    <span className="text-[10px] font-normal text-gray-600 block">
                      ({guest.category})
                    </span>
                  )}
                </td>
                <td className="p-1.5 border border-gray-300 font-semibold">
                  {guest.tableNumber}
                </td>
                <td className="p-1.5 border border-gray-300">
                  {guest.rsvpStatus === 'confirmed' ? 'OUI' : guest.rsvpStatus === 'declined' ? 'NON' : 'ATTENTE'}
                </td>
                <td className="p-1.5 border border-gray-300 text-[11px]">
                  {guest.plusOneAllowed
                    ? (confirmedPersons(guest) === 2 ? `2 pers. (avec ${guest.plusOneName || 'le conjoint'})` : `${confirmedPersons(guest)} pers.`)
                    : 'Seul'}
                  {guest.childrenCount > 0 && ` · ${guest.childrenCount} enf.`}
                </td>
                <td className="p-1.5 border border-gray-300 text-[10px]">
                  {guest.dietaryPreference !== 'classic' && (
                    <strong className="block">{guest.dietaryPreference}</strong>
                  )}
                  {guest.allergies && (
                    <span className="text-red-700 italic block">⚠️ {guest.allergies}</span>
                  )}
                </td>
                <td className="p-1.5 border border-gray-300 text-center font-bold">
                  {guest.isCheckedIn ? '✓ ARRIVÉ' : '[   ]'}
                </td>
                <td className="p-1.5 border border-gray-300 text-center">
                  <div className="h-6" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer Visa */}
      <div className="mt-8 pt-4 border-t border-gray-400 flex justify-between text-xs text-gray-700">
        <div>
          <p className="font-semibold">Visa Responsable de l'Accueil :</p>
          <div className="h-12 border-b border-dashed border-gray-400 w-48 mt-2" />
        </div>
        <div>
          <p className="font-semibold">Visa Maître d'Hôtel / Traiteur :</p>
          <div className="h-12 border-b border-dashed border-gray-400 w-48 mt-2" />
        </div>
      </div>
    </div>
  );
};
