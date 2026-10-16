'use client';
import { ArrowRight, Cake, Briefcase, Camera, FileText, Flame, Gem, LogIn, QrCode, ShieldCheck, Smartphone, Users } from 'lucide-react';
import type { SiteSettings } from '@/lib/siteSettings';
import { faq, steps } from '@/lib/homeContent';

interface Props { settings: SiteSettings; onLogin: (tab: 'manager' | 'admin') => void }

const TYPES = [
  { icon: Flame, title: 'Deuil & hommage', text: 'Un espace recueilli pour rassembler les mots et les souvenirs de tous les proches.' },
  { icon: Gem, title: 'Mariage', text: 'Les vœux et les photos des invités, réunis dans un livre élégant.' },
  { icon: Cake, title: 'Anniversaire', text: 'Un cadeau collectif à offrir : messages, anecdotes et photos de toute une vie.' },
  { icon: Briefcase, title: 'Départ à la retraite', text: 'Les équipes et les collègues saluent une carrière en quelques lignes.' },
];

const FEATURES = [
  { icon: QrCode, title: 'Lien privé & QR code', text: "Un lien unique par groupe, à partager ou à imprimer. Aucun compte pour les invités." },
  { icon: Smartphone, title: 'Pensé pour le mobile', text: "Les proches écrivent et ajoutent leurs photos en quelques secondes depuis leur téléphone." },
  { icon: Camera, title: 'Photos optimisées', text: "Jusqu'à 6 photos par invité, redimensionnées automatiquement pour un rendu net et léger." },
  { icon: ShieldCheck, title: 'Modération simple', text: "Masquez, épinglez ou supprimez un message avant de composer le livre." },
  { icon: Users, title: 'Groupes cloisonnés', text: "Famille, amis, collègues : chaque responsable ne voit que son groupe." },
  { icon: FileText, title: 'Livre PDF A4', text: "Couverture, messages et photos mis en page en haute définition, prêts à imprimer." },
];

export default function Welcome({ settings, onLogin }: Props) {
  return (
    <main>
      <section className="bg-gradient-to-b from-stone-900 via-stone-900 to-stone-800 text-stone-100">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center space-y-7">
          <p className="text-xs uppercase tracking-[0.3em] font-serif-cinzel font-semibold text-amber-300">{settings.welcomeKicker}</p>
          <h1 className="text-3xl sm:text-5xl font-serif-cormorant font-bold tracking-tight leading-tight text-amber-50">{settings.welcomeTitle}</h1>
          <p className="text-sm sm:text-base text-stone-300 max-w-2xl mx-auto leading-relaxed">{settings.welcomeText}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button onClick={() => onLogin('manager')} className="px-6 py-3 text-sm font-semibold text-stone-950 bg-amber-300 hover:bg-amber-200 rounded-xl transition-all shadow-md flex items-center gap-2">
              <LogIn className="w-4 h-4" /><span>{settings.loginLabel}</span>
            </button>
            <a href="#comment-ca-marche" className="px-6 py-3 text-sm font-medium text-amber-100 border border-stone-600 hover:border-amber-300 rounded-xl transition-all">Comment ça marche</a>
          </div>
        </div>
      </section>

      <section aria-labelledby="ceremonies" className="max-w-6xl mx-auto px-4 py-14">
        <h2 id="ceremonies" className="text-2xl sm:text-3xl font-serif-cormorant font-bold text-center text-stone-900">Pour chaque moment qui compte</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-8">
          {TYPES.map(({ icon: Icon, title, text }) => (
            <article key={title} className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-3">
              <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center"><Icon className="w-5 h-5" aria-hidden="true" /></span>
              <h3 className="font-serif-cinzel font-semibold text-stone-900 text-base">{title}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="comment-ca-marche" aria-labelledby="etapes" className="bg-white border-y border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <h2 id="etapes" className="text-2xl sm:text-3xl font-serif-cormorant font-bold text-center text-stone-900">Comment ça marche</h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            {steps.map((s, i) => (
              <li key={s.title} className="space-y-2">
                <span className="w-9 h-9 rounded-full bg-stone-900 text-amber-300 font-serif-cinzel font-bold flex items-center justify-center text-sm">{i + 1}</span>
                <h3 className="font-semibold text-stone-900">{s.title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="atouts" className="max-w-6xl mx-auto px-4 py-14">
        <h2 id="atouts" className="text-2xl sm:text-3xl font-serif-cormorant font-bold text-center text-stone-900">Tout ce qu'il faut pour un beau livre d'or</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-8">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3 p-5 bg-white border border-stone-200 rounded-2xl">
              <Icon className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
              <div><h3 className="font-semibold text-stone-900 text-sm">{title}</h3><p className="text-xs text-stone-600 leading-relaxed mt-1">{text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Espaces de connexion" className="max-w-4xl mx-auto px-4 pb-14 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Espace Administrateur" onClick={() => onLogin('admin')} cta="Ouvrir l'administration →"
          text="Créez les cérémonies, les groupes et les codes de vos responsables, réglez l'en-tête et les textes du site, et générez les livres PDF complets." />
        <Card title="Espace Responsable" onClick={() => onLogin('manager')} cta="Ouvrir mon espace →"
          text="Choisissez la photo du concerné à la une, diffusez votre lien et votre QR code, modérez les messages et téléchargez le livre PDF de votre groupe." />
      </section>

      <section aria-labelledby="faq" className="bg-white border-t border-stone-200">
        <div className="max-w-3xl mx-auto px-4 py-14">
          <h2 id="faq" className="text-2xl sm:text-3xl font-serif-cormorant font-bold text-center text-stone-900">Questions fréquentes</h2>
          <div className="pt-8 space-y-3">
            {faq(settings.brandName).map((f) => (
              <details key={f.q} className="group bg-stone-50 border border-stone-200 rounded-xl px-5 py-4">
                <summary className="cursor-pointer font-semibold text-sm text-stone-900 list-none flex justify-between gap-4">{f.q}<span className="text-amber-800 group-open:rotate-45 transition-transform">+</span></summary>
                <p className="text-sm text-stone-600 leading-relaxed pt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Card({ title, text, cta, onClick }: { title: string; text: string; cta: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-left p-6 bg-white border border-stone-200 rounded-2xl shadow-xs hover:border-amber-600 transition-all space-y-3 group">
      <span className="flex items-center justify-between">
        <span className="font-serif-cinzel font-semibold text-stone-900 text-base">{title}</span>
        <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-800 transition-colors" aria-hidden="true" />
      </span>
      <span className="block text-xs text-stone-600 leading-relaxed">{text}</span>
      <span className="text-xs font-semibold text-amber-900 inline-block">{cta}</span>
    </button>
  );
}
