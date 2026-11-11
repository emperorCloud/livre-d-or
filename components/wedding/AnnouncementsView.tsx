'use client';
import React, { useState } from 'react';
import {
  Bell,
  AlertCircle,
  Info,
  Clock,
  Plus,
  Send,
  Sparkles,
  Users,
  CheckCircle2
} from 'lucide-react';
import type { Announcement } from '@/lib/wedding/types';
import { postAnnouncement } from '@/lib/wedding/api';

interface AnnouncementsViewProps {
  announcements: Announcement[];
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ announcements }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'info' | 'important' | 'urgent'>('important');
  const [author, setAuthor] = useState('Les Mariés (Camille & Alexandre)');
  const [target, setTarget] = useState<'all' | 'confirmed_only'>('all');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSending(true);
    try {
      await postAnnouncement({
        title: title.trim(),
        message: message.trim(),
        priority,
        author: author.trim(),
        target
      });

      setTitle('');
      setMessage('');
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const getPriorityBadge = (p: 'info' | 'important' | 'urgent') => {
    switch (p) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Urgent
          </span>
        );
      case 'important':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Important
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            Information
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider">
            <Bell className="w-4 h-4 text-amber-600" />
            <span>Mises à Jour & Annonces Officielles</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900 mt-1">
            Informations & Alertes aux Invités
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Toutes les consignes de transport, météo, dress code et rappels logistiques diffusés en direct sur les téléphones des invités.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Publier une mise à jour</span>
        </button>
      </div>

      {/* Announcements Feed */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200/80">
            <Bell className="w-12 h-12 mx-auto stroke-1 text-slate-300 mb-2" />
            <p className="text-sm">Aucune annonce publiée pour le moment.</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white rounded-2xl p-6 border shadow-xs transition ${
                ann.priority === 'urgent'
                  ? 'border-rose-300/80 bg-rose-50/10'
                  : ann.priority === 'important'
                  ? 'border-amber-200/80 bg-amber-50/10'
                  : 'border-slate-200/80'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {getPriorityBadge(ann.priority)}
                  <span className="text-xs text-slate-500">
                    Par <strong className="text-slate-800">{ann.author}</strong>
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-xs text-slate-400">
                    {new Date(ann.createdAt).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {ann.target === 'confirmed_only' ? 'Confirmés uniquement' : 'Tous les invités'}
                  </span>
                </div>
              </div>

              <h3 className="font-serif text-lg font-bold text-slate-900">
                {ann.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed whitespace-pre-line">
                {ann.message}
              </p>
            </div>
          ))
        )}
      </div>

      {/* New Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-xl font-bold text-slate-900">
                Diffuser une nouvelle notification
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Titre de la mise à jour *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: Horaires des navettes retour précisés"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Message aux invités *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Indiquez tous les détails pratiques..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Niveau d'importance</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="info">Information (Standard)</option>
                    <option value="important">Important (À lire)</option>
                    <option value="urgent">Urgent (Prioritaire)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Destinataires</label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="all">Tous les invités</option>
                    <option value="confirmed_only">Invités confirmés uniquement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Signataire de l'annonce</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Diffusion...' : 'Diffuser immédiatement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
