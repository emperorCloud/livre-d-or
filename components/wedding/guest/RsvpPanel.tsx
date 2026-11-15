'use client';
import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { AlertCircle, CheckCircle2, HelpCircle, Loader2, Send, Ticket, XCircle } from 'lucide-react';
import type { DietaryOption, Guest, RsvpStatus, WeddingConfig } from '@/lib/wedding/types';
import { submitRsvp } from '@/lib/wedding/api';
import { hasTicket } from '@/lib/wedding/rsvp';
import { FloralDivider } from '../../decor/Flowers';

type Answer = Exclude<RsvpStatus, 'pending'> | null;
const toAnswer = (s: RsvpStatus): Answer => (s === 'pending' ? null : s);

const DIETS: { value: DietaryOption; label: string }[] = [
  { value: 'classic', label: 'Classique' }, { value: 'vegetarian', label: 'Végétarien' }, { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Casher' }, { value: 'gluten_free', label: 'Sans gluten' }, { value: 'other', label: 'Autre (précisez ci-dessous)' },
];

/** Choix présent / absent d'UNE personne : deux grands boutons, jamais une case à cocher ambiguë. */
function PersonChoice({ legend, value, onChange, disabled }: { legend: string; value: Answer; onChange: (a: Exclude<Answer, null>) => void; disabled?: boolean }) {
  const btn = (on: boolean, tone: 'yes' | 'no') =>
    `flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition cursor-pointer disabled:opacity-50 ${
      on ? (tone === 'yes' ? 'bg-emerald-50 border-emerald-600 text-emerald-900' : 'bg-rose-50 border-rose-400 text-rose-900') : 'border-[#F3D0DB] bg-white text-[#5E4450] hover:bg-slate-50'}`;
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-xs font-semibold text-[#5E4450] mb-1.5">{legend}</legend>
      <div className="flex gap-2" role="radiogroup" aria-label={legend}>
        <button type="button" role="radio" aria-checked={value === 'confirmed'} onClick={() => onChange('confirmed')} className={btn(value === 'confirmed', 'yes')}>
          <CheckCircle2 className="w-4 h-4" /><span>Sera présent(e)</span>
        </button>
        <button type="button" role="radio" aria-checked={value === 'declined'} onClick={() => onChange('declined')} className={btn(value === 'declined', 'no')}>
          <XCircle className="w-4 h-4" /><span>Ne pourra pas venir</span>
        </button>
      </div>
    </fieldset>
  );
}

type Props = { guest: Guest; config: WeddingConfig; onViewTicket: () => void; onProposeRepresentative: () => void };

export const RsvpPanel: React.FC<Props> = ({ guest, config, onViewTicket, onProposeRepresentative }) => {
  const couple = guest.plusOneAllowed;
  const [guestAns, setGuestAns] = useState<Answer>(toAnswer(guest.guestRsvp));
  const [partnerAns, setPartnerAns] = useState<Answer>(toAnswer(guest.partnerRsvp));
  const [partnerName, setPartnerName] = useState(guest.plusOneName || '');
  const [events, setEvents] = useState<Record<string, boolean>>(guest.attendingEvents || {});
  const [diet, setDiet] = useState<DietaryOption>(guest.dietaryPreference || 'classic');
  const [allergies, setAllergies] = useState(guest.allergies || '');
  const [note1, setNote1] = useState(guest.personalNote || '');
  const [note2, setNote2] = useState(guest.partnerNote || '');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [done, setDone] = useState<null | 'yes' | 'no'>(null);
  const top = useRef<HTMLDivElement>(null);

  // Une autre fiche (ou une correction du responsable) : on repart des valeurs enregistrées.
  useEffect(() => {
    setGuestAns(toAnswer(guest.guestRsvp)); setPartnerAns(toAnswer(guest.partnerRsvp)); setPartnerName(guest.plusOneName || '');
    setEvents(guest.attendingEvents || {}); setDiet(guest.dietaryPreference || 'classic'); setAllergies(guest.allergies || '');
    setNote1(guest.personalNote || ''); setNote2(guest.partnerNote || ''); setDone(null);
  }, [guest.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const name1 = `${guest.firstName} ${guest.lastName}`.trim() || guest.greetingTitle || 'Vous';
  const name2 = partnerName.trim() || 'Votre conjoint(e)';
  const anyYes = guestAns === 'confirmed' || (couple && partnerAns === 'confirmed');
  const complete = guestAns !== null && (!couple || partnerAns !== null);
  const missing = !complete ? (couple ? (guestAns === null && partnerAns === null ? 'Chaque personne doit répondre.' : guestAns === null ? `${name1} doit encore répondre.` : `${name2} doit encore répondre.`) : 'Choisissez une réponse.') : '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complete || busy) return;
    setBusy(true); setError('');
    try {
      await submitRsvp(guest.id, {
        guestRsvp: guestAns, partnerRsvp: couple ? partnerAns : undefined, plusOneName: couple ? partnerName.trim() : '',
        attendingEvents: events, dietaryPreference: diet, allergies, personalNote: note1, partnerNote: couple ? note2 : '',
      });
      setDone(anyYes ? 'yes' : 'no');
      if (anyYes) confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
      top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Votre réponse n’a pas pu être enregistrée. Réessayez dans un instant.');
    } finally { setBusy(false); }
  };

  const input = 'w-full p-3 text-sm bg-slate-50 border border-[#EBC3CF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C65E7E]/40';

  return (
    <div ref={top} className="max-w-3xl mx-auto px-4 py-8 space-y-6 scroll-mt-28">
      <div className="space-y-1.5">
        <FloralDivider className="w-44 mb-1" /><span className="text-xs font-semibold text-[#B04C6B] tracking-[0.3em] uppercase">Réponse</span>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A2F38]">Votre réponse</h2>
        <p className="text-sm text-[#8C7480] leading-relaxed">
          {couple
            ? 'Cette invitation est pour deux : chaque personne indique sa présence. Vous pouvez modifier votre réponse jusqu’au jour J.'
            : 'Dites-nous si vous serez des nôtres. Vous pourrez modifier votre réponse jusqu’au jour J.'}
        </p>
      </div>

      {done && (
        <div role="status" className={`rounded-2xl p-5 border space-y-3 ${done === 'yes' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
          <p className="font-bold text-emerald-900 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-700" />{done === 'yes' ? 'Merci ! Votre réponse est enregistrée.' : 'Merci, votre réponse est enregistrée.'}</p>
          {done === 'yes' ? (
            <button onClick={onViewTicket} className="px-5 py-3 bg-[#C65E7E] hover:bg-[#A94566] text-white text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"><Ticket className="w-4 h-4" />Voir mon billet</button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-600">Vous êtes absent(e) : vous pouvez proposer quelqu’un pour vous représenter, si les mariés l’acceptent.</p>
              <button onClick={onProposeRepresentative} className="px-4 py-2.5 bg-white border border-[#E3B5C3] text-[#4A2F38] text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"><HelpCircle className="w-4 h-4 text-[#C65E7E]" />Proposer un représentant</button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={submit} className="bg-white rounded-2xl p-5 sm:p-7 border border-[#F6DCE4] shadow-sm space-y-7">
        <h3 className="font-serif text-xl font-bold text-[#4A2F38] border-b border-[#FBE9EE] pb-3">{guest.greetingTitle || name1}</h3>

        {/* Personne 1 */}
        <section className="space-y-3">
          <PersonChoice legend={couple ? `Personne 1 · ${name1}` : name1} value={guestAns} onChange={setGuestAns} disabled={busy} />
          <label className="block"><span className="block text-xs font-semibold text-[#5E4450] mb-1">{couple ? `Un mot de ${guest.firstName || 'la personne 1'} pour les mariés` : 'Un mot pour les mariés'} <span className="font-normal text-slate-400">(facultatif)</span></span>
            <textarea rows={2} value={note1} maxLength={600} onChange={(e) => setNote1(e.target.value)} placeholder="Votre message chaleureux…" className={input} /></label>
        </section>

        {/* Personne 2 : même formulaire, réponse distincte */}
        {couple && (
          <section className="space-y-3 pt-6 border-t border-dashed border-[#F3D0DB]">
            <label className="block"><span className="block text-xs font-semibold text-[#5E4450] mb-1">Personne 2 · prénom et nom</span>
              <input value={partnerName} maxLength={80} onChange={(e) => setPartnerName(e.target.value)} placeholder="Prénom et nom de votre conjoint(e)" className={input} /></label>
            <PersonChoice legend={`Personne 2 · ${name2}`} value={partnerAns} onChange={setPartnerAns} disabled={busy} />
            <label className="block"><span className="block text-xs font-semibold text-[#5E4450] mb-1">Un mot de {partnerName.trim() || 'la personne 2'} pour les mariés <span className="font-normal text-slate-400">(facultatif)</span></span>
              <textarea rows={2} value={note2} maxLength={600} onChange={(e) => setNote2(e.target.value)} placeholder="Un message de la part de votre conjoint(e)…" className={input} /></label>
          </section>
        )}

        {/* Détails utiles seulement si quelqu'un vient */}
        {anyYes && (
          <section className="space-y-5 pt-6 border-t border-[#FBE9EE]">
            {config.timelineEvents.length > 0 && (
              <div className="space-y-2">
                <div><span className="font-semibold text-[#4A2F38] text-sm block">Quels moments serez-vous présents ?</span><span className="text-xs text-[#9A8490]">Cochez ceux auxquels vous participerez.</span></div>
                {config.timelineEvents.map((ev) => (
                  <label key={ev.id} className="flex items-start gap-3 p-3 rounded-xl border border-[#F3D0DB] hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={events[ev.id] ?? true} onChange={(e) => setEvents({ ...events, [ev.id]: e.target.checked })} className="w-4 h-4 mt-0.5 accent-[#C65E7E]" />
                    <div><div className="font-semibold text-sm text-[#4A2F38]">{ev.title}</div><div className="text-xs text-[#8C7480]">{[ev.time, ev.locationName].filter(Boolean).join(' · ')}</div></div>
                  </label>
                ))}
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block"><span className="block text-xs font-semibold text-[#5E4450] mb-1">Menu</span>
                <select value={diet} onChange={(e) => setDiet(e.target.value as DietaryOption)} className={input}>{DIETS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select></label>
              <label className="block"><span className="block text-xs font-semibold text-[#5E4450] mb-1">Allergies <span className="font-normal text-slate-400">(facultatif)</span></span>
                <input value={allergies} maxLength={200} onChange={(e) => setAllergies(e.target.value)} className={input} /></label>
            </div>
          </section>
        )}

        <div className="space-y-3">
          {error && <p role="alert" className="flex items-start gap-2 text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"><AlertCircle className="w-4 h-4 shrink-0 mt-px" />{error}</p>}
          {!complete && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{missing}</p>}
          <button type="submit" disabled={!complete || busy} className="w-full py-4 bg-[#C65E7E] hover:bg-[#A94566] disabled:opacity-45 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}<span>{busy ? 'Enregistrement…' : 'Enregistrer ma réponse'}</span>
          </button>
          {hasTicket(guest) && !done && <button type="button" onClick={onViewTicket} className="w-full text-xs text-[#C65E7E] underline underline-offset-2 cursor-pointer">Retourner à mon billet</button>}
        </div>
      </form>
    </div>
  );
};
