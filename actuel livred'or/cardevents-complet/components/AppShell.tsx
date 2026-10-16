'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Ceremony, Group, GuestEntry, SessionInfo } from '@/lib/types';
import type { SiteSettings } from '@/lib/siteSettings';
import { api } from '@/lib/client/api';
import Navbar from './Navbar';
import SiteFooter from './SiteFooter';
import Welcome from './Welcome';
import LoginModal from './LoginModal';
import AdminView from './AdminView';
import GroupManagerView from './GroupManagerView';
import CeremonyFormModal, { type CeremonyFormValues } from './CeremonyFormModal';
import GroupFormModal from './GroupFormModal';
import AccessCodeModal from './AccessCodeModal';
import QrCodeModal from './QrCodeModal';
import SettingsModal from './SettingsModal';
import BookPdfModal from './BookPdfModal';

type Modal =
  | null
  | { kind: 'login'; tab: 'manager' | 'admin' }
  | { kind: 'ceremony'; ceremony?: Ceremony }
  | { kind: 'group'; ceremony: Ceremony }
  | { kind: 'code'; code: string; groupName: string }
  | { kind: 'qr'; group: Group; ceremony: Ceremony }
  | { kind: 'pdf'; ceremony: Ceremony; groupId?: string }
  | { kind: 'settings' };

const NONE: SessionInfo = { role: 'none', isAdmin: false };

