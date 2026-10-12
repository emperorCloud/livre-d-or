// Polices du PDF. Si les fichiers .ttf sont présents dans /public/fonts (voir public/fonts/README.md),
// ils sont embarqués (Cormorant Garamond + Cinzel). Sinon : Times intégré au PDF, qui reste net et sans erreur.

export interface FontStyle { fontFamily: string; fontStyle?: 'italic'; fontWeight?: number }
export interface FontSet { reg: FontStyle; ital: FontStyle; bold: FontStyle; head: FontStyle; embedded: boolean }

const FILES = {
  regular: '/fonts/CormorantGaramond-Regular.ttf',
  italic: '/fonts/CormorantGaramond-Italic.ttf',
  bold: '/fonts/CormorantGaramond-Bold.ttf',
  head: '/fonts/Cinzel-Bold.ttf',
};

async function exists(url: string): Promise<boolean> {
  try { return (await fetch(url, { method: 'HEAD' })).ok; } catch { return false; }
}

export async function setupFonts(Font: any): Promise<FontSet> {
  Font.registerHyphenationCallback((word: string) => [word]); // pas de coupures de mots approximatives
  const all = await Promise.all(Object.values(FILES).map(exists));
  if (all.every(Boolean)) {
    Font.register({
      family: 'BookSerif',
      fonts: [
        { src: FILES.regular },
        { src: FILES.italic, fontStyle: 'italic' },
        { src: FILES.bold, fontWeight: 700 },
      ],
    });
    Font.register({ family: 'BookHead', src: FILES.head });
    return {
      reg: { fontFamily: 'BookSerif' },
      ital: { fontFamily: 'BookSerif', fontStyle: 'italic' },
      bold: { fontFamily: 'BookSerif', fontWeight: 700 },
      head: { fontFamily: 'BookHead' },
      embedded: true,
    };
  }
  return {
    reg: { fontFamily: 'Times-Roman' }, ital: { fontFamily: 'Times-Italic' },
    bold: { fontFamily: 'Times-Bold' }, head: { fontFamily: 'Times-Bold' }, embedded: false,
  };
}

export function registerEmoji(Font: any) {
  Font.registerEmojiSource({ format: 'png', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/' });
}
