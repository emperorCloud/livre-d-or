'use client';
import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { CalendarDays, Check, Download, MapPin, Ticket, Heart } from 'lucide-react';
import type { PublicInvitation, RsvpStatus } from '@/lib/types';
import type { SiteSettings } from '@/lib/siteSettings';
import { api } from '@/lib/client/api';
import { fontClass, paperStyle } from '@/lib/client/themeStyles';
import { formatTicketCode } from '@/lib/invitations/format';
import SiteFooter from './SiteFooter';
import { inputCls } from './ui';

type Tab = 'celebration' | 'reponse' | 'billet';
const TABS: { id: Tab; label: string }[] = [
  { id: 'celebration', label: 'Le grand jour' }, { id: 'reponse', label: 'Votre réponse' }, { id: 'billet', label: 'Votre billet' },
];
const heroCls = (r: string) => (r === '4:5' ? 'aspect-[4/5] max-w-md mx-auto' : r === '1:1' ? 'aspect-square max-w-lg mx-auto' : 'aspect-[4/5] sm:aspect-[16/9]');
const CHOICES: { v: Exclude<RsvpStatus, 'pending'>; label: string }[] = [
  { v: 'yes', label: 'Je serai présent(e)' }, { v: 'maybe', label: 'Peut-être' }, { v: 'no', label: 'Je ne pourrai pas venir' },
];

