import { ArrowRight, Check, MessageCircle } from 'lucide-react';
import type { SiteSettings } from '@/lib/siteSettings';
import { SERVICE_PAGES, type ServicePage } from '@/lib/homeContent';
import { brandInitials } from '@/lib/brand';
import { FloralBranch, FloralCorner, FloralDivider } from '../decor/Flowers';
import SiteFooter from '../SiteFooter';
import { contactLink } from './contact';

const BLOCKS: { key: keyof Pick<ServicePage, 'organise' | 'embellish' | 'terrain' | 'digital'>; title: string }[] = [
  { key: 'organise', title: 'Nous organisons' }, { key: 'embellish', title: 'Nous embellissons' },
  { key: 'terrain', title: 'Nous mettons en œuvre sur le terrain' }, { key: 'digital', title: 'Nous prolongeons en numérique' },
];

/** Page d'un type d'événement (rendu serveur : tout le texte est dans le HTML envoyé aux moteurs de recherche). */
export default function ServicePageView({ page, settings }: { page: ServicePage; settings: SiteSettings }) {
  const contact = contactLink(settings, page.name);
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFAF7] text-[#4A2F38]">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#F6DCE4]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3" aria-label={`${settings.brandName} — accueil`}>
            <span className="w-9 h-9 rounded-full bg-[#FDEBF0] border border-[#F3D0DB] flex items-center justify-center text-[#C65E7E] text-xs font-bold">{brandInitials(settings.brandName)}</span>
            <span className="font-serif-cormorant text-2xl font-semibold">{settings.brandName}</span>
          </a>
          {contact && <a href={contact.href} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-xs font-semibold text-white bg-[#C65E7E] hover:bg-[#B04C6B] rounded-full transition flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" />Nous contacter</a>}
        </div>
      </header>

      <main className="flex-1">
        <nav aria-label="Fil d'Ariane" className="max-w-6xl mx-auto px-4 pt-5 text-xs text-[#9A8490]">
          <a href="/" className="hover:text-[#C65E7E]">Accueil</a> <span aria-hidden>›</span> <a href="/#evenements" className="hover:text-[#C65E7E]">Événements</a> <span aria-hidden>›</span> <span className="text-[#5E4450]">{page.name}</span>
        </nav>

        <section className="relative overflow-hidden bg-gradient-to-b from-[#FFE4EB] via-[#FFF0F4] to-[#FFFAF7] mt-4">
          <FloralCorner className="pointer-events-none absolute -top-8 -left-10 w-44 sm:w-80" />
          <FloralCorner className="pointer-events-none absolute -top-8 -right-10 w-44 sm:w-80 scale-x-[-1]" />
          <div className="relative z-10 max-w-3xl mx-auto px-5 pt-24 pb-16 sm:pt-32 sm:pb-24 text-center space-y-5">
            <p className="text-[11px] tracking-[0.4em] uppercase font-semibold text-[#B04C6B]">{page.kicker}</p>
            <h1 className="font-serif-cormorant text-4xl sm:text-6xl font-semibold leading-[1.08]">{page.h1}</h1>
            <FloralDivider className="w-52 mx-auto" />
            <p className="text-sm sm:text-lg text-[#6E5560] leading-relaxed">{page.intro}</p>
            {contact && <a href={contact.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#C65E7E] hover:bg-[#B04C6B] rounded-full shadow-md shadow-[#C65E7E]/30 transition"><MessageCircle className="w-4 h-4" />{contact.label}</a>}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-5 py-14 grid gap-5 sm:grid-cols-2">
          {BLOCKS.map((b) => (
            <article key={b.key} className="bg-white border border-[#F6DCE4] rounded-3xl p-7 space-y-3 shadow-sm shadow-[#C65E7E]/5">
              <h2 className="font-serif-cormorant text-2xl font-semibold">{b.title}</h2>
              <ul className="space-y-2 text-sm text-[#6E5560]">
                {page[b.key].map((t) => <li key={t} className="flex gap-2.5"><Check className="w-4 h-4 mt-0.5 shrink-0 text-[#C65E7E]" aria-hidden="true" /><span>{t}</span></li>)}
              </ul>
            </article>
          ))}
        </section>

        <section aria-labelledby="faq-page" className="bg-white border-y border-[#F6DCE4]">
          <div className="max-w-3xl mx-auto px-5 py-14">
            <h2 id="faq-page" className="font-serif-cormorant text-3xl sm:text-4xl font-semibold text-center">Vos questions</h2>
            <div className="pt-8 space-y-3">
              {page.faq.map((f) => (
                <details key={f.q} className="group bg-[#FFF7F9] border border-[#F6DCE4] rounded-2xl px-5 py-4">
                  <summary className="cursor-pointer font-semibold text-sm list-none flex justify-between gap-4">{f.q}<span className="text-[#C65E7E] group-open:rotate-45 transition-transform">+</span></summary>
                  <p className="text-sm text-[#6E5560] leading-relaxed pt-3">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden max-w-5xl mx-auto px-5 py-16">
          <h2 className="font-serif-cormorant text-3xl font-semibold text-center">Découvrez aussi</h2>
          <ul className="flex flex-wrap justify-center gap-3 pt-6">
            {SERVICE_PAGES.filter((s) => s.slug !== page.slug).map((s) => (
              <li key={s.slug}><a href={`/evenements/${s.slug}`} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-white border border-[#F3D0DB] hover:bg-[#FDEBF0] rounded-full transition">{s.name}<ArrowRight className="w-3.5 h-3.5 text-[#C65E7E]" aria-hidden="true" /></a></li>
            ))}
          </ul>
          <FloralBranch className="pointer-events-none mx-auto mt-10 w-72 opacity-90" />
        </section>
      </main>
      <SiteFooter settings={settings} variant="light" />
    </div>
  );
}
