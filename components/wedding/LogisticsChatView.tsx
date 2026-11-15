'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Car, Home, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import type { ChatMessage, Guest } from '@/lib/wedding/types';
import { sendChatMessage } from '@/lib/wedding/api';

type ChannelId = ChatMessage['channelId'];

interface LogisticsChatViewProps {
  messages: ChatMessage[];
  guests?: Guest[]; // conservé pour compatibilité des appels
  activeGuest?: Guest | null;
  /** Nom affiché comme expéditeur. Pour un invité, le serveur impose de toute façon le nom de sa fiche. */
  currentUserName?: string;
  currentUserRole?: 'organizer' | 'guest';
  /** Le salon « Témoins & surprises » est secret : visible uniquement des témoins et de l'organisateur. */
  canSeeWitnesses?: boolean;
  onSendMessage?: (msg: Partial<ChatMessage>) => Promise<ChatMessage>;
  /** « sheet » : plein écran sur téléphone, fenêtre sur ordinateur ; « page » : bloc intégré dans l'espace organisateur. */
  layout?: 'page' | 'sheet';
  onClose?: () => void;
}

const CHANNELS: { id: ChannelId; label: string; short: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'covoiturage', label: 'Covoiturage & navettes', short: 'Covoiturage', icon: <Car className="w-3.5 h-3.5" />, desc: 'Proposez ou demandez une place, organisez les trajets depuis la gare ou l’aéroport.' },
  { id: 'logement', label: 'Hébergements', short: 'Hébergement', icon: <Home className="w-3.5 h-3.5" />, desc: 'Partage de chambres, hôtels à proximité, navettes de nuit.' },
  { id: 'general', label: 'Questions générales', short: 'Questions', icon: <MessageSquare className="w-3.5 h-3.5" />, desc: 'Tenue, météo, horaires : toutes les questions pratiques.' },
  { id: 'temoins', label: 'Témoins & surprises', short: 'Témoins', icon: <Sparkles className="w-3.5 h-3.5" />, desc: 'Salon secret : discours, animations et surprises. Les autres invités ne le voient pas.' },
];

const MAX = 1000;
const dayLabel = (iso: string) => {
  const d = new Date(iso), today = new Date(), y = new Date(); y.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  return same(d, today) ? 'Aujourd’hui' : same(d, y) ? 'Hier' : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};
