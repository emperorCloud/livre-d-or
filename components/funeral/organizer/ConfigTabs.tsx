'use client';
import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { EVENT_CATEGORIES, type FuneralConfig, type FuneralEvent, type Notice } from '@/lib/funeral/types';
import { uploadConfigImage } from '@/lib/client/upload';
import { V, VField } from '../ui';
import { newId, PayMethodsEditor, Section } from './shared';

interface Props { config: FuneralConfig; onChange: (c: FuneralConfig) => void }

export function IdentityTab({ config, onChange }: Props) {
  const pr = config.profile;
  const set = <K extends keyof typeof pr>(k: K, v: (typeof pr)[K]) => onChange({ ...config, profile: { ...pr, [k]: v } });
  const file = useRef<HTMLInputElement>(null);
  const [up, setUp] = useState(false), [err, setErr] = useState('');
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    setUp(true); setErr('');
    try { set('photoUrl', await uploadConfigImage(f)); } catch (x) { setErr(x instanceof Error ? x.message : 'Envoi impossible.'); } finally { setUp(false); }
  };
  return (
    <div className="space-y-5">
      <Section title="Le défunt" hint="Le nom et le lieu de la cérémonie se modifient depuis la fiche de la cérémonie (administrateur).">
        <div className="flex items-center gap-4">
          {pr.photoUrl ? <img src={pr.photoUrl} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-violet-300/40" /> : <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/25 flex items-center justify-center text-violet-300"><ImagePlus className="w-6 h-6" /></div>}
          <div className="space-y-1">
            <input ref={file} type="file" accept="image/*" className="hidden" onChange={pick} />
            <button type="button" className={V.btnGhost} disabled={up} onClick={() => file.current?.click()}>{up ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}{pr.photoUrl ? 'Changer la photo' : 'Ajouter un portrait'}</button>
            {pr.photoUrl && <button type="button" className={`${V.danger} ml-2`} onClick={() => set('photoUrl', '')}>Retirer</button>}
            {err && <p className="text-xs text-red-300">{err}</p>}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <VField label="Titres / distinctions" hint="Ex : Chef, Papa, Dr., Honorable…"><input className={V.input} value={pr.titles} onChange={(e) => set('titles', e.target.value)} /></VField>
          <VField label="Épitaphe"><input className={V.input} value={pr.epitaph} onChange={(e) => set('epitaph', e.target.value)} /></VField>
          <VField label="Date de naissance"><input type="date" className={V.input} value={pr.birthDate} onChange={(e) => set('birthDate', e.target.value)} /></VField>
          <VField label="Date de décès"><input type="date" className={V.input} value={pr.deathDate} onChange={(e) => set('deathDate', e.target.value)} /></VField>
          <VField label="Village d'origine"><input className={V.input} value={pr.hometown} onChange={(e) => set('hometown', e.target.value)} /></VField>
          <VField label="Ville de résidence"><input className={V.input} value={pr.residenceCity} onChange={(e) => set('residenceCity', e.target.value)} /></VField>
        </div>
        <VField label="Mot de la famille"><textarea rows={4} className={V.input} value={pr.familyMessage} onChange={(e) => set('familyMessage', e.target.value)} /></VField>
        <VField label="Parcours / biographie"><textarea rows={6} className={V.input} value={pr.biography} onChange={(e) => set('biography', e.target.value)} /></VField>
        <VField label="Tenue conseillée"><textarea rows={2} className={V.input} value={pr.dressCodeAdvice} onChange={(e) => set('dressCodeAdvice', e.target.value)} /></VField>
      </Section>
      <Section title="Contact & monnaie">
        <div className="grid sm:grid-cols-3 gap-4">
          <VField label="Téléphone de la famille"><input type="tel" className={V.input} value={pr.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} /></VField>
          <VField label="E-mail"><input type="email" className={V.input} value={pr.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} /></VField>
          <VField label="Monnaie"><input className={V.input} value={pr.currency} onChange={(e) => set('currency', e.target.value)} /></VField>
        </div>
      </Section>
      <Section title="Soutien financier" hint="Numéros affichés publiquement sur l'onglet « Soutien ». Les dons déclarés restent « en attente » tant que vous ne les avez pas confirmés.">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pr.donationsOpen} onChange={(e) => set('donationsOpen', e.target.checked)} />Accepter les déclarations de dons</label>
        <PayMethodsEditor value={pr.donationMethods} onChange={(v) => set('donationMethods', v)} />
      </Section>
      <Section title="Référencement Google" hint="Le lien reste partageable (WhatsApp, SMS) dans tous les cas.">
        <label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" checked={pr.searchIndexing} onChange={(e) => set('searchIndexing', e.target.checked)} />
          <span>Autoriser Google à référencer cette page (nom, dates, lieu des cérémonies et contact de la famille deviennent trouvables par une recherche). Décochez pour une page strictement réservée à ceux qui reçoivent le lien.</span></label>
      </Section>
    </div>
  );
}

