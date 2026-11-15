'use client';
import { useRef, useState } from 'react';
import { Bus as BusIcon, Check, Copy, HandHeart, Loader2, MapPin, Phone, Upload } from 'lucide-react';
import { DONATION_METHODS, fmtMoney, type PublicBus, type PublicProgramme } from '@/lib/funeral/types';
import { frDateTime, telHref } from '@/lib/funeral/format';
import { programmeApi } from '@/lib/funeral/client';
import { uploadProofImage } from '@/lib/client/upload';
import { copyText } from '@/lib/client/links';
import { V, VField, VModal } from './ui';

const CATEGORIES = ['Famille', 'Ami(e)', 'Collègue', 'Voisin(e)', 'Autre'];

function ReserveModal({ bus, slug, currency, onClose, onDone }: { bus: PublicBus; slug: string; currency: string; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ passengerName: '', passengerPhone: '', category: CATEGORIES[0], paymentMethod: '' });
  const [proof, setProof] = useState(''), [busy, setBusy] = useState(false), [up, setUp] = useState(false), [error, setError] = useState('');
  const [done, setDone] = useState<number | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files?.[0]; e.target.value = '';
    if (!fl) return;
    setUp(true); setError('');
    try { setProof(await uploadProofImage(fl, slug)); } catch (err) { setError(err instanceof Error ? err.message : 'Envoi impossible.'); } finally { setUp(false); }
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { const r = await programmeApi(slug).reserve({ busId: bus.id, ...f, proofUrl: proof }); setDone(r.orderNumber); onDone(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Réservation impossible.'); } finally { setBusy(false); }
  };

  if (done !== null) return (
    <VModal title="Place demandée" kicker={bus.name} onClose={onClose}>
      <div className="text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-300/15 border border-emerald-200/30 flex items-center justify-center"><Check className="w-6 h-6 text-emerald-200" /></div>
        <p className="text-sm">Votre numéro d’ordre : <b className="text-2xl block text-amber-200">N° {done}</b></p>
        <p className={`text-xs ${V.muted}`}>Votre place sera confirmée par l’organisateur après vérification{bus.fare > 0 ? ' du paiement' : ''}. Notez ce numéro.</p>
        <button onClick={onClose} className={V.btn}>Fermer</button>
      </div>
    </VModal>
  );
  return (
    <VModal title="Réserver une place" kicker={bus.name} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <div className="p-3 rounded-lg text-xs bg-red-500/15 border border-red-300/30 text-red-100">{error}</div>}
        <VField label="Nom complet *"><input required className={V.input} value={f.passengerName} onChange={(e) => setF({ ...f, passengerName: e.target.value })} autoComplete="name" /></VField>
        <VField label="Téléphone *"><input required type="tel" className={V.input} value={f.passengerPhone} onChange={(e) => setF({ ...f, passengerPhone: e.target.value })} placeholder="+237 6XX XX XX XX" autoComplete="tel" /></VField>
        <VField label="Lien avec la famille"><select className={V.input} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></VField>
        {bus.fare > 0 && (
          <>
            <p className="text-sm">Tarif : <b className={V.gold}>{fmtMoney(bus.fare, currency)}</b> par place.</p>
            {bus.paymentMethods.length > 0 && (
              <VField label="Mode de paiement">
                <select className={V.input} value={f.paymentMethod} onChange={(e) => setF({ ...f, paymentMethod: e.target.value })}>
                  <option value="">— Choisir —</option>{bus.paymentMethods.map((m) => <option key={m.label}>{m.label}</option>)}<option>Sur place</option>
                </select>
                {bus.paymentMethods.find((m) => m.label === f.paymentMethod) && (() => { const m = bus.paymentMethods.find((x) => x.label === f.paymentMethod)!; return <span className="block text-[11px] text-violet-200 mt-1.5">{m.accountNumber} {m.accountName && `· ${m.accountName}`} {m.instructions && `— ${m.instructions}`}</span>; })()}
              </VField>
            )}
            <div>
              <input ref={file} type="file" accept="image/*" className="hidden" onChange={pick} />
              <button type="button" onClick={() => file.current?.click()} className={V.btnGhost} disabled={up}>
                {up ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}{proof ? 'Preuve ajoutée ✓ (changer)' : 'Joindre la preuve de paiement (image)'}
              </button>
            </div>
          </>
        )}
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className={V.btnGhost}>Annuler</button><button disabled={busy || up} className={V.btn}>{busy ? 'Envoi…' : 'Réserver'}</button></div>
      </form>
    </VModal>
  );
}