export default function InvitationPage({ initial, token, settings }: { initial: PublicInvitation; token: string; settings: SiteSettings }) {
  const [inv, setInv] = useState(initial);
  const [tab, setTab] = useState<Tab>('celebration');
  const t = inv.theme;
  const paper = paperStyle(t.paperTexture);
  const font = fontClass(t.fontStyle);

  const [status, setStatus] = useState<'' | Exclude<RsvpStatus, 'pending'>>(inv.rsvp.status === 'pending' ? '' : inv.rsvp.status);
  const [guests, setGuests] = useState(inv.rsvp.guests || 1);
  const [diet, setDiet] = useState(inv.rsvp.diet);
  const [allergies, setAllergies] = useState(inv.rsvp.allergies);
  const [note, setNote] = useState(inv.rsvp.note);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [qr, setQr] = useState('');

  // Onglets synchronisés avec l'adresse (#reponse, #billet) pour pouvoir envoyer un lien direct.
  useEffect(() => {
    const read = () => { const h = window.location.hash.replace('#', '') as Tab; if (TABS.some((x) => x.id === h)) setTab(h); };
    read(); window.addEventListener('hashchange', read); return () => window.removeEventListener('hashchange', read);
  }, []);
  const go = (id: Tab) => { setTab(id); history.replaceState(null, '', `#${id}`); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  useEffect(() => {
    if (!inv.ticketCode) { setQr(''); return; }
    QRCode.toDataURL(inv.ticketCode, { width: 560, margin: 2, color: { dark: '#1C1917', light: '#FFFFFF' } }).then(setQr).catch(() => setQr(''));
  }, [inv.ticketCode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!status) { setError('Choisissez une réponse.'); return; }
    setBusy(true); setError(''); setSaved(false);
    try {
      const r = await api.rsvp(token, { status, guests: status === 'no' ? 0 : guests, diet, allergies, note });
      setInv(r.invitation); setSaved(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Envoi impossible.'); } finally { setBusy(false); }
  };

  const people = useMemo(() => Array.from({ length: inv.maxGuests }, (_, i) => i + 1), [inv.maxGuests]);
  const statusText = inv.rsvp.status === 'yes' ? 'Votre présence est confirmée' : inv.rsvp.status === 'maybe' ? 'Vous avez répondu « peut-être »' : inv.rsvp.status === 'no' ? 'Vous avez indiqué ne pas pouvoir venir' : 'Nous attendons votre réponse';

  return (
    <div className={`min-h-screen flex flex-col bg-linear-to-br ${t.bgGradient}`}>
      <header className="text-center py-4 border-b" style={{ borderColor: paper.border, background: paper.bg, color: paper.text }}>
        <span className={`${font} text-xl sm:text-2xl font-semibold`} style={{ color: t.primaryColor }}>{inv.ceremony.honoreeName}</span>
      </header>
      <nav className="sticky top-0 z-30 border-b backdrop-blur" style={{ borderColor: paper.border, background: `${paper.bg}ee` }}>
        <div className="max-w-3xl mx-auto grid grid-cols-3">
          {TABS.map((x, i) => (
            <button key={x.id} onClick={() => go(x.id)} className={`py-3 text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${tab === x.id ? '' : 'opacity-60 border-transparent'}`}
              style={tab === x.id ? { borderColor: t.accentColor, color: t.primaryColor } : { color: paper.text }}>
              <span style={{ color: t.accentColor }}>0{i + 1}</span> {x.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        <p className="text-center text-sm" style={{ color: t.primaryColor }}>Invitation personnelle pour <strong>{inv.greeting}</strong></p>

        {tab === 'celebration' && (
          <section className="space-y-6">
            {inv.photo.url ? (
              <div className={`relative w-full overflow-hidden rounded-2xl shadow-xl border-2 ${heroCls(inv.photo.aspectRatio)}`} style={{ borderColor: t.accentColor }}>
                <img src={inv.photo.url} alt={inv.ceremony.honoreeName} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: `${inv.photo.focalX * 100}% ${inv.photo.focalY * 100}%` }} fetchPriority="high" />
                <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
                <div className={`absolute bottom-0 inset-x-0 p-5 sm:p-8 text-white ${font}`}>
                  <h1 className="text-3xl sm:text-5xl font-bold leading-tight drop-shadow">{inv.ceremony.title}</h1>
                  {inv.ceremony.subtitle && <p className="text-sm sm:text-lg opacity-90 mt-1">{inv.ceremony.subtitle}</p>}
                </div>
              </div>
            ) : (
              <div className={`text-center space-y-2 pt-4 ${font}`} style={{ color: t.primaryColor }}>
                <h1 className="text-4xl sm:text-5xl font-bold">{inv.ceremony.title}</h1>
                {inv.ceremony.subtitle && <p className="opacity-80">{inv.ceremony.subtitle}</p>}
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm" style={{ color: t.primaryColor }}>
              {inv.ceremony.date && <span className="inline-flex items-center gap-2"><CalendarDays className="w-4 h-4" style={{ color: t.accentColor }} />{inv.ceremony.date}</span>}
              {inv.ceremony.location && <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" style={{ color: t.accentColor }} />{inv.ceremony.location}</span>}
            </div>
            {t.coverQuote && <p className={`${font} italic text-center text-lg max-w-xl mx-auto`} style={{ color: t.primaryColor }}>« {t.coverQuote} »{t.coverQuoteAuthor ? <span className="not-italic text-xs"> — {t.coverQuoteAuthor}</span> : null}</p>}
            <div className="text-center"><button onClick={() => go('reponse')} className="px-6 py-3 text-sm font-semibold text-white rounded-xl shadow" style={{ background: t.primaryColor }}>Répondre à l'invitation</button></div>
          </section>
        )}

        {tab === 'reponse' && (
          <section className="rounded-2xl border shadow-lg p-5 sm:p-8 space-y-5" style={{ background: paper.bg, borderColor: paper.border, color: paper.text }}>
            <div className="space-y-1">
              <h2 className={`${font} text-2xl font-semibold`} style={{ color: t.primaryColor }}>Votre réponse</h2>
              <p className="text-xs opacity-70">{statusText}{inv.rsvp.at ? ` · le ${new Date(inv.rsvp.at).toLocaleDateString('fr-FR')}` : ''}. Vous pouvez modifier votre réponse à tout moment.</p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}
              <div className="grid sm:grid-cols-3 gap-2">
                {CHOICES.map((c) => (
                  <button type="button" key={c.v} onClick={() => setStatus(c.v)} className="p-3 rounded-xl border text-sm font-medium transition-all text-left"
                    style={status === c.v ? { borderColor: t.accentColor, background: `${t.accentColor}22`, color: t.primaryColor } : { borderColor: paper.border }}>
                    {status === c.v && <Check className="inline w-4 h-4 mr-1" />}{c.label}
                  </button>
                ))}
              </div>
              {(status === 'yes' || status === 'maybe') && (
                <div className="space-y-3">
                  {inv.maxGuests > 1 && (
                    <label className="block text-xs font-semibold uppercase">Nombre de personnes (vous inclus)
                      <select className={`${inputCls} mt-1 font-normal normal-case`} value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                        {people.map((n) => <option key={n} value={n}>{n} personne{n > 1 ? 's' : ''}</option>)}
                      </select>
                    </label>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input className={inputCls} placeholder="Régime alimentaire (facultatif)" maxLength={80} value={diet} onChange={(e) => setDiet(e.target.value)} />
                    <input className={inputCls} placeholder="Allergies (facultatif)" maxLength={200} value={allergies} onChange={(e) => setAllergies(e.target.value)} />
                  </div>
                </div>
              )}
              {status && <textarea rows={3} className={inputCls} placeholder="Un petit mot pour les mariés (facultatif)" maxLength={600} value={note} onChange={(e) => setNote(e.target.value)} />}
              <button type="submit" disabled={busy || !status} className="px-5 py-3 text-sm font-semibold text-white rounded-xl shadow disabled:opacity-60" style={{ background: t.primaryColor }}>{busy ? 'Envoi…' : 'Enregistrer ma réponse'}</button>
              {saved && (
                <p className="text-sm flex flex-wrap items-center gap-2" style={{ color: t.primaryColor }}><Heart className="w-4 h-4" style={{ color: t.accentColor }} />Merci, votre réponse est enregistrée.
                  {inv.ticketCode && <button type="button" onClick={() => go('billet')} className="underline font-semibold">Voir mon billet</button>}</p>
              )}
            </form>
          </section>
        )}

        {tab === 'billet' && (
          <section className="rounded-2xl border shadow-lg p-5 sm:p-8 text-center space-y-4" style={{ background: paper.bg, borderColor: paper.border, color: paper.text }}>
            <Ticket className="w-8 h-8 mx-auto" style={{ color: t.accentColor }} />
            <h2 className={`${font} text-2xl font-semibold`} style={{ color: t.primaryColor }}>Votre billet</h2>
            {inv.ticketCode ? (
              <>
                <p className="text-sm">{inv.greeting} · {inv.rsvp.guests} personne{inv.rsvp.guests > 1 ? 's' : ''}{inv.tableNumber ? ` · Table ${inv.tableNumber}` : ''}</p>
                {qr ? <img src={qr} alt="QR code de votre billet" className="w-60 h-60 mx-auto rounded-xl border bg-white p-2" style={{ borderColor: paper.border }} /> : <div className="w-60 h-60 mx-auto rounded-xl bg-stone-200 animate-pulse" />}
                <p className="font-mono text-lg tracking-widest font-bold">{formatTicketCode(inv.ticketCode)}</p>
                <p className="text-xs opacity-70">Présentez ce QR code à l'entrée. Gardez ce billet sur votre téléphone.</p>
                {qr && <a href={qr} download="billet.png" className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border" style={{ borderColor: t.accentColor, color: t.primaryColor }}><Download className="w-4 h-4" />Enregistrer mon billet</a>}
              </>
            ) : (
              <>
                <p className="text-sm opacity-80">Votre billet est activé dès que vous confirmez votre présence.</p>
                <button onClick={() => go('reponse')} className="px-5 py-3 text-sm font-semibold text-white rounded-xl shadow" style={{ background: t.primaryColor }}>Répondre à l'invitation</button>
              </>
            )}
          </section>
        )}
      </main>
      <SiteFooter settings={settings} override={t.footerText} />
    </div>
  );
}
