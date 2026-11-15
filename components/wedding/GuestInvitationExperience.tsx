'use client';
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Heart,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Download,
  Printer,
  Maximize2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Send,
  Phone,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  ShoppingBag,
  Bell,
  MessageSquare,
  X,
  Gift,
  Lock
} from 'lucide-react';
import type { Guest, WeddingConfig, TimelineEventItem, PhysicalGiftItem, Announcement, ChatMessage } from '@/lib/wedding/types';
import { QrCodeDisplay } from './QrCodeDisplay';
import { proposeRepresentative, pledgePhysicalGift } from '@/lib/wedding/api';

// Date lisible de la fête, à partir de la configuration (jamais écrite en dur).
const formatEventDate = (d: string) => {
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? '' : t.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};
import { ChatSheet } from './LogisticsChatView';
import { GuestCtas } from './guest/GuestCtas';
import { FloralCorner, FloralDivider } from '../decor/Flowers';
import { RsvpPanel } from './guest/RsvpPanel';
import { TicketPanel } from './guest/TicketPanel';
import { everyoneAnswered, hasTicket } from '@/lib/wedding/rsvp';

interface GuestInvitationExperienceProps {
  config: WeddingConfig;
  guests: Guest[];
  currentGuest: Guest;
  initialTab?: 'grand_jour' | 'programme' | 'story' | 'gifts' | 'infos' | 'billet' | 'rsvp';
  announcements?: Announcement[];
  messages?: ChatMessage[];
  onSendMessage?: (msg: Partial<ChatMessage>) => Promise<ChatMessage>;
}

export type GuestActiveTab = 'grand_jour' | 'programme' | 'story' | 'gifts' | 'infos' | 'billet' | 'rsvp';

/** Compte à rebours discret : calculé côté navigateur (évite tout écart d'hydratation). */
function DaysToGo({ date }: { date: string }) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    const d = new Date(date); if (Number.isNaN(d.getTime())) return;
    const t0 = new Date(); t0.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0);
    setDays(Math.round((d.getTime() - t0.getTime()) / 86_400_000));
  }, [date]);
  if (days === null || days < 0) return null;
  return (
    <div className="inline-flex items-baseline gap-2 px-5 py-2 rounded-full bg-white/80 border border-[#F6DCE4] text-[#A94566]">
      {days === 0 ? <span className="font-serif text-xl">C’est aujourd’hui !</span> : <><span className="font-serif text-3xl font-semibold">{days}</span><span className="text-xs tracking-widest uppercase">jour{days > 1 ? 's' : ''} avant le grand jour</span></>}
    </div>
  );
}

