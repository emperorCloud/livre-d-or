'use client';
import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  QrCode,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Utensils,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Eye,
  FileSpreadsheet,
  Link,
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageCircle,
  Send,
  HelpCircle
} from 'lucide-react';
import type { Guest, WeddingConfig, RsvpStatus, DietaryOption } from '@/lib/wedding/types';
import { checkInGuest, undoCheckIn, removeGuest, updateGuest, addGuest } from '@/lib/wedding/api';

interface DashboardProps {
  config: WeddingConfig;
  guests: Guest[];
  onOpenGuestPass: (guest: Guest) => void;
  onOpenExportModal: () => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  config,
  guests,
  onOpenGuestPass,
  onOpenExportModal,
  isAddModalOpen,
  setIsAddModalOpen
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'declined' | 'checked_in' | 'not_checked_in'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // Quick link helper states
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedDemoGuestId, setSelectedDemoGuestId] = useState<string>(guests[0]?.id || '');

  // New guest state for modal
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newGreeting, setNewGreeting] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTable, setNewTable] = useState('Table d\'Honneur');
  const [newCategory, setNewCategory] = useState<string>('Amis');
  const [newPlusOne, setNewPlusOne] = useState(true);

  // Generate guest link
  const getGuestLink = (guest: Guest) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/inv/${guest.inviteToken ?? ''}#billet`;
  };

  const getGuestWhatsAppUrl = (guest: Guest) => {
    const link = getGuestLink(guest);
    const guestName = guest.greetingTitle || `${guest.firstName} ${guest.lastName}`;
    const text = encodeURIComponent(
      `Bonjour ${guestName} !\n\n${config.coupleNames} ont l'immense joie de vous inviter à leur mariage le ${new Date(config.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à ${config.venueCity}.\n\nAccédez à votre invitation personnalisée, découvrez le programme, l'ambiance musicale et retrouvez votre billet d'accès sécurisé (QR code) ici :\n👉 ${link}\n\nMerci de confirmer votre présence via ce lien !`
    );
    const phoneClean = guest.phone ? guest.phone.replace(/[^0-9]/g, '') : '';
    return phoneClean ? `https://wa.me/${phoneClean}?text=${text}` : `https://wa.me/?text=${text}`;
  };

  const handleCopyLink = (guest: Guest) => {
    const link = getGuestLink(guest);
    navigator.clipboard.writeText(link);
    setCopiedToken(guest.qrCodeToken);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleCopyAllLinks = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = guests
      .map((g) => `${g.greetingTitle || `${g.firstName} ${g.lastName}`} (${g.tableNumber}) : ${origin}/inv/${g.inviteToken ?? ''}#billet`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  // Computed metrics
  const stats = useMemo(() => {
    let totalInvited = 0;
    let totalConfirmedAdults = 0;
    let totalConfirmedKids = 0;
    let totalDeclined = 0;
    let totalPending = 0;
    let totalCheckedIn = 0;

    const dietaryCounts: Record<DietaryOption, number> = {
      classic: 0,
      vegetarian: 0,
      halal: 0,
      kosher: 0,
      gluten_free: 0,
      other: 0
    };

    const tableCounts: Record<string, { total: number; checkedIn: number }> = {};
    const allergyList: Array<{ name: string; allergy: string; table: string }> = [];

    guests.forEach((g) => {
      totalInvited += 1 + (g.plusOneAllowed ? 1 : 0) + g.childrenCount;

      if (g.isCheckedIn) {
        totalCheckedIn += 1;
      }

      if (g.rsvpStatus === 'confirmed') {
        totalConfirmedAdults += 1 + (g.plusOneConfirmed ? 1 : 0);
        totalConfirmedKids += g.childrenCount;
        dietaryCounts[g.dietaryPreference] = (dietaryCounts[g.dietaryPreference] || 0) + 1;
        if (g.allergies?.trim()) {
          allergyList.push({
            name: `${g.firstName} ${g.lastName}`,
            allergy: g.allergies,
            table: g.tableNumber
          });
        }
      } else if (g.rsvpStatus === 'declined') {
        totalDeclined += 1;
      } else {
        totalPending += 1;
      }

      const tableName = g.tableNumber || 'Non assignée';
      if (!tableCounts[tableName]) {
        tableCounts[tableName] = { total: 0, checkedIn: 0 };
      }
      tableCounts[tableName].total += 1;
      if (g.isCheckedIn) {
        tableCounts[tableName].checkedIn += 1;
      }
    });

    const totalConfirmedOverall = totalConfirmedAdults + totalConfirmedKids;
    const confirmationRate = guests.length > 0
      ? Math.round((guests.filter(g => g.rsvpStatus === 'confirmed').length / guests.length) * 100)
      : 0;

    const checkInRate = totalConfirmedAdults > 0
      ? Math.round((totalCheckedIn / totalConfirmedAdults) * 100)
      : 0;

    return {
      totalGuests: guests.length,
      totalInvited,
      totalConfirmedOverall,
      totalConfirmedAdults,
      totalConfirmedKids,
      totalDeclined,
      totalPending,
      totalCheckedIn,
      confirmationRate,
      checkInRate,
      dietaryCounts,
      tableCounts,
      allergyList
    };
  }, [guests]);

  // Filtered guest list
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchSearch =
        `${g.firstName} ${g.lastName} ${g.greetingTitle || ''} ${g.tableNumber} ${g.email || ''} ${g.qrCodeToken}`
          .toLowerCase()
          .includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (categoryFilter !== 'all' && g.category !== categoryFilter) {
        return false;
      }

      if (statusFilter === 'confirmed' && g.rsvpStatus !== 'confirmed') return false;
      if (statusFilter === 'pending' && g.rsvpStatus !== 'pending') return false;
      if (statusFilter === 'declined' && g.rsvpStatus !== 'declined') return false;
      if (statusFilter === 'checked_in' && !g.isCheckedIn) return false;
      if (statusFilter === 'not_checked_in' && g.isCheckedIn) return false;

      return true;
    });
  }, [guests, search, statusFilter, categoryFilter]);

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim()) return;

    try {
      await addGuest({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        greetingTitle: newGreeting.trim() || `M. et Mme ${newLastName.trim()} ${newFirstName.trim()}`,
        email: newEmail.trim(),
        phone: newPhone.trim(),
        tableNumber: newTable,
        category: newCategory,
        plusOneAllowed: newPlusOne
      });

      setNewFirstName('');
      setNewLastName('');
      setNewGreeting('');
      setNewEmail('');
      setNewPhone('');
      setNewPlusOne(true);
      setIsAddModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEditGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest) return;
    try {
      await updateGuest(editingGuest.id, editingGuest);
      setEditingGuest(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGuest = async (guest: Guest) => {
    if (confirm(`Supprimer définitivement l'invitation de ${guest.firstName} ${guest.lastName} ?`)) {
      try {
        await removeGuest(guest.id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleCheckIn = async (guest: Guest) => {
    try {
      if (guest.isCheckedIn) {
        await undoCheckIn(guest.id);
      } else {
        await checkInGuest({ guestId: guest.id, checkedInBy: 'Tableau de bord' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const demoGuest = guests.find((g) => g.id === selectedDemoGuestId) || guests[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* ============================================================== */}
      {/* SECTION EXCLUSIVE : OÙ SONT GÉNÉRÉS LES LIENS D'INVITATION ?   */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-r from-[#1B382B] via-[#234A38] to-[#1E3A2F] text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-emerald-700/50 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-400/30">
              <Link className="w-3.5 h-3.5" />
              <span>Générateur de Liens Invités Sécurisés</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-amber-50">
              Où sont générés les liens pour valider les invitations ?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-3xl leading-relaxed">
              Chaque convive possède un **lien unique et personnalisé**. En cliquant dessus, l'invité accède directement à l'invitation avec la musique d'ambiance, peut confirmer son RSVP et télécharger son billet avec son QR code d'accès, **sans aucun mot de passe requis**.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyAllLinks}
              className="px-4 py-2.5 bg-white text-[#1B382B] hover:bg-emerald-50 font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedAll ? 'Tous les liens copiés !' : 'Copier tous les liens (Groupe)'}</span>
            </button>

            <button
              onClick={onOpenExportModal}
              className="px-4 py-2.5 bg-emerald-800/80 hover:bg-emerald-800 text-white font-medium text-xs rounded-xl border border-emerald-600/50 transition flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exporter en CSV / Excel</span>
            </button>
          </div>
        </div>

        {/* Interactive Link Tester & Share preview */}
        {demoGuest && (
          <div className="bg-black/25 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-300 font-medium">Sélectionner un invité pour générer son lien :</span>
                <select
                  value={selectedDemoGuestId}
                  onChange={(e) => setSelectedDemoGuestId(e.target.value)}
                  className="bg-emerald-950 text-white border border-emerald-700/80 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                >
                  {guests.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.greetingTitle || `${g.firstName} ${g.lastName}`} ({g.tableNumber})
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-emerald-200/80 font-mono text-[11px]">
                Token : {demoGuest.qrCodeToken}
              </span>
            </div>

            {/* URL Display Bar */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="flex-1 bg-white/10 rounded-xl px-3.5 py-2 font-mono text-xs text-amber-200 truncate border border-white/10">
                {getGuestLink(demoGuest)}
              </div>

              <button
                onClick={() => handleCopyLink(demoGuest)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#1B382B] font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                {copiedToken === demoGuest.qrCodeToken ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Lien copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copier le lien</span>
                  </>
                )}
              </button>

              <a
                href={getGuestWhatsAppUrl(demoGuest)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                title="Envoyer l'invitation sur WhatsApp avec message pré-rédigé"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Envoyer WhatsApp</span>
              </a>

              <button
                onClick={() => onOpenGuestPass(demoGuest)}
                className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Visualiser la page d'invitation telle que l'invité la verra"
              >
                <Eye className="w-4 h-4" />
                <span>Tester la vue invité</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top Welcome & KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Total Invités */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Invités</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.totalGuests}</span>
            <span className="text-xs text-slate-500">foyers</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ~{stats.totalInvited} convives attendus
          </div>
        </div>

        {/* Confirmés (RSVP Oui) */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Confirmés (RSVP)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{stats.totalConfirmedOverall}</span>
            <span className="text-xs text-emerald-600">({stats.confirmationRate}%)</span>
          </div>
          <div className="text-[11px] text-emerald-800/80 mt-1">
            {stats.totalConfirmedAdults} adultes · {stats.totalConfirmedKids} enfant(s)
          </div>
        </div>

        {/* En attente */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-900">En attente</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">{stats.totalPending}</span>
            <span className="text-xs text-amber-600">réponses</span>
          </div>
          <div className="text-[11px] text-amber-800/70 mt-1">
            Relance recommandée
          </div>
        </div>

        {/* Déclinés */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Ne viendront pas</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-700">{stats.totalDeclined}</span>
            <span className="text-xs text-slate-400">absents</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Places libérées
          </div>
        </div>

        {/* Émargés Jour J */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white p-4 rounded-2xl shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-200">Émargés Jour J</span>
            <QrCode className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{stats.totalCheckedIn}</span>
            <span className="text-xs text-emerald-200">/ {stats.totalConfirmedAdults}</span>
          </div>
          <div className="text-[11px] text-emerald-200/80 mt-1 flex items-center justify-between">
            <span>Taux d'arrivée</span>
            <span className="font-bold">{stats.checkInRate}%</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Dietary / Catering & Tables allocation */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Dietary breakdown for caterer */}
        <div className="md:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-700" />
              <span>Régimes Alimentaires (Pour le Traiteur)</span>
            </h3>
            <span className="text-xs text-slate-500">{stats.totalConfirmedOverall} repas confirmés</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500 text-[10px] block uppercase font-medium">Classique</span>
              <span className="text-base font-bold text-slate-800">{stats.dietaryCounts.classic}</span>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 text-[10px] block uppercase font-medium">Végétarien</span>
              <span className="text-base font-bold text-emerald-800">{stats.dietaryCounts.vegetarian}</span>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
              <span className="text-amber-800 text-[10px] block uppercase font-medium">Sans Gluten</span>
              <span className="text-base font-bold text-amber-900">{stats.dietaryCounts.gluten_free}</span>
            </div>
            <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-100">
              <span className="text-teal-800 text-[10px] block uppercase font-medium">Halal</span>
              <span className="text-base font-bold text-teal-900">{stats.dietaryCounts.halal}</span>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
              <span className="text-blue-800 text-[10px] block uppercase font-medium">Casher</span>
              <span className="text-base font-bold text-blue-900">{stats.dietaryCounts.kosher}</span>
            </div>
            <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100">
              <span className="text-purple-800 text-[10px] block uppercase font-medium">Autre</span>
              <span className="text-base font-bold text-purple-900">{stats.dietaryCounts.other}</span>
            </div>
          </div>

          {stats.allergyList.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-rose-800 flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Allergies signalées ({stats.allergyList.length}) :</span>
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {stats.allergyList.map((a, i) => (
                  <div key={i} className="text-[11px] bg-rose-50 text-rose-900 p-1.5 rounded-lg flex items-center justify-between">
                    <span className="font-semibold">{a.name} ({a.table})</span>
                    <span>{a.allergy}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Table plan allocation */}
        <div className="md:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-700" />
              <span>Répartition des Tables & Placement</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {Object.keys(stats.tableCounts).length} tables
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs max-h-44 overflow-y-auto pr-1">
            {Object.entries(stats.tableCounts).map(([tableName, data]) => (
              <div
                key={tableName}
                className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/70 transition"
              >
                <div className="font-medium text-slate-800 truncate" title={tableName}>
                  {tableName}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>{data.total} convive(s)</span>
                  <span className="text-emerald-700 font-medium">
                    {data.checkedIn} arrivés
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Guests List Table with Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl font-bold text-slate-900">
                Liste des Invités & Liens Personnalisés
              </h3>
              <p className="text-xs text-slate-500">
                Chaque invité dispose d'un lien d'accès direct, d'un QR code unique et de son statut en temps réel.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenExportModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV / PDF</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un invité</span>
              </button>
            </div>
          </div>

          {/* Search bar & Category filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, prénom, table, code..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
              >
                <option value="all">Toutes catégories</option>
                <option value="Témoins">Témoins</option>
                <option value="Famille">Famille</option>
                <option value="Amis">Amis</option>
                <option value="Collègues">Collègues</option>
                <option value="Honneur">Honneur</option>
              </select>
            </div>
          </div>

          {/* Segmented status filter buttons */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white font-medium shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              Tous ({guests.length})
            </button>

            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                statusFilter === 'confirmed'
                  ? 'bg-emerald-600 text-white font-medium shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              Confirmés ({guests.filter((g) => g.rsvpStatus === 'confirmed').length})
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white font-medium shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              En attente ({guests.filter((g) => g.rsvpStatus === 'pending').length})
            </button>

            <button
              onClick={() => setStatusFilter('declined')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                statusFilter === 'declined'
                  ? 'bg-rose-600 text-white font-medium shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              Déclinés ({guests.filter((g) => g.rsvpStatus === 'declined').length})
            </button>

            <button
              onClick={() => setStatusFilter('checked_in')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                statusFilter === 'checked_in'
                  ? 'bg-teal-700 text-white font-medium shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              Émargés Jour J ({guests.filter((g) => g.isCheckedIn).length})
            </button>

            <button
              onClick={() => setStatusFilter('not_checked_in')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                statusFilter === 'not_checked_in'
                  ? 'bg-slate-700 text-white font-medium shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              Non Émargés ({guests.filter((g) => !g.isCheckedIn && g.rsvpStatus === 'confirmed').length})
            </button>
          </div>
        </div>

        {/* Guests Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100 font-medium">
                <th className="py-3 px-4">Invité</th>
                <th className="py-3 px-4">Lien d'Invitation Personnel</th>
                <th className="py-3 px-4">Table</th>
                <th className="py-3 px-4">RSVP & Accompagnants</th>
                <th className="py-3 px-4">Menu & Régime</th>
                <th className="py-3 px-4 text-center">Émargement Jour J</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun invité ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => {
                  return (
                    <tr
                      key={guest.id}
                      className={`hover:bg-slate-50/80 transition ${
                        guest.isCheckedIn ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      {/* Name & Contact */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{guest.greetingTitle || `${guest.firstName} ${guest.lastName}`}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="text-amber-800 font-medium">{guest.category}</span>
                          {guest.phone && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{guest.phone}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* LIEN D'INVITATION PERSONNEL & PARTAGE */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyLink(guest)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium rounded-lg border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                            title="Copier le lien unique de cet invité"
                          >
                            {copiedToken === guest.qrCodeToken ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[11px] font-bold">Copié !</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Copier lien</span>
                              </>
                            )}
                          </button>

                          <a
                            href={getGuestWhatsAppUrl(guest)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/30 text-[#128C7E] rounded-lg transition"
                            title="Partager par WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => onOpenGuestPass(guest)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Ouvrir l'Espace Invité"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Table */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{guest.tableNumber}</span>
                      </td>

                      {/* RSVP Status & +1 */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {guest.rsvpStatus === 'confirmed' && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Présent
                            </span>
                          )}
                          {guest.rsvpStatus === 'pending' && (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              En attente
                            </span>
                          )}
                          {guest.rsvpStatus === 'declined' && (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                              Absent
                            </span>
                          )}
                        </div>

                        {(guest.plusOneConfirmed || guest.childrenCount > 0) && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {guest.plusOneConfirmed && (
                              <span>+1 ({guest.plusOneName || 'accompagnant'}) </span>
                            )}
                            {guest.childrenCount > 0 && (
                              <span>· {guest.childrenCount} enfant(s)</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Dietary */}
                      <td className="py-3 px-4">
                        <div className="capitalize text-slate-700 font-medium">
                          {guest.dietaryPreference === 'gluten_free' ? 'Sans gluten' : guest.dietaryPreference}
                        </div>
                        {guest.allergies && (
                          <div className="text-[10px] text-rose-700 truncate max-w-[140px]" title={guest.allergies}>
                            ⚠️ {guest.allergies}
                          </div>
                        )}
                      </td>

                      {/* Check-In Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleCheckIn(guest)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            guest.isCheckedIn
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title={guest.isCheckedIn ? 'Cliquer pour annuler l\'émargement' : 'Cliquer pour émarger manuellement'}
                        >
                          {guest.isCheckedIn ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Émargé
                            </span>
                          ) : (
                            'Émarger'
                          )}
                        </button>
                        {guest.isCheckedIn && guest.checkedInAt && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(guest.checkedInAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenGuestPass(guest)}
                            className="p-1.5 text-slate-500 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="Ouvrir le pass invité mobile avec QR code"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setEditingGuest(guest)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Modifier les informations"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteGuest(guest)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Supprimer l'invitation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Guest Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-xl font-bold text-slate-900">
                Ajouter un Nouvel Invité & Générer son Lien
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGuest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Titre d'invitation (Optionnel)</label>
                <input
                  type="text"
                  value={newGreeting}
                  onChange={(e) => setNewGreeting(e.target.value)}
                  placeholder="ex : M. et Mme Nom, Dr Prénom Nom…"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="ex : Prénom"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="ex : Nom de famille"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="adresse@exemple.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Téléphone (WhatsApp)</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Téléphone (pour WhatsApp)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-medium">Table Assignée</label>
                    {config.tablesList && config.tablesList.length > 0 && (
                      <span className="text-[10px] text-amber-700 font-medium">({config.tablesList.length} tables dispo)</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      list="add-tables-list"
                      value={newTable}
                      onChange={(e) => setNewTable(e.target.value)}
                      placeholder="Sélectionnez ou saisissez une table..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <datalist id="add-tables-list">
                      {(config.tablesList || []).map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name} (Capacité: {t.capacity} pers.)
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Amis">Amis</option>
                    <option value="Famille">Famille</option>
                    <option value="Témoins">Témoins</option>
                    <option value="Collègues">Collègues</option>
                    <option value="Honneur">Honneur</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newPlusOne}
                  onChange={(e) => setNewPlusOne(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="text-slate-800 font-medium">
                  Autoriser un accompagnant (+1) sur cette invitation
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Créer l'invitation & le Lien unique
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Guest Modal */}
      {editingGuest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-xl font-bold text-slate-900">
                Modifier : {editingGuest.greetingTitle || `${editingGuest.firstName} ${editingGuest.lastName}`}
              </h3>
              <button
                onClick={() => setEditingGuest(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditGuest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Titre d'invitation affiché</label>
                <input
                  type="text"
                  value={editingGuest.greetingTitle || ''}
                  onChange={(e) => setEditingGuest({ ...editingGuest, greetingTitle: e.target.value })}
                  placeholder="M. et Mme..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Prénom</label>
                  <input
                    type="text"
                    value={editingGuest.firstName}
                    onChange={(e) => setEditingGuest({ ...editingGuest, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Nom</label>
                  <input
                    type="text"
                    value={editingGuest.lastName}
                    onChange={(e) => setEditingGuest({ ...editingGuest, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-medium">Table</label>
                    {config.tablesList && config.tablesList.length > 0 && (
                      <span className="text-[10px] text-amber-700 font-medium">({config.tablesList.length} tables)</span>
                    )}
                  </div>
                  <input
                    type="text"
                    list="edit-tables-list"
                    value={editingGuest.tableNumber}
                    onChange={(e) => setEditingGuest({ ...editingGuest, tableNumber: e.target.value })}
                    placeholder="Sélectionnez ou tapez le nom..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  <datalist id="edit-tables-list">
                    {(config.tablesList || []).map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} (Capacité: {t.capacity} pers.)
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Statut RSVP</label>
                  <select
                    value={editingGuest.rsvpStatus}
                    onChange={(e) => setEditingGuest({ ...editingGuest, rsvpStatus: e.target.value as RsvpStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="confirmed">Confirmé (Présent)</option>
                    <option value="pending">En attente</option>
                    <option value="declined">Décliné (Ne viendra pas)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingGuest(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
