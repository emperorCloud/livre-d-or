'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CalendarPlus, Clock, Flame, HandHeart, Printer, Share2, Users, Bus as BusIcon, CalendarDays } from 'lucide-react';
import { EVENT_CATEGORIES, type PublicProgramme } from '@/lib/funeral/types';
import { frDate, frLongDate, frTime, telHref } from '@/lib/funeral/format';
import { downloadIcs, printBooklet } from '@/lib/funeral/print';
import { programmeApi } from '@/lib/funeral/client';
import { copyText } from '@/lib/client/links';
import { ConvoisPanel, DonsPanel, MapLink } from './PublicPanels';
import { ItinerarySection } from './Itineraries';
import { V, themeStyle } from './ui';

type Tab = 'programme' | 'faire-part' | 'convois' | 'dons';
const TABS: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
  { id: 'programme', label: 'Programme', icon: CalendarDays }, { id: 'faire-part', label: 'Faire-part', icon: Users },
  { id: 'convois', label: 'Convois', icon: BusIcon }, { id: 'dons', label: 'Soutien', icon: HandHeart },
];

export default function ProgrammePublic({ initial }: { initial: PublicProgramme }) {
  const [p, setP] = useState(initial);
  const [tab, setTab] = useState<Tab>('programme');
  const [shared, setShared] = useState(false);
  const pr = p.config.profile;

  useEffect(() => { const h = window.location.hash.slice(1) as Tab; if (TABS.some((t) => t.id === h)) setTab(h); }, []);
  const go = (t: Tab) => { setTab(t); window.history.replaceState(null, '', `#${t}`); };

  // Places restantes, dons confirmés et rappels : rafraîchis au retour sur la page et toutes les 60 s.
  const refresh = useCallback(() => { programmeApi(p.slug).get().then(setP).catch(() => undefined); }, [p.slug]);
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 60_000);
    const v = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', v);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', v); };
  }, [refresh]);

  const notices = p.config.notices.filter((n) => !n.showFrom || new Date(`${n.showFrom}:00+01:00`).getTime() <= Date.now());
  const days = useMemo(() => {
    const dated = [...new Set(p.config.events.filter((e) => e.date).map((e) => e.date))].sort();
    return dated.map((d) => ({ date: d, events: p.config.events.filter((e) => e.date === d).sort((a, b) => a.startTime.localeCompare(b.startTime)) }));
  }, [p.config.events]);
  const undated = p.config.events.filter((e) => !e.date);
  const name = [pr.titles, p.ceremony.honoreeName].filter(Boolean).join(' ');

  const share = async () => {
    const url = window.location.origin + `/p/${p.slug}`;
    if (navigator.share) { try { await navigator.share({ title: `Obsèques de ${name}`, url }); return; } catch { /* annulé */ } }
    if (await copyText(url)) { setShared(true); setTimeout(() => setShared(false), 1800); }
  };

  const eventCard = (e: PublicProgramme['config']['events'][number]) => (
    <article key={e.id} className={`${e.isKey ? V.cardKey : V.card} p-4 sm:p-5 space-y-2`}>
      <div className="flex items-start gap-3">
        <div className="text-right shrink-0 w-16"><p className="text-lg font-semibold text-amber-200 leading-tight">{frTime(e.startTime) || '—'}</p>{e.endTime && <p className={`text-[11px] ${V.muted}`}>→ {frTime(e.endTime)}</p>}</div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-violet-300">{EVENT_CATEGORIES.find((c) => c.value === e.category)?.label}</p>
          <h3 className="text-lg font-semibold leading-snug">{e.title}</h3>
          {(e.locationName || e.locationAddress) && <p className={`text-sm ${V.muted}`}>{[e.locationName, e.locationAddress].filter(Boolean).join(' — ')}</p>}
        </div>
      </div>
      {e.description && <p className="text-sm text-violet-100/90 whitespace-pre-line">{e.description}</p>}
      {(e.leader || e.dressCode) && <p className={`text-xs ${V.muted}`}>{[e.leader && `Officiant : ${e.leader}`, e.dressCode && `Tenue : ${e.dressCode}`].filter(Boolean).join(' · ')}</p>}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <MapLink url={e.mapUrl} />
        {e.date && <button onClick={() => downloadIcs(e, p.ceremony.honoreeName)} className="inline-flex items-center gap-1 text-xs text-violet-200 underline underline-offset-2"><CalendarPlus className="w-3.5 h-3.5" />Ajouter à mon agenda</button>}
      </div>
    </article>
  );

  return (
    <div className={V.page} style={themeStyle(pr.pageColor)}>
      {notices.map((n) => (
        <div key={n.id} role="status" className="bg-amber-200/15 border-b border-amber-200/30 px-4 py-2.5 text-sm flex items-start gap-2 justify-center text-amber-100">
          <Bell className="w-4 h-4 mt-0.5 shrink-0" /><span><b>{n.title}</b>{n.title && n.message ? ' — ' : ''}{n.message}</span>
        </div>
      ))}

      <header className="max-w-3xl mx-auto px-5 pt-12 pb-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-violet-300 flex items-center justify-center gap-2"><Flame className="w-3.5 h-3.5" />Programme des obsèques</p>
        {pr.photoUrl && <img src={pr.photoUrl} alt={`Portrait de ${p.ceremony.honoreeName}`} className="w-40 h-40 sm:w-48 sm:h-48 rounded-full object-cover mx-auto mt-6 border-4 border-violet-300/40 shadow-2xl" />}
        <h1 className="text-4xl sm:text-5xl font-semibold mt-6 leading-tight font-serif-cormorant">{name}</h1>
        <p className="text-amber-200 mt-2 text-sm">{[pr.birthDate && frDate(pr.birthDate), pr.deathDate && frDate(pr.deathDate)].filter(Boolean).join('  —  ')}</p>
        {pr.epitaph && <p className="italic text-violet-200/90 mt-4 font-serif-cormorant text-lg">« {pr.epitaph} »</p>}
        <p className={`text-xs mt-3 ${V.muted}`}>{[p.ceremony.location, pr.hometown && `Village : ${pr.hometown}`].filter(Boolean).join(' · ')}</p>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <button onClick={() => printBooklet(p)} className={V.btnGhost}><Printer className="w-3.5 h-3.5" />Livret imprimable</button>
          <button onClick={share} className={V.btnGhost}><Share2 className="w-3.5 h-3.5" />{shared ? 'Lien copié ✓' : 'Partager'}</button>
        </div>
      </header>

      <nav aria-label="Sections" className="sticky top-0 z-30 backdrop-blur bg-[var(--pg-from,#1A0B2E)]/85 border-y border-white/10">
        <div className="max-w-3xl mx-auto flex">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => go(id)} aria-current={tab === id} className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${tab === id ? 'border-violet-300 text-violet-50' : 'border-transparent text-violet-300/70 hover:text-violet-100'}`}>
              <Icon className="w-4 h-4" /><span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-6">
        {/* Les quatre sections restent dans le HTML (lisibles par les moteurs de recherche) ; seule la section active est affichée. */}
        <section id="programme" hidden={tab !== 'programme'} className="space-y-8" aria-labelledby="h-programme">
          <h2 id="h-programme" className="sr-only">Programme des cérémonies</h2>
          {pr.familyMessage && <div className={`${V.card} p-5 text-sm leading-relaxed whitespace-pre-line`}>{pr.familyMessage}</div>}
          {days.length === 0 && undated.length === 0 && <p className={`${V.card} p-6 text-sm ${V.muted}`}>Le programme détaillé sera publié très bientôt.</p>}
          {days.map((d) => (
            <div key={d.date} className="space-y-3">
              <h3 className="text-sm uppercase tracking-widest text-violet-300 flex items-center gap-2"><Clock className="w-4 h-4" /><time dateTime={d.date}>{frLongDate(d.date)}</time></h3>
              {d.events.map(eventCard)}
            </div>
          ))}
          {undated.length > 0 && <div className="space-y-3">{undated.map(eventCard)}</div>}
          <ItinerarySection items={p.config.itineraries} honoree={p.ceremony.honoreeName} />
          {pr.dressCodeAdvice && <div className={`${V.card} p-5`}><p className={`text-xs uppercase tracking-widest ${V.muted} mb-1`}>Tenue conseillée</p><p className="text-sm whitespace-pre-line">{pr.dressCodeAdvice}</p></div>}
          {pr.biography && <div className="space-y-2"><h3 className="text-sm uppercase tracking-widest text-violet-300">Son parcours</h3><p className="text-sm leading-relaxed text-violet-100/90 whitespace-pre-line">{pr.biography}</p></div>}
        </section>

        <section id="faire-part" hidden={tab !== 'faire-part'} className="space-y-4" aria-labelledby="h-fp">
          <h2 id="h-fp" className="text-xl font-semibold font-serif-cormorant text-center">Faire-part</h2>
          {p.config.fairePart.header && <p className="text-center text-sm leading-relaxed whitespace-pre-line">{p.config.fairePart.header}</p>}
          {p.config.fairePart.groups.map((g) => (
            <div key={g.id} className={`${V.card} p-5`}><h3 className="text-xs uppercase tracking-widest text-violet-300 mb-2">{g.title}</h3><ul className="space-y-1.5 text-sm">{g.members.map((m, i) => <li key={i} className="flex gap-2.5"><span aria-hidden className="mt-[0.55em] w-1 h-1 rounded-full bg-violet-300/70 shrink-0" /><span>{m}</span></li>)}</ul></div>
          ))}
          {p.config.fairePart.footer && <p className={`text-center text-sm italic ${V.muted} whitespace-pre-line`}>{p.config.fairePart.footer}</p>}
          {!p.config.fairePart.header && p.config.fairePart.groups.length === 0 && <p className={`${V.card} p-6 text-sm ${V.muted}`}>Le faire-part sera publié très bientôt.</p>}
        </section>

        <section id="convois" hidden={tab !== 'convois'} aria-labelledby="h-convois">
          <h2 id="h-convois" className="text-xl font-semibold font-serif-cormorant text-center mb-4">Convois & transport</h2>
          <ConvoisPanel p={p} onChanged={refresh} />
        </section>

        <section id="dons" hidden={tab !== 'dons'} aria-labelledby="h-dons">
          <h2 id="h-dons" className="text-xl font-semibold font-serif-cormorant text-center mb-4">Soutenir la famille</h2>
          <DonsPanel p={p} />
        </section>
      </main>

      <footer className="max-w-3xl mx-auto px-5 pb-10 text-center space-y-2">
        {(pr.contactPhone || pr.contactEmail) && <p className="text-sm">Contact de la famille : {pr.contactPhone && <a className="underline" href={telHref(pr.contactPhone)}>{pr.contactPhone}</a>} {pr.contactEmail && <a className="underline" href={`mailto:${pr.contactEmail}`}>{pr.contactEmail}</a>}</p>}
        <p className={`text-[11px] ${V.muted}`}>Page publiée avec CardEvents: +237 622 280 626, infos-cardevents@cardit.cm</p>
      </footer>
    </div>
  );
}