const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export const LogisticsChatView: React.FC<LogisticsChatViewProps> = ({
  messages, activeGuest, currentUserName, currentUserRole = 'guest', canSeeWitnesses, onSendMessage, layout = 'page', onClose,
}) => {
  const isOrganizer = currentUserRole === 'organizer';
  const witnessAccess = canSeeWitnesses ?? isOrganizer;
  const channels = useMemo(() => CHANNELS.filter((c) => c.id !== 'temoins' || witnessAccess), [witnessAccess]);
  const [channel, setChannel] = useState<ChannelId>('covoiturage');
  const [text, setText] = useState('');
  const [signature, setSignature] = useState(currentUserName || (activeGuest && !isOrganizer ? `${activeGuest.firstName} ${activeGuest.lastName}`.trim() : '') || (isOrganizer ? 'Organisateur' : 'Invité'));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true); // on ne colle au bas de la liste que si l'utilisateur y était déjà (il peut relire l'historique)
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (currentUserName) setSignature(currentUserName); }, [currentUserName]);
  useEffect(() => { if (!channels.some((c) => c.id === channel)) setChannel('covoiturage'); }, [channels, channel]);

  const current = channels.find((c) => c.id === channel) ?? channels[0];
  const list = useMemo(() => messages.filter((m) => m.channelId === channel), [messages, channel]);
  const counts = useMemo(() => Object.fromEntries(channels.map((c) => [c.id, messages.filter((m) => m.channelId === c.id).length])), [messages, channels]);

  const scrollDown = useCallback((smooth = false) => { const el = listRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }); }, []);
  useEffect(() => { stick.current = true; scrollDown(); }, [channel, scrollDown]);
  useEffect(() => { if (stick.current) scrollDown(true); }, [list.length, scrollDown]);

  const grow = () => { const t = taRef.current; if (t) { t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 112)}px`; } };

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true); setError('');
    try {
      const payload: Partial<ChatMessage> = { channelId: channel, senderName: signature.trim() || 'Invité', senderRole: isOrganizer ? 'Organisateur' : 'Invite', content };
      await (onSendMessage ?? sendChatMessage)(payload);
      setText(''); stick.current = true;
      requestAnimationFrame(() => { grow(); scrollDown(true); });
    } catch (e) { setError(e instanceof Error ? e.message : 'Message non envoyé. Vérifiez votre connexion et réessayez.'); } finally { setSending(false); }
  };

  const mine = (m: ChatMessage) => m.senderName.trim().toLowerCase() === signature.trim().toLowerCase();
  const sheet = layout === 'sheet';

  return (
    <div className={`flex flex-col min-h-0 bg-white ${sheet ? 'h-full' : 'h-[min(72vh,680px)] rounded-2xl border border-slate-200 overflow-hidden'}`}>
      {/* En-tête */}
      <div className="shrink-0 px-4 pt-3 pb-2 border-b border-slate-100 bg-[#FFF7F9]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-lg font-bold text-[#4A2F38] leading-tight">Discussions des invités</h3>
            <p className="text-[11px] text-[#8C7480] truncate">Covoiturage, hébergement, questions pratiques</p>
          </div>
          {onClose && <button type="button" onClick={onClose} aria-label="Fermer la discussion" className="p-2 -mr-1 rounded-full text-slate-500 hover:bg-black/5"><X className="w-5 h-5" /></button>}
        </div>
        {/* Salons : une rangée de pastilles, jamais une colonne qui mange l'écran */}
        <div role="tablist" aria-label="Salons" className="mt-2.5 -mx-1 px-1 flex gap-1.5 overflow-x-auto scrollbar-none">
          {channels.map((c) => (
            <button key={c.id} role="tab" aria-selected={channel === c.id} onClick={() => setChannel(c.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${channel === c.id ? 'bg-[#C65E7E] border-[#C65E7E] text-white' : 'bg-white border-[#EFC8D4] text-[#5E4450] hover:bg-[#FDEBF0]'}`}>
              {c.icon}<span>{c.short}</span>{counts[c.id] > 0 && <span className={`text-[10px] px-1.5 rounded-full ${channel === c.id ? 'bg-white/25' : 'bg-slate-100 text-slate-600'}`}>{counts[c.id]}</span>}
            </button>
          ))}
        </div>
        {current && <p className="text-[11px] text-[#8C7480] mt-2 leading-snug">{current.desc}</p>}
      </div>

      {/* Messages */}
      <div ref={listRef} onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}
        className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-3 bg-slate-50/60" aria-live="polite">
        {list.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 px-6 gap-1">
            <MessageSquare className="w-9 h-9 text-slate-300" strokeWidth={1.25} />
            <p className="text-sm font-medium text-slate-500">Aucun message pour l’instant</p>
            <p className="text-xs">Lancez la discussion : proposez un trajet, demandez une place…</p>
          </div>
        ) : (
          <ol className="space-y-1">
            {list.map((m, i) => {
              const prev = list[i - 1];
              const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
              const grouped = !newDay && prev && prev.senderName === m.senderName && new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000;
              const me = mine(m);
              const couple = m.senderRole === 'Marie(e)' || m.senderRole === 'Organisateur';
              return (
                <li key={m.id}>
                  {newDay && <div className="text-center my-3"><span className="text-[10px] uppercase tracking-wider text-slate-400 bg-white border border-slate-200 rounded-full px-3 py-0.5">{dayLabel(m.createdAt)}</span></div>}
                  <div className={`flex flex-col ${me ? 'items-end' : 'items-start'} ${grouped ? 'mt-0.5' : 'mt-2'}`}>
                    {!grouped && (
                      <div className="flex items-center gap-1.5 text-[11px] px-1 mb-0.5">
                        <span className="font-semibold text-slate-700">{me ? 'Vous' : m.senderName}</span>
                        {couple && <span className="px-1.5 rounded bg-amber-100 text-amber-900 font-semibold text-[10px]">Organisation</span>}
                        {m.senderRole === 'Temoin' && <span className="px-1.5 rounded bg-purple-100 text-purple-900 font-semibold text-[10px]">Témoin</span>}
                        <span className="text-slate-400">{hhmm(m.createdAt)}</span>
                      </div>
                    )}
                    <div className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-line break-words ${me ? 'bg-[#C65E7E] text-white rounded-br-md' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'}`}>{m.content}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Saisie : toujours visible en bas, au-dessus du clavier */}
      <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="shrink-0 border-t border-slate-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {error && <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 mb-2">{error}</p>}
        {isOrganizer ? (
          <label className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">Signer en tant que
            <input value={signature} onChange={(e) => setSignature(e.target.value)} maxLength={80} className="flex-1 min-w-0 px-2 py-1 border border-slate-200 rounded-lg text-xs text-slate-800" />
          </label>
        ) : (
          <p className="text-[11px] text-slate-400 mb-1.5">Vous écrivez en tant que <b className="text-slate-600">{signature}</b></p>
        )}
        <div className="flex items-end gap-2">
          <textarea ref={taRef} rows={1} value={text} maxLength={MAX} aria-label="Votre message" placeholder={`Message dans « ${current?.short ?? ''} »`}
            onChange={(e) => { setText(e.target.value); grow(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }}
            className="flex-1 min-w-0 resize-none px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C65E7E]/40" />
          <button type="submit" disabled={sending || !text.trim()} aria-label="Envoyer"
            className="shrink-0 w-11 h-11 rounded-full bg-[#C65E7E] hover:bg-[#A94566] disabled:opacity-40 text-white flex items-center justify-center transition"><Send className="w-4 h-4" /></button>
        </div>
        {text.length > 800 && <p className="text-[10px] text-slate-400 text-right mt-1">{text.length}/{MAX}</p>}
      </form>
    </div>
  );
};

/** Fenêtre de discussion côté invité : plein écran sur téléphone (le clavier ne cache plus la saisie), fenêtre centrée sur ordinateur. */
export const ChatSheet: React.FC<{ open: boolean; onClose: () => void } & Omit<LogisticsChatViewProps, 'layout' | 'onClose'>> = ({ open, onClose, ...rest }) => {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Discussions des invités" className="fixed inset-0 z-50 bg-black/55 sm:flex sm:items-center sm:justify-center sm:p-4 no-print" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="h-[100dvh] w-full sm:h-[min(86vh,720px)] sm:max-w-xl sm:rounded-3xl overflow-hidden shadow-2xl bg-white">
        <LogisticsChatView {...rest} layout="sheet" onClose={onClose} />
      </div>
    </div>
  );
};
