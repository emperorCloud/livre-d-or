// Livret des obsèques : 2 feuilles A4 PAYSAGE, chacune coupée en deux, à plier comme un programme imprimé.
//   Feuille 1 (extérieur) : plans d'accès  |  couverture (portrait ovale, dates, verset)
//   Feuille 2 (intérieur) : faire-part     |  programme (par jour) + QR de la page en ligne
// Navigateur uniquement. Tout texte saisi est échappé avant d'entrer dans le HTML ; les images viennent de notre stockage.
import type { FuneralEvent, PublicProgramme } from './types';
import { EVENT_CATEGORIES } from './types';
import { frDate, frLongDate, frTime } from './format';
import { normalizePageColor } from './theme';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const nl2br = (s: string) => esc(s).replace(/\n/g, '<br>');
const GOLD = '#B8923A', GOLD2 = '#D9B96A';

const CORNER = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="none" stroke="${GOLD}" stroke-linecap="round" stroke-linejoin="round">
<path d="M6 112 V30 C6 16 16 6 30 6 H112" stroke-width="2.4"/><path d="M13 112 V33 C13 22 22 13 33 13 H112" stroke-width="1"/>
<path d="M30 30 C30 52 52 60 62 46 C70 34 54 24 44 32 C37 38 42 48 50 46" stroke-width="1.8"/><path d="M30 30 C52 30 60 52 46 62 C34 70 24 54 32 44 C38 37 48 42 46 50" stroke-width="1.8"/>
<path d="M64 8 C74 18 86 18 96 8" stroke-width="1.4"/><path d="M8 64 C18 74 18 86 8 96" stroke-width="1.4"/>
<path d="M60 6 C66 16 78 22 90 20 C84 14 78 8 60 6Z" fill="${GOLD2}" stroke-width=".8"/><path d="M6 60 C16 66 22 78 20 90 C14 84 8 78 6 60Z" fill="${GOLD2}" stroke-width=".8"/>
<circle cx="30" cy="30" r="3.2" fill="${GOLD}" stroke="none"/><circle cx="104" cy="6" r="2.2" fill="${GOLD}" stroke="none"/><circle cx="6" cy="104" r="2.2" fill="${GOLD}" stroke="none"/></g></svg>`;
const BOW = `<svg viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-linecap="round"><path d="M10 12 C24 -2 40 -2 50 12 C60 -2 76 -2 90 12"/><path d="M50 12 V22"/><circle cx="50" cy="26" r="3" fill="${GOLD}" stroke="none"/><path d="M30 8 C36 2 44 4 50 12 C56 4 64 2 70 8" stroke-width="1"/></g></svg>`;
// Bande centrale façon tissu traditionnel : losanges blancs sur indigo
const BAND = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="38" height="60"><rect width="38" height="60" fill="#1F2D6B"/><path d="M19 4 L33 30 L19 56 L5 30Z" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M19 15 L27 30 L19 45 L11 30Z" fill="#fff" fill-opacity=".9"/><circle cx="2" cy="2" r="2.5" fill="#fff"/><circle cx="36" cy="2" r="2.5" fill="#fff"/><circle cx="2" cy="58" r="2.5" fill="#fff"/><circle cx="36" cy="58" r="2.5" fill="#fff"/></svg>`)}`;

const CSS = (accent: string) => `
  @page { size: 297mm 210mm; margin: 0 }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact }
  html, body { margin: 0; padding: 0; background: #d8dbe3; font-family: Georgia, 'Times New Roman', serif; color: #1d1b2b }
  .bar { position: sticky; top: 0; z-index: 10; background: #fff; border-bottom: 1px solid #ccc; padding: 10px 16px; font: 13px/1.4 system-ui, sans-serif; display: flex; gap: 12px; align-items: center; flex-wrap: wrap }
  .bar button { background: ${accent}; color: #fff; border: 0; border-radius: 8px; padding: 9px 16px; font: 600 13px system-ui, sans-serif; cursor: pointer }
  .sheet { width: 297mm; height: 210mm; margin: 12px auto; position: relative; display: flex; overflow: hidden; break-after: page; page-break-after: always;
    background: radial-gradient(ellipse 60% 50% at 18% 12%, #ffffff 0, rgba(255,255,255,0) 70%), radial-gradient(ellipse 55% 45% at 82% 28%, #dfe6f1 0, rgba(223,230,241,0) 70%),
                radial-gradient(ellipse 60% 50% at 30% 88%, #d3dbe9 0, rgba(211,219,233,0) 72%), radial-gradient(ellipse 50% 40% at 90% 92%, #ffffff 0, rgba(255,255,255,0) 70%), #e9edf5 }
  .sheet:last-child { break-after: auto; page-break-after: auto }
  .panel { width: 148.5mm; height: 210mm; position: relative; display: flex; flex-direction: column; padding: 17mm 15mm 14mm }
  .band { position: absolute; left: 143.5mm; top: 0; width: 10mm; height: 210mm; background: url("${BAND}") repeat-y center top / 10mm auto }
  .fold { position: absolute; left: 148.5mm; top: 14mm; bottom: 14mm; width: 0; border-left: .3mm solid ${GOLD}; opacity: .8 }
  .orn { position: absolute; width: 22mm; height: 22mm }
  .orn.tl { left: 5mm; top: 5mm } .orn.tr { right: 5mm; top: 5mm; transform: scaleX(-1) } .orn.bl { left: 5mm; bottom: 5mm; transform: scaleY(-1) } .orn.br { right: 5mm; bottom: 5mm; transform: scale(-1) }
  .title { text-align: center; color: ${accent}; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; font-size: 15pt; margin: 2mm 0 1mm }
  .rule { width: 34mm; height: 0; border-top: .5mm solid ${GOLD}; margin: 2mm auto 5mm; position: relative }
  .rule::after { content: ''; position: absolute; left: 50%; top: -1.6mm; width: 2.6mm; height: 2.6mm; background: ${GOLD}; transform: translateX(-50%) rotate(45deg) }
  .fit { flex: 1; min-height: 0; overflow: hidden; font-size: 10pt; line-height: 1.38 }
  .fit.two { column-count: 2; column-gap: 7mm; column-fill: auto }
  .grp { break-inside: avoid; margin: 0 0 3.2mm } .grp h3 { margin: 0 0 .6mm; font-size: 1em; color: ${accent}; font-weight: 700 }
  .grp ul { list-style: none; margin: 0; padding: 0 } .grp li { margin: 0 }
  .intro { text-align: center; font-style: italic; margin: 0 0 4mm; color: #3a3650 }
  .day { margin: 0 0 3.6mm; break-inside: avoid } .day h3 { margin: 0 0 1.4mm; color: ${accent}; font-size: 1.02em; font-weight: 700; border-bottom: .3mm solid ${GOLD}; padding-bottom: .6mm }
  .ev { margin: 0 0 1.6mm } .ev b { font-weight: 700 } .ev .t { color: ${accent}; font-weight: 700 } .ev .m { display: block; font-size: .86em; color: #4b4863 } .ev .d { display: block; font-size: .86em; color: #3a3650 }
  .foot { flex: none; display: flex; align-items: center; gap: 4mm; margin-top: 3mm; padding-top: 3mm; border-top: .3mm solid ${GOLD}; font-size: 8pt; color: #3a3650 }
  .foot img { width: 19mm; height: 19mm; flex: none }
  .cover { align-items: center; text-align: center }
  .kicker { font-weight: 700; letter-spacing: .12em; font-size: 11.5pt; text-transform: uppercase; margin-top: 3mm }
  .de { font-style: italic; font-size: 10pt; margin: .6mm 0 }
  .name { color: ${accent}; font-weight: 700; font-size: 18pt; line-height: 1.15; margin: 0 0 3mm }
  .oval { width: 80mm; height: 104mm; border-radius: 50%; border: 1.3mm solid ${GOLD}; box-shadow: 0 0 0 1.2mm #fff, 0 0 0 2.4mm ${GOLD2}; overflow: hidden; background: #f4efe3; margin: 3mm 0 5mm; display: flex; align-items: center; justify-content: center; flex: none }
  .oval img { width: 100%; height: 100%; object-fit: cover; object-position: center 25% } .oval span { font-size: 52pt; color: ${GOLD}; font-weight: 700 }
  .years { color: ${GOLD}; font-weight: 700; font-size: 24pt; letter-spacing: .04em; margin: 0 0 3mm }
  .verse { font-size: 8.6pt; line-height: 1.4; max-width: 112mm; color: #26233a }
  .bow { width: 30mm; height: 9mm }
  .maps { flex: 1; min-height: 0; display: grid; gap: 4mm; grid-auto-rows: 1fr }
  .maps.c1 { grid-template-columns: 1fr } .maps.c2 { grid-template-columns: 1fr 1fr }
  .map { display: flex; flex-direction: column; min-height: 0; text-align: center; font-size: 8pt }
  .map .frame { flex: 1; min-height: 0; background: #fff; border: .4mm solid ${GOLD}; border-radius: 2mm; padding: 1.5mm; display: flex }
  .map img { flex: 1; width: 100%; min-height: 0; object-fit: contain }
  .map b { display: block; color: ${accent}; margin-top: 1mm } .map span { color: #3a3650 }
  @media print { .bar { display: none } html, body { background: none } .sheet { margin: 0 } }
`;

const catLabel = (c: string) => EVENT_CATEGORIES.find((x) => x.value === c)?.label || '';
const orn = (cls: string) => `<div class="orn ${cls}">${CORNER}</div>`;
const years = (b: string, d: string) => (b && d ? `${b.slice(0, 4)} - ${d.slice(0, 4)}` : d ? frDate(d) : b ? frDate(b) : '');

function programmeHtml(p: PublicProgramme, compact: boolean): string {
  const dates = [...new Set(p.config.events.map((e) => e.date).filter(Boolean))].sort();
  const row = (e: FuneralEvent) => `<div class="ev"><span class="t">${esc(frTime(e.startTime))}${e.endTime ? ` – ${esc(frTime(e.endTime))}` : ''}</span> · <b>${esc(e.title)}</b> <span style="font-size:.84em;color:#4b4863">(${esc(catLabel(e.category))})</span>
    ${e.locationName || e.locationAddress ? `<span class="m">${esc([e.locationName, e.locationAddress].filter(Boolean).join(' — '))}</span>` : ''}
    ${!compact && e.description ? `<span class="d">${nl2br(e.description)}</span>` : ''}${!compact && (e.leader || e.dressCode) ? `<span class="m">${esc([e.leader && `Officiant : ${e.leader}`, e.dressCode && `Tenue : ${e.dressCode}`].filter(Boolean).join(' · '))}</span>` : ''}</div>`;
  const days = dates.map((d) => `<div class="day"><h3>${esc(frLongDate(d))}</h3>${p.config.events.filter((e) => e.date === d).sort((a, b) => a.startTime.localeCompare(b.startTime)).map(row).join('')}</div>`).join('');
  const undated = p.config.events.filter((e) => !e.date);
  const pr = p.config.profile;
  return `${days}${undated.length ? `<div class="day">${undated.map(row).join('')}</div>` : ''}${pr.dressCodeAdvice ? `<div class="day"><h3>Tenue conseillée</h3>${nl2br(pr.dressCodeAdvice)}</div>` : ''}`;
}

/** HTML complet du livret. `qr` = image du QR de la page en ligne (facultatif). */
export function bookletHtml(p: PublicProgramme, qr: string, pageUrl: string): string {
  const pr = p.config.profile, accent = normalizePageColor(pr.pageColor);
  const full = [pr.titles, p.ceremony.honoreeName].filter(Boolean).join(' ');
  const maps = p.config.itineraries;
  const fp = p.config.fairePart;
  const names = fp.groups.reduce((n, g) => n + g.members.length, 0);
  const nEvents = p.config.events.length;

  // ----- Feuille 1, gauche : plans d'accès (sinon hommage) -----
  const left1 = maps.length
    ? `<div class="title">${maps.length > 1 ? 'Plans de localisation' : 'Plan de localisation'}</div><div class="rule"></div>
       <div class="maps ${maps.length >= 3 ? 'c2' : 'c1'}">${maps.map((m) => `<figure class="map" style="margin:0"><div class="frame"><img src="${esc(m.imageUrl)}" alt="${esc(m.title || 'Plan d’accès')}"></div>${m.title ? `<b>${esc(m.title)}</b>` : ''}${m.description ? `<span>${esc(m.description)}</span>` : ''}</figure>`).join('')}</div>`
    : `<div class="title">Hommage</div><div class="rule"></div>
       <div class="fit" data-fit>${pr.familyMessage ? `<p style="margin:0 0 3mm;text-align:center;font-style:italic">${nl2br(pr.familyMessage)}</p>` : ''}${pr.biography ? `<div class="grp"><h3>Son parcours</h3>${nl2br(pr.biography)}</div>` : ''}${pr.contactPhone ? `<div class="grp"><h3>Contact de la famille</h3>${esc(pr.contactPhone)}${pr.contactEmail ? `<br>${esc(pr.contactEmail)}` : ''}</div>` : ''}</div>`;

  // ----- Feuille 1, droite : couverture -----
  const initials = (p.ceremony.honoreeName.match(/\p{L}/gu) || []).slice(0, 2).join('').toUpperCase();
  const cover = `<div class="kicker">Programme des obsèques</div><div class="de">de</div><div class="name">${esc(full)}</div>
    <div class="bow">${BOW}</div>
    <div class="oval">${pr.photoUrl ? `<img src="${esc(pr.photoUrl)}" alt="${esc(p.ceremony.honoreeName)}">` : `<span>${esc(initials)}</span>`}</div>
    <div class="years">${esc(years(pr.birthDate, pr.deathDate))}</div>
    ${pr.epitaph ? `<div class="verse">${nl2br(pr.epitaph)}</div>` : ''}`;

  // ----- Feuille 2, gauche : faire-part (une liste, un nom par ligne) -----
  const fairePart = `<div class="title">Faire-part</div><div class="rule"></div>
    <div class="fit" data-fit data-cols="${names > 18 ? 1 : 0}">${fp.header ? `<p class="intro">${nl2br(fp.header)}</p>` : ''}
    ${fp.groups.map((g) => `<div class="grp">${g.title ? `<h3>${esc(g.title)}</h3>` : ''}<ul>${g.members.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>`).join('')}
    ${fp.footer ? `<p class="intro" style="margin-top:3mm">${nl2br(fp.footer)}</p>` : ''}</div>`;

  // ----- Feuille 2, droite : programme -----
  const programme = `<div class="title">Programme</div><div class="rule"></div>
    <div class="fit" data-fit>${programmeHtml(p, nEvents > 9)}</div>
    <div class="foot">${qr ? `<img src="${qr}" alt="QR de la page en ligne">` : ''}<div><b>Programme en ligne</b><br>Convois, soutien à la famille et mises à jour :<br>${esc(pageUrl)}${pr.contactPhone ? `<br>Contact : ${esc(pr.contactPhone)}` : ''}</div></div>`;

  const title = `Programme des obsèques — ${full}`;
  const script = `
    (function () {
      var over = function (b) { return b.scrollHeight > b.clientHeight + 1 || b.scrollWidth > b.clientWidth + 1; };
      function fit(b) {
        // Longue liste de noms : deux colonnes d'emblée (plus lisible qu'une police minuscule).
        if (b.getAttribute('data-cols') === '1') b.classList.add('two');
        var shrink = function () { for (var s = 100; s >= 60; s -= 3) { b.style.fontSize = (10 * s / 100) + 'pt'; if (!over(b)) return true; } return false; };
        b.style.fontSize = '10pt';
        if (over(b)) { if (!shrink()) b.style.fontSize = '6pt'; return; }
        // Contenu court : on agrandit le texte pour remplir joliment la page (13 pt maximum).
        var best = 10; for (var g = 10.5; g <= 13; g += 0.5) { b.style.fontSize = g + 'pt'; if (over(b)) break; best = g; }
        b.style.fontSize = best + 'pt';
      }
      function run() { document.querySelectorAll('[data-fit]').forEach(fit); }
      var imgs = Array.prototype.slice.call(document.images);
      Promise.all(imgs.map(function (i) { return i.complete ? 1 : new Promise(function (r) { i.onload = i.onerror = r; }); })).then(function () {
        run(); document.getElementById('go').disabled = false; document.getElementById('st').textContent = 'Prêt : 2 feuilles A4 paysage.';
        setTimeout(function () { window.print(); }, 400);
      });
      document.getElementById('go').onclick = function () { window.print(); };
    })();`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=1123"><title>${esc(title)}</title><style>${CSS(accent)}</style></head><body>
  <div class="bar"><button id="go" disabled>Imprimer / Enregistrer en PDF</button><span id="st">Préparation du livret…</span>
  <span>Dans la fenêtre d’impression : <b>format A4, orientation paysage, marges : aucune</b>, puis « Enregistrer au format PDF ».</span></div>
  <section class="sheet">${orn('tl')}${orn('bl')}<div class="panel">${left1}</div><div class="band"></div><div class="panel cover">${cover}</div>${orn('tr')}${orn('br')}</section>
  <section class="sheet">${orn('tl')}${orn('bl')}<div class="panel">${fairePart}</div><div class="fold"></div><div class="panel">${programme}</div>${orn('tr')}${orn('br')}</section>
  <script>${script}</script></body></html>`;
}

/** Ouvre le livret dans une fenêtre (ouverte tout de suite : un navigateur refuse une fenêtre ouverte après une attente). */
export async function printBooklet(p: PublicProgramme) {
  const w = window.open('', '_blank');
  if (!w) { alert("Autorisez l'ouverture de fenêtres pour générer le livret."); return; }
  w.document.write('<p style="font:16px system-ui;padding:24px">Préparation du livret…</p>');
  const url = `${window.location.origin}/p/${p.slug}`;
  let qr = '';
  try { const QR = (await import('qrcode')).default; qr = await QR.toDataURL(url, { margin: 1, width: 300 }); } catch { /* le livret reste valable sans QR */ }
  w.document.open();
  w.document.write(bookletHtml(p, qr, url));
  w.document.close();
}