export const GuestInvitationExperience: React.FC<GuestInvitationExperienceProps> = ({
  config,
  guests,
  currentGuest,
  initialTab = 'grand_jour',
  announcements = [],
  messages = [],
  onSendMessage
}) => {
  const [activeTab, setActiveTab] = useState<GuestActiveTab>(initialTab);

  // Physical gifts & cagnottes selector
  const [giftSubTab, setGiftSubTab] = useState<'physical' | 'monetary'>('physical');
  const [selectedPhysicalGift, setSelectedPhysicalGift] = useState<PhysicalGiftItem | null>(null);
  const [pledgeQuantity, setPledgeQuantity] = useState(1);
  const [pledgeDonorName, setPledgeDonorName] = useState(
    currentGuest.greetingTitle || `${currentGuest.firstName} ${currentGuest.lastName}`
  );
  const [pledgeContact, setPledgeContact] = useState(currentGuest.phone || currentGuest.email || '');
  const [pledgeMessage, setPledgeMessage] = useState('');
  const [isPledging, setIsPledging] = useState(false);
  const [pledgeSuccess, setPledgeSuccess] = useState(false);

  // Modals for announcements & chat in guest space
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // Representative Modal
  const [isRepModalOpen, setIsRepModalOpen] = useState(false);
  const [repName, setRepName] = useState(currentGuest.representativeRequest?.name || '');
  const [repContact, setRepContact] = useState(currentGuest.representativeRequest?.contact || '');
  const [repReason, setRepReason] = useState(currentGuest.representativeRequest?.reason || '');
  const [repSubmitted, setRepSubmitted] = useState(false);

  // Copy helper
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const handleProposeRepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repName.trim()) return;
    try {
      await proposeRepresentative(currentGuest.id, {
        name: repName.trim(),
        contact: repContact.trim(),
        reason: repReason.trim()
      });
      setRepSubmitted(true);
      setTimeout(() => {
        setIsRepModalOpen(false);
        setRepSubmitted(false);
      }, 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePledgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhysicalGift) return;
    setIsPledging(true);
    try {
      await pledgePhysicalGift(selectedPhysicalGift.id, {
        guestName: pledgeDonorName.trim() || currentGuest.greetingTitle || `${currentGuest.firstName} ${currentGuest.lastName}`,
        guestContact: pledgeContact.trim(),
        quantity: pledgeQuantity,
        message: pledgeMessage.trim()
      });
      setPledgeSuccess(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        setSelectedPhysicalGift(null);
        setPledgeSuccess(false);
        setPledgeMessage('');
      }, 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPledging(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(id);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  const answered = everyoneAnswered(currentGuest);
  const ticketReady = hasTicket(currentGuest) && !!currentGuest.qrCodeToken;

  // Messages non lus : tout ce qui est arrivé depuis la dernière ouverture de la discussion (mémorisé sur cet appareil).
  const seenKey = `chat-seen:${currentGuest.id}`;
  const [seenAt, setSeenAt] = useState(0);
  useEffect(() => { try { setSeenAt(Number(localStorage.getItem(seenKey)) || 0); } catch { /* stockage indisponible */ } }, [seenKey]);
  const myName = `${currentGuest.firstName} ${currentGuest.lastName}`.trim().toLowerCase();
  const unreadChat = messages.filter((m) => new Date(m.createdAt).getTime() > seenAt && m.senderName.trim().toLowerCase() !== myName).length;
  const openChat = () => { setIsChatModalOpen(true); const now = Date.now(); setSeenAt(now); try { localStorage.setItem(seenKey, String(now)); } catch { /* ignoré */ } };

  const guestDisplayName = currentGuest.greetingTitle || `M. et Mme ${currentGuest.lastName} ${currentGuest.firstName}`;

  return (
    <div className="min-h-screen bg-[#FFF7F9] text-[#4A2F38] font-sans">
      {/* Guest Navigation Header matching screenshot */}
      <header className="sticky top-0 z-30 bg-[#FFF7F9]/95 backdrop-blur-md border-b border-[#F6DCE4] transition-all no-print">
        {/* Top 5 numbered tabs bar */}
        <div className="max-w-6xl mx-auto px-4 pt-2.5 pb-1 flex justify-center overflow-x-auto scrollbar-none">
          <nav className="flex items-center gap-6 sm:gap-10 text-[11px] sm:text-xs tracking-wider uppercase font-medium text-[#9A8490]">
            <button
              onClick={() => setActiveTab('grand_jour')}
              className={`pb-1 transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'grand_jour'
                  ? 'text-[#B04C6B] font-bold border-b-2 border-[#B04C6B]'
                  : 'hover:text-[#4A2F38]'
              }`}
            >
              <span>LE GRAND JOUR</span>
            </button>

            <button
              onClick={() => setActiveTab('programme')}
              className={`pb-1 transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'programme'
                  ? 'text-[#B04C6B] font-bold border-b-2 border-[#B04C6B]'
                  : 'hover:text-[#4A2F38]'
              }`}
            >
              <span>PROGRAMME</span>
            </button>

            <button
              onClick={() => setActiveTab('story')}
              className={`pb-1 transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'story'
                  ? 'text-[#B04C6B] font-bold border-b-2 border-[#B04C6B]'
                  : 'hover:text-[#4A2F38]'
              }`}
            >
              <span>NOTRE HISTOIRE</span>
            </button>

            <button
              onClick={() => setActiveTab('gifts')}
              className={`pb-1 transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'gifts'
                  ? 'text-[#B04C6B] font-bold border-b-2 border-[#B04C6B]'
                  : 'hover:text-[#4A2F38]'
              }`}
            >
              <span>CADEAUX</span>
            </button>

            <button
              onClick={() => setActiveTab('infos')}
              className={`pb-1 transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'infos'
                  ? 'text-[#B04C6B] font-bold border-b-2 border-[#B04C6B]'
                  : 'hover:text-[#4A2F38]'
              }`}
            >
              <span>INFOS</span>
            </button>
          </nav>
        </div>

        {/* Barre secondaire : nom de l'invité, annonces, discussion, et les deux actions — la RÉPONSE d'abord */}
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-t border-[#FBE9EE]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="font-serif text-base sm:text-lg font-medium text-[#5E4450] truncate">{guestDisplayName}</div>
            <div className="flex items-center gap-1 pl-2 border-l border-[#F3D0DB]">
              <button onClick={() => setIsAnnouncementsModalOpen(true)} className="relative p-2 sm:px-2.5 sm:py-1 text-[11px] font-medium text-[#7C6470] hover:text-[#4A2F38] hover:bg-[#FBE9EE] rounded-full transition flex items-center gap-1 cursor-pointer" title="Annonces des mariés" aria-label="Annonces des mariés">
                <Bell className="w-3.5 h-3.5 text-[#C65E7E]" /><span className="hidden sm:inline">Annonces</span>
                {announcements.length > 0 && <span className="min-w-4 h-4 px-1 rounded-full bg-[#C65E7E] text-white text-[9px] font-bold flex items-center justify-center">{announcements.length}</span>}
              </button>
              <button onClick={openChat} className="relative p-2 sm:px-2.5 sm:py-1 text-[11px] font-medium text-[#7C6470] hover:text-[#4A2F38] hover:bg-[#FBE9EE] rounded-full transition flex items-center gap-1 cursor-pointer" title="Discussions : covoiturage et hébergement" aria-label="Discussions : covoiturage et hébergement">
                <MessageSquare className="w-3.5 h-3.5 text-[#C65E7E]" /><span className="hidden sm:inline">Discussions</span>
                {unreadChat > 0 && <span className="min-w-4 h-4 px-1 rounded-full bg-[#C65E7E] text-white text-[9px] font-bold flex items-center justify-center">{unreadChat}</span>}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Réponse : action principale tant qu'elle n'est pas donnée */}
            <button onClick={() => setActiveTab('rsvp')}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition cursor-pointer uppercase flex items-center gap-1.5 ${
                !answered ? 'bg-[#C65E7E] text-white shadow-md hover:bg-[#B04C6B] ring-2 ring-[#C65E7E]/25' : activeTab === 'rsvp' ? 'bg-[#8E3F58] text-white' : 'bg-transparent border border-[#E3B5C3] text-[#5E4450] hover:bg-[#FDEBF0]'}`}>
              {!answered && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              {answered && <Check className="w-3.5 h-3.5" />}
              <span>{!answered ? 'Répondre' : 'Ma réponse'}</span>
            </button>
            {/* Billet : verrouillé tant qu'aucune présence n'est confirmée */}
            <button onClick={() => setActiveTab('billet')} title={ticketReady ? 'Mon billet d’accès' : 'Disponible après votre réponse'}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide transition cursor-pointer uppercase flex items-center gap-1.5 ${
                ticketReady ? (activeTab === 'billet' ? 'bg-[#C65E7E] text-white ring-2 ring-[#C65E7E]/30' : 'bg-[#C65E7E] text-white hover:bg-[#A94566]') : 'bg-transparent border border-dashed border-[#E3B5C3] text-[#B8A3AD] hover:bg-[#FDEBF0]'}`}>
              {ticketReady ? <span>Mon billet</span> : <><Lock className="w-3 h-3" /><span>Billet</span></>}
              {ticketReady && currentGuest.isCheckedIn && <span className="w-2 h-2 rounded-full bg-emerald-300" />}
            </button>
          </div>
        </div>

        {/* Live Announcement Banner if recent announcements exist */}
        {announcements.length > 0 && (
          <div className="bg-[#FFEFF3] border-t border-b border-[#F6D5DE] px-4 py-2">
            <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-[#7A4558] gap-3">
              <div className="flex items-center gap-2 truncate">
                <span className="px-2 py-0.5 rounded-full bg-[#C65E7E] text-white text-[10px] font-bold shrink-0">
                  Info Mariés
                </span>
                <span className="font-semibold truncate">{announcements[0].title} :</span>
                <span className="truncate text-[#A0687A]">{announcements[0].message}</span>
              </div>
              <button
                onClick={() => setIsAnnouncementsModalOpen(true)}
                className="shrink-0 text-[11px] font-bold text-[#C65E7E] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Lire ({announcements.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Areas */}
      <main className="pb-24">
        {/* ============================================================== */}
        {/* TAB 01: LE GRAND JOUR                                          */}
        {/* ============================================================== */}
        {activeTab === 'grand_jour' && (
          <div className="space-y-12">
            {/* Accueil : épuré, centré, fleuri */}
            <section className="relative overflow-hidden bg-gradient-to-b from-[#FFE4EB] via-[#FFF0F4] to-[#FFF7F9]">
              <FloralCorner className="pointer-events-none absolute -top-8 -left-10 w-52 sm:w-80" />
              <FloralCorner className="pointer-events-none absolute -top-8 -right-10 w-52 sm:w-80 scale-x-[-1]" />
              <FloralCorner className="pointer-events-none absolute -bottom-14 -left-12 w-40 sm:w-64 scale-y-[-1] opacity-80" />
              <FloralCorner className="pointer-events-none absolute -bottom-14 -right-12 w-40 sm:w-64 scale-[-1] opacity-80" />

              <div className="relative z-10 max-w-2xl mx-auto px-6 pt-24 pb-28 sm:pt-32 sm:pb-36 text-center space-y-6">
                <p className="text-[11px] tracking-[0.4em] uppercase text-[#B04C6B] font-semibold">Nous nous marions</p>
                {config.heroImageUrl && (
                  <div className="mx-auto w-40 h-52 sm:w-48 sm:h-60 rounded-t-full rounded-b-3xl overflow-hidden ring-4 ring-white shadow-xl shadow-[#C65E7E]/20">
                    <img src={config.heroImageUrl} alt={config.coupleNames} className="w-full h-full object-cover object-[center_30%]" />
                  </div>
                )}
                <h1 className="font-script text-6xl sm:text-8xl text-[#A94566] leading-[1.05]">{config.coupleNames}</h1>
                <p className="text-sm sm:text-base tracking-wide text-[#6E5560]">{formatEventDate(config.eventDate)}{config.venueCity ? ` · ${config.venueCity}` : ''}</p>
                <FloralDivider className="w-52 sm:w-64 mx-auto" />
                {config.storyQuote && <p className="font-serif text-xl sm:text-2xl italic text-[#7C6470] max-w-xl mx-auto leading-snug">« {config.storyQuote} »</p>}
                <DaysToGo date={config.eventDate} />
              </div>
            </section>

            {/* Rien que pour vous : la réponse d'abord */}
            <section className="relative z-10 -mt-24 sm:-mt-28 px-4">
              <div className="max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#C65E7E]/10 border border-[#F6DCE4] space-y-4 text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C65E7E]">Rien que pour vous</div>
                <h2 className="font-serif text-3xl font-semibold text-[#4A2F38] leading-tight">{guestDisplayName}</h2>
                <div className="text-left"><GuestCtas guest={currentGuest} onRsvp={() => setActiveTab('rsvp')} onTicket={() => setActiveTab('billet')} onRepresentative={() => setIsRepModalOpen(true)} /></div>
                <p className="text-[11px] text-[#B8A3AD] italic">Gardez ce lien personnel jusqu’au jour J.</p>
              </div>
            </section>

            {/* Dress code */}
            <section className="max-w-4xl mx-auto px-4 text-center space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C65E7E] block">Pour célébrer ensemble</span>
                <h3 className="font-serif text-4xl font-semibold text-[#4A2F38] mt-1">Dress code</h3>
                <FloralDivider className="w-44 mx-auto mt-2" />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-2">
                {config.dressCodeColors.map((color, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div style={{ backgroundColor: color.hex }} className="w-16 h-20 rounded-t-full rounded-b-lg shadow-md ring-2 ring-white transform hover:scale-105 transition" />
                    <span className="text-xs font-medium text-[#5E4450]">{color.name}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 02: PROGRAMME                                              */}
        {/* ============================================================== */}
        {activeTab === 'programme' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A2F38]">
                On se retrouve...
              </h2>
              <p className="text-xs sm:text-sm text-[#8C7480]">
                Voici les moments que nous souhaitons partager avec vous.
              </p>
            </div>

            {/* 5 Cards with arched top styling */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {config.timelineEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-[#FDEBF0] rounded-t-3xl rounded-b-2xl p-5 border border-[#F3D0DB] flex flex-col justify-between space-y-4 hover:shadow-md transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#C65E7E] italic font-serif text-base">{ev.order}</span>
                      <span className="text-[#8E3F58] font-mono">{ev.time}</span>
                    </div>

                    <div className="text-[11px] text-[#9A8490] font-medium">{ev.dateStr}</div>

                    <h3 className="font-serif text-lg font-bold text-[#4A2F38] leading-snug">
                      {ev.title}
                    </h3>

                    <p className="text-xs text-[#5C4F44]">{ev.locationName}</p>
                    <p className="text-[11px] text-[#9A8490]">{ev.locationDetails}</p>
                    <p className="text-[11px] text-[#9A8490]">{ev.city}</p>
                  </div>

                  {/* Map snippet / Itinerary button */}
                  <div className="space-y-2 pt-2 border-t border-[#F6DCE4]">
                    <div className="bg-[#EAE2D7] rounded-xl p-3 text-center text-xs text-[#8C7480] flex flex-col items-center gap-1">
                      <MapPin className="w-4 h-4 text-[#C65E7E]" />
                      <span className="font-medium text-[11px]">Afficher la carte</span>
                      <span className="text-[10px] text-[#B8A3AD]">Google Maps</span>
                    </div>

                    <a
                      href={ev.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-[#8E3F58] hover:bg-[#C65E7E] text-white text-[11px] font-semibold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Nous retrouver ici</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Action principale en bas du programme : la réponse */}
            <div className="pt-6 border-t border-[#F6DCE4]">
              <GuestCtas guest={currentGuest} onRsvp={() => setActiveTab('rsvp')} onTicket={() => setActiveTab('billet')} onRepresentative={() => setIsRepModalOpen(true)} />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 03: NOTRE HISTOIRE                                         */}
        {/* ============================================================== */}
        {activeTab === 'story' && (
          <div className="space-y-10">
            {/* Banner with dark atmosphere */}
            <div className="bg-[#7A334A] text-white py-14 px-4 text-center">
              <div className="max-w-2xl mx-auto space-y-3">
                <h2 className="font-serif text-3xl sm:text-5xl font-bold text-amber-50">
                  {config.storyTitle}
                </h2>
                <p className="text-xs sm:text-sm text-[#D7CBC0] leading-relaxed max-w-xl mx-auto">
                  {config.storyText}
                </p>
                <p className="font-serif text-lg italic text-amber-200 pt-2">
                  {config.coupleNames}
                </p>
              </div>
            </div>

            {/* Album : affiché seulement si le responsable a ajouté des photos */}
            <div className={`max-w-4xl mx-auto px-4 space-y-8 ${config.storyPhotos && config.storyPhotos.length > 0 ? '' : 'hidden'}`}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C65E7E] block">
                  Notre Album
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A2F38] mt-1">
                  Quelques instants <span className="italic font-normal text-[#B04C6B]">de nous.</span>
                </h3>
              </div>

              {/* Photos showcase */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(config.storyPhotos || []).map((photo) => (
                  <div key={photo.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#F6DCE4] space-y-3">
                    <div className="aspect-4/3 rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-serif text-lg font-bold text-[#4A2F38]">{photo.title}</h4>
                      <p className="text-xs text-[#8C7480] mt-0.5 leading-relaxed">
                        {photo.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 04: CADEAUX & LISTE DE MARIAGE                             */}
        {/* ============================================================== */}
        {activeTab === 'gifts' && (
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-[#B04C6B]">
                <Heart className="w-6 h-6 fill-[#B04C6B]" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-[#4A2F38]">
                Liste de Mariage & Présents
              </h2>
              <p className="text-xs sm:text-sm text-[#5C4F44] leading-relaxed">
                Votre présence est le plus précieux des cadeaux. Si vous souhaitez nous gâter pour notre installation ou participer à notre voyage de noces, voici les options préparées avec amour.
              </p>
            </div>

            {/* Sub-tabs selector: Physical Gifts vs Monetary Gifts */}
            <div className="flex items-center justify-center">
              <div className="inline-flex p-1.5 bg-[#EFE6DC] rounded-2xl shadow-inner gap-1">
                <button
                  type="button"
                  onClick={() => setGiftSubTab('physical')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                    giftSubTab === 'physical'
                      ? 'bg-white text-[#4A2F38] shadow-sm'
                      : 'text-[#7C6470] hover:text-[#4A2F38]'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-[#B04C6B]" />
                  <span>Cadeaux Physiques d'Installation</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-[#B04C6B] font-mono">
                    {config.physicalGifts?.length || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setGiftSubTab('monetary')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                    giftSubTab === 'monetary'
                      ? 'bg-white text-[#4A2F38] shadow-sm'
                      : 'text-[#7C6470] hover:text-[#4A2F38]'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#B04C6B]" />
                  <span>Cagnottes & Mobile Money</span>
                </button>
              </div>
            </div>

            {/* Sub-tab 1: Physical Gifts Registry */}
            {giftSubTab === 'physical' && (
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 border border-[#F6DCE4] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7C6470]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#B04C6B]" />
                    <span>
                      Choisissez un article, indiquez la quantité que vous offrez, et laissez un mot doux aux mariés.
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-[#B04C6B] bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Mise à jour en temps réel
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(config.physicalGifts || []).map((gift) => {
                    const reserved = gift.reservedQuantity || 0;
                    const desired = gift.desiredQuantity || 1;
                    const isFullyReserved = reserved >= desired;
                    const progressPercent = Math.min(100, Math.round((reserved / desired) * 100));

                    return (
                      <div
                        key={gift.id}
                        className={`bg-white rounded-3xl p-5 border shadow-sm flex flex-col justify-between transition hover:shadow-md ${
                          isFullyReserved
                            ? 'border-emerald-200/80 bg-emerald-50/20'
                            : 'border-[#F6DCE4] hover:border-[#B04C6B]/40'
                        }`}
                      >
                        <div className="space-y-3.5">
                          {/* Image preview with recommended 500x500 presentation */}
                          <div className="aspect-square w-full rounded-2xl overflow-hidden bg-stone-100 relative border border-slate-100">
                            {gift.imageUrl ? (
                              <img
                                src={gift.imageUrl}
                                alt={gift.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                                <ShoppingBag className="w-10 h-10 mb-1 opacity-40" />
                                <span className="text-[11px]">Photo de l'article</span>
                              </div>
                            )}

                            <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-xs text-[#B04C6B] shadow-xs">
                              {gift.category || 'Maison'}
                            </span>

                            {isFullyReserved && (
                              <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[1px] flex items-center justify-center p-3 text-center">
                                <div className="bg-white text-emerald-800 px-3 py-1.5 rounded-full font-bold text-xs shadow-lg flex items-center gap-1.5">
                                  <Check className="w-4 h-4 text-emerald-600" />
                                  <span>Totalement offert !</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div>
                            <h3 className="font-serif text-lg font-bold text-[#4A2F38] leading-snug">
                              {gift.name}
                            </h3>
                            {gift.description && (
                              <p className="text-xs text-[#8C7480] mt-1 line-clamp-2">
                                {gift.description}
                              </p>
                            )}
                          </div>

                          {/* Quantities & progress bar */}
                          <div className="space-y-1.5 pt-1 border-t border-slate-100">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-[#7C6470] font-medium">Offert :</span>
                              <span className="font-bold text-[#4A2F38]">
                                {reserved} / {desired} {desired > 1 ? 'unités' : 'unité'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                style={{ width: `${progressPercent}%` }}
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isFullyReserved ? 'bg-emerald-500' : 'bg-[#C65E7E]'
                                }`}
                              />
                            </div>
                          </div>

                          {/* Brand, Color, Where to find */}
                          <div className="bg-[#FFF7F9] rounded-xl p-3 text-[11px] space-y-1 text-[#5C4F44]">
                            {gift.brandReference && (
                              <div>
                                <span className="font-semibold text-[#4A2F38]">Réf / Modèle : </span>
                                <span>{gift.brandReference}</span>
                              </div>
                            )}
                            {gift.colorOrFinish && (
                              <div>
                                <span className="font-semibold text-[#4A2F38]">Couleur / Finition : </span>
                                <span>{gift.colorOrFinish}</span>
                              </div>
                            )}
                            {gift.whereToFind && (
                              <div>
                                <span className="font-semibold text-[#4A2F38]">Où trouver : </span>
                                <span>{gift.whereToFind}</span>
                              </div>
                            )}
                            {gift.estimatedPrice && (
                              <div>
                                <span className="font-semibold text-[#4A2F38]">Prix estimé : </span>
                                <span className="text-[#C65E7E] font-bold">{gift.estimatedPrice}</span>
                              </div>
                            )}
                          </div>

                          {/* Store link if available */}
                          {gift.externalUrl && (
                            <a
                              href={gift.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-[#C65E7E] hover:underline flex items-center gap-1"
                            >
                              <span>Voir l'article en magasin / en ligne</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

                          {/* Existing pledges list */}
                          {gift.pledges && gift.pledges.length > 0 && (
                            <div className="pt-2 border-t border-slate-100">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-[#B8A3AD] mb-1.5">
                                Déjà offert avec amour par :
                              </div>
                              <div className="space-y-1">
                                {gift.pledges.map((p) => (
                                  <div
                                    key={p.id}
                                    className="text-[11px] bg-amber-50/70 border border-amber-100/80 rounded-lg p-2 text-[#5E4450]"
                                  >
                                    <div className="font-semibold flex justify-between">
                                      <span>{p.guestName}</span>
                                      <span className="text-[#B04C6B] font-bold">+{p.quantity}</span>
                                    </div>
                                    {p.message && (
                                      <p className="text-[10px] italic text-[#8C7480] mt-0.5">
                                        « {p.message} »
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* CTA button */}
                        <div className="pt-4 mt-2">
                          {isFullyReserved ? (
                            <div className="w-full py-2.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-1.5">
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span>Merci pour ce cadeau !</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPhysicalGift(gift);
                                setPledgeQuantity(1);
                                setPledgeMessage('');
                              }}
                              className="w-full py-2.5 bg-[#C65E7E] hover:bg-[#A94566] text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:shadow"
                            >
                              <Gift className="w-4 h-4" />
                              <span>Offrir ce cadeau aux mariés</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-tab 2: Monetary & Mobile Money Gifts */}
            {giftSubTab === 'monetary' && (
              <div className="space-y-6">
                <div className="text-center max-w-lg mx-auto text-xs text-[#7C6470]">
                  Vous pouvez effectuer un transfert instantané par Mobile Money (Orange Money, MTN MoMo) ou par virement bancaire sécurisé.
                </div>

                {/* Gift Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {config.giftOptions.map((opt, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-3xl p-6 border border-[#F6DCE4] shadow-sm flex flex-col justify-between space-y-5 text-center hover:border-[#B04C6B]/40 transition"
                    >
                      <div className="space-y-3">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-[#B04C6B]">
                          {opt.badgeText}
                        </span>

                        <h4 className="font-serif text-base font-bold text-[#4A2F38]">
                          Votre attention nous honore
                        </h4>

                        <div className="text-xs font-medium text-[#8C7480]">
                          {opt.beneficiaryName}
                        </div>

                        <div className="font-mono text-sm font-bold text-[#4A2F38] bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-200 truncate">
                          {opt.numberOrLink}
                        </div>

                        <p className="text-[11px] text-[#B8A3AD] leading-relaxed">
                          {opt.note}
                        </p>
                      </div>

                      {opt.type === 'orange_money' ? (
                        <button
                          onClick={() => copyToClipboard(opt.numberOrLink, `gift-${i}`)}
                          className="w-full py-2.5 bg-[#8E3F58] hover:bg-[#C65E7E] text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {copiedNumber === `gift-${i}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Numéro copié !</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copier le numéro</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <a
                          href={opt.numberOrLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 bg-[#8E3F58] hover:bg-[#C65E7E] text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Contribuer en ligne</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 05: INFOS & DRESS CODE & CONTACTS                          */}
        {/* ============================================================== */}
        {activeTab === 'infos' && (
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C65E7E] block">
                05 · Les petits détails
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A2F38]">
                Prêts pour la fête.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Bride Portrait */}
              <div className="md:col-span-5 bg-white rounded-3xl p-3 shadow-sm border border-[#F6DCE4]">
                <div className="aspect-3/4 rounded-2xl overflow-hidden bg-slate-100">
                  <img
                    src={config.brideImageUrl || undefined}
                    alt={config.coupleNames}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Dress Code & Contacts */}
              <div className="md:col-span-7 space-y-6">
                {/* Dress code palette */}
                <div className="bg-white rounded-2xl p-6 border border-[#F6DCE4] shadow-xs space-y-3">
                  <h4 className="font-serif text-lg font-bold text-[#4A2F38]">Dress Code d'Honneur</h4>
                  <p className="text-xs text-[#8C7480]">
                    Harmonie de teintes douces et solaires recommandées pour sublimer les photos souvenirs.
                  </p>
                  <div className="flex gap-4 pt-2">
                    {config.dressCodeColors.map((c, i) => (
                      <div key={i} className="text-center">
                        <div
                          style={{ backgroundColor: c.hex }}
                          className="w-12 h-14 rounded-t-full rounded-b-md shadow-inner border border-black/10 mx-auto"
                        />
                        <span className="text-[10px] text-[#5C4F44] block mt-1">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Useful Contacts */}
                <div className="bg-white rounded-2xl p-6 border border-[#F6DCE4] shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#B04C6B]" />
                    <h4 className="font-serif text-lg font-bold text-[#4A2F38]">Contacts Utiles</h4>
                  </div>

                  <div className="space-y-3 divide-y divide-slate-100 text-xs">
                    {config.usefulContacts.map((ct, idx) => (
                      <div key={idx} className="pt-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#4A2F38]">{ct.role} : </span>
                          <span className="text-[#5C4F44]">{ct.name}</span>
                          <span className="block text-[#9A8490] font-mono text-[11px]">{ct.phone}</span>
                        </div>
                        <a
                          href={`tel:${ct.phone.replace(/\s+/g, '')}`}
                          className="px-3 py-1.5 bg-[#FFF7F9] hover:bg-[#EAE2D7] border border-[#EBC3CF] rounded-lg text-[#4A2F38] font-medium text-xs flex items-center gap-1 transition"
                        >
                          <Phone className="w-3 h-3 text-[#C65E7E]" />
                          <span>Appeler</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW: VOTRE BILLET - QR PASS JOUR J                            */}
        {/* ============================================================== */}
        {activeTab === 'billet' && <TicketPanel config={config} guest={currentGuest} displayName={guestDisplayName} onRsvp={() => setActiveTab('rsvp')} />}

        {/* VOTRE RÉPONSE (RSVP) : un formulaire, une réponse par personne */}
        {activeTab === 'rsvp' && (
          <RsvpPanel guest={currentGuest} config={config} onViewTicket={() => setActiveTab('billet')} onProposeRepresentative={() => setIsRepModalOpen(true)} />
        )}
      </main>

      {/* Proposer un représentant Modal */}
      {isRepModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-xl font-bold text-[#4A2F38]">
                Proposer un Représentant
              </h3>
              <button
                onClick={() => setIsRepModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8C7480]">
              Si vous ne pouvez pas assister au mariage, vous pouvez désigner un proche pour vous représenter. Les mariés valideront cette demande.
            </p>

            <form onSubmit={handleProposeRepSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Nom et Prénom du représentant *</label>
                <input
                  type="text"
                  required
                  value={repName}
                  onChange={(e) => setRepName(e.target.value)}
                  placeholder="ex: Paul MBA (Frère)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C65E7E]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Téléphone / Contact</label>
                <input
                  type="text"
                  value={repContact}
                  onChange={(e) => setRepContact(e.target.value)}
                  placeholder="Votre numéro de téléphone"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Motif de l'absence</label>
                <textarea
                  rows={2}
                  value={repReason}
                  onChange={(e) => setRepReason(e.target.value)}
                  placeholder="ex: Déplacement professionnel à l'étranger..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRepModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C65E7E] hover:bg-[#A94566] text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Soumettre aux mariés
                </button>
              </div>

              {repSubmitted && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold text-center">
                  Demande transmise avec succès !
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: OFFRIR UN CADEAU PHYSIQUE                              */}
      {/* ============================================================== */}
      {selectedPhysicalGift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#B04C6B]" />
                <h3 className="font-serif text-xl font-bold text-[#4A2F38]">
                  Offrir ce cadeau
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhysicalGift(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected item summary */}
            <div className="flex items-center gap-4 bg-[#FFF7F9] p-3 rounded-2xl border border-[#EFE6DC]">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-200">
                {selectedPhysicalGift.imageUrl ? (
                  <img
                    src={selectedPhysicalGift.imageUrl}
                    alt={selectedPhysicalGift.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="text-xs">
                <h4 className="font-serif font-bold text-sm text-[#4A2F38]">
                  {selectedPhysicalGift.name}
                </h4>
                {selectedPhysicalGift.brandReference && (
                  <p className="text-[#7C6470] text-[11px]">
                    Réf : {selectedPhysicalGift.brandReference}
                  </p>
                )}
                <p className="text-[#B04C6B] font-bold text-[11px] mt-0.5">
                  Restant à offrir : {Math.max(1, selectedPhysicalGift.desiredQuantity - (selectedPhysicalGift.reservedQuantity || 0))} unité(s)
                </p>
              </div>
            </div>

            <form onSubmit={handlePledgeSubmit} className="space-y-3.5 text-xs">
              {/* Quantity Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Combien d'unités souhaitez-vous offrir ? *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, selectedPhysicalGift.desiredQuantity - (selectedPhysicalGift.reservedQuantity || 0))}
                    value={pledgeQuantity}
                    onChange={(e) => setPledgeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-base focus:outline-none focus:ring-1 focus:ring-[#C65E7E]"
                  />
                  <span className="text-[#8C7480] text-[11px]">
                    sur {selectedPhysicalGift.desiredQuantity} souhaité(s) par les mariés
                  </span>
                </div>
              </div>

              {/* Donor Name */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Votre nom ou signature *
                </label>
                <input
                  type="text"
                  required
                  value={pledgeDonorName}
                  onChange={(e) => setPledgeDonorName(e.target.value)}
                  placeholder="ex : Prénom Nom"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C65E7E]"
                />
              </div>

              {/* Contact phone/email */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Téléphone / WhatsApp pour coordination (facultatif)
                </label>
                <input
                  type="text"
                  value={pledgeContact}
                  onChange={(e) => setPledgeContact(e.target.value)}
                  placeholder="ex : numéro ou e-mail"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              {/* Message to the couple */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Un mot doux pour les mariés (facultatif)
                </label>
                <textarea
                  rows={3}
                  value={pledgeMessage}
                  onChange={(e) => setPledgeMessage(e.target.value)}
                  placeholder="ex: Félicitations aux mariés ! De quoi concocter de succulents repas d'amour..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPhysicalGift(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPledging}
                  className="px-5 py-2.5 bg-[#C65E7E] hover:bg-[#A94566] text-white font-semibold rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Gift className="w-4 h-4" />
                  <span>{isPledging ? 'Enregistrement...' : 'Confirmer mon cadeau'}</span>
                </button>
              </div>

              {pledgeSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Merci infiniment ! Votre cadeau a été réservé et transmis aux mariés.</span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: TOUTES LES ANNONCES & MISES À JOUR                      */}
      {/* ============================================================== */}
      {isAnnouncementsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-[#C65E7E]">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#4A2F38]">
                    Mises à Jour & Annonces
                  </h3>
                  <p className="text-[11px] text-[#8C7480]">
                    Informations officielles communiquées par les mariés
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAnnouncementsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {announcements && announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-2xl border border-[#F6DCE4] bg-[#FFF7F9] space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-serif font-bold text-base text-[#4A2F38]">
                        {ann.title}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ann.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : ann.priority === 'important'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {ann.priority}
                      </span>
                    </div>
                    <p className="text-xs text-[#5C4F44] leading-relaxed whitespace-pre-wrap">
                      {ann.message}
                    </p>
                    <div className="text-[10px] text-[#B8A3AD] flex items-center gap-1 pt-1">
                      <Clock className="w-3 h-3" />
                      <span>Publiée le {new Date(ann.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-2 bg-slate-50 rounded-2xl">
                <Bell className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">
                  Aucune annonce particulière pour le moment.
                </p>
                <p className="text-[11px] text-slate-400">
                  Tout se déroule parfaitement selon le programme !
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAnnouncementsModalOpen(false)}
                className="px-5 py-2 bg-[#8E3F58] text-white text-xs font-semibold rounded-xl hover:bg-[#C65E7E] transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: MESSAGERIE LOGISTIQUE & COVOITURAGE                     */}
      <ChatSheet
        open={isChatModalOpen} onClose={() => setIsChatModalOpen(false)} messages={messages}
        currentUserName={`${currentGuest.firstName} ${currentGuest.lastName}`.trim() || currentGuest.greetingTitle || 'Invité'}
        currentUserRole="guest" canSeeWitnesses={/t[ée]moin/i.test(currentGuest.category || '')}
        onSendMessage={onSendMessage || (async () => ({} as ChatMessage))}
      />

    </div>
  );
};
