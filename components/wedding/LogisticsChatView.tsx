'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Car,
  Home,
  Sparkles,
  Send,
  Users,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import type { ChatMessage, Guest } from '@/lib/wedding/types';
import { sendChatMessage } from '@/lib/wedding/api';

interface LogisticsChatViewProps {
  messages: ChatMessage[];
  guests?: Guest[];
  activeGuest?: Guest | null;
  currentUserName?: string;
  currentUserRole?: 'organizer' | 'guest';
  onSendMessage?: (msg: Partial<ChatMessage>) => Promise<ChatMessage>;
}

type ChannelId = 'general' | 'covoiturage' | 'logement' | 'temoins';

export const LogisticsChatView: React.FC<LogisticsChatViewProps> = ({
  messages,
  guests = [],
  activeGuest,
  currentUserName,
  currentUserRole = 'guest',
  onSendMessage
}) => {
  const [selectedChannel, setSelectedChannel] = useState<ChannelId>('covoiturage');
  const [inputText, setInputText] = useState('');
  const [senderName, setSenderName] = useState(
    currentUserName || (activeGuest ? `${activeGuest.firstName} ${activeGuest.lastName}` : 'Invité')
  );
  const [senderRole, setSenderRole] = useState<'Marie(e)' | 'Temoin' | 'Invite' | 'Organisateur'>(
    currentUserRole === 'organizer' ? 'Organisateur' : 'Invite'
  );
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Update sender if active guest or currentUserName changes
  useEffect(() => {
    if (currentUserName) {
      setSenderName(currentUserName);
    } else if (activeGuest) {
      setSenderName(`${activeGuest.firstName} ${activeGuest.lastName}`);
      if (activeGuest.category === 'Témoins') {
        setSenderRole('Temoin');
      } else {
        setSenderRole('Invite');
      }
    }
  }, [activeGuest?.id, currentUserName]);

  const filteredMessages = messages.filter((m) => m.channelId === selectedChannel);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages.length, selectedChannel]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSending(true);
    try {
      const payload: Partial<ChatMessage> = {
        channelId: selectedChannel,
        senderName: senderName.trim(),
        senderRole,
        content: inputText.trim()
      };

      if (onSendMessage) {
        await onSendMessage(payload);
      } else {
        await sendChatMessage(payload);
      }

      setInputText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const channels: Array<{ id: ChannelId; label: string; icon: React.ReactNode; desc: string }> = [
    {
      id: 'covoiturage',
      label: 'Covoiturage & Navettes',
      icon: <Car className="w-4 h-4 text-emerald-600" />,
      desc: 'Proposez ou demandez des places de voiture, organisez les trajets gare/aéroports.'
    },
    {
      id: 'logement',
      label: 'Hébergements & Gîtes',
      icon: <Home className="w-4 h-4 text-blue-600" />,
      desc: 'Partage de chambres, hôtels à proximité et navettes nocturnes.'
    },
    {
      id: 'temoins',
      label: 'Témoins & Surprises',
      icon: <Sparkles className="w-4 h-4 text-amber-600" />,
      desc: 'Coordination secrète des discours, animations et flashmobs.'
    },
    {
      id: 'general',
      label: 'Questions Générales',
      icon: <MessageSquare className="w-4 h-4 text-purple-600" />,
      desc: 'Informations diverses, tenues et météo.'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[640px]">
        {/* Left Sidebar: Channels & User identity */}
        <div className="md:col-span-4 border-r border-slate-100 bg-slate-50/50 p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Messagerie Logistique
              </span>
              <h3 className="font-serif text-xl font-bold text-slate-900 mt-0.5">
                Salons de Coordination
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Échangez en temps réel avec les autres invités et l'équipe d'organisation.
              </p>
            </div>

            {/* Channels List */}
            <div className="space-y-1.5">
              {channels.map((ch) => {
                const count = messages.filter((m) => m.channelId === ch.id).length;
                const isSelected = selectedChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch.id)}
                    className={`w-full text-left p-3 rounded-xl transition cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-white shadow-xs border border-slate-200 text-slate-900'
                        : 'hover:bg-slate-100/80 text-slate-600'
                    }`}
                  >
                    <div className="mt-0.5">{ch.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold truncate">{ch.label}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono">
                          {count}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{ch.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Profile Selector (Simulate who is talking) */}
          <div className="pt-4 border-t border-slate-200/80 space-y-2 text-xs">
            <span className="text-slate-500 font-medium block">
              Vous vous exprimez en tant que :
            </span>

            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Votre nom..."
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            />

            <select
              value={senderRole}
              onChange={(e) => setSenderRole(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="Invite">Invité</option>
              <option value="Temoin">Témoin</option>
              <option value="Marie(e)">Marié(e)</option>
              <option value="Organisateur">Organisateur / Coordinateur</option>
            </select>
          </div>
        </div>

        {/* Right Area: Messages flow & Input */}
        <div className="md:col-span-8 flex flex-col justify-between bg-white h-[640px]">
          {/* Channel Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {channels.find((c) => c.id === selectedChannel)?.icon}
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">
                  {channels.find((c) => c.id === selectedChannel)?.label}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {channels.find((c) => c.id === selectedChannel)?.desc}
                </p>
              </div>
            </div>

            <span className="text-[11px] text-slate-400">
              Synchronisé en direct
            </span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-1">
                <MessageSquare className="w-8 h-8 text-slate-300 stroke-1" />
                <p>Aucun message dans ce salon.</p>
                <p className="text-[11px] text-slate-400">Soyez le premier à poser une question logistique !</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = msg.senderName.trim().toLowerCase() === senderName.trim().toLowerCase();
                const isOrganiser = msg.senderRole === 'Marie(e)' || msg.senderRole === 'Organisateur';
                const isTemoin = msg.senderRole === 'Temoin';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                      <span className="font-bold text-slate-700">{msg.senderName}</span>
                      {isOrganiser && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-semibold text-[10px]">
                          Marié(e)
                        </span>
                      )}
                      {isTemoin && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 font-semibold text-[10px]">
                          Témoin
                        </span>
                      )}
                      <span>·</span>
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div
                      className={`max-w-md p-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-2xs ${
                        isMe
                          ? 'bg-slate-900 text-white rounded-tr-xs'
                          : 'bg-slate-100 text-slate-800 rounded-tl-xs'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Écrire un message dans #${channels.find((c) => c.id === selectedChannel)?.label}...`}
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Envoyer</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
