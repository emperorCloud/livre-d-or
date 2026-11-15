'use client';
import { ArrowRight, BookOpen, Cake, Church, Flower2, Gem, Heart, LogIn, MessageCircle, PartyPopper, QrCode, Sparkles, Ticket, Users } from 'lucide-react';
import type { SiteSettings } from '@/lib/siteSettings';
import { faq, PILLARS, SERVICE_PAGES, STEPS } from '@/lib/homeContent';
import { FloralBranch, FloralCorner, FloralDivider } from './decor/Flowers';
import { contactLink } from './site/contact';

interface Props { settings: SiteSettings; onLogin: (tab: 'manager' | 'admin') => void }

const SERVICE_ICON: Record<string, typeof Heart> = { mariage: Gem, 'deuil-hommage': Flower2, anniversaire: Cake, 'bapteme-communion': Church, 'depart-retraite': PartyPopper };
const SERVICE_BLURB: Record<string, string> = {
  mariage: "Organisation, décoration florale, coordination du jour J et invitations en ligne avec billets QR.",
  'deuil-hommage': "Programme en ligne, plans d'accès, convois, soutien à la famille et livre d'or, avec sobriété.",
  anniversaire: "Thème, décor et déroulé de la fête, puis un livre d'or offert en livre souvenir.",
  'bapteme-communion': "La réception après la célébration, organisée dans la douceur, avec un livre d'or pour l'enfant.",
  'depart-retraite': "Une cérémonie à la hauteur d'une carrière, avec les messages de toute l'équipe.",
};
const PILLAR_ICON = [Sparkles, Flower2, Users, QrCode];

const rose = 'text-[#C65E7E]';
const card = 'bg-white border border-[#F6DCE4] rounded-3xl shadow-sm shadow-[#C65E7E]/5';

