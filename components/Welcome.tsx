'use client';
import { ArrowRight, LogIn } from 'lucide-react';
import type { SiteSettings } from '@/lib/siteSettings';

interface Props { settings: SiteSettings; onLogin: (tab: 'manager' | 'admin') => void }

export default function Welcome({ settings, onLogin }: Props) {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center space-y-8">
      <div className="space-y-4">
        <span className="text-xs uppercase tracking-[0.3em] font-serif-cinzel font-semibold text-amber-900 block">{settings.welcomeKicker}</span>
        <h1 className="text-3xl sm:text-5xl font-serif-cormorant font-bold text-stone-900 tracking-tight leading-tight">{settings.welcomeTitle}</h1>
        <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">{settings.welcomeText}</p>
      </div>
      <div className="flex justify-center pt-2">
        <button onClick={() => onLogin('manager')} className="px-6 py-3 text-sm font-semibold text-stone-950 bg-amber-300 hover:bg-amber-200 rounded-xl transition-all shadow-md flex items-center gap-2">
          <LogIn className="w-4 h-4" /><span>{settings.loginLabel} (Administrateur ou Responsable)</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 text-left">
        <Card title="Espace Administrateur" onClick={() => onLogin('admin')} cta="Ouvrir l'administration →"
          text="Créez les cérémonies, les groupes et les codes de vos responsables, réglez l'en-tête, le pied de page et les textes du site, et générez les livres PDF complets." />
        <Card title="Espace Responsable" onClick={() => onLogin('manager')} cta="Ouvrir mon espace →"
          text="Choisissez la photo du concerné à la une (mobile et ordinateur), diffusez votre lien et votre QR code, modérez les messages et téléchargez le livre PDF de votre groupe." />
      </div>
    </main>
  );
}

function Card({ title, text, cta, onClick }: { title: string; text: string; cta: string; onClick: () => void }) {
  return (
    <div onClick={onClick} className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs hover:border-amber-600 cursor-pointer transition-all space-y-3 group">
      <div className="flex items-center justify-between">
        <h3 className="font-serif-cinzel font-semibold text-stone-900 text-base">{title}</h3>
        <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-800 transition-colors" />
      </div>
      <p className="text-xs text-stone-600 leading-relaxed">{text}</p>
      <span className="text-xs font-semibold text-amber-900 inline-block">{cta}</span>
    </div>
  );
}
