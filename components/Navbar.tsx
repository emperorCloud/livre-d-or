'use client';
import { LogIn, LogOut, Shield, Users } from 'lucide-react';
import type { AuthRole } from '@/lib/types';
import type { SiteSettings } from '@/lib/siteSettings';

interface Props { settings: SiteSettings; role: AuthRole; managerLabel?: string; onLogin?: () => void; onLogout?: () => void; onBrand?: () => void }

export default function Navbar({ settings, role, managerLabel, onLogin, onLogout, onBrand }: Props) {
  const initials = settings.brandName.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6 h-16">
        <button onClick={onBrand} className="flex items-center gap-3 font-serif-cinzel font-bold tracking-widest text-lg text-amber-100 hover:text-white transition-colors shrink-0">
          <span className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300 text-sm">{initials}</span>
          <span className="truncate max-w-[40vw] sm:max-w-none uppercase">{settings.brandName}</span>
        </button>

        <div className="hidden md:flex items-center text-xs text-stone-400">
          {role === 'admin' && <Badge icon={<Shield className="w-3.5 h-3.5 text-amber-400" />}>Tableau de bord Administrateur</Badge>}
          {role === 'manager' && <Badge icon={<Users className="w-3.5 h-3.5 text-amber-400" />}>Espace Responsable{managerLabel ? ` · ${managerLabel}` : ''}</Badge>}
          {role === 'none' && <span className="italic">{settings.brandTagline}</span>}
        </div>

        {onLogin || onLogout ? (
          role === 'none' ? (
            <button onClick={onLogin} className="px-4 py-2 text-xs font-semibold text-stone-950 bg-amber-200 hover:bg-amber-100 rounded-xl transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap">
              <LogIn className="w-3.5 h-3.5" /><span>{settings.loginLabel}</span>
            </button>
          ) : (
            <button onClick={onLogout} className="px-3.5 py-1.5 text-xs font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl transition-all flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5" /><span>Déconnexion</span>
            </button>
          )
        ) : <span />}
      </div>
    </header>
  );
}

function Badge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <span className="flex items-center gap-1.5 text-amber-200 bg-stone-800/80 px-3 py-1 rounded-full border border-stone-700">{icon}<span>{children}</span></span>;
}
