import type { SiteSettings } from '@/lib/siteSettings';

export default function SiteFooter({ settings, override }: { settings: SiteSettings; override?: string }) {
  return (
    <footer className="border-t border-stone-200 bg-stone-900 text-stone-400 py-6 text-xs text-center no-print">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="font-serif-cinzel text-amber-200">{override || settings.footerLeft}</div>
        <div className="text-stone-500">{settings.footerRight}</div>
      </div>
    </footer>
  );
}
