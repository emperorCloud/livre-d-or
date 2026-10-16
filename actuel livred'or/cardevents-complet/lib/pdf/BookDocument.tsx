import React from 'react';
import { Document, Page, View, Text, Image, Link } from '@react-pdf/renderer';
import { CONTENT_W, MARGIN_X, ROW_GAP, type Palette } from './geometry';
import type { FontSet } from './fonts';
import { cleanText, paragraphs } from './text';

export interface BookPhoto { src: string | null; width: number; height: number; caption: string }
export interface BookEntry {
  id: string; name: string; relation: string; date: string;
  message: string; anecdote: string; wish: string; rows: BookPhoto[][]; photoCount: number;
}
export interface BookData {
  title: string; recipient: string; subtitle: string; eventDate: string; preface: string; closing: string; closingTitle: string; closingSignature: string;
  wishLabel: string; palette: Palette; fonts: FontSet; entries: BookEntry[];
  cover: { src: string; width: number; height: number } | null;
  draft: boolean;                         // passe 1 : mêmes cadres, sans images (calcul des numéros de page)
  keepEmoji: boolean;
  known: Map<string, number>;             // numéros de page connus (lus par le sommaire)
  written: Map<string, number>;           // numéros de page mesurés pendant ce rendu
}

const label = (d: BookData) => ({ ...d.fonts.head, fontSize: 7.5, letterSpacing: 1.4, color: d.palette.accent });

