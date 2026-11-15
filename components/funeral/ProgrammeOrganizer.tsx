'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bus as BusIcon, CalendarDays, Check, Copy, ExternalLink, HandHeart, Loader2, Save, UserRound, Users } from 'lucide-react';
import type { Ceremony, Group } from '@/lib/types';
import type { FuneralConfig, FuneralState } from '@/lib/funeral/types';
import { funeralApi } from '@/lib/funeral/client';
import { copyText } from '@/lib/client/links';
import { IdentityTab, FairePartTab, ProgrammeTab } from './organizer/ConfigTabs';
import { BusesTab } from './organizer/BusesTab';
import { DonationsTab } from './organizer/DonationsTab';
import { V, themeStyle } from './ui';

type Tab = 'identite' | 'faire-part' | 'programme' | 'convois' | 'dons';
const TABS: { id: Tab; label: string; icon: typeof UserRound }[] = [
  { id: 'identite', label: 'Identité', icon: UserRound }, { id: 'faire-part', label: 'Faire-part', icon: Users },
  { id: 'programme', label: 'Programme', icon: CalendarDays }, { id: 'convois', label: 'Convois', icon: BusIcon }, { id: 'dons', label: 'Dons', icon: HandHeart },
];
const CONFIG_TABS: Tab[] = ['identite', 'faire-part', 'programme'];

/** Espace « Programme » d'un deuil : même responsable que le livre d'or, même code d'accès. */
export default function ProgrammeOrganizer({ ceremony, group }: { ceremony: Ceremony; group: Group }) {
  const api = useMemo(() => funeralApi(ceremony.id), [ceremony.id]);
  const [state, setState] = useState<FuneralState | null>(null);
  const [draft, setDraft] = useState<FuneralConfig | null>(null);
  const [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false), [saved, setSaved] = useState(false);
  const [error, setError] = useState(''), [copied, setCopied] = useState(false), [tab, setTab] = useState<Tab>('identite');

  const load = useCallback(async () => {
    try { const s = await api.state(); setState(s); setDraft((d) => d ?? s.config); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Chargement impossible.'); }
  }, [api]);
  // Recharge seulement les données « vivantes » (réservations, dons, bus) : le brouillon en cours de saisie n'est jamais écrasé.
  const reloadLive = useCallback(async () => {
    const s = await api.state();
    setState((p) => (p ? { ...p, buses: s.buses, reservations: s.reservations, donations: s.donations } : s));
  }, [api]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (tab !== 'convois' && tab !== 'dons') return;
    const t = setInterval(() => { if (document.visibilityState === 'visible') reloadLive().catch(() => undefined); }, 20_000);
    return () => clearInterval(t);
  }, [tab, reloadLive]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const onChange = (c: FuneralConfig) => { setDraft(c); setDirty(true); setSaved(false); };
  const save = async () => {
    if (!draft) return;
    setBusy(true); setError('');
    try { const r = await api.saveConfig(draft); setDraft(r.config); setState((p) => (p ? { ...p, config: r.config } : p)); setDirty(false); setSaved(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Enregistrement impossible.'); } finally { setBusy(false); }
  };

  const url = typeof window === 'undefined' ? '' : `${window.location.origin}/p/${group.inviteSlug}`;
  const copy = async () => { if (await copyText(url)) { setCopied(true); setTimeout(() => setCopied(false), 1800); } };

  return (
    <div style={themeStyle((draft ?? state?.config)?.profile.pageColor ?? '')} className="rounded-3xl bg-gradient-to-b from-[var(--pg-from,#1A0B2E)] via-[var(--pg-via,#22103F)] to-[var(--pg-to,#12081F)] text-violet-50 p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><span className="text-[11px] uppercase tracking-[0.25em] text-violet-300 font-semibold">Programme des obsèques</span>
          <p className={`text-xs ${V.muted} mt-0.5 break-all`}>{url}</p></div>
        <div className="flex gap-2"><button onClick={copy} className={V.btnGhost}>{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copié' : 'Copier le lien'}</button>
          <a href={`/p/${group.inviteSlug}`} target="_blank" rel="noopener noreferrer" className={V.btnGhost}><ExternalLink className="w-3.5 h-3.5" />Voir la page</a></div>
      </div>

      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-white/10">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`shrink-0 px-3 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 ${tab === id ? 'border-violet-300 text-violet-50' : 'border-transparent text-violet-300/70 hover:text-violet-100'}`}><Icon className="w-4 h-4" />{label}</button>
        ))}
      </div>

      {error && <div className="p-3 rounded-lg text-xs bg-red-500/15 border border-red-300/30 text-red-100">{error} {!state && <button className="underline ml-1" onClick={load}>Réessayer</button>}</div>}
      {!state || !draft ? (!error && <div className="flex items-center gap-2 text-sm text-violet-200 py-10 justify-center"><Loader2 className="w-4 h-4 animate-spin" />Chargement…</div>) : (
        <>
          {tab === 'identite' && <IdentityTab config={draft} onChange={onChange} />}
          {tab === 'faire-part' && <FairePartTab config={draft} onChange={onChange} />}
          {tab === 'programme' && <ProgrammeTab config={draft} onChange={onChange} />}
          {tab === 'convois' && <BusesTab api={api} state={state} reload={reloadLive} currency={state.config.profile.currency} />}
          {tab === 'dons' && <DonationsTab api={api} state={state} reload={reloadLive} honoree={ceremony.honoreeName} />}
          {CONFIG_TABS.includes(tab) && (
            <div className="sticky bottom-3 z-20 flex items-center justify-end gap-3 p-3 rounded-2xl border border-white/15 bg-[var(--pg-surface,#1E0F36)]/95 backdrop-blur">
              <span className={`text-xs ${dirty ? 'text-amber-200' : V.muted}`}>{dirty ? 'Modifications non enregistrées' : saved ? 'Enregistré ✓' : 'À jour'}</span>
              <button onClick={save} disabled={busy || !dirty} className={V.btn}>{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Enregistrer</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