export function ConvoisPanel({ p, onChanged }: { p: PublicProgramme; onChanged: () => void }) {
  const [bus, setBus] = useState<PublicBus | null>(null);
  const cur = p.config.profile.currency;
  if (p.buses.length === 0) return <p className={`${V.card} p-6 text-sm ${V.muted}`}>Aucun convoi n’est organisé pour le moment. Revenez bientôt ou contactez la famille.</p>;
  return (
    <div className="space-y-4">
      {p.buses.map((b) => {
        const left = Math.max(0, b.capacity - b.taken), full = left === 0, open = b.reservationsOpen && !full;
        return (
          <article key={b.id} className={`${V.card} p-5 space-y-3`}>
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="text-lg font-semibold flex items-center gap-2"><BusIcon className="w-4 h-4 text-violet-300" />{b.name}</h3>
                <p className={`text-xs ${V.muted}`}>{[b.departureAt && frDateTime(b.departureAt), b.departureLocation && `départ : ${b.departureLocation}`, b.destination && `→ ${b.destination}`].filter(Boolean).join(' · ')}</p></div>
              <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${full ? 'border-red-300/30 text-red-200 bg-red-500/10' : 'border-emerald-200/30 text-emerald-200 bg-emerald-300/10'}`}>{full ? 'Complet' : `${left} place${left > 1 ? 's' : ''}`}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-violet-300" style={{ width: `${Math.min(100, (b.taken / b.capacity) * 100)}%` }} /></div>
            <p className="text-sm">{b.fare > 0 ? <>Tarif : <b className={V.gold}>{fmtMoney(b.fare, cur)}</b></> : 'Transport gratuit'}{b.plate && <span className={V.muted}> · {b.plate}</span>}</p>
            {b.notes && <p className={`text-sm whitespace-pre-line ${V.muted}`}>{b.notes}</p>}
            {(b.captainName || b.captainPhone) && <p className="text-xs flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-violet-300" />Chef de convoi : {b.captainName} {b.captainPhone && <a className="underline text-violet-200" href={telHref(b.captainPhone)}>{b.captainPhone}</a>}</p>}
            <button disabled={!open} onClick={() => setBus(b)} className={V.btn}>{!b.reservationsOpen ? 'Réservations closes' : full ? 'Complet' : 'Réserver une place'}</button>
          </article>
        );
      })}
      {bus && <ReserveModal bus={bus} slug={p.slug} currency={cur} onClose={() => setBus(null)} onDone={onChanged} />}
    </div>
  );
}

function DonateModal({ p, onClose }: { p: PublicProgramme; onClose: () => void }) {
  const [f, setF] = useState({ donorName: '', donorPhone: '', amount: '', paymentMethod: 'mobile_money', paymentReference: '', blessing: '', isAnonymous: false });
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [receipt, setReceipt] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { const r = await programmeApi(p.slug).donate({ ...f, amount: Number(f.amount), paymentMethod: f.paymentMethod as never }); setReceipt(r.receiptNumber); }
    catch (err) { setError(err instanceof Error ? err.message : 'Envoi impossible.'); } finally { setBusy(false); }
  };
  if (receipt) return (
    <VModal title="Merci pour votre geste" onClose={onClose}>
      <div className="text-center space-y-3">
        <HandHeart className="w-10 h-10 mx-auto text-amber-200" />
        <p className="text-sm">Votre déclaration porte le numéro <b className="text-amber-200">{receipt}</b>.</p>
        <p className={`text-xs ${V.muted}`}>Elle sera confirmée par la famille après vérification de la réception. Conservez ce numéro.</p>
        <button onClick={onClose} className={V.btn}>Fermer</button>
      </div>
    </VModal>
  );
  return (
    <VModal title="Soutenir la famille" kicker="Déclarer un don" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <div className="p-3 rounded-lg text-xs bg-red-500/15 border border-red-300/30 text-red-100">{error}</div>}
        <p className={`text-xs ${V.muted}`}>Effectuez d’abord le paiement avec l’un des moyens indiqués, puis déclarez-le ici.</p>
        <VField label="Nom *"><input required className={V.input} value={f.donorName} onChange={(e) => setF({ ...f, donorName: e.target.value })} autoComplete="name" /></VField>
        <div className="grid grid-cols-2 gap-3">
          <VField label={`Montant (${p.config.profile.currency}) *`}><input required type="number" min={1} inputMode="numeric" className={V.input} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></VField>
          <VField label="Moyen"><select className={V.input} value={f.paymentMethod} onChange={(e) => setF({ ...f, paymentMethod: e.target.value })}>{DONATION_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></VField>
        </div>
        <VField label="Téléphone" hint="Visible uniquement par la famille."><input type="tel" className={V.input} value={f.donorPhone} onChange={(e) => setF({ ...f, donorPhone: e.target.value })} /></VField>
        <VField label="Référence de la transaction"><input className={V.input} value={f.paymentReference} onChange={(e) => setF({ ...f, paymentReference: e.target.value })} /></VField>
        <VField label="Message pour la famille"><textarea rows={2} className={V.input} value={f.blessing} onChange={(e) => setF({ ...f, blessing: e.target.value })} /></VField>
        <label className="flex items-center gap-2 text-xs text-violet-100"><input type="checkbox" checked={f.isAnonymous} onChange={(e) => setF({ ...f, isAnonymous: e.target.checked })} />Ne pas afficher mon nom publiquement</label>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className={V.btnGhost}>Annuler</button><button disabled={busy} className={V.btn}>{busy ? 'Envoi…' : 'Déclarer mon don'}</button></div>
      </form>
    </VModal>
  );
}

export function DonsPanel({ p }: { p: PublicProgramme }) {
  const [open, setOpen] = useState(false), [copied, setCopied] = useState('');
  const pr = p.config.profile;
  return (
    <div className="space-y-4">
      {p.donations.count > 0 && <div className={`${V.card} p-5 text-center`}><p className={`text-xs uppercase tracking-widest ${V.muted}`}>Déjà recueilli</p><p className="text-3xl font-semibold text-amber-200 mt-1">{fmtMoney(p.donations.total, pr.currency)}</p><p className={`text-xs ${V.muted} mt-1`}>{p.donations.count} contribution{p.donations.count > 1 ? 's' : ''} confirmée{p.donations.count > 1 ? 's' : ''}</p></div>}
      {pr.donationMethods.length === 0 && <p className={`${V.card} p-6 text-sm ${V.muted}`}>Les moyens de contribution seront communiqués par la famille.</p>}
      {pr.donationMethods.map((m) => (
        <div key={m.label} className={`${V.card} p-4 flex items-center justify-between gap-3`}>
          <div className="min-w-0"><p className="font-semibold">{m.label}</p><p className="text-sm text-amber-200 break-all">{m.accountNumber}</p>{(m.accountName || m.instructions) && <p className={`text-xs ${V.muted}`}>{[m.accountName, m.instructions].filter(Boolean).join(' — ')}</p>}</div>
          {m.accountNumber && <button className={V.btnGhost} onClick={async () => { if (await copyText(m.accountNumber)) { setCopied(m.label); setTimeout(() => setCopied(''), 1800); } }}>{copied === m.label ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied === m.label ? 'Copié' : 'Copier'}</button>}
        </div>
      ))}
      {pr.donationsOpen ? <button onClick={() => setOpen(true)} className={`${V.btn} w-full`}><HandHeart className="w-4 h-4" />J’ai effectué un don — le déclarer</button> : <p className={`text-center text-sm ${V.muted}`}>Les contributions sont closes. Merci à tous.</p>}
      {p.donations.donors.length > 0 && <div className={`${V.card} p-5`}><p className={`text-xs uppercase tracking-widest ${V.muted} mb-2`}>La famille remercie</p><p className="text-sm leading-relaxed">{p.donations.donors.join(' · ')}</p></div>}
      {open && <DonateModal p={p} onClose={() => setOpen(false)} />}
    </div>
  );
}

export const MapLink = ({ url, label = 'Itinéraire' }: { url: string; label?: string }) =>
  url ? <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-violet-200 underline underline-offset-2"><MapPin className="w-3.5 h-3.5" />{label}</a> : null;
