// Fonctions pures de mise en forme (navigateur et serveur).
export function frDate(d: string): string {
  if (!d) return '';
  const t = new Date(`${d}T12:00:00Z`);
  return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
export function frLongDate(d: string): string {
  if (!d) return '';
  const t = new Date(`${d}T12:00:00Z`);
  return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
export const frTime = (t: string) => (t ? t.replace(':', 'h') : '');
/** « 2026-08-28T06:30 » → « 28 août 2026 à 06h30 ». */
export function frDateTime(v: string): string {
  const [d, t] = v.split('T');
  return d ? `${frDate(d)}${t ? ` à ${frTime(t)}` : ''}` : '';
}
export const telHref = (p: string) => `tel:${p.replace(/[^+0-9]/g, '')}`;
export const waHref = (p: string) => `https://wa.me/${p.replace(/[^0-9]/g, '')}`;
