// Livret imprimable, reçu et agenda (.ics) — côté navigateur. Tout texte saisi est échappé avant d'entrer dans le HTML.
import type { Donation, FuneralEvent, PublicProgramme } from './types';
import { fmtMoney } from './types';
export { printBooklet } from './booklet';
import { frDate, frDateTime } from './format';

export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const nl2br = (s: string) => esc(s).replace(/\n/g, '<br>');

const BASE_CSS = `
  @page { size: A4; margin: 18mm }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1c1230; line-height: 1.5; margin: 0 }
  h1 { font-size: 30px; margin: 0; color: #2a1450 } h2 { font-size: 18px; color: #2a1450; border-bottom: 1px solid #c9b6e8; padding-bottom: 4px; margin: 26px 0 10px }
  .sub { color: #5b4a7a; letter-spacing: .12em; text-transform: uppercase; font-size: 12px }
  .ev { break-inside: avoid; margin: 0 0 12px } .ev b { color: #2a1450 } .muted { color: #5b4a7a; font-size: 13px }
  table { width: 100%; border-collapse: collapse } td { padding: 6px 0; vertical-align: top; border-bottom: 1px dotted #c9b6e8 }
`;

function openPrint(title: string, body: string) {
  const w = window.open('', '_blank');
  if (!w) { alert("Autorisez l'ouverture de fenêtres pour imprimer."); return; }
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${BASE_CSS}</style></head><body>${body}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}


export function printReceipt(d: Donation, honoree: string, currency: string, contact: string) {
  openPrint(`Reçu ${d.receiptNumber}`, `
    <p class="sub">Reçu de contribution</p><h1>${esc(d.receiptNumber)}</h1>
    <p class="muted">En soutien à la famille de ${esc(honoree)}</p>
    <table>
      <tr><td>Donateur</td><td><b>${esc(d.isAnonymous ? d.donorName + ' (anonyme)' : d.donorName)}</b></td></tr>
      <tr><td>Montant</td><td><b>${esc(fmtMoney(d.amount, currency))}</b></td></tr>
      <tr><td>Date</td><td>${esc(frDate(d.date))}</td></tr>
      <tr><td>Mode de paiement</td><td>${esc(d.paymentMethod)}${d.paymentReference ? ' — réf. ' + esc(d.paymentReference) : ''}</td></tr>
      ${d.purpose ? `<tr><td>Objet</td><td>${esc(d.purpose)}</td></tr>` : ''}
    </table>
    <p style="margin-top:28px">La famille vous remercie du fond du cœur pour votre soutien et votre présence à ses côtés.</p>
    ${contact ? `<p class="muted">Contact : ${esc(contact)}</p>` : ''}`);
}

/** Télécharge un événement du programme au format agenda (.ics). Heure du Cameroun (UTC+1) → UTC. */
export function downloadIcs(e: FuneralEvent, honoree: string) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const mk = (date: string, time: string) => {
    const [y, m, d] = date.split('-').map(Number), [h, mi] = (time || '00:00').split(':').map(Number);
    return new Date(Date.UTC(y, m - 1, d, h - 1, mi));
  };
  const s = mk(e.date, e.startTime);
  const en = e.endTime ? mk(e.date, e.endTime) : new Date(s.getTime() + 2 * 3600_000);
  const start = fmt(s), end = fmt(en);
  const t = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CardEvents//Programme//FR', 'BEGIN:VEVENT', `UID:${e.id}@cardevents`, `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${t(`${e.title} — ${honoree}`)}`, `LOCATION:${t([e.locationName, e.locationAddress].filter(Boolean).join(', '))}`,
    `DESCRIPTION:${t(e.description)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  a.download = `${e.title.replace(/[^\w-]+/g, '_').slice(0, 40) || 'evenement'}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export const when = (e: FuneralEvent) => frDateTime(`${e.date}T${e.startTime}`);
