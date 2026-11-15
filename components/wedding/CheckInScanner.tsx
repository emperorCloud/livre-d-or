'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  RotateCcw,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  Clock,
  UserCheck
} from 'lucide-react';
import type { Guest } from '@/lib/wedding/types';
import { confirmedPersons } from '@/lib/wedding/rsvp';
import { checkInGuest, undoCheckIn, CheckInResult } from '@/lib/wedding/api';
import { playSuccessSound, playWarningSound, playErrorSound } from '@/lib/wedding/soundUtils';

interface CheckInScannerProps {
  guests: Guest[];
  onGuestSelectedForView: (guest: Guest) => void;
}

export const CheckInScanner: React.FC<CheckInScannerProps> = ({ guests, onGuestSelectedForView }) => {
  const [manualCode, setManualCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<Array<{ guest: Guest; time: string }>>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update recent check-ins list from guests state
  useEffect(() => {
    const checked = guests
      .filter((g) => g.isCheckedIn && g.checkedInAt)
      .sort((a, b) => new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime())
      .slice(0, 8)
      .map((g) => ({ guest: g, time: g.checkedInAt! }));
    setRecentCheckIns(checked);
  }, [guests]);

  const handleProcessToken = useCallback(async (tokenOrId: string, isId = false) => {
    if (isProcessing || !tokenOrId.trim()) return;
    setIsProcessing(true);

    try {
      const payload = isId
        ? { guestId: tokenOrId.trim(), checkedInBy: 'Contrôle Entrée' }
        : { token: tokenOrId.trim(), checkedInBy: 'Scanner Entrée' };

      const result = await checkInGuest(payload);
      setLastResult(result);

      if (soundEnabled) {
        if (result.success) {
          playSuccessSound();
        } else if (result.status === 'already_checked_in') {
          playWarningSound();
        } else {
          playErrorSound();
        }
      }

      if (result.success && result.guest) {
        setManualCode('');
      }
    } catch (err) {
      console.error('Scan error:', err);
      if (soundEnabled) playErrorSound();
      setLastResult({
        success: false,
        status: 'not_found',
        message: 'Erreur réseau lors de la validation du billet.'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, soundEnabled]);

  // Camera BarcodeDetector scan loop
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);

      // Check for native BarcodeDetector
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (video: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector({
          formats: ['qr_code']
        });

        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                const detected = barcodes[0].rawValue;
                handleProcessToken(detected);
              }
            } catch {
              // frame detection pass
            }
          }
        }, 400);
      }
    } catch (err: unknown) {
      console.warn('Camera error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Impossible d\'accéder à la caméra';
      setCameraError(errorMsg);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleProcessToken(manualCode.trim());
    }
  };

  const handleUndo = async (guestId: string) => {
    try {
      await undoCheckIn(guestId);
      if (lastResult?.guest?.id === guestId) {
        setLastResult(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter guests for fast name check-in
  const filteredGuests = searchQuery.trim()
    ? guests.filter((g) =>
        `${g.firstName} ${g.lastName} ${g.tableNumber} ${g.qrCodeToken}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : [];

  const checkedInCount = guests.filter((g) => g.isCheckedIn).length;
  const confirmedCount = guests.filter((g) => g.rsvpStatus === 'confirmed').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner: Status & Quick stats */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs tracking-wider uppercase font-semibold">
            <UserCheck className="w-4 h-4" />
            <span>Poste de Contrôle d'Accès & Émargement</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mt-1">
            Émargement des Invités le Jour J
          </h2>
          <p className="text-emerald-100/80 text-sm mt-0.5">
            Scannez le QR code ou saisissez le nom de l'invité pour valider instantanément son entrée et son placement.
          </p>
        </div>

        <div className="flex items-center gap-6 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/15">
          <div className="text-center">
            <span className="block text-2xl font-bold text-white">{checkedInCount}</span>
            <span className="text-xs text-emerald-200">Émargés</span>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center">
            <span className="block text-2xl font-bold text-emerald-300">{confirmedCount}</span>
            <span className="text-xs text-emerald-200">Attendus</span>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center">
            <span className="block text-2xl font-bold text-white">
              {confirmedCount > 0 ? Math.round((checkedInCount / confirmedCount) * 100) : 0}%
            </span>
            <span className="text-xs text-emerald-200">Arrivés</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scanner viewport & Input */}
        <div className="lg:col-span-7 space-y-6">
          {/* Scanner Box */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                <span>Scanner Optique de Billet</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  title={soundEnabled ? 'Désactiver les signaux sonores' : 'Activer les signaux sonores'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>

            {/* Camera Viewport or Placeholder */}
            <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden flex flex-col items-center justify-center border border-slate-800">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Scan target reticle */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-emerald-400/80 rounded-2xl relative animate-pulse">
                      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400" />
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400" />
                      <div className="h-0.5 w-full bg-emerald-400/70 shadow-[0_0_8px_rgba(52,211,153,0.8)] absolute top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <button
                    onClick={stopCamera}
                    className="absolute top-3 right-3 px-3 py-1 bg-black/60 hover:bg-black/80 text-white text-xs rounded-lg backdrop-blur-sm cursor-pointer"
                  >
                    Désactiver Caméra
                  </button>
                </>
              ) : (
                <div className="text-center p-6 space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Caméra désactivée</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Autorisez la caméra pour scanner les QR codes présentés sur les téléphones des invités.
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
                  >
                    Activer la Caméra
                  </button>
                  {cameraError && (
                    <p className="text-rose-400 text-xs max-w-sm mx-auto">{cameraError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Quick Saisie manuelle / Douchette code-barres */}
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <label className="text-xs font-medium text-slate-700 block">
                Saisie directe ou douchette (code du billet, ex : ABCDE-FGHJK) :
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="XXXXX-XXXXX"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase font-mono font-medium tracking-wide"
                  />
                  <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing || !manualCode.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition cursor-pointer"
                >
                  Valider
                </button>
              </div>
            </form>

            {/* One-click demo test buttons for immediate evaluation */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block mb-2">
                Simuler un scan en 1 clic (Test Rapide) :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {guests.slice(0, 5).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleProcessToken(g.qrCodeToken)}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer font-medium flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>{g.firstName} {g.lastName}</span>
                    {g.isCheckedIn && <span className="text-[10px] text-emerald-700 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Search Guest by Name for Manual Check-In */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-500" />
              <span>Recherche manuelle par Nom ou Table</span>
            </h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher Dupont, Fontaine, Table 2..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />

            {searchQuery.trim() && (
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {filteredGuests.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Aucun invité ne correspond à cette recherche.
                  </div>
                ) : (
                  filteredGuests.map((guest) => (
                    <div
                      key={guest.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 transition"
                    >
                      <div>
                        <div className="font-medium text-slate-900 text-sm">
                          {guest.firstName} {guest.lastName}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-semibold text-amber-900">{guest.tableNumber}</span>
                          <span aria-hidden="true">·</span>
                          <span>{guest.qrCodeToken}</span>
                          {guest.plusOneAllowed && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{confirmedPersons(guest)} pers. attendue{confirmedPersons(guest) > 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {guest.isCheckedIn ? (
                          <span className="px-2.5 py-1 text-xs bg-emerald-100 text-emerald-800 font-medium rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Déjà émargé
                          </span>
                        ) : (
                          <button
                            onClick={() => handleProcessToken(guest.id, true)}
                            className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition cursor-pointer"
                          >
                            Émarger
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scan Result & Real-Time Check-In Feed */}
        <div className="lg:col-span-5 space-y-6">
          {/* Instant Result Box */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm tracking-wide uppercase text-slate-500">
              Résultat du dernier scan
            </h3>

            {!lastResult ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <QrCode className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
                <p className="text-sm">En attente d'un scan ou d'une saisie...</p>
                <p className="text-xs text-slate-400">Le statut et le placement apparaîtront ici.</p>
              </div>
            ) : lastResult.success && lastResult.guest ? (
              <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-900 rounded">
                      Émargement Validé
                    </span>
                    <h4 className="font-serif text-xl font-bold text-slate-900 mt-0.5">
                      {lastResult.guest.firstName} {lastResult.guest.lastName}
                    </h4>
                    <p className="text-xs text-emerald-800">
                      Entrée enregistrée à {new Date(lastResult.guest.checkedInAt || '').toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200 text-xs">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Table Assignée</span>
                    <span className="font-bold text-amber-900 text-sm">{lastResult.guest.tableNumber}</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Régime Alimentaire</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {lastResult.guest.dietaryPreference === 'gluten_free' ? 'Sans Gluten' : lastResult.guest.dietaryPreference}
                    </span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Personnes attendues</span>
                    <span className="font-medium text-slate-800">
                      {confirmedPersons(lastResult.guest)}
                      {lastResult.guest.plusOneAllowed && lastResult.guest.partnerRsvp === 'confirmed' && ` (avec ${lastResult.guest.plusOneName || 'le conjoint'})`}
                    </span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Enfants</span>
                    <span className="font-medium text-slate-800">
                      {lastResult.guest.childrenCount > 0 ? `${lastResult.guest.childrenCount} enfant(s)` : '0'}
                    </span>
                  </div>
                </div>

                {lastResult.guest.allergies && (
                  <div className="bg-amber-100/90 text-amber-900 p-2 rounded-lg text-xs font-medium">
                    ⚠️ Allergies signalées : {lastResult.guest.allergies}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => onGuestSelectedForView(lastResult.guest!)}
                    className="text-xs text-emerald-800 hover:text-emerald-950 underline font-medium cursor-pointer"
                  >
                    Voir l'espace invité complet
                  </button>
                  <button
                    onClick={() => handleUndo(lastResult.guest!.id)}
                    className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Annuler l'émargement</span>
                  </button>
                </div>
              </div>
            ) : lastResult.status === 'already_checked_in' ? (
              <div className="bg-amber-50 border-2 border-amber-400/80 rounded-xl p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 rounded">
                      Attention : Déjà Émargé
                    </span>
                    <h4 className="font-serif text-lg font-bold text-slate-900 mt-0.5">
                      {lastResult.guest?.firstName} {lastResult.guest?.lastName}
                    </h4>
                    <p className="text-xs text-amber-800 mt-1">{lastResult.message}</p>
                    <div className="mt-2 text-xs font-medium text-slate-700">
                      Table : <span className="font-bold text-amber-950">{lastResult.guest?.tableNumber}</span>
                    </div>
                  </div>
                </div>

                {lastResult.guest && (
                  <button
                    onClick={() => handleUndo(lastResult.guest!.id)}
                    className="text-xs text-amber-900 hover:text-amber-950 underline font-medium cursor-pointer"
                  >
                    Réinitialiser ce statut
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-rose-50 border-2 border-rose-400/80 rounded-xl p-5 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-rose-200 text-rose-900 rounded">
                      Billet Non Reconnu
                    </span>
                    <p className="text-xs text-rose-800 mt-1">{lastResult.message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Arrival Feed */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Dernières arrivées enregistrées</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {recentCheckIns.length} récents
              </span>
            </div>

            {recentCheckIns.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Aucun invité émargé pour le moment.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {recentCheckIns.map(({ guest, time }) => (
                  <div key={guest.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-slate-900">
                        {guest.firstName} {guest.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span className="font-semibold text-amber-800">{guest.tableNumber}</span>
                        <span>·</span>
                        <span>{new Date(time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUndo(guest.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                      title="Annuler cet émargement"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