export default function Welcome({ settings, onLogin }: Props) {
  const contact = contactLink(settings);
  return (
    <main className="bg-[#FFFAF7] text-[#4A2F38]">
      {/* ---------- Accueil ---------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FFE4EB] via-[#FFF0F4] to-[#FFFAF7]">
        <FloralCorner className="pointer-events-none absolute -top-8 -left-10 w-52 sm:w-96" />
        <FloralCorner className="pointer-events-none absolute -top-8 -right-10 w-52 sm:w-96 scale-x-[-1]" />
        <div className="relative z-10 max-w-3xl mx-auto px-5 pt-28 pb-20 sm:pt-36 sm:pb-28 text-center space-y-6">
          <p className="text-[11px] tracking-[0.4em] uppercase font-semibold text-[#B04C6B]">{settings.welcomeKicker}</p>
          <h1 className="font-serif-cormorant text-4xl sm:text-6xl font-semibold leading-[1.08] text-[#4A2F38]">{settings.welcomeTitle}</h1>
          <FloralDivider className="w-56 mx-auto" />
          <p className="text-sm sm:text-lg text-[#6E5560] max-w-2xl mx-auto leading-relaxed">{settings.welcomeText}</p>
          {settings.serviceArea && <p className="text-xs tracking-widest uppercase text-[#B04C6B]">{settings.serviceArea}</p>}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {contact && <a href={contact.href} target="_blank" rel="noopener noreferrer" className="px-6 py-3.5 text-sm font-semibold text-white bg-[#C65E7E] hover:bg-[#B04C6B] rounded-full shadow-md shadow-[#C65E7E]/30 transition flex items-center gap-2"><MessageCircle className="w-4 h-4" />Parler de mon événement</a>}
            <a href="#evenements" className={`px-6 py-3.5 text-sm font-semibold rounded-full transition flex items-center gap-2 ${contact ? 'text-[#A94566] bg-white border border-[#F3D0DB] hover:bg-[#FDEBF0]' : 'text-white bg-[#C65E7E] hover:bg-[#B04C6B] shadow-md'}`}>Découvrir nos événements<ArrowRight className="w-4 h-4" /></a>
          </div>
        </div>
      </section>

      {/* ---------- Ce que nous faisons ---------- */}
      <section aria-labelledby="savoir-faire" className="max-w-6xl mx-auto px-5 py-16">
        <div className="text-center space-y-2">
          <p className={`text-[11px] tracking-[0.35em] uppercase font-semibold ${rose}`}>Notre métier</p>
          <h2 id="savoir-faire" className="font-serif-cormorant text-3xl sm:text-5xl font-semibold">Sur le terrain et en numérique</h2>
          <p className="text-sm sm:text-base text-[#6E5560] max-w-2xl mx-auto">Un seul interlocuteur, de l'idée à la dernière photo : nous organisons, nous embellissons, nous coordonnons et nous prolongeons l'événement en ligne.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-10">
          {PILLARS.map((p, i) => { const Icon = PILLAR_ICON[i]; return (
            <article key={p.id} className={`${card} p-6 space-y-3`}>
              <span className="w-11 h-11 rounded-2xl bg-[#FDEBF0] text-[#C65E7E] flex items-center justify-center"><Icon className="w-5 h-5" aria-hidden="true" /></span>
              <h3 className="font-serif-cormorant text-2xl font-semibold">{p.title}</h3>
              <p className="text-sm text-[#6E5560] leading-relaxed">{p.text}</p>
            </article>
          ); })}
        </div>
      </section>

      {/* ---------- Événements ---------- */}
      <section id="evenements" aria-labelledby="evenements-titre" className="relative bg-[#FFF1F5] border-y border-[#F6DCE4] overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-5 py-16">
          <div className="text-center space-y-2">
            <p className={`text-[11px] tracking-[0.35em] uppercase font-semibold ${rose}`}>Chaque moment compte</p>
            <h2 id="evenements-titre" className="font-serif-cormorant text-3xl sm:text-5xl font-semibold">Les cérémonies que nous organisons</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-10">
            {SERVICE_PAGES.map((s) => { const Icon = SERVICE_ICON[s.slug] ?? Heart; return (
              <a key={s.slug} href={`/evenements/${s.slug}`} className={`${card} p-6 space-y-3 group hover:border-[#E3B5C3] hover:shadow-md transition`}>
                <span className="w-11 h-11 rounded-2xl bg-[#FDEBF0] text-[#C65E7E] flex items-center justify-center"><Icon className="w-5 h-5" aria-hidden="true" /></span>
                <h3 className="font-serif-cormorant text-2xl font-semibold flex items-center justify-between">{s.name}<ArrowRight className="w-4 h-4 text-[#E3B5C3] group-hover:text-[#C65E7E] group-hover:translate-x-0.5 transition" aria-hidden="true" /></h3>
                <p className="text-sm text-[#6E5560] leading-relaxed">{SERVICE_BLURB[s.slug]}</p>
              </a>
            ); })}
            <div className={`${card} p-6 space-y-3 border-dashed`}>
              <span className="w-11 h-11 rounded-2xl bg-[#FDEBF0] text-[#C65E7E] flex items-center justify-center"><Sparkles className="w-5 h-5" aria-hidden="true" /></span>
              <h3 className="font-serif-cormorant text-2xl font-semibold">Une autre occasion ?</h3>
              <p className="text-sm text-[#6E5560] leading-relaxed">Remise de diplôme, inauguration, fiançailles, retrouvailles de famille : dites-nous ce que vous préparez.</p>
              {contact && <a href={contact.href} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#A94566] underline underline-offset-4">Nous en parler</a>}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Le numérique ---------- */}
      <section aria-labelledby="numerique" className="max-w-6xl mx-auto px-5 py-16">
        <div className="text-center space-y-2">
          <p className={`text-[11px] tracking-[0.35em] uppercase font-semibold ${rose}`}>Le prolongement en ligne</p>
          <h2 id="numerique" className="font-serif-cormorant text-3xl sm:text-5xl font-semibold">Des outils simples pour vos invités</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 pt-10">
          {[
            { icon: Ticket, t: 'Invitations & billets QR', d: "Un lien personnel par invité : réponse de chacun (même pour un couple), billet QR après confirmation, émargement à l'entrée." },
            { icon: Heart, t: 'Programme & hommage', d: "Programme des cérémonies, faire-part, plans d'accès en images, convois en bus et soutien à la famille, sur une seule page." },
            { icon: BookOpen, t: "Livre d'or & livre souvenir", d: "Messages et photos des proches depuis un lien ou un QR code, puis livre PDF A4 haute définition à imprimer." },
          ].map(({ icon: Icon, t, d }) => (
            <article key={t} className={`${card} p-7 space-y-3`}>
              <Icon className="w-6 h-6 text-[#C65E7E]" aria-hidden="true" />
              <h3 className="font-serif-cormorant text-2xl font-semibold">{t}</h3>
              <p className="text-sm text-[#6E5560] leading-relaxed">{d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Comment nous travaillons ---------- */}
      <section aria-labelledby="etapes" className="bg-white border-y border-[#F6DCE4]">
        <div className="max-w-5xl mx-auto px-5 py-16">
          <h2 id="etapes" className="font-serif-cormorant text-3xl sm:text-5xl font-semibold text-center">Comment nous travaillons</h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-10">
            {STEPS.map((s, i) => (
              <li key={s.title} className="space-y-2">
                <span className="w-10 h-10 rounded-full bg-[#FDEBF0] text-[#A94566] font-serif-cormorant text-xl font-semibold flex items-center justify-center">{i + 1}</span>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-[#6E5560] leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Contact ---------- */}
      <section aria-labelledby="contact" className="relative overflow-hidden bg-gradient-to-b from-[#FFFAF7] to-[#FFE9EF]">
        <FloralBranch className="pointer-events-none absolute -bottom-2 left-0 w-72 sm:w-[28rem] opacity-90" />
        <FloralBranch className="pointer-events-none absolute -bottom-2 right-0 w-72 sm:w-[28rem] scale-x-[-1] opacity-90" />
        <div className="relative max-w-2xl mx-auto px-5 py-20 text-center space-y-5">
          <h2 id="contact" className="font-serif-cormorant text-3xl sm:text-5xl font-semibold">Parlons de votre événement</h2>
          <p className="text-[#6E5560]">Dites-nous ce que vous préparez : nous vous répondons avec une première proposition d'organisation.</p>
          {contact
            ? <a href={contact.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-7 py-4 text-sm font-semibold text-white bg-[#C65E7E] hover:bg-[#B04C6B] rounded-full shadow-md shadow-[#C65E7E]/30 transition"><MessageCircle className="w-4 h-4" />{contact.label}</a>
            : <p className="text-xs text-[#B8A3AD]">Les coordonnées de contact s'affichent ici dès qu'elles sont renseignées dans les paramètres du site.</p>}
          <div className="pb-16" />
        </div>
      </section>

      {/* ---------- Questions ---------- */}
      <section aria-labelledby="faq" className="bg-white border-t border-[#F6DCE4]">
        <div className="max-w-3xl mx-auto px-5 py-16">
          <h2 id="faq" className="font-serif-cormorant text-3xl sm:text-5xl font-semibold text-center">Questions fréquentes</h2>
          <div className="pt-8 space-y-3">
            {faq(settings.brandName).map((f) => (
              <details key={f.q} className="group bg-[#FFF7F9] border border-[#F6DCE4] rounded-2xl px-5 py-4">
                <summary className="cursor-pointer font-semibold text-sm list-none flex justify-between gap-4">{f.q}<span className="text-[#C65E7E] group-open:rotate-45 transition-transform">+</span></summary>
                <p className="text-sm text-[#6E5560] leading-relaxed pt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Espaces clients ---------- */}
      <section aria-label="Espaces de connexion" className="max-w-4xl mx-auto px-5 py-14 grid md:grid-cols-2 gap-5">
        <Space title="Espace responsable" text="Vous organisez une cérémonie avec nous ? Retrouvez vos invités, votre programme, vos messages et votre livre souvenir." cta="Ouvrir mon espace" onClick={() => onLogin('manager')} />
        <Space title="Espace administrateur" text="Création des cérémonies, des groupes et des accès, réglages du site et génération des livres." cta="Ouvrir l'administration" onClick={() => onLogin('admin')} />
      </section>
    </main>
  );
}

function Space({ title, text, cta, onClick }: { title: string; text: string; cta: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-left p-6 bg-white border border-[#F6DCE4] rounded-3xl hover:border-[#E3B5C3] hover:shadow-md transition space-y-2 group">
      <span className="flex items-center justify-between"><span className="font-serif-cormorant text-2xl font-semibold">{title}</span><LogIn className="w-4 h-4 text-[#E3B5C3] group-hover:text-[#C65E7E] transition" aria-hidden="true" /></span>
      <span className="block text-sm text-[#6E5560] leading-relaxed">{text}</span>
      <span className="text-sm font-semibold text-[#A94566] inline-block">{cta} →</span>
    </button>
  );
}
