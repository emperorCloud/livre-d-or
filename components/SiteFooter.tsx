import type { SiteSettings } from '@/lib/siteSettings';
import { SERVICE_PAGES } from '@/lib/homeContent';
import { contactLink } from './site/contact';

export default function SiteFooter({ settings, override, variant = 'dark' }: { settings: SiteSettings; override?: string; variant?: 'dark' | 'light' }) {
  if (variant === 'light') {
    const contact = contactLink(settings);
    return (
      <footer className="border-t border-[#F6DCE4] bg-[#FFF1F5] text-[#6E5560] py-10 text-sm no-print">
        <div className="max-w-6xl mx-auto px-5 grid gap-8 sm:grid-cols-3">
          <div className="space-y-2">
            <div className="font-serif-cormorant text-2xl font-semibold text-[#4A2F38]">{override || settings.brandName}</div>
            <p className="text-xs leading-relaxed">{settings.brandTagline}</p>
            {settings.serviceArea && <p className="text-xs text-[#B04C6B]">{settings.serviceArea}</p>}
          </div>
          <nav aria-label="Nos événements" className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#B04C6B]">Événements</div>
            <ul className="space-y-1.5 text-xs">{SERVICE_PAGES.map((s) => <li key={s.slug}><a href={`/evenements/${s.slug}`} className="hover:text-[#C65E7E]">{s.name}</a></li>)}</ul>
          </nav>
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#B04C6B]">Contact</div>
            {contact ? <a href={contact.href} target="_blank" rel="noopener noreferrer" className="text-xs underline underline-offset-4 hover:text-[#C65E7E]">{contact.label}</a> : <p className="text-xs">À renseigner dans les paramètres du site.</p>}
            {settings.contactEmail && <p className="text-xs">{settings.contactEmail}</p>}
          </div>
        </div>
        <p className="max-w-6xl mx-auto px-5 pt-8 text-[11px] text-[#B8A3AD]">{settings.footerRight}</p>
      </footer>
    );
  }
  return (
    <footer className="border-t border-stone-200 bg-stone-900 text-stone-400 py-6 text-xs text-center no-print">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="font-serif-cinzel text-amber-200">{override || settings.footerLeft}</div>
        <div className="text-stone-500">{settings.footerRight}</div>
      </div>
    </footer>
  );
}
