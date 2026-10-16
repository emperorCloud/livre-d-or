'use client';
import { useState } from 'react';
import { ArrowRight, Key, Lock, Shield, Users, X } from 'lucide-react';
import { api } from '@/lib/client/api';

interface Props { open: boolean; initialTab?: 'manager' | 'admin'; brandName: string; onClose: () => void; onLoggedIn: () => void }

export default function LoginModal({ open, initialTab = 'manager', brandName, onClose, onLoggedIn }: Props) {
  const [tab, setTab] = useState<'manager' | 'admin'>(initialTab);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      if (tab === 'manager') await api.managerLogin(code); else await api.adminLogin(password);
      setCode(''); setPassword('');
      onLoggedIn(); onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible.');
    } finally { setBusy(false); }
  };

  const tabBtn = (id: 'manager' | 'admin', icon: React.ReactNode, label: string) => (
    <button type="button" onClick={() => { setTab(id); setError(''); }}
      className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${tab === id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}>
      {icon}<span>{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-stone-50 border border-stone-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-stone-900">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-100/70">
          <div>
            <span className="text-[11px] font-serif-cinzel uppercase tracking-widest text-amber-800 font-bold block">{brandName}</span>
            <h3 className="text-xl font-serif-cinzel font-semibold">Espace de connexion</h3>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-1 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-2 bg-stone-200/70 grid grid-cols-2 gap-1 border-b border-stone-200">
          {tabBtn('manager', <Users className="w-3.5 h-3.5 text-amber-800" />, 'Responsable')}
          {tabBtn('admin', <Shield className="w-3.5 h-3.5 text-amber-800" />, 'Administrateur')}
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}
          {tab === 'manager' ? (
            <div>
              <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">Code d'accès responsable</label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input required autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="XXXXXX-XXXXXXXXXX" value={code} onChange={(e) => setCode(e.target.value)}
                  className="w-full text-sm font-mono uppercase bg-white border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Le code fourni par l'administrateur pour gérer la page de votre groupe.</p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">Mot de passe administrateur</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm bg-white border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Gestion de toutes les cérémonies, des groupes, des codes et des paramètres du site.</p>
            </div>
          )}
          <button type="submit" disabled={busy} className="w-full py-2.5 text-xs font-semibold text-stone-950 bg-amber-300 hover:bg-amber-200 disabled:opacity-60 rounded-xl shadow flex items-center justify-center gap-2">
            <span>{busy ? 'Connexion…' : tab === 'manager' ? 'Accéder à mon espace responsable' : "Accéder à l'administration"}</span>
            {!busy && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
