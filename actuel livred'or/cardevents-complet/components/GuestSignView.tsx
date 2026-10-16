'use client';
import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2, Trash2, X } from 'lucide-react';
import type { GuestPhoto, PublicInvite } from '@/lib/types';
import type { SiteSettings } from '@/lib/siteSettings';
import { api } from '@/lib/client/api';
import { uploadGuestPhoto } from '@/lib/client/upload';
import { fontClass, paperStyle } from '@/lib/client/themeStyles';
import Navbar from './Navbar';
import SiteFooter from './SiteFooter';
import { inputCls } from './ui';

const MAX_PHOTOS = 6;
const RELATIONS = ['Famille', 'Ami(e)', 'Collègue', 'Voisin(e)', 'Ancien(ne) camarade', 'Autre'];
const tokenKey = (slug: string) => `livre-or:token:${slug}`;

const heroCls = (r: string) => (r === '4:5' ? 'aspect-[4/5] max-w-md mx-auto' : r === '1:1' ? 'aspect-square max-w-lg mx-auto' : 'aspect-[4/5] sm:aspect-[16/9]');

interface Pending { key: string; name: string; error?: string }

export default function GuestSignView({ invite, settings }: { invite: PublicInvite; settings: SiteSettings }) {
  const t = invite.theme;
  const paper = paperStyle(t.paperTexture);
  const font = fontClass(t.fontStyle);
  const [form, setForm] = useState({ firstName: '', lastName: '', relationship: '', message: '', anecdote: '', wish: '' });
  const [photos, setPhotos] = useState<GuestPhoto[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<'edit' | 'created' | 'updated' | 'deleted'>('edit');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Retrouve le témoignage de ce visiteur (jeton gardé dans son navigateur) pour qu'il puisse le modifier.
  useEffect(() => {
    const tk = localStorage.getItem(tokenKey(invite.slug));
    if (!tk) return;
    api.myEntries(tk).then((list) => {
      const e = list[0];
      if (!e) { localStorage.removeItem(tokenKey(invite.slug)); return; }
      setToken(tk);
      setForm({ firstName: e.firstName, lastName: e.lastName, relationship: e.relationship, message: e.message, anecdote: e.anecdote || '', wish: e.wish || '' });
      setPhotos(e.photos || []);
    }).catch(() => {});
  }, [invite.slug]);

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length - pending.filter((p) => !p.error).length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > picked.length) setError(`Vous pouvez joindre ${MAX_PHOTOS} photos au maximum.`); else setError('');
    for (const file of picked) {
      const key = crypto.randomUUID();
      setPending((p) => [...p, { key, name: file.name }]);
      try {
        const photo = await uploadGuestPhoto(file, { inviteSlug: invite.slug });
        setPhotos((p) => [...p, photo]);
        setPending((p) => p.filter((x) => x.key !== key));
      } catch (e) {
        setPending((p) => p.map((x) => (x.key === key ? { ...x, error: e instanceof Error ? e.message : 'Échec' } : x)));
      }
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const res = await api.submitEntry({ ...form, photos, inviteSlug: invite.slug, token: token || undefined });
      const tk = res.token || token;
      if (tk) { localStorage.setItem(tokenKey(invite.slug), tk); setToken(tk); }
      setState(token ? 'updated' : 'created');
    } catch (err) { setError(err instanceof Error ? err.message : 'Envoi impossible.'); } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!token || !confirm('Supprimer définitivement votre message et vos photos ?')) return;
    try { await api.deleteMine(token); localStorage.removeItem(tokenKey(invite.slug)); setToken(null); setPhotos([]); setForm({ firstName: '', lastName: '', relationship: '', message: '', anecdote: '', wish: '' }); setState('deleted'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Suppression impossible.'); }
  };

  const busyUploading = pending.some((p) => !p.error);
  const accent = t.accentColor;

  return (
    <div className={`min-h-screen flex flex-col bg-linear-to-br ${t.bgGradient}`}>
      <Navbar settings={{ ...settings, brandTagline: invite.ceremony.title }} role="none" onBrand={() => (window.location.href = '/')} />
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">

        {/* Photo du concerné à la une : recadrée autour du point focal choisi par le responsable */}
        {invite.featuredPhotoUrl && (
          <div className={`relative w-full overflow-hidden rounded-2xl shadow-xl border-2 ${heroCls(invite.featuredPhotoAspectRatio)}`} style={{ borderColor: accent }}>
            <img src={invite.featuredPhotoUrl} alt={invite.ceremony.honoreeName} className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: `${invite.featuredFocalX * 100}% ${invite.featuredFocalY * 100}%` }} fetchPriority="high" />
            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
            <div className={`absolute bottom-0 inset-x-0 p-5 sm:p-8 text-white ${font}`}>
              <h1 className="text-3xl sm:text-5xl font-bold leading-tight drop-shadow">{invite.ceremony.honoreeName}</h1>
              <p className="text-sm sm:text-base opacity-90 mt-1">{[invite.ceremony.date, invite.ceremony.location].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
        )}
        {!invite.featuredPhotoUrl && (
          <div className={`text-center space-y-1 pt-6 ${font}`} style={{ color: t.primaryColor }}>
            <h1 className="text-4xl sm:text-5xl font-bold">{invite.ceremony.honoreeName}</h1>
            <p className="text-sm opacity-80">{[invite.ceremony.date, invite.ceremony.location].filter(Boolean).join(' · ')}</p>
          </div>
        )}

        <div className={`text-center space-y-2 ${font}`} style={{ color: t.primaryColor }}>
          <h2 className="text-xl sm:text-2xl font-semibold">{invite.ceremony.title}</h2>
          {invite.ceremony.subtitle && <p className="text-sm opacity-80">{invite.ceremony.subtitle}</p>}
          {t.coverQuote && <p className="italic text-sm sm:text-base max-w-xl mx-auto opacity-90">« {t.coverQuote} »{t.coverQuoteAuthor ? <span className="not-italic text-xs"> — {t.coverQuoteAuthor}</span> : null}</p>}
        </div>

        {invite.customIntro && <p className="text-sm text-stone-700 text-center max-w-xl mx-auto leading-relaxed">{invite.customIntro}</p>}

        <div className="rounded-2xl border shadow-lg p-5 sm:p-8" style={{ background: paper.bg, borderColor: paper.border, color: paper.text }}>
          {invite.isClosed ? (
            <p className={`text-center ${font} text-lg`}>Ce livre d'or est clos : il n'accepte plus de nouveaux messages. Merci à toutes et à tous.</p>
          ) : state === 'created' || state === 'updated' || state === 'deleted' ? (
            <div className="text-center space-y-4 py-6">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center" style={{ background: accent, color: '#fff' }}><Check className="w-6 h-6" /></div>
              <p className={`${font} text-xl`}>{state === 'deleted' ? 'Votre message a été supprimé.' : state === 'updated' ? 'Votre message a été mis à jour.' : 'Votre message et vos photos ont bien été enregistrés. Merci infiniment !'}</p>
              {state !== 'deleted' && <button onClick={() => setState('edit')} className="text-xs underline">Modifier mon message</button>}
              {state === 'deleted' && <button onClick={() => setState('edit')} className="text-xs underline">Écrire un nouveau message</button>}
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h3 className={`${font} text-2xl font-semibold`} style={{ color: t.primaryColor }}>{token ? 'Modifier mon message' : 'Laisser un message'}</h3>
              {invite.customPrompt && <p className="text-xs opacity-75">{invite.customPrompt}</p>}
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

              <div className="grid sm:grid-cols-2 gap-3">
                <input required className={inputCls} placeholder="Prénom *" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} maxLength={80} />
                <input required className={inputCls} placeholder="Nom *" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} maxLength={80} />
              </div>
              <div>
                <input list="relations" className={inputCls} placeholder="Votre lien (ex : Cousin, Collègue, Amie d'enfance…)" value={form.relationship} onChange={(e) => set('relationship', e.target.value)} maxLength={80} />
                <datalist id="relations">{RELATIONS.map((r) => <option key={r} value={r} />)}</datalist>
              </div>
              <textarea required rows={6} className={inputCls} placeholder="Écrivez ici votre message, vos souvenirs, vos vœux les plus sincères… *" value={form.message} onChange={(e) => set('message', e.target.value)} maxLength={4000} />
              <textarea rows={2} className={inputCls} placeholder="Un souvenir ou une anecdote à partager (facultatif)" value={form.anecdote} onChange={(e) => set('anecdote', e.target.value)} maxLength={3000} />
              <textarea rows={2} className={inputCls} placeholder="Vos vœux (facultatif)" value={form.wish} onChange={(e) => set('wish', e.target.value)} maxLength={1000} />

              {invite.allowPhotos && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase">Photos souvenirs ({photos.length}/{MAX_PHOTOS})</span>
                    <button type="button" disabled={photos.length + pending.length >= MAX_PHOTOS} onClick={() => fileRef.current?.click()}
                      className="text-xs font-semibold px-3 py-2 rounded-xl border bg-white/70 hover:bg-white disabled:opacity-50 flex items-center gap-1.5" style={{ borderColor: accent }}>
                      <Camera className="w-4 h-4" />Ajouter des photos
                    </button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
                  {(photos.length > 0 || pending.length > 0) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {photos.map((p, i) => (
                        <div key={p.url} className="space-y-1">
                          <div className="relative aspect-square rounded-xl overflow-hidden border bg-stone-200" style={{ borderColor: paper.border }}>
                            <img src={p.thumbUrl || p.url} alt="" className="w-full h-full object-cover" />
                            <button type="button" title="Retirer cette photo" onClick={() => setPhotos((l) => l.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
                          </div>
                          <input className="w-full text-[11px] bg-white/70 border border-stone-300 rounded-lg px-2 py-1" placeholder="Légende (facultatif)" maxLength={200} value={p.caption || ''}
                            onChange={(e) => setPhotos((l) => l.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} />
                        </div>
                      ))}
                      {pending.map((p) => (
                        <div key={p.key} className="aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center text-[11px] text-center p-2 gap-1" style={{ borderColor: paper.border }}>
                          {p.error ? (<><span className="text-red-700">{p.error}</span><button type="button" onClick={() => setPending((l) => l.filter((x) => x.key !== p.key))} className="underline">Fermer</button></>)
                            : (<><Loader2 className="w-5 h-5 animate-spin" /><span className="truncate max-w-full">Envoi de {p.name}…</span></>)}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] opacity-60">Vos photos sont réduites automatiquement sur votre appareil avant l'envoi. Elles seront toutes présentes dans le livre PDF.</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button type="submit" disabled={busy || busyUploading} className="px-5 py-3 text-sm font-semibold text-white rounded-xl shadow disabled:opacity-60" style={{ background: t.primaryColor }}>
                  {busy ? 'Envoi…' : busyUploading ? 'Photos en cours d’envoi…' : token ? 'Enregistrer mes modifications' : 'Enregistrer mon message & mes souvenirs'}
                </button>
                {token && <button type="button" onClick={remove} className="text-xs text-red-700 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" />Supprimer mon message</button>}
              </div>
            </form>
          )}
        </div>
      </div>
      <SiteFooter settings={settings} override={t.footerText} />
    </div>
  );
}