export function FairePartTab({ config, onChange }: Props) {
  const fp = config.fairePart;
  const set = (p: Partial<typeof fp>) => onChange({ ...config, fairePart: { ...fp, ...p } });
  return (
    <div className="space-y-5">
      <Section title="Annonce du décès" hint="Texte d'ouverture du faire-part.">
        <textarea rows={5} className={V.input} value={fp.header} onChange={(e) => set({ header: e.target.value })} />
      </Section>
      <Section title="Familles & personnes annoncées" hint="Un groupe par bloc (La veuve, Les enfants, Les frères et sœurs…). Une personne par ligne.">
        {fp.groups.map((g, i) => (
          <div key={g.id} className="space-y-2 p-3 rounded-xl border border-white/10 bg-white/[0.04]">
            <input className={V.input} placeholder="Titre du groupe" value={g.title} onChange={(e) => set({ groups: fp.groups.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
            <textarea rows={4} className={V.input} placeholder="Un nom par ligne" value={g.members.join('\n')} onChange={(e) => set({ groups: fp.groups.map((x, j) => (j === i ? { ...x, members: e.target.value.split('\n') } : x)) })} />
            <button type="button" className={V.danger} onClick={() => set({ groups: fp.groups.filter((_, j) => j !== i) })}><Trash2 className="w-3.5 h-3.5" />Supprimer le groupe</button>
          </div>
        ))}
        <button type="button" className={V.btnGhost} onClick={() => set({ groups: [...fp.groups, { id: newId(), title: '', members: [] }] })}><Plus className="w-3.5 h-3.5" />Ajouter un groupe</button>
      </Section>
      <Section title="Mot de fin"><textarea rows={3} className={V.input} value={fp.footer} onChange={(e) => set({ footer: e.target.value })} /></Section>
    </div>
  );
}

const blankEvent = (): FuneralEvent => ({ id: newId(), title: '', category: 'autre', date: '', startTime: '', endTime: '', locationName: '', locationAddress: '', mapUrl: '', description: '', leader: '', dressCode: '', isKey: false });

export function ProgrammeTab({ config, onChange }: Props) {
  const ev = config.events, nt = config.notices;
  const setEv = (i: number, p: Partial<FuneralEvent>) => onChange({ ...config, events: ev.map((e, j) => (j === i ? { ...e, ...p } : e)) });
  const setNt = (i: number, p: Partial<Notice>) => onChange({ ...config, notices: nt.map((n, j) => (j === i ? { ...n, ...p } : n)) });
  return (
    <div className="space-y-5">
      <Section title="Cérémonies du programme" hint="L'affichage public les classe automatiquement par date et par heure.">
        {ev.map((e, i) => (
          <div key={e.id} className="space-y-3 p-4 rounded-xl border border-white/10 bg-white/[0.04]">
            <div className="grid sm:grid-cols-2 gap-3">
              <VField label="Titre *"><input className={V.input} value={e.title} onChange={(x) => setEv(i, { title: x.target.value })} /></VField>
              <VField label="Type"><select className={V.input} value={e.category} onChange={(x) => setEv(i, { category: x.target.value as FuneralEvent['category'] })}>{EVENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></VField>
              <VField label="Date"><input type="date" className={V.input} value={e.date} onChange={(x) => setEv(i, { date: x.target.value })} /></VField>
              <div className="grid grid-cols-2 gap-3">
                <VField label="Début"><input type="time" className={V.input} value={e.startTime} onChange={(x) => setEv(i, { startTime: x.target.value })} /></VField>
                <VField label="Fin"><input type="time" className={V.input} value={e.endTime} onChange={(x) => setEv(i, { endTime: x.target.value })} /></VField>
              </div>
              <VField label="Lieu"><input className={V.input} value={e.locationName} onChange={(x) => setEv(i, { locationName: x.target.value })} /></VField>
              <VField label="Adresse"><input className={V.input} value={e.locationAddress} onChange={(x) => setEv(i, { locationAddress: x.target.value })} /></VField>
              <VField label="Lien de carte" hint="Google Maps (https://…)"><input className={V.input} value={e.mapUrl} onChange={(x) => setEv(i, { mapUrl: x.target.value })} /></VField>
              <VField label="Officiant"><input className={V.input} value={e.leader} onChange={(x) => setEv(i, { leader: x.target.value })} /></VField>
              <VField label="Tenue"><input className={V.input} value={e.dressCode} onChange={(x) => setEv(i, { dressCode: x.target.value })} /></VField>
            </div>
            <VField label="Description"><textarea rows={2} className={V.input} value={e.description} onChange={(x) => setEv(i, { description: x.target.value })} /></VField>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={e.isKey} onChange={(x) => setEv(i, { isKey: x.target.checked })} />Moment fort (mis en avant)</label>
              <button type="button" className={V.danger} onClick={() => onChange({ ...config, events: ev.filter((_, j) => j !== i) })}><Trash2 className="w-3.5 h-3.5" />Supprimer</button>
            </div>
          </div>
        ))}
        {ev.length < 60 && <button type="button" className={V.btnGhost} onClick={() => onChange({ ...config, events: [...ev, blankEvent()] })}><Plus className="w-3.5 h-3.5" />Ajouter une cérémonie</button>}
      </Section>

      <Section title="Rappels & alertes" hint="Bandeau affiché en haut de la page publique à partir de la date choisie (heure du Cameroun). Vide = tout de suite.">
        {nt.map((n, i) => (
          <div key={n.id} className="grid sm:grid-cols-2 gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.04]">
            <VField label="Titre"><input className={V.input} value={n.title} onChange={(x) => setNt(i, { title: x.target.value })} /></VField>
            <VField label="Afficher à partir de"><input type="datetime-local" className={V.input} value={n.showFrom} onChange={(x) => setNt(i, { showFrom: x.target.value })} /></VField>
            <div className="sm:col-span-2"><VField label="Message"><textarea rows={2} className={V.input} value={n.message} onChange={(x) => setNt(i, { message: x.target.value })} /></VField></div>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={n.active} onChange={(x) => setNt(i, { active: x.target.checked })} />Actif</label>
            <button type="button" className={`${V.danger} justify-self-end`} onClick={() => onChange({ ...config, notices: nt.filter((_, j) => j !== i) })}><Trash2 className="w-3.5 h-3.5" />Supprimer</button>
          </div>
        ))}
        {nt.length < 20 && <button type="button" className={V.btnGhost} onClick={() => onChange({ ...config, notices: [...nt, { id: newId(), title: '', message: '', showFrom: '', active: true }] })}><Plus className="w-3.5 h-3.5" />Ajouter un rappel</button>}
      </Section>
    </div>
  );
}
