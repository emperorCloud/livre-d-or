// Fleurs en SVG pur (aucune image, aucune police, aucun id) : légères, nettes à toutes les tailles, et sans requête réseau.
// Les primitives (Rose, Peony, Blossom, Leaf, Sprig) sont des <g> à composer ; les compositions (FloralCorner, FloralDivider…) sont des <svg>.
import React from 'react';

export const PETAL = { white: '#FFF4F6', blush: '#FADCE3', soft: '#F6C3CF', rose: '#EFA3B6', deep: '#E1809C', core: '#C65E7E' };
export const LEAF = { light: '#B5CDB8', mid: '#93B49A', dark: '#6F9A7E' };
export const GOLD = '#D9B779';

type G = { x?: number; y?: number; s?: number; r?: number; o?: number };
const tf = ({ x = 0, y = 0, s = 1, r = 0 }: G) => `translate(${x} ${y}) rotate(${r}) scale(${s})`;

/** Feuille : pointe vers la droite, longueur 44. */
export const Leaf = ({ x, y, s, r, o = 1, tone = LEAF.mid }: G & { tone?: string }) => (
  <g transform={tf({ x, y, s, r })} opacity={o}>
    <path d="M0 0 C8 -13 30 -14 44 0 C30 14 8 13 0 0Z" fill={tone} />
    <path d="M2 0 C16 -1 30 -1 42 0" stroke="#fff" strokeOpacity=".45" strokeWidth="1" fill="none" />
  </g>
);

/** Rose : pétales en couches, cœur en spirale. Rayon ≈ 34. */
export const Rose = ({ x, y, s, r, o = 1 }: G) => (
  <g transform={tf({ x, y, s, r })} opacity={o}>
    {[0, 72, 144, 216, 288].map((a) => <ellipse key={`a${a}`} cx="0" cy="-17" rx="17" ry="19" fill={PETAL.soft} stroke={PETAL.rose} strokeOpacity=".5" strokeWidth=".8" transform={`rotate(${a})`} />)}
    {[36, 108, 180, 252, 324].map((a) => <ellipse key={`b${a}`} cx="0" cy="-12" rx="12.5" ry="14" fill={PETAL.rose} stroke={PETAL.deep} strokeOpacity=".45" strokeWidth=".8" transform={`rotate(${a})`} />)}
    {[0, 90, 180, 270].map((a) => <ellipse key={`c${a}`} cx="0" cy="-7" rx="8" ry="9" fill={PETAL.deep} transform={`rotate(${a + 20})`} />)}
    <circle r="6.5" fill={PETAL.core} />
    <path d="M0 0 C3 -1 4 -4 1 -5.2 C-3 -6 -6 -2 -4 2 C-2 6 4 6 6 1" fill="none" stroke={PETAL.soft} strokeOpacity=".8" strokeWidth="1.1" strokeLinecap="round" />
  </g>
);

/** Pivoine : plus ample et plus claire. Rayon ≈ 42. */
export const Peony = ({ x, y, s, r, o = 1 }: G) => (
  <g transform={tf({ x, y, s, r })} opacity={o}>
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <ellipse key={`a${a}`} cx="0" cy="-24" rx="19" ry="22" fill={PETAL.blush} stroke={PETAL.soft} strokeWidth=".9" transform={`rotate(${a})`} />)}
    {[22, 67, 112, 157, 202, 247, 292, 337].map((a) => <ellipse key={`b${a}`} cx="0" cy="-17" rx="14" ry="16.5" fill={PETAL.soft} stroke={PETAL.rose} strokeOpacity=".5" strokeWidth=".8" transform={`rotate(${a})`} />)}
    {[0, 60, 120, 180, 240, 300].map((a) => <ellipse key={`c${a}`} cx="0" cy="-10" rx="9.5" ry="11.5" fill={PETAL.rose} fillOpacity=".9" transform={`rotate(${a + 15})`} />)}
    {[0, 72, 144, 216, 288].map((a) => <ellipse key={`d${a}`} cx="0" cy="-4.5" rx="5.2" ry="6.4" fill={PETAL.deep} transform={`rotate(${a})`} />)}
    <circle r="3.4" fill={PETAL.core} />
  </g>
);

/** Fleur de cerisier : 5 pétales ronds, étamines dorées. Rayon ≈ 26. */
export const Blossom = ({ x, y, s, r, o = 1 }: G) => (
  <g transform={tf({ x, y, s, r })} opacity={o}>
    {[0, 72, 144, 216, 288].map((a) => <path key={a} d="M0 -3 C-13 -8 -11 -25 0 -23 C11 -25 13 -8 0 -3Z" fill="#FFF7F8" stroke={PETAL.soft} strokeWidth="1" transform={`rotate(${a})`} />)}
    {[0, 72, 144, 216, 288].map((a) => <path key={`s${a}`} d="M0 0 L0 -10" stroke={PETAL.rose} strokeWidth=".9" transform={`rotate(${a + 36})`} />)}
    {[0, 72, 144, 216, 288].map((a) => <circle key={`d${a}`} cx="0" cy="-11" r="1.7" fill={GOLD} transform={`rotate(${a + 36})`} />)}
    <circle r="3" fill={PETAL.deep} />
  </g>
);

