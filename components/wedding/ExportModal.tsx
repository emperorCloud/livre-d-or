'use client';
import React from 'react';
import {
  FileSpreadsheet,
  Printer,
  X,
  CheckCircle2,
  Download,
  ShieldCheck,
  FileText
} from 'lucide-react';
import type { Guest, WeddingConfig } from '@/lib/wedding/types';
import { exportGuestsToCsv, printCheckinSheet } from '@/lib/wedding/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  guests: Guest[];
  config: WeddingConfig;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  guests,
  config
}) => {
  if (!isOpen) return null;

  const handleDownloadCsv = () => {
    exportGuestsToCsv(guests, config);
  };

  const handlePrint = () => {
    printCheckinSheet();
  };

  const confirmedGuests = guests.filter((g) => g.rsvpStatus === 'confirmed');
  const checkedInCount = guests.filter((g) => g.isCheckedIn).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-bold text-slate-900">
                Exportation des Listes d'Émargement
              </h3>
              <p className="text-xs text-slate-500">
                Exportez les données à jour pour le traiteur, le staff d'accueil ou l'archivage.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick summary numbers */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total inscrits</span>
            <span className="font-bold text-slate-800 text-base">{guests.length}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Confirmés</span>
            <span className="font-bold text-emerald-700 text-base">{confirmedGuests.length}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Déjà émargés</span>
            <span className="font-bold text-amber-800 text-base">{checkedInCount}</span>
          </div>
        </div>

        {/* Two Export Options */}
        <div className="space-y-4">
          {/* CSV Export Option */}
          <div className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition bg-white space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">
                    Fichier Tableur CSV (Excel, Numbers, Sheets)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Contient l'intégralité des données : codes QR, tables, régimes, allergies, coordonnées, statuts RSVP et horodatages d'entrée. Encodage UTF-8 avec séparateur point-virgule.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadCsv}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger le fichier .CSV</span>
            </button>
          </div>

          {/* PDF / Printable Check-in Sheet */}
          <div className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition bg-white space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">
                    Feuille d'Émargement Officielle (Format PDF / Papier)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mise en page optimisée pour l'impression A4 à destination des vigiles et de l'accueil : liste ordonnée, colonne table, régime alimentaire et case signature.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / Enregistrer en PDF (Ctrl+P)</span>
            </button>
          </div>
        </div>

        <div className="pt-2 text-center text-[11px] text-slate-400">
          Les exports sont générés en direct à partir des dernières réponses synchronisées.
        </div>
      </div>
    </div>
  );
};
