'use client';
import { uploadConfigImage } from '@/lib/client/upload';
import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Save,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  Palette,
  Heart,
  Gift,
  Music,
  Users,
  Phone,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Upload,
  Play,
  Pause,
  Sliders,
  Volume2,
  Eye,
  ShoppingBag
} from 'lucide-react';
import type {
  WeddingConfig,
  TimelineEventItem,
  GiftPaymentOption,
  UsefulContact,
  StoryPhotoItem,
  TableItem,
  DressCodeColor,
  PhysicalGiftItem
} from '@/lib/wedding/types';
import { updateWeddingConfig } from '@/lib/wedding/api';
import { configureMusicSettings } from '@/lib/wedding/weddingMusic';

interface WeddingCustomizerProps {
  config: WeddingConfig;
  onConfigSaved: (newConfig: WeddingConfig) => void;
}

type CustomizerTab =
  | 'identity'
  | 'visuals'
  | 'theme'
  | 'programme'
  | 'dresscode'
  | 'gifts'
  | 'tables'
  | 'story'
  | 'music'
  | 'contacts';

export const WeddingCustomizer: React.FC<WeddingCustomizerProps> = ({
  config,
  onConfigSaved
}) => {
  const [activeTab, setActiveTab] = useState<CustomizerTab>('identity');
  const [giftSubTab, setGiftSubTab] = useState<'physical' | 'monetary'>('physical');
  const [previewAudioPlaying, setPreviewAudioPlaying] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const [formData, setFormData] = useState<WeddingConfig>({
    ...config,
    dressCodeColors: config.dressCodeColors || [],
    timelineEvents: config.timelineEvents || [],
    giftOptions: config.giftOptions || [],
    physicalGifts: config.physicalGifts || [],
    usefulContacts: config.usefulContacts || [],
    storyPhotos: config.storyPhotos || [],
    tablesList: config.tablesList || [],
    guestHeaderBgColor: config.guestHeaderBgColor || '#FDFBF7',
    guestAccentColor: config.guestAccentColor || '#243E36',
    guestHeroOverlayStyle: config.guestHeroOverlayStyle || 'soft',
    responsableThemeColor: config.responsableThemeColor || '#047857',
    loadingScreenTitle: config.loadingScreenTitle || 'NOTRE MARIAGE',
    loadingScreenSubtitle: config.loadingScreenSubtitle || 'Votre invitation se prépare...'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await updateWeddingConfig(formData);
      onConfigSaved(updated);
      configureMusicSettings(updated.musicTrack, updated.customMusicUrl);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Preset available images in workspace for 1-click select
  const presetPhotos: { label: string; url: string }[] = [];

  // Helper functions for array fields
  const addColor = () => {
    const newColor: DressCodeColor = {
      id: 'col-' + Date.now(),
      name: 'Nouvelle Couleur',
      hex: '#B26955'
    };
    setFormData({ ...formData, dressCodeColors: [...formData.dressCodeColors, newColor] });
  };

  const removeColor = (id: string) => {
    setFormData({
      ...formData,
      dressCodeColors: formData.dressCodeColors.filter((c) => c.id !== id)
    });
  };

  const addEvent = () => {
    const orderNum = String(formData.timelineEvents.length + 1).padStart(2, '0');
    const newEv: TimelineEventItem = {
      id: 'ev-' + Date.now(),
      order: orderNum,
      title: 'Nouvelle Célébration',
      dateStr: 'samedi 19 décembre',
      time: '14:00',
      locationName: 'Lieu de la réception',
      locationDetails: 'Entrée principale',
      city: formData.venueCity || '',
      mapsUrl: formData.mapsUrl || 'https://maps.google.com'
    };
    setFormData({ ...formData, timelineEvents: [...formData.timelineEvents, newEv] });
  };

  const removeEvent = (id: string) => {
    setFormData({
      ...formData,
      timelineEvents: formData.timelineEvents.filter((e) => e.id !== id)
    });
  };

  const addGiftOption = () => {
    const newGift: GiftPaymentOption = {
      id: 'gift-' + Date.now(),
      type: 'orange_money',
      beneficiaryName: formData.coupleNames,
      numberOrLink: '',
      badgeText: 'Cagnotte Mariage',
      note: 'Vérifiez le destinataire avant de valider votre contribution.',
      suggestedAmount: 'Libre'
    };
    setFormData({ ...formData, giftOptions: [...formData.giftOptions, newGift] });
  };

  const removeGiftOption = (id: string) => {
    setFormData({
      ...formData,
      giftOptions: formData.giftOptions.filter((g) => g.id !== id)
    });
  };

  const addPhysicalGift = () => {
    const newGift: PhysicalGiftItem = {
      id: 'phys-' + Date.now(),
      title: 'Nouvel Article Souhaité',
      category: 'Cuisine',
      brandReference: 'Marque ou Modèle...',
      colorOrFinish: 'Couleur...',
      whereToFind: 'Boutique ou Magasin...',
      externalUrl: '',
      estimatedPrice: '50 000 FCFA',
      imageUrl: 'https://images.unsplash.com/photo-1584990347449-389f41b2e811?w=500&auto=format&fit=crop&q=80',
      desiredQuantity: 1,
      reservedQuantity: 0,
      pledges: []
    };
    setFormData({
      ...formData,
      physicalGifts: [...(formData.physicalGifts || []), newGift]
    });
  };

  const removePhysicalGift = (id: string) => {
    setFormData({
      ...formData,
      physicalGifts: (formData.physicalGifts || []).filter((g) => g.id !== id)
    });
  };

  const handleImageFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onUrlReady: (url: string) => void
  ) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
      onUrlReady(await uploadConfigImage(file));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Envoi de l'image impossible.");
    } finally {
      input.value = '';
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = '';
    window.alert("L'envoi d'un fichier audio n'est pas encore disponible. Choisissez un morceau de la liste, ou collez le lien (https) d'un fichier audio.");
  };

  const addContact = () => {
    const newCt: UsefulContact = {
      id: 'ct-' + Date.now(),
      role: '',
      name: '',
      phone: ''
    };
    setFormData({ ...formData, usefulContacts: [...formData.usefulContacts, newCt] });
  };

  const removeContact = (id: string) => {
    setFormData({
      ...formData,
      usefulContacts: formData.usefulContacts.filter((c) => c.id !== id)
    });
  };

  const addStoryPhoto = () => {
    const newStory: StoryPhotoItem = {
      id: 'st-' + Date.now(),
      title: 'Notre Moment Magique',
      description: 'Racontez en quelques mots cet instant précieux...',
      imageUrl: ''
    };
    setFormData({ ...formData, storyPhotos: [...formData.storyPhotos, newStory] });
  };

  const removeStoryPhoto = (id: string) => {
    setFormData({
      ...formData,
      storyPhotos: formData.storyPhotos.filter((s) => s.id !== id)
    });
  };

  const addTable = () => {
    const num = formData.tablesList.length + 1;
    const newTbl: TableItem = {
      id: 'tbl-' + Date.now(),
      name: `Table ${num} - Les Palmiers`,
      capacity: 10,
      description: 'Proche estrade mariés'
    };
    setFormData({ ...formData, tablesList: [...formData.tablesList, newTbl] });
  };

  const removeTable = (id: string) => {
    setFormData({
      ...formData,
      tablesList: formData.tablesList.filter((t) => t.id !== id)
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-[#8A4B38] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Centre de Contrôle & Personnalisation Complète</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Paramétrez Tout l'Univers de Votre Mariage
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Rien n'est figé : modifiez les noms, photos, musiques, couleurs, cadeaux, programme et tables. Tout se synchronise en temps réel sur les téléphones des invités.
          </p>
        </div>

        <button
          onClick={() => handleSave()}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1B382B] hover:bg-[#12281D] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Enregistrement...' : 'Enregistrer toutes les modifications'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center justify-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Toutes les données ont été sauvegardées et diffusées en direct sur les téléphones de tous les invités !</span>
        </div>
      )}

      {/* Main Settings Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-1 p-2 bg-slate-50/70 border-b border-slate-200/80 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('identity')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'identity'
                ? 'bg-[#1B382B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>1. Noms & Date</span>
          </button>

          <button
            onClick={() => setActiveTab('visuals')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'visuals'
                ? 'bg-[#1B382B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>2. Photos & Dimensions</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'theme'
                ? 'bg-[#1B382B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>3. Thème & Couleurs</span>
          </button>

          <button
            onClick={() => setActiveTab('programme')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'programme'
                ? 'bg-[#1B382B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>4. Programme des Festivités</span>
          </button>

          <button
            onClick={() => setActiveTab('dresscode')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dresscode'
                ? 'bg-[#1B382B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>5. Couleurs & Dress Code</span>
          </button>

          <button
            onClick={() => setActiveTab('gifts')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'gifts'
                ? 'bg-[#1B382B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>6. Liste de Cadeaux (Physiques & Cagnottes)</span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tables'
                ? 'bg-[#1B382B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>7. Plan de Table</span>
          </button>

          <button
            onClick={() => setActiveTab('story')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'story'
                ? 'bg-[#1B382B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>8. Notre Histoire</span>
          </button>

          <button
            onClick={() => setActiveTab('music')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'music'
                ? 'bg-[#1B382B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>9. Musique & Upload MP3</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'contacts'
                ? 'bg-[#1B382B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>10. Contacts & Logistique</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* ========================================================== */}
          {/* 1. NOMS, DATE, LIEU & CITATION                             */}
          {/* ========================================================== */}
          {activeTab === 'identity' && (
            <div className="space-y-5 text-xs">
              <h3 className="font-serif text-xl font-bold text-slate-900">
                Identité des Mariés & Coordonnées du Mariage
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Noms des Mariés *</label>
                  <input
                    type="text"
                    value={formData.coupleNames}
                    onChange={(e) => setFormData({ ...formData, coupleNames: e.target.value })}
                    placeholder="Prénoms des mariés"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-serif text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phrase d'accroche / Citation</label>
                  <input
                    type="text"
                    value={formData.storyQuote}
                    onChange={(e) => setFormData({ ...formData, storyQuote: e.target.value })}
                    placeholder="Un oui, une fête, et le bonheur de se retrouver."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-serif italic text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date Principale *</label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Heure de Début *</label>
                  <input
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ville & Pays *</label>
                  <input
                    type="text"
                    value={formData.venueCity}
                    onChange={(e) => setFormData({ ...formData, venueCity: e.target.value })}
                    placeholder="Ville, pays"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nom du Lieu / Domaine</label>
                  <input
                    type="text"
                    value={formData.venueName}
                    onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                    placeholder="Nom du lieu principal"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Adresse complète</label>
                  <input
                    type="text"
                    value={formData.venueAddress}
                    onChange={(e) => setFormData({ ...formData, venueAddress: e.target.value })}
                    placeholder="Quartier / adresse"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lien Google Maps (Itinéraire)</label>
                <input
                  type="url"
                  value={formData.mapsUrl}
                  onChange={(e) => setFormData({ ...formData, mapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 2. PHOTOS & VISUELS DU MARIAGE                             */}
          {/* ========================================================== */}
          {activeTab === 'visuals' && (
            <div className="space-y-6 text-xs">
              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/80 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#8A4B38] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-serif text-sm font-bold text-slate-900">
                    Guide des Dimensions & Ratios Recommandés pour vos Photos
                  </h4>
                  <p className="text-slate-600 text-xs mt-0.5">
                    Pour garantir un affichage sublime sur tous les écrans (smartphones, tablettes, ordinateurs), respectez les dimensions conseillées ci-dessous. Vous pouvez soit importer directement vos photos depuis votre appareil, soit renseigner un lien URL.
                  </p>
                </div>
              </div>

              {/* 3 Main Slots with Dimension Badges & Direct File Upload */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Slot 1: Hero Banner */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">
                      1. Bannière d'Accueil (Grand Jour)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Haut de page
                    </span>
                  </div>

                  {/* Dimensions Guide Badge */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div className="font-semibold text-slate-800 flex items-center justify-between">
                      <span>Dimensions conseillées :</span>
                      <span className="font-mono text-emerald-700 font-bold">1920 × 800 px</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Ratio 21:9 ou 16:9 panoramique. Sujet décentré à droite pour laisser respirer le titre. Poids max : 4 Mo.
                    </p>
                  </div>

                  <div className="aspect-video rounded-xl bg-slate-200 overflow-hidden border border-slate-300 relative group">
                    <img
                      src={formData.heroImageUrl || undefined}
                      alt="Hero"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Direct File Upload */}
                  <div>
                    <label className="cursor-pointer w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Importer depuis votre appareil</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageFileUpload(e, (url) => setFormData({ ...formData, heroImageUrl: url }))}
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={formData.heroImageUrl}
                    onChange={(e) => setFormData({ ...formData, heroImageUrl: e.target.value })}
                    placeholder="Ou collez l'URL de l'image..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <div className="flex flex-wrap gap-1">
                    {presetPhotos.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData({ ...formData, heroImageUrl: p.url })}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600"
                      >
                        Photo {i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slot 2: Ticket Card Image */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">
                      2. Photo du Billet d'Accès QR
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#8A4B38] text-[10px] font-bold">
                      Billet Jour J
                    </span>
                  </div>

                  {/* Dimensions Guide Badge */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div className="font-semibold text-slate-800 flex items-center justify-between">
                      <span>Dimensions conseillées :</span>
                      <span className="font-mono text-emerald-700 font-bold">800 × 400 px</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Ratio 2:1 horizontal. Apparaît au sommet de la carte d'embarquement / billet d'entrée. Poids max : 2 Mo.
                    </p>
                  </div>

                  <div className="aspect-video rounded-xl bg-slate-200 overflow-hidden border border-slate-300">
                    <img
                      src={formData.ticketImageUrl || undefined}
                      alt="Ticket"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Direct File Upload */}
                  <div>
                    <label className="cursor-pointer w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Importer depuis votre appareil</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageFileUpload(e, (url) => setFormData({ ...formData, ticketImageUrl: url }))}
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={formData.ticketImageUrl}
                    onChange={(e) => setFormData({ ...formData, ticketImageUrl: e.target.value })}
                    placeholder="Ou collez l'URL de l'image..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <div className="flex flex-wrap gap-1">
                    {presetPhotos.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData({ ...formData, ticketImageUrl: p.url })}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600"
                      >
                        Photo {i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slot 3: Bride / Couple Portrait */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">
                      3. Portrait Mariée / Couple (Infos)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                      Arche Page Infos
                    </span>
                  </div>

                  {/* Dimensions Guide Badge */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div className="font-semibold text-slate-800 flex items-center justify-between">
                      <span>Dimensions conseillées :</span>
                      <span className="font-mono text-emerald-700 font-bold">600 × 750 px</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Ratio 4:5 ou 3:4 vertical. Découpé élégamment en forme d'arche arrondie dans l'onglet Infos.
                    </p>
                  </div>

                  <div className="aspect-video rounded-xl bg-slate-200 overflow-hidden border border-slate-300">
                    <img
                      src={formData.brideImageUrl || undefined}
                      alt="Bride"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Direct File Upload */}
                  <div>
                    <label className="cursor-pointer w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Importer depuis votre appareil</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageFileUpload(e, (url) => setFormData({ ...formData, brideImageUrl: url }))}
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={formData.brideImageUrl}
                    onChange={(e) => setFormData({ ...formData, brideImageUrl: e.target.value })}
                    placeholder="Ou collez l'URL de l'image..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <div className="flex flex-wrap gap-1">
                    {presetPhotos.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData({ ...formData, brideImageUrl: p.url })}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600"
                      >
                        Photo {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 3. THÈME VISUEL, COULEURS & VOILE DE FOND                  */}
          {/* ========================================================== */}
          {activeTab === 'theme' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  Thème Visuel, Couleurs & Voile de Bannière
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Réglez le voile sur la photo d'accueil pour que l'image de fond soit parfaitement claire, lumineuse et sans vert opaque indésirable.
                </p>
              </div>

              {/* Hero Mask Style Selector */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
                <span className="font-bold text-slate-800 text-sm block">
                  Style du voile sur la photo d'accueil (Hero)
                </span>
                <p className="text-slate-500 text-xs">
                  Choisissez la façon dont le texte se superpose à la photo de couverture. Le mode « Subtil & Transparent » laisse l'image resplendir à 100%.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    onClick={() => setFormData({ ...formData, guestHeroOverlayStyle: 'soft' })}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                      formData.guestHeroOverlayStyle === 'soft' || !formData.guestHeroOverlayStyle
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20'
                        : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Subtil & Transparent (Recommandé)</span>
                      <input
                        type="radio"
                        name="guestHeroOverlayStyle"
                        checked={formData.guestHeroOverlayStyle === 'soft' || !formData.guestHeroOverlayStyle}
                        onChange={() => setFormData({ ...formData, guestHeroOverlayStyle: 'soft' })}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Dégradé léger et élégant : la photo reste parfaitement visible et vive, sans teinte lourde.
                    </p>
                  </label>

                  <label
                    onClick={() => setFormData({ ...formData, guestHeroOverlayStyle: 'dark' })}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                      formData.guestHeroOverlayStyle === 'dark'
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20'
                        : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Léger Sombre</span>
                      <input
                        type="radio"
                        name="guestHeroOverlayStyle"
                        checked={formData.guestHeroOverlayStyle === 'dark'}
                        onChange={() => setFormData({ ...formData, guestHeroOverlayStyle: 'dark' })}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Voile noir doux à 35% pour accentuer le contraste du texte blanc.
                    </p>
                  </label>

                  <label
                    onClick={() => setFormData({ ...formData, guestHeroOverlayStyle: 'transparent' })}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                      formData.guestHeroOverlayStyle === 'transparent'
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20'
                        : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Pure Image 100% Nette</span>
                      <input
                        type="radio"
                        name="guestHeroOverlayStyle"
                        checked={formData.guestHeroOverlayStyle === 'transparent'}
                        onChange={() => setFormData({ ...formData, guestHeroOverlayStyle: 'transparent' })}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Zéro voile de couleur, texte protégé par une ombre douce portée.
                    </p>
                  </label>
                </div>
              </div>

              {/* Theme Colors for Spaces */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <span className="font-bold text-slate-800 text-xs block">
                    Couleurs de l'Espace Invité
                  </span>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Couleur d'accentuation principale</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.guestAccentColor || '#243E36'}
                        onChange={(e) => setFormData({ ...formData, guestAccentColor: e.target.value })}
                        className="w-10 h-9 rounded-lg border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.guestAccentColor || '#243E36'}
                        onChange={(e) => setFormData({ ...formData, guestAccentColor: e.target.value })}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Fond de l'en-tête invité</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.guestHeaderBgColor || '#FAF7F2'}
                        onChange={(e) => setFormData({ ...formData, guestHeaderBgColor: e.target.value })}
                        className="w-10 h-9 rounded-lg border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.guestHeaderBgColor || '#FAF7F2'}
                        onChange={(e) => setFormData({ ...formData, guestHeaderBgColor: e.target.value })}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <span className="font-bold text-slate-800 text-xs block">
                    Couleurs de l'Espace Responsable
                  </span>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Couleur d'accentuation organisateur</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.responsableThemeColor || '#047857'}
                        onChange={(e) => setFormData({ ...formData, responsableThemeColor: e.target.value })}
                        className="w-10 h-9 rounded-lg border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.responsableThemeColor || '#047857'}
                        onChange={(e) => setFormData({ ...formData, responsableThemeColor: e.target.value })}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading Screen Customization */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
                <div>
                  <span className="font-bold text-slate-800 text-sm block">
                    Écran de Chargement de l'Invitation
                  </span>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Personnalisez le titre et le sous-titre de l'écran d'accueil élégant qui s'affiche lors de l'ouverture du lien.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Titre haut (lettres espacées)</label>
                    <input
                      type="text"
                      value={formData.loadingScreenTitle || 'NOTRE MARIAGE'}
                      onChange={(e) => setFormData({ ...formData, loadingScreenTitle: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Sous-titre d'attente</label>
                    <input
                      type="text"
                      value={formData.loadingScreenSubtitle || 'Votre invitation se prépare...'}
                      onChange={(e) => setFormData({ ...formData, loadingScreenSubtitle: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg italic font-serif"
                    />
                  </div>
                </div>

                {/* Live Preview of Loading Card */}
                <div className="mt-2 p-6 rounded-2xl bg-[#F4EFEA] border border-[#E3D7C9] flex flex-col items-center justify-center text-center">
                  <div className="bg-white px-8 py-7 rounded-2xl shadow-md border border-[#E8DFD5] max-w-sm w-full space-y-3">
                    <span className="text-[10px] tracking-[0.25em] text-[#8A7968] font-bold uppercase block">
                      {formData.loadingScreenTitle || 'NOTRE MARIAGE'}
                    </span>
                    <h4 className="font-serif text-3xl font-bold text-[#243E36]">
                      {formData.coupleNames}
                    </h4>
                    <p className="text-xs text-[#8A7968] italic font-serif">
                      {formData.loadingScreenSubtitle || 'Votre invitation se prépare...'}
                    </p>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent mx-auto" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 3. PROGRAMME DES CÉRÉMONIES                                */}
          {/* ========================================================== */}
          {activeTab === 'programme' && (
            <div className="space-y-5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-slate-900">
                    Programme des Célébrations & Horaires
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Ajoutez, modifiez ou réordonnez les moments du mariage (Traditionnel, Civil, Vin d'honneur, Religieux, Banquet...).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addEvent}
                  className="px-3.5 py-2 bg-[#1B382B] text-white rounded-xl font-semibold flex items-center gap-1.5 hover:bg-emerald-900 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une étape</span>
                </button>
              </div>

              <div className="space-y-4">
                {formData.timelineEvents.map((ev, index) => (
                  <div
                    key={ev.id || index}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-[#8A4B38] font-serif text-sm">
                        Étape #{ev.order || index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEvent(ev.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        title="Supprimer cette étape"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-slate-600 mb-1 font-medium">Titre de l'étape *</label>
                        <input
                          type="text"
                          value={ev.title}
                          onChange={(e) => {
                            const updated = [...formData.timelineEvents];
                            updated[index].title = e.target.value;
                            setFormData({ ...formData, timelineEvents: updated });
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 mb-1 font-medium">Date affichée</label>
                        <input
                          type="text"
                          value={ev.dateStr}
                          onChange={(e) => {
                            const updated = [...formData.timelineEvents];
                            updated[index].dateStr = e.target.value;
                            setFormData({ ...formData, timelineEvents: updated });
                          }}
                          placeholder="samedi 19 décembre"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 mb-1 font-medium">Heure</label>
                        <input
                          type="text"
                          value={ev.time}
                          onChange={(e) => {
                            const updated = [...formData.timelineEvents];
                            updated[index].time = e.target.value;
                            setFormData({ ...formData, timelineEvents: updated });
                          }}
                          placeholder="18:00"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 mb-1 font-medium">Lieu / Salle</label>
                        <input
                          type="text"
                          value={ev.locationName}
                          onChange={(e) => {
                            const updated = [...formData.timelineEvents];
                            updated[index].locationName = e.target.value;
                            setFormData({ ...formData, timelineEvents: updated });
                          }}
                          placeholder="Nom du lieu"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-600 mb-1 font-medium">Précision / Accès</label>
                        <input
                          type="text"
                          value={ev.locationDetails}
                          onChange={(e) => {
                            const updated = [...formData.timelineEvents];
                            updated[index].locationDetails = e.target.value;
                            setFormData({ ...formData, timelineEvents: updated });
                          }}
                          placeholder="Précisions d'accès"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 mb-1 font-medium">Ville</label>
                        <input
                          type="text"
                          value={ev.city}
                          onChange={(e) => {
                            const updated = [...formData.timelineEvents];
                            updated[index].city = e.target.value;
                            setFormData({ ...formData, timelineEvents: updated });
                          }}
                          placeholder="Ville, pays"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 mb-1 font-medium">Lien Google Maps</label>
                        <input
                          type="url"
                          value={ev.mapsUrl}
                          onChange={(e) => {
                            const updated = [...formData.timelineEvents];
                            updated[index].mapsUrl = e.target.value;
                            setFormData({ ...formData, timelineEvents: updated });
                          }}
                          placeholder="https://maps.google.com/?q=..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 4. DRESS CODE & PALETTE DE COULEURS                        */}
          {/* ========================================================== */}
          {activeTab === 'dresscode' && (
            <div className="space-y-5 text-xs">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  Dress Code & Palette de Couleurs du Mariage
                </h3>
                <p className="text-slate-500 text-xs">
                  Définissez l'intitulé et personnalisez les couleurs affichées sous forme d'arches sur la page d'invitation des convives.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Texte du Dress Code</label>
                <input
                  type="text"
                  value={formData.dressCode}
                  onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                  placeholder="Vert sauge, Moutarde, Rose poudré & Champagne"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-slate-800">
                    Nuances de Couleurs ({formData.dressCodeColors.length})
                  </span>
                  <button
                    type="button"
                    onClick={addColor}
                    className="px-3 py-1.5 bg-[#1B382B] text-white rounded-lg font-semibold flex items-center gap-1 hover:bg-emerald-900 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une couleur</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {formData.dressCodeColors.map((color, index) => (
                    <div
                      key={color.id || index}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col items-center gap-3 relative shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => removeColor(color.id)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Visual swatch with color picker */}
                      <div className="relative">
                        <div
                          style={{ backgroundColor: color.hex }}
                          className="w-16 h-20 rounded-t-full rounded-b-md shadow-md border border-black/10 cursor-pointer"
                        />
                        <input
                          type="color"
                          value={color.hex}
                          onChange={(e) => {
                            const updated = [...formData.dressCodeColors];
                            updated[index].hex = e.target.value;
                            setFormData({ ...formData, dressCodeColors: updated });
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          title="Cliquer pour changer la couleur"
                        />
                      </div>

                      <div className="w-full space-y-1.5 text-center">
                        <input
                          type="text"
                          value={color.name}
                          onChange={(e) => {
                            const updated = [...formData.dressCodeColors];
                            updated[index].name = e.target.value;
                            setFormData({ ...formData, dressCodeColors: updated });
                          }}
                          className="w-full text-center px-2 py-1 bg-white border border-slate-300 rounded-md font-semibold text-xs"
                        />
                        <span className="font-mono text-[11px] text-slate-500 block">
                          {color.hex}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 6. LISTE DE CADEAUX (PHYSIQUES & CAGNOTTES)                */}
          {/* ========================================================== */}
          {activeTab === 'gifts' && (
            <div className="space-y-6 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif text-xl font-bold text-slate-900">
                    Liste de Cadeaux & Cagnottes au Choix des Mariés
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Définissez ce dont vous avez besoin pour votre foyer : articles physiques précis (marmites, cuisinière, TV, vaisselle...) et cagnottes en ligne.
                  </p>
                </div>

                {/* Sub-tab Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setGiftSubTab('physical')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      giftSubTab === 'physical'
                        ? 'bg-white text-emerald-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Cadeaux Physiques ({formData.physicalGifts?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGiftSubTab('monetary')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      giftSubTab === 'monetary'
                        ? 'bg-white text-emerald-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Gift className="w-3.5 h-3.5 text-[#8A4B38]" />
                    <span>Cagnottes & Mobile Money ({formData.giftOptions.length})</span>
                  </button>
                </div>
              </div>

              {/* ================= SUB-TAB 1: PHYSICAL GIFTS ================= */}
              {giftSubTab === 'physical' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-emerald-900 text-xs">
                        Liste d'Équipement du Foyer (Marmites, Cuisinière, TV, Vaisselle, Déco...)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={addPhysicalGift}
                      className="px-3.5 py-1.5 bg-[#1B382B] text-white rounded-xl font-semibold flex items-center gap-1.5 hover:bg-emerald-900 transition cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter un article physique</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {(formData.physicalGifts || []).map((gift, index) => (
                      <div
                        key={gift.id || index}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-4 shadow-2xs"
                      >
                        {/* Top row: Title & Actions */}
                        <div className="flex items-start justify-between border-b border-slate-200 pb-3 gap-3">
                          <div className="flex-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mb-1">
                              {gift.category || 'Cuisine'}
                            </span>
                            <input
                              type="text"
                              value={gift.title}
                              onChange={(e) => {
                                const updated = [...(formData.physicalGifts || [])];
                                updated[index].title = e.target.value;
                                setFormData({ ...formData, physicalGifts: updated });
                              }}
                              placeholder="ex: Batterie de Marmites Inox 10 pièces"
                              className="w-full font-serif text-base font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removePhysicalGift(gift.id)}
                            className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title="Supprimer cet article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Mid row: Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Catégorie</label>
                            <select
                              value={gift.category}
                              onChange={(e) => {
                                const updated = [...(formData.physicalGifts || [])];
                                updated[index].category = e.target.value as any;
                                setFormData({ ...formData, physicalGifts: updated });
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                            >
                              <option value="Cuisine">Cuisine</option>
                              <option value="Électroménager">Électroménager</option>
                              <option value="Vaisselle">Vaisselle</option>
                              <option value="Maison & Déco">Maison & Déco</option>
                              <option value="Autre">Autre</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Marque / Référence</label>
                            <input
                              type="text"
                              value={gift.brandReference || ''}
                              onChange={(e) => {
                                const updated = [...(formData.physicalGifts || [])];
                                updated[index].brandReference = e.target.value;
                                setFormData({ ...formData, physicalGifts: updated });
                              }}
                              placeholder="ex: Tefal Ingenio / Samsung UHD"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Couleur / Finition</label>
                            <input
                              type="text"
                              value={gift.colorOrFinish || ''}
                              onChange={(e) => {
                                const updated = [...(formData.physicalGifts || [])];
                                updated[index].colorOrFinish = e.target.value;
                                setFormData({ ...formData, physicalGifts: updated });
                              }}
                              placeholder="ex: Inox brossé, Noir mat..."
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Prix estimé (indicatif)</label>
                            <input
                              type="text"
                              value={gift.estimatedPrice || ''}
                              onChange={(e) => {
                                const updated = [...(formData.physicalGifts || [])];
                                updated[index].estimatedPrice = e.target.value;
                                setFormData({ ...formData, physicalGifts: updated });
                              }}
                              placeholder="ex: 65 000 FCFA ou 120 €"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Où trouver / Magasin conseillé</label>
                            <input
                              type="text"
                              value={gift.whereToFind || ''}
                              onChange={(e) => {
                                const updated = [...(formData.physicalGifts || [])];
                                updated[index].whereToFind = e.target.value;
                                setFormData({ ...formData, physicalGifts: updated });
                              }}
                              placeholder="ex : magasin ou enseigne"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Lien Web / E-boutique (optionnel)</label>
                            <input
                              type="url"
                              value={gift.externalUrl || ''}
                              onChange={(e) => {
                                const updated = [...(formData.physicalGifts || [])];
                                updated[index].externalUrl = e.target.value;
                                setFormData({ ...formData, physicalGifts: updated });
                              }}
                              placeholder="https://www.exemple.com/…"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-[11px]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-slate-600 mb-1 font-medium">Quantité souhaitée</label>
                              <input
                                type="number"
                                min={1}
                                max={20}
                                value={gift.desiredQuantity}
                                onChange={(e) => {
                                  const updated = [...(formData.physicalGifts || [])];
                                  updated[index].desiredQuantity = Math.max(1, parseInt(e.target.value) || 1);
                                  setFormData({ ...formData, physicalGifts: updated });
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-emerald-800"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-600 mb-1 font-medium">Déjà réservée</label>
                              <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg font-bold text-emerald-700 text-center">
                                {gift.reservedQuantity || 0} / {gift.desiredQuantity}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Image & Dimension recommendations for physical gifts */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700">Photo de l'article</span>
                            <span className="text-[10px] text-amber-700 font-mono font-medium">
                              Format conseillé : 500 × 500 px (carré 1:1 fond blanc)
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                              {gift.imageUrl ? (
                                <img src={gift.imageUrl} alt={gift.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <ImageIcon className="w-6 h-6" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 space-y-1.5">
                              <input
                                type="text"
                                value={gift.imageUrl || ''}
                                onChange={(e) => {
                                  const updated = [...(formData.physicalGifts || [])];
                                  updated[index].imageUrl = e.target.value;
                                  setFormData({ ...formData, physicalGifts: updated });
                                }}
                                placeholder="URL de l'image de l'article..."
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                              />

                              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-[11px] font-semibold text-slate-700 transition">
                                <Upload className="w-3 h-3 text-emerald-700" />
                                <span>Importer une photo depuis l'appareil</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleImageFileUpload(e, (url) => {
                                      const updated = [...(formData.physicalGifts || [])];
                                      updated[index].imageUrl = url;
                                      setFormData({ ...formData, physicalGifts: updated });
                                    })
                                  }
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Pledges / Contributions received from guests */}
                        {gift.pledges && gift.pledges.length > 0 && (
                          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70 space-y-2">
                            <span className="font-bold text-[#8A4B38] text-[11px] uppercase tracking-wider block">
                              Promesses d'offrandes reçues ({gift.pledges.length}) :
                            </span>
                            <div className="space-y-1.5">
                              {gift.pledges.map((plg) => (
                                <div
                                  key={plg.id}
                                  className="text-[11px] bg-white p-2 rounded-lg border border-amber-200 flex flex-wrap items-center justify-between gap-2"
                                >
                                  <div>
                                    <span className="font-bold text-slate-800">{plg.guestName}</span>
                                    {plg.guestContact && (
                                      <span className="text-slate-500 font-mono ml-2">({plg.guestContact})</span>
                                    )}
                                    {plg.message && (
                                      <p className="text-slate-600 italic mt-0.5">« {plg.message} »</p>
                                    )}
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                    {plg.quantity} offert(s)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= SUB-TAB 2: MONETARY GIFTS ================= */}
              {giftSubTab === 'monetary' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#8A4B38]" />
                      <span className="font-bold text-slate-800 text-xs">
                        Comptes Mobile Money, SumUp, Cartes & Cagnottes en ligne
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={addGiftOption}
                      className="px-3.5 py-1.5 bg-[#1B382B] text-white rounded-xl font-semibold flex items-center gap-1.5 hover:bg-emerald-900 transition cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter un compte de paiement</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.giftOptions.map((gift, index) => (
                      <div
                        key={gift.id || index}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-[#8A4B38] font-bold text-xs uppercase">
                              {gift.badgeText || 'Cagnotte'}
                            </span>
                            <span className="font-bold text-slate-800">{gift.beneficiaryName}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeGiftOption(gift.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Type de paiement</label>
                            <select
                              value={gift.type}
                              onChange={(e) => {
                                const updated = [...formData.giftOptions];
                                updated[index].type = e.target.value as any;
                                updated[index].badgeText =
                                  e.target.value === 'orange_money'
                                    ? 'Orange Money'
                                    : e.target.value === 'momo'
                                    ? 'MTN MoMo'
                                    : e.target.value === 'sumup'
                                    ? 'SumUp'
                                    : e.target.value === 'paypal'
                                    ? 'PayPal'
                                    : 'Virement RIB';
                                setFormData({ ...formData, giftOptions: updated });
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                            >
                              <option value="orange_money">Orange Money</option>
                              <option value="momo">MTN Mobile Money</option>
                              <option value="sumup">SumUp (Carte Bancaire)</option>
                              <option value="paypal">PayPal</option>
                              <option value="rib">Virement Bancaire (RIB / IBAN)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Bénéficiaire affiché</label>
                            <input
                              type="text"
                              value={gift.beneficiaryName}
                              onChange={(e) => {
                                const updated = [...formData.giftOptions];
                                updated[index].beneficiaryName = e.target.value;
                                setFormData({ ...formData, giftOptions: updated });
                              }}
                              placeholder="Nom du bénéficiaire"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Numéro de téléphone ou Lien</label>
                            <input
                              type="text"
                              value={gift.numberOrLink}
                              onChange={(e) => {
                                const updated = [...formData.giftOptions];
                                updated[index].numberOrLink = e.target.value;
                                setFormData({ ...formData, giftOptions: updated });
                              }}
                              placeholder="Numéro ou lien https://…"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-600 mb-1 font-medium">Instruction / Note pour l'invité</label>
                          <input
                            type="text"
                            value={gift.note}
                            onChange={(e) => {
                              const updated = [...formData.giftOptions];
                              updated[index].note = e.target.value;
                              setFormData({ ...formData, giftOptions: updated });
                            }}
                            placeholder="Vérifiez le bénéficiaire avant de confirmer le virement..."
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* 6. PLAN DE TABLE & GESTION DES TABLES                      */}
          {/* ========================================================== */}
          {activeTab === 'tables' && (
            <div className="space-y-5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-slate-900">
                    Configuration des Tables & Salles de Réception
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Définissez la liste des tables disponibles afin de pouvoir y affecter vos convives en un clic.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addTable}
                  className="px-3.5 py-2 bg-[#1B382B] text-white rounded-xl font-semibold flex items-center gap-1.5 hover:bg-emerald-900 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une table</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.tablesList.map((tbl, index) => (
                  <div
                    key={tbl.id || index}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">Table #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeTable(tbl.id)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-slate-600 mb-1">Nom de la table *</label>
                        <input
                          type="text"
                          value={tbl.name}
                          onChange={(e) => {
                            const updated = [...formData.tablesList];
                            updated[index].name = e.target.value;
                            setFormData({ ...formData, tablesList: updated });
                          }}
                          placeholder="Table d'Honneur, Les Orchidées..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-600 mb-1">Capacité maximale (places)</label>
                          <input
                            type="number"
                            value={tbl.capacity}
                            onChange={(e) => {
                              const updated = [...formData.tablesList];
                              updated[index].capacity = Number(e.target.value);
                              setFormData({ ...formData, tablesList: updated });
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">Emplacement / Remarques</label>
                          <input
                            type="text"
                            value={tbl.description || ''}
                            onChange={(e) => {
                              const updated = [...formData.tablesList];
                              updated[index].description = e.target.value;
                              setFormData({ ...formData, tablesList: updated });
                            }}
                            placeholder="Près de la piste..."
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 7. NOTRE HISTOIRE & ALBUM                                  */}
          {/* ========================================================== */}
          {activeTab === 'story' && (
            <div className="space-y-5 text-xs">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  Récit des Mariés & Album Photo Souvenirs
                </h3>
                <p className="text-slate-500 text-xs">
                  Partagez les étapes de votre rencontre, vos voyages et vos fiançailles avec vos invités.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Titre de la section</label>
                <input
                  type="text"
                  value={formData.storyTitle}
                  onChange={(e) => setFormData({ ...formData, storyTitle: e.target.value })}
                  placeholder="À deux, tout commence."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-serif text-base font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Texte d'introduction</label>
                <textarea
                  rows={3}
                  value={formData.storyText}
                  onChange={(e) => setFormData({ ...formData, storyText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Photos souvenirs */}
              <div className="pt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    Photos de l'Album Souvenirs ({formData.storyPhotos.length})
                  </span>
                  <button
                    type="button"
                    onClick={addStoryPhoto}
                    className="px-3 py-1.5 bg-[#1B382B] text-white rounded-lg font-semibold flex items-center gap-1 hover:bg-emerald-900 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un souvenir</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formData.storyPhotos.map((photo, index) => (
                    <div
                      key={photo.id || index}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Souvenir #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeStoryPhoto(photo.id)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="aspect-video rounded-xl bg-slate-200 overflow-hidden border border-slate-300">
                        <img
                          src={photo.imageUrl}
                          alt={photo.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-slate-600 mb-1">Titre</label>
                          <input
                            type="text"
                            value={photo.title}
                            onChange={(e) => {
                              const updated = [...formData.storyPhotos];
                              updated[index].title = e.target.value;
                              setFormData({ ...formData, storyPhotos: updated });
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 mb-1">Lien / URL de l'image</label>
                          <input
                            type="text"
                            value={photo.imageUrl}
                            onChange={(e) => {
                              const updated = [...formData.storyPhotos];
                              updated[index].imageUrl = e.target.value;
                              setFormData({ ...formData, storyPhotos: updated });
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 mb-1">Petite anecdote</label>
                          <textarea
                            rows={2}
                            value={photo.description}
                            onChange={(e) => {
                              const updated = [...formData.storyPhotos];
                              updated[index].description = e.target.value;
                              setFormData({ ...formData, storyPhotos: updated });
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 8. MUSIQUE & AMBIANCE SONORE                               */}
          {/* ========================================================== */}
          {activeTab === 'music' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  Ambiance Musicale & Sonorisation de l'Invitation
                </h3>
                <p className="text-slate-500 text-xs">
                  Définissez ou téléchargez la musique qui accueille vos invités. Vous pouvez importer votre propre chanson d'amour (MP3 / WAV) ou choisir parmi des compositions romantiques de mariage.
                </p>
              </div>

              {/* SECTION: Direct Audio File Upload from device */}
              <div className="p-5 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">
                        Télécharger une Musique depuis votre appareil (MP3, WAV, M4A)
                      </span>
                      <p className="text-slate-600 text-xs">
                        Glissez-déposez ou sélectionnez votre fichier audio sur votre ordinateur ou téléphone.
                      </p>
                    </div>
                  </div>

                  <label className="cursor-pointer px-4 py-2 bg-[#1B382B] hover:bg-emerald-900 text-white font-semibold rounded-xl transition flex items-center gap-2 shadow-xs">
                    <Upload className="w-4 h-4" />
                    <span>Sélectionner le fichier audio</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleAudioFileUpload}
                    />
                  </label>
                </div>

                {formData.customMusicUrl && (
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Volume2 className="w-4 h-4 text-emerald-700" />
                      <div>
                        <span className="font-bold text-slate-800 text-xs block">
                          Fichier actif : {formData.musicTitle || 'Chanson personnalisée'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formData.customMusicUrl.startsWith('data:') ? 'Audio chargé en mémoire locale' : formData.customMusicUrl}
                        </span>
                      </div>
                    </div>

                    <audio
                      controls
                      src={formData.customMusicUrl}
                      className="h-8 max-w-xs"
                    />
                  </div>
                )}
              </div>

              {/* Audio Track Title definition */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="block text-slate-700 font-bold mb-1">
                  Titre affiché du morceau pour les invités
                </label>
                <input
                  type="text"
                  value={formData.musicTitle || ''}
                  onChange={(e) => setFormData({ ...formData, musicTitle: e.target.value })}
                  placeholder="ex: Canon de Pachelbel (Harpe Nuptiale) ou Perfect - Ed Sheeran"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-medium"
                />
              </div>

              {/* Preset Instrumental Compositions */}
              <div>
                <span className="font-bold text-slate-800 text-sm block mb-2">
                  Ou choisissez une ambiance instrumentale prédéfinie :
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    onClick={() => {
                      setFormData({
                        ...formData,
                        musicTrack: 'canon',
                        musicTitle: 'Canon de Pachelbel (Harpe Céleste)'
                      });
                      configureMusicSettings('canon');
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      formData.musicTrack === 'canon'
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="musicTrack"
                      checked={formData.musicTrack === 'canon'}
                      onChange={() => {
                        setFormData({
                          ...formData,
                          musicTrack: 'canon',
                          musicTitle: 'Canon de Pachelbel (Harpe Céleste)'
                        });
                        configureMusicSettings('canon');
                      }}
                      className="mt-1 text-emerald-700"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">
                        Canon de Pachelbel (Harpe Céleste)
                      </span>
                      <p className="text-slate-500 mt-1">
                        Classique, doux et royal. L'ambiance traditionnelle par excellence pour les entrées nuptiales.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => {
                      setFormData({
                        ...formData,
                        musicTrack: 'celeste',
                        musicTitle: 'Étoiles Célestes (Méditatif & Moderne)'
                      });
                      configureMusicSettings('celeste');
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      formData.musicTrack === 'celeste'
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="musicTrack"
                      checked={formData.musicTrack === 'celeste'}
                      onChange={() => {
                        setFormData({
                          ...formData,
                          musicTrack: 'celeste',
                          musicTitle: 'Étoiles Célestes (Méditatif & Moderne)'
                        });
                        configureMusicSettings('celeste');
                      }}
                      className="mt-1 text-emerald-700"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">
                        Étoiles Célestes (Méditatif & Moderne)
                      </span>
                      <p className="text-slate-500 mt-1">
                        Sonorités éthérées et cristallines évoquant la paix, la nature et le romantisme contemporain.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => {
                      setFormData({
                        ...formData,
                        musicTrack: 'valse',
                        musicTitle: 'Valse Nuptiale (Rythme à 3 temps)'
                      });
                      configureMusicSettings('valse');
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      formData.musicTrack === 'valse'
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="musicTrack"
                      checked={formData.musicTrack === 'valse'}
                      onChange={() => {
                        setFormData({
                          ...formData,
                          musicTrack: 'valse',
                          musicTitle: 'Valse Nuptiale (Rythme à 3 temps)'
                        });
                        configureMusicSettings('valse');
                      }}
                      className="mt-1 text-emerald-700"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">
                        Valse Nuptiale (Rythme à 3 temps)
                      </span>
                      <p className="text-slate-500 mt-1">
                        Une mélodie entraînante et festive rappelant l'ouverture de bal des mariés.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => {
                      setFormData({
                        ...formData,
                        musicTrack: 'ambient_harp',
                        musicTitle: 'Harpe Champêtre (Douceur Boisée)'
                      });
                      configureMusicSettings('ambient_harp');
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      formData.musicTrack === 'ambient_harp'
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="musicTrack"
                      checked={formData.musicTrack === 'ambient_harp'}
                      onChange={() => {
                        setFormData({
                          ...formData,
                          musicTrack: 'ambient_harp',
                          musicTitle: 'Harpe Champêtre (Douceur Boisée)'
                        });
                        configureMusicSettings('ambient_harp');
                      }}
                      className="mt-1 text-emerald-700"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">
                        Harpe Champêtre (Douceur Boisée)
                      </span>
                      <p className="text-slate-500 mt-1">
                        Accords chauds et intimes parfaits pour un mariage en plein air ou sous les arbres.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Custom audio link / stream URL */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="radio"
                    name="musicTrack"
                    checked={formData.musicTrack === 'custom'}
                    onChange={() => setFormData({ ...formData, musicTrack: 'custom' })}
                    className="text-emerald-700"
                  />
                  <span>Ou renseigner l'URL directe d'un flux audio / MP3 hébergé</span>
                </label>

                {formData.musicTrack === 'custom' && (
                  <input
                    type="url"
                    value={formData.customMusicUrl || ''}
                    onChange={(e) => setFormData({ ...formData, customMusicUrl: e.target.value })}
                    placeholder="https://monsite.com/ma-chanson-de-mariage.mp3"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs"
                  />
                )}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 9. CONTACTS & LOGISTIQUE                                   */}
          {/* ========================================================== */}
          {activeTab === 'contacts' && (
            <div className="space-y-5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-slate-900">
                    Contacts Utiles & Référents du Mariage
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Coordonnées téléphoniques du wedding planner, des familles et des chauffeurs accessibles aux invités.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addContact}
                  className="px-3.5 py-2 bg-[#1B382B] text-white rounded-xl font-semibold flex items-center gap-1.5 hover:bg-emerald-900 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter un contact</span>
                </button>
              </div>

              <div className="space-y-3">
                {formData.usefulContacts.map((ct, index) => (
                  <div
                    key={ct.id || index}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center"
                  >
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Rôle / Titre</label>
                      <input
                        type="text"
                        value={ct.role}
                        onChange={(e) => {
                          const updated = [...formData.usefulContacts];
                          updated[index].role = e.target.value;
                          setFormData({ ...formData, usefulContacts: updated });
                        }}
                        placeholder="Wedding Planner, Famille..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Prénom et Nom</label>
                      <input
                        type="text"
                        value={ct.name}
                        onChange={(e) => {
                          const updated = [...formData.usefulContacts];
                          updated[index].name = e.target.value;
                          setFormData({ ...formData, usefulContacts: updated });
                        }}
                        placeholder="Prénom Nom"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-slate-600 mb-1 font-medium">Téléphone</label>
                        <input
                          type="text"
                          value={ct.phone}
                          onChange={(e) => {
                            const updated = [...formData.usefulContacts];
                            updated[index].phone = e.target.value;
                            setFormData({ ...formData, usefulContacts: updated });
                          }}
                          placeholder="Numéro de téléphone"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeContact(ct.id)}
                        className="text-slate-400 hover:text-rose-600 mt-5 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Chaque enregistrement met à jour instantanément la base et l'espace des invités.
            </span>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1B382B] hover:bg-[#12281D] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