/** Brindille : tige courbe, feuilles et petits boutons. Longueur ≈ 120. */
export const Sprig = ({ x, y, s, r, o = 1 }: G) => (
  <g transform={tf({ x, y, s, r })} opacity={o}>
    <path d="M0 0 C30 -12 62 -10 120 -22" fill="none" stroke={LEAF.dark} strokeWidth="2" strokeLinecap="round" />
    <Leaf x={22} y={-8} s={0.55} r={-48} tone={LEAF.mid} /><Leaf x={22} y={-8} s={0.5} r={42} tone={LEAF.light} />
    <Leaf x={55} y={-12} s={0.6} r={-44} tone={LEAF.light} /><Leaf x={55} y={-12} s={0.5} r={46} tone={LEAF.mid} />
    <Leaf x={88} y={-17} s={0.5} r={-40} tone={LEAF.mid} /><Leaf x={88} y={-17} s={0.45} r={44} tone={LEAF.light} />
    <circle cx="120" cy="-22" r="3.4" fill={PETAL.rose} /><circle cx="104" cy="-17" r="2.4" fill={PETAL.soft} /><circle cx="40" cy="-13" r="2" fill={GOLD} />
  </g>
);

const Svg = ({ w, h, className, children }: { w: number; h: number; className?: string; children: React.ReactNode }) => (
  <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">{children}</svg>
);

/** Bouquet d'angle (haut-gauche). Se retourne avec CSS : scale-x-[-1], scale-y-[-1]. */
export const FloralCorner = ({ className }: { className?: string }) => (
  <Svg w={360} h={360} className={className}>
    <Sprig x={6} y={170} s={1.45} r={64} o={0.95} /><Sprig x={170} y={6} s={1.4} r={16} o={0.95} /><Sprig x={4} y={60} s={0.9} r={40} o={0.8} />
    <Leaf x={150} y={40} s={1.3} r={-32} tone={LEAF.light} /><Leaf x={38} y={150} s={1.3} r={62} tone={LEAF.light} />
    <Leaf x={190} y={120} s={1.2} r={-20} tone={LEAF.mid} /><Leaf x={110} y={200} s={1.15} r={78} tone={LEAF.mid} />
    <Leaf x={70} y={70} s={1.45} r={28} tone={LEAF.dark} o={0.9} /><Leaf x={70} y={70} s={1.5} r={72} tone={LEAF.mid} />
    <Blossom x={44} y={246} s={1.25} r={10} /><Blossom x={258} y={46} s={1.15} r={-14} />
    <Peony x={108} y={108} s={1.5} r={8} />
    <Rose x={240} y={126} s={1.0} r={-18} /><Rose x={96} y={240} s={0.95} r={24} />
    <Blossom x={178} y={196} s={0.75} r={30} /><Blossom x={306} y={92} s={0.7} r={8} />
    <circle cx="200" cy="30" r="3" fill={GOLD} /><circle cx="30" cy="200" r="3" fill={GOLD} /><circle cx="214" cy="170" r="2.4" fill={PETAL.deep} /><circle cx="150" cy="248" r="2.4" fill={PETAL.rose} />
  </Svg>
);

/** Séparateur : une rose entre deux brindilles. */
export const FloralDivider = ({ className }: { className?: string }) => (
  <Svg w={320} h={64} className={className}>
    <Sprig x={150} y={36} s={1.1} r={180} o={0.95} /><Sprig x={170} y={36} s={1.1} r={0} o={0.95} />
    <Rose x={160} y={32} s={0.78} /><Blossom x={112} y={40} s={0.5} r={12} /><Blossom x={208} y={40} s={0.5} r={-12} />
  </Svg>
);

/** Branche fleurie horizontale (bordures de sections). */
export const FloralBranch = ({ className }: { className?: string }) => (
  <Svg w={420} h={110} className={className}>
    <Sprig x={10} y={70} s={1.5} r={-4} /><Leaf x={150} y={58} s={1} r={-38} tone={LEAF.light} /><Leaf x={230} y={50} s={1} r={40} tone={LEAF.mid} />
    <Peony x={190} y={54} s={0.8} /><Rose x={286} y={48} s={0.62} r={20} /><Blossom x={110} y={50} s={0.6} /><Blossom x={350} y={36} s={0.55} r={-10} />
    <Sprig x={300} y={44} s={0.9} r={-8} o={0.9} />
  </Svg>
);

/** Fleur isolée (puces, médaillons). */
export const SingleRose = ({ className }: { className?: string }) => <Svg w={80} h={80} className={className}><Rose x={40} y={40} s={1.05} /></Svg>;
export const SingleBlossom = ({ className }: { className?: string }) => <Svg w={60} h={60} className={className}><Blossom x={30} y={30} s={1.05} /></Svg>;