export default function AppShell({ initialSettings, initialSession }: { initialSettings: SiteSettings; initialSession?: SessionInfo }) {
  const [settings, setSettings] = useState(initialSettings);
  const [session, setSession] = useState<SessionInfo | null>(initialSession ?? null);
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [entries, setEntries] = useState<GuestEntry[]>([]);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [notice, setNotice] = useState('');

  const fail = (e: unknown) => setNotice(e instanceof Error ? e.message : 'Une erreur est survenue.');

  const load = useCallback(async (s: SessionInfo) => {
    try {
      if (s.role === 'admin') {
        const [cg, en] = await Promise.all([api.ceremonies(), api.entries()]);
        setCeremonies(cg.ceremonies); setGroups(cg.groups); setEntries(en);
      } else if (s.role === 'manager') {
        const [me, en] = await Promise.all([api.managerMe(), api.entries()]);
        setCeremonies([me.ceremony]); setGroups([me.group]); setEntries(en);
      } else { setCeremonies([]); setGroups([]); setEntries([]); }
    } catch (e) { fail(e); }
  }, []);

  const refreshSession = useCallback(async () => {
    const s = await api.session().catch(() => NONE);
    setSession(s); setOpenGroupId(null);
    await load(s);
  }, [load]);

  useEffect(() => { refreshSession(); }, [refreshSession]);

  const logout = async () => { await api.logout().catch(() => {}); setSession(NONE); setOpenGroupId(null); setCeremonies([]); setGroups([]); setEntries([]); };
  const reload = () => (session ? load(session) : Promise.resolve());

  // ---- actions (chacune recharge les données depuis la base : pas d'état local qui diverge) ----
  const saveCeremony = async (existing: Ceremony | undefined, v: CeremonyFormValues, initialGroup?: string) => {
    if (existing) { await api.updateCeremony(existing.id, v); await reload(); return; }
    const { ceremony } = await api.createCeremony(v);
    if (initialGroup) {
      const r = await api.createGroup({ ceremonyId: ceremony.id, name: initialGroup, managerName: '', customIntro: `Bienvenue sur la page dédiée à ${ceremony.honoreeName}. Vos messages et vos souvenirs seront conservés dans le livre d'or.`, customPrompt: 'Partagez un souvenir, une anecdote ou vos vœux les plus sincères.', allowPhotos: true });
      setModal({ kind: 'code', code: r.accessCode, groupName: r.group.name });
    }
    await reload();
  };
  const createGroup = async (v: Record<string, unknown>) => {
    const r = await api.createGroup(v);
    setModal({ kind: 'code', code: r.accessCode, groupName: r.group.name });
    await reload();
  };
  const resetCode = async (g: Group) => {
    if (!confirm(`Générer un nouveau code pour « ${g.name} » ? L'ancien cessera immédiatement de fonctionner.`)) return;
    try { const r = await api.resetCode(g.id); setModal({ kind: 'code', code: r.accessCode, groupName: g.name }); await reload(); } catch (e) { fail(e); }
  };
  const deleteCeremony = async (c: Ceremony) => {
    if (!confirm(`Supprimer « ${c.title} », ses groupes ET tous leurs témoignages et photos référencés ? Action irréversible.`)) return;
    try { await api.deleteCeremony(c.id); await reload(); } catch (e) { fail(e); }
  };
  const deleteGroup = async (g: Group) => {
    if (!confirm(`Supprimer le groupe « ${g.name} » et tous ses témoignages ? Action irréversible.`)) return;
    try { await api.deleteGroup(g.id); await reload(); } catch (e) { fail(e); }
  };
  const saveGroup = async (g: Group, patch: Partial<Group>) => { await api.updateGroup(g.id, patch); await reload(); };
  const moderate = async (id: string, patch: { isPinned?: boolean; isApproved?: boolean }) => {
    try { const { entry } = await api.moderate(id, patch); setEntries((l) => l.map((e) => (e.id === id ? { ...e, ...entry } : e))); } catch (e) { fail(e); }
  };
  const deleteEntry = async (e: GuestEntry) => {
    if (!confirm(`Supprimer le témoignage de ${e.firstName} ${e.lastName} ?`)) return;
    try { await api.deleteEntry(e.id); setEntries((l) => l.filter((x) => x.id !== e.id)); } catch (err) { fail(err); }
  };

  if (!session) return <div className="min-h-screen flex items-center justify-center text-sm text-stone-500">Chargement…</div>;

  const group = session.role === 'manager' ? groups[0] : groups.find((g) => g.id === openGroupId);
  const ceremony = group ? ceremonies.find((c) => c.id === group.ceremonyId) : undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar settings={settings} role={session.role} managerLabel={session.role === 'manager' ? groups[0]?.managerName || groups[0]?.name : undefined}
        onLogin={() => setModal({ kind: 'login', tab: 'manager' })} onLogout={logout} onBrand={() => setOpenGroupId(null)} />

      {notice && <div className="bg-red-50 border-b border-red-200 text-red-800 text-xs px-4 py-2 flex justify-between"><span>{notice}</span><button onClick={() => setNotice('')}>Fermer</button></div>}

      <div className="flex-1">
        {session.role === 'none' && <Welcome settings={settings} onLogin={(tab) => setModal({ kind: 'login', tab })} />}

        {session.role === 'admin' && !group && (
          <AdminView ceremonies={ceremonies} groups={groups} entries={entries}
            onNewCeremony={() => setModal({ kind: 'ceremony' })} onEditCeremony={(c) => setModal({ kind: 'ceremony', ceremony: c })} onDeleteCeremony={deleteCeremony}
            onNewGroup={(c) => setModal({ kind: 'group', ceremony: c })} onOpenGroup={(g) => setOpenGroupId(g.id)} onDeleteGroup={deleteGroup} onResetCode={resetCode}
            onQr={(g, c) => setModal({ kind: 'qr', group: g, ceremony: c })} onPdf={(c) => setModal({ kind: 'pdf', ceremony: c })} onSettings={() => setModal({ kind: 'settings' })} />
        )}

        {group && ceremony && (
          <GroupManagerView ceremony={ceremony} group={group} entries={entries} onBack={session.role === 'admin' ? () => setOpenGroupId(null) : undefined}
            onSave={(p) => saveGroup(group, p)} onModerate={moderate} onDeleteEntry={deleteEntry}
            onQr={() => setModal({ kind: 'qr', group, ceremony })} onPdf={() => setModal({ kind: 'pdf', ceremony, groupId: group.id })} />
        )}
      </div>

      <SiteFooter settings={settings} />

      {modal?.kind === 'login' && <LoginModal open initialTab={modal.tab} brandName={settings.brandName} onClose={() => setModal(null)} onLoggedIn={refreshSession} />}
      {modal?.kind === 'ceremony' && <CeremonyFormModal ceremony={modal.ceremony} onClose={() => setModal(null)} onSubmit={(v, g) => saveCeremony(modal.ceremony, v, g)} />}
      {modal?.kind === 'group' && <GroupFormModal ceremony={modal.ceremony} onClose={() => setModal(null)} onSubmit={createGroup} />}
      {modal?.kind === 'code' && <AccessCodeModal code={modal.code} groupName={modal.groupName} onClose={() => setModal(null)} />}
      {modal?.kind === 'qr' && <QrCodeModal group={modal.group} ceremony={modal.ceremony} onClose={() => setModal(null)} />}
      {modal?.kind === 'settings' && <SettingsModal settings={settings} onClose={() => setModal(null)} onSave={async (s) => setSettings(await api.saveSettings(s))} />}
      {modal?.kind === 'pdf' && <BookPdfModal ceremony={modal.ceremony} groups={groups} entries={entries} defaultGroupId={modal.groupId} onClose={() => setModal(null)} />}
    </div>
  );
}