function Entry({ e, d }: { e: BookEntry; d: BookData }) {
  const { palette: p, fonts: f, keepEmoji: k } = d;
  const msg = paragraphs(cleanText(e.message, k));
  const anecdote = cleanText(e.anecdote, k);
  const wish = cleanText(e.wish, k);
  return (
    <View style={{ marginBottom: 24 }}>
      <View id={e.id} wrap={false} minPresenceAhead={110}
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: p.gold, paddingBottom: 5, marginBottom: 9 }}>
        <View style={{ flexShrink: 1, paddingRight: 10 }}>
          <Text style={label(d)}>TÉMOIGNAGE DE</Text>
          <Text style={{ ...f.bold, fontSize: 16, color: p.ink }}
            render={({ pageNumber }) => { d.written.set(e.id, pageNumber); return cleanText(e.name, false); }} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {e.relation ? <Text style={{ ...f.ital, fontSize: 9.5, color: p.muted }}>{cleanText(e.relation, false)}</Text> : null}
          {e.date ? <Text style={{ ...f.reg, fontSize: 9, color: p.muted }}>{e.date}</Text> : null}
        </View>
      </View>

      {msg.map((t, i) => (
        <Text key={i} style={{ ...f.ital, fontSize: 11.5, lineHeight: 1.45, color: p.ink, marginBottom: 5 }}>
          {(i === 0 ? '« ' : '') + t + (i === msg.length - 1 ? ' »' : '')}
        </Text>
      ))}

      {anecdote ? (
        <View wrap={false} style={{ marginTop: 6, padding: 8, borderRadius: 4, borderWidth: 0.8, borderColor: p.gold, backgroundColor: p.boxBg }}>
          <Text style={label(d)}>SOUVENIR PARTAGÉ / ANECDOTE COMPLICE</Text>
          <Text style={{ ...f.reg, fontSize: 10.5, lineHeight: 1.4, color: p.ink, marginTop: 3 }}>{anecdote}</Text>
        </View>
      ) : null}

      {wish ? (
        <View wrap={false} style={{ marginTop: 6, padding: 8, borderRadius: 4, borderWidth: 0.8, borderColor: p.wishBorder, backgroundColor: p.wishBg }}>
          <Text style={{ ...label(d), color: '#2F7D4F' }}>{d.wishLabel.toUpperCase()}</Text>
          <Text style={{ ...f.reg, fontSize: 10.5, lineHeight: 1.4, color: p.ink, marginTop: 3 }}>{wish}</Text>
        </View>
      ) : null}

      {e.rows.length > 0 ? (
        <Text style={{ ...label(d), marginTop: 10 }}>{`PHOTOS SOUVENIRS (${e.photoCount})`}</Text>
      ) : null}
      {e.rows.map((row, ri) => (
        <View key={ri} wrap={false} style={{ flexDirection: 'row', justifyContent: 'center', marginTop: ri === 0 ? 4 : ROW_GAP }}>
          {row.map((ph, pi) => (
            <View key={pi} style={{ width: ph.width, marginLeft: pi === 0 ? 0 : ROW_GAP }}>
              {ph.src && !d.draft ? (
                <Image src={ph.src} style={{ width: ph.width, height: ph.height, objectFit: 'cover', borderRadius: 3 }} />
              ) : (
                <View style={{ width: ph.width, height: ph.height, borderRadius: 3, borderWidth: d.draft ? 0 : 0.8, borderColor: p.gold, alignItems: 'center', justifyContent: 'center' }}>
                  {d.draft ? null : <Text style={{ ...f.ital, fontSize: 9, color: p.muted }}>Photo indisponible</Text>}
                </View>
              )}
              {ph.caption ? <Text style={{ ...f.ital, fontSize: 8.5, color: p.muted, marginTop: 2 }}>{cleanText(ph.caption, k)}</Text> : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function BookDocument({ data: d }: { data: BookData }) {
  const { palette: p, fonts: f } = d;
  const page = { backgroundColor: p.paper, paddingTop: 62, paddingBottom: 62, paddingHorizontal: MARGIN_X };
  const n = d.entries.length;
  const coverH = d.cover ? Math.min(250, (220 * d.cover.height) / d.cover.width) : 0;

  return (
    <Document title={`${d.title} — ${d.recipient}`} author="Livre d'or" language="fr">
      {/* Couverture */}
      <Page size="A4" style={{ backgroundColor: p.coverBg }}>
        <View style={{ flex: 1, margin: 28, borderWidth: 1.2, borderColor: p.gold, paddingHorizontal: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ ...f.head, fontSize: 8.5, letterSpacing: 3, color: p.gold, textAlign: 'center' }}>RECUEIL OFFICIEL D’HONNEUR ET D’AMITIÉ</Text>
          <View style={{ width: 70, height: 1.2, backgroundColor: p.gold, marginVertical: 16 }} />
          <Text style={{ ...f.head, fontSize: 24, lineHeight: 1.25, color: p.coverText, textAlign: 'center' }}>{cleanText(d.title, false).toUpperCase()}</Text>
          {d.cover ? (
            <Image src={d.cover.src} style={{ width: 220, height: coverH, objectFit: 'cover', marginTop: 22, borderWidth: 1.5, borderColor: p.gold }} />
          ) : null}
          <Text style={{ ...f.ital, fontSize: 12, color: p.coverText, marginTop: 24 }}>Dédié en tout honneur, respect et gratitude à</Text>
          <Text style={{ ...f.bold, fontSize: 30, color: p.gold, textAlign: 'center', marginTop: 8 }}>{cleanText(d.recipient, false)}</Text>
          {d.subtitle ? <Text style={{ ...f.ital, fontSize: 12.5, lineHeight: 1.4, color: p.coverText, textAlign: 'center', marginTop: 16 }}>{'« ' + cleanText(d.subtitle, false) + ' »'}</Text> : null}
          <View style={{ width: 70, height: 1.2, backgroundColor: p.gold, marginVertical: 18 }} />
          <Text style={{ ...f.reg, fontSize: 11, color: p.coverText }}>{[d.eventDate, `${n} témoignage${n > 1 ? 's' : ''} réuni${n > 1 ? 's' : ''}`].filter(Boolean).join('  •  ')}</Text>
        </View>
      </Page>

      {/* Préface */}
      {d.preface ? (
        <Page size="A4" style={page}>
          <Text style={{ ...f.head, fontSize: 17, color: p.accent, textAlign: 'center', marginTop: 90 }}>Préface & Hommage de l’Équipe</Text>
          <View style={{ width: 60, height: 1.2, backgroundColor: p.gold, alignSelf: 'center', marginVertical: 16 }} />
          {paragraphs(cleanText(d.preface, d.keepEmoji)).map((t, i) => (
            <Text key={i} style={{ ...f.ital, fontSize: 14, lineHeight: 1.6, color: p.ink, textAlign: 'center', marginBottom: 8 }}>{t}</Text>
          ))}
        </Page>
      ) : null}

      {/* Sommaire (liens cliquables + numéros de page) */}
      <Page size="A4" style={page} wrap>
        <Text style={{ ...f.head, fontSize: 15, color: p.accent, marginBottom: 4 }}>{`Table des contributeurs (${n} hommage${n > 1 ? 's' : ''})`}</Text>
        <View style={{ height: 1, backgroundColor: p.gold, marginBottom: 10 }} />
        {d.entries.map((e) => (
          <Link key={e.id} src={`#${e.id}`} style={{ textDecoration: 'none', color: p.ink }}>
            <View wrap={false} style={{ flexDirection: 'row', alignItems: 'flex-end', height: 17 }}>
              <Text style={{ ...f.reg, fontSize: 11, color: p.ink }}>{cleanText(e.name, false)}</Text>
              <View style={{ flex: 1, height: 8, marginHorizontal: 5, borderBottomWidth: 0.7, borderBottomColor: p.muted, borderBottomStyle: 'dotted' }} />
              <Text style={{ ...f.reg, fontSize: 11, color: p.ink, width: 24, textAlign: 'right' }}>{d.known.get(e.id) ?? ''}</Text>
            </View>
          </Link>
        ))}
      </Page>

      {/* Témoignages : la mise en page coule d'une page à l'autre, rien n'est coupé ni perdu */}
      <Page size="A4" style={page} wrap>
        <View fixed style={{ position: 'absolute', top: 24, left: MARGIN_X, right: MARGIN_X, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 0.8, borderBottomColor: p.gold, paddingBottom: 4 }}>
          <Text style={{ ...f.head, fontSize: 7.5, letterSpacing: 1, color: p.accent }}>{cleanText(d.title, false).toUpperCase()}</Text>
          <Text style={{ ...f.ital, fontSize: 8.5, color: p.muted }}>{cleanText(d.recipient, false)}</Text>
        </View>
        {d.entries.map((e) => <Entry key={e.id} e={e} d={d} />)}
        <View fixed style={{ position: 'absolute', bottom: 24, left: MARGIN_X, right: MARGIN_X, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.8, borderTopColor: p.gold, paddingTop: 4 }}>
          <Text style={{ ...f.ital, fontSize: 8.5, color: p.muted }}>{d.eventDate}</Text>
          <Text style={{ ...f.reg, fontSize: 8.5, color: p.muted }} render={({ pageNumber, totalPages }) => `Page ${pageNumber} sur ${totalPages}`} />
        </View>
      </Page>

      {/* Mot de la fin */}
      <Page size="A4" style={page}>
        <View style={{ marginTop: 250, width: CONTENT_W, borderWidth: 2, borderColor: p.gold, borderRadius: 10, backgroundColor: p.boxBg, padding: 28, alignItems: 'center' }}>
          <Text style={{ ...f.head, fontSize: 18, color: p.accent, textAlign: 'center' }}>{d.closingTitle || `Merci pour tout, ${cleanText(d.recipient.replace(/^(monsieur|madame|m\.|mme)\s+/i, ''), false).split(' ')[0]} !`}</Text>
          <Text style={{ ...f.ital, fontSize: 13, lineHeight: 1.5, color: p.ink, textAlign: 'center', marginTop: 12 }}>{'« ' + cleanText(d.closing, d.keepEmoji) + ' »'}</Text>
          {d.closingSignature ? <Text style={{ ...f.bold, fontSize: 10.5, color: p.accent, marginTop: 12 }}>{d.closingSignature}</Text> : null}
        </View>
      </Page>
    </Document>
  );
}
