import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Sheet } from "../../components/Sheet";
import { Icon } from "../../components/Icon";
import { Tabs } from "../../components/Tabs";
import { Topbar } from "../../components/Topbar";
import { formatDate, plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { isDemo } from "../../lib/supabase";
import { fetchPreview, uploadImage, useSignedUrls } from "../odkazy/data";
import { domainOf, extractUrl } from "../odkazy/util";
import {
  BUCKET, IDEA_CATEGORIES, daysUntil, nextFriday13, noteLabel, removePhoto, useAddNote, useDeleteNote, useUntroisNotes, useUpdateNote,
  type UntroisNote,
} from "./data";
import { MEANINGS, MEANING_CATEGORIES } from "./meanings";

const MODULE = MODULE_BY_KEY.untrois;
const NAPADU: [string, string, string] = ["věc", "věci", "věcí"];

type Photo = { storage_path: string | null; image_url: string | null };

/** Fotka nápadu (nahraná nebo z odkazu); v ukázkovém režimu je nahraná fotka data URL. */
const photoOf = (n: UntroisNote | null): Photo | null =>
  n?.storage_path ? { storage_path: n.storage_path, image_url: null }
    : n?.image_url?.startsWith("data:") ? { storage_path: null, image_url: n.image_url }
      : null;

export function UntroisScreen() {
  const { data: notes = [], error } = useUntroisNotes();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<"napady" | "vyznamy">("napady");
  const [cat, setCat] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ note: UntroisNote | null; kind: "napad" | "vyznam" } | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!params.has("nova")) return;
    setParams({}, { replace: true });
    setSheet({ note: null, kind: "napad" });
  }, [params, setParams]);

  const ideas = notes.filter((n) => n.kind === "napad");
  const mine = notes.filter((n) => n.kind === "vyznam");
  const signed = useSignedUrls(ideas.filter((n) => n.storage_path).map((n) => n.storage_path!), BUCKET);
  const srcOf = (n: UntroisNote) => (n.storage_path ? signed.data?.[n.storage_path] ?? null : n.image_url ?? null);

  const friday = nextFriday13();
  const fridayIn = daysUntil(friday);
  const isThirteenth = new Date().getDate() === 13;

  const starred = ideas.some((n) => n.starred);
  const visibleIdeas = ideas
    .filter((n) => !cat || (cat === "Top" ? n.starred : n.category === cat))
    .sort((a, b) => Number(b.starred) - Number(a.starred));
  const ideaCats = useMemo(() => [...new Set(ideas.map((n) => n.category))], [ideas]);
  const meanings = [
    ...mine.map((n) => ({ category: n.category, title: n.title ?? "", body: n.body ?? "", kind: null, note: n })),
    ...MEANINGS.map((m) => ({ ...m, note: null as UntroisNote | null })),
  ];

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar title="untrois" brand />
        <div className="hero">
          <span className="icon-slot"><Icon name="untrois" size={96} /></span>
          <span className="hero-num">{ideas.length}</span>
          <span className="hero-cap">{plural(ideas.length, NAPADU)} na nástěnce</span>
          <p className="hero-line">
            {isThirteenth ? "Dnes je třináctého. Tvůj den." : fridayIn === 0 ? "Dnes je pátek 13.!" : `Příští pátek 13.: ${formatDate(friday, true)} (za ${fridayIn} ${plural(fridayIn, ["den", "dny", "dní"])})`}
          </p>
        </div>
        <button className="btn-hero" onClick={() => setSheet({ note: null, kind: tab === "vyznamy" ? "vyznam" : "napad" })}>
          <Icon name="i-plus" size={24} /> {tab === "vyznamy" ? "Přidat význam" : "Přidat na nástěnku"}
        </button>
      </div>

      {error && <p className="error">Nepodařilo se načíst nástěnku. Zkontroluj připojení.</p>}

      <Tabs label="Část" value={tab} onChange={(t) => { setTab(t); setCat(null); }} items={[{ id: "napady", label: "Nástěnka" }, { id: "vyznamy", label: "Co je 13" }]} />

      {tab === "napady" && (
        <div className="tab-panel">
          {(ideaCats.length > 1 || starred) && (
            <div className="chips" role="group" aria-label="Kategorie">
              <button className={`chip${!cat ? " on" : ""}`} onClick={() => setCat(null)}>Vše</button>
              {starred && <button className={`chip${cat === "Top" ? " on" : ""}`} onClick={() => setCat("Top")}>Top</button>}
              {ideaCats.length > 1 && ideaCats.map((c) => <button key={c} className={`chip${cat === c ? " on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}
            </div>
          )}
          {visibleIdeas.length === 0 ? (
            <p className="empty">Zatím prázdno. Sbírej, co se ti líbí: fotky, grafiku, odkazy z Pinterestu nebo Instagramu, slova.</p>
          ) : (
            <ul className="board">
              {visibleIdeas.map((n) => (
                <li key={n.id}><BoardTile note={n} src={srcOf(n)} onOpen={() => setSheet({ note: n, kind: "napad" })} /></li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "vyznamy" && (
        <div className="tab-panel">
          <p className="small muted">Všechno bez štítku se dá ověřit. Štítek výklad = symbolika nebo pověst: jako obraz, ne jako tvrzení.</p>
          <div className="chips" role="group" aria-label="Kategorie">
            <button className={`chip${!cat ? " on" : ""}`} onClick={() => setCat(null)}>Vše</button>
            {[...MEANING_CATEGORIES, ...(mine.length ? ["Moje"] : [])].map((c) => <button key={c} className={`chip${cat === c ? " on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          {(cat === "Moje" ? meanings.filter((m) => m.note) : meanings.filter((m) => !cat || m.category === cat)).map((m) => {
            const id = m.note?.id ?? m.title;
            const expanded = open === id;
            return (
              <button key={id} className={`meaning${expanded ? " open" : ""}${m.note ? " mine" : ""}`} aria-expanded={expanded} onClick={() => (m.note && expanded ? setSheet({ note: m.note, kind: "vyznam" }) : setOpen(expanded ? null : id))}>
                <span className="meaning-head">
                  <b>{m.title}</b>
                  {m.note ? <span className="meaning-cat">moje</span> : m.kind === "vyklad" && <span className="meaning-kind">výklad</span>}
                </span>
                {expanded && <span className="meaning-body">{m.body}{m.note && <span className="small muted"> Ťukni znovu pro úpravu.</span>}</span>}
              </button>
            );
          })}
        </div>
      )}

      {sheet && <NoteSheet note={sheet.note} kind={sheet.kind} src={sheet.note ? srcOf(sheet.note) : null} onClose={() => setSheet(null)} />}
    </div>
  );
}

/** Dlaždice nástěnky: čtverec s fotkou (nebo náhledem odkazu); nápad bez obrázku ukáže název (zbytek je v detailu). */
function BoardTile({ note, src, onOpen }: { note: UntroisNote; src: string | null; onOpen: () => void }) {
  const [broken, setBroken] = useState(false);
  const image = src && !broken;
  return (
    <button className={`board-tile${image ? " has-image" : ""}`} onClick={onOpen} aria-label={noteLabel(note)}>
      {image ? (
        <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
      ) : (
        <span className="board-text">
          {note.title ? <b>{note.title}</b> : note.body && <b>{note.body}</b>}
          {note.url && <span className="board-site">{note.site ?? domainOf(note.url)}</span>}
        </span>
      )}
      {note.starred && <span className="idea-star"><Icon name="star" size={16} /></span>}
    </button>
  );
}

const withTimeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<null>((resolve) => window.setTimeout(() => resolve(null), ms))]);

function NoteSheet({ note, kind, src, onClose }: { note: UntroisNote | null; kind: "napad" | "vyznam"; src: string | null; onClose: () => void }) {
  const isIdea = kind === "napad";
  const cats = isIdea ? IDEA_CATEGORIES : [...MEANING_CATEGORIES];
  const [category, setCategory] = useState(note?.category ?? cats[0]);
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [starred, setStarred] = useState(note?.starred ?? false);
  const [urlText, setUrlText] = useState(note?.url ?? "");
  const [photo, setPhoto] = useState<Photo | null>(photoOf(note));
  const [preview, setPreview] = useState<string | null>(photoOf(note) ? src : null);
  const [busy, setBusy] = useState<"upload" | "save" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // fotka nahraná v tomhle okně – když se neuloží, smaže se z úložiště
  const fresh = useRef<string | null>(null);
  const add = useAddNote();
  const update = useUpdateNote();
  const remove = useDeleteNote();

  const url = urlText.trim() ? extractUrl(urlText) : null;
  const canSave = isIdea ? !!(title.trim() || url || photo) : !!title.trim();

  const close = () => {
    if (fresh.current) void removePhoto(fresh.current);
    onClose();
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy("upload");
    setErr(null);
    try {
      const stored = await uploadImage(file, BUCKET);
      if (fresh.current) void removePhoto(fresh.current);
      fresh.current = stored.storage_path;
      setPhoto(stored);
      setPreview(stored.image_url ?? URL.createObjectURL(file));
    } catch (e) {
      setErr(`Nahrání se nepovedlo: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    setBusy("save");
    // náhled odkazu (obrázek, web, název) jen když není vlastní fotka a odkaz je nový
    let linkImage = photoOf(note) ? null : note?.image_url ?? null;
    let site = note?.site ?? null;
    let linkTitle: string | null = null;
    if (!url) { linkImage = null; site = null; }
    else if (url !== note?.url) {
      const p = await withTimeout(fetchPreview(url), 6000);
      linkImage = p?.image_url ?? null;
      site = p?.site ?? domainOf(url);
      linkTitle = p?.title ?? null;
    }
    const fields = {
      category,
      title: title.trim() || (isIdea ? linkTitle?.slice(0, 200) ?? null : null),
      body: body.trim() || null,
      starred,
      ...(isIdea ? { url, site, storage_path: photo?.storage_path ?? null, image_url: photo ? photo.image_url : linkImage } : {}),
    };
    if (note) update.mutate({ ...note, ...fields });
    else add.mutate({ id: crypto.randomUUID(), kind, created_at: new Date().toISOString(), ...fields });
    // stará fotka, kterou nová nahradila nebo která se odebrala
    if (note?.storage_path && note.storage_path !== fields.storage_path) void removePhoto(note.storage_path);
    fresh.current = null;
    onClose();
  };

  return (
    <Sheet title={note ? "Upravit" : isIdea ? "Na nástěnku" : "Význam čísla 13"} onClose={close}>
      {isIdea && (
        <>
          {photo && preview && <img className="board-preview" src={preview} alt="" />}
          <div className="inline-form">
            <label className={`btn tap file-btn grow${busy === "upload" ? " busy" : ""}`}>
              <Icon name="i-up" size={20} /> {busy === "upload" ? "Nahrávám…" : photo ? "Jiná fotka" : "Přidat fotku"}
              <input type="file" accept="image/*" disabled={!!busy} onChange={(e) => void pick(e.target.files?.[0])} />
            </label>
            {photo && <button type="button" className="btn tap" onClick={() => { setPhoto(null); setPreview(null); }}>Odebrat</button>}
          </div>
          {isDemo && <p className="small muted">V ukázkovém režimu se fotky ukládají zmenšené jen v tomhle prohlížeči.</p>}
        </>
      )}
      <div className="chips">
        {cats.map((c) => <button key={c} type="button" className={`chip${category === c ? " on" : ""}`} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}
      </div>
      <label htmlFor="u-title" className="field-label">{isIdea ? "Popisek (nepovinný)" : "Co to je"}</label>
      <input id="u-title" className="input" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
      {isIdea && (
        <>
          <label htmlFor="u-url" className="field-label">Odkaz (nepovinný)</label>
          <input id="u-url" className="input" inputMode="url" autoComplete="off" placeholder="Pinterest, Instagram, web…" value={urlText} onChange={(e) => setUrlText(e.target.value)} />
          {urlText.trim() && !url && <p className="error">Tohle nevypadá jako odkaz.</p>}
          {note?.url && <a className="link" href={note.url} target="_blank" rel="noreferrer">Otevřít odkaz</a>}
        </>
      )}
      <label htmlFor="u-body" className="field-label">{isIdea ? "Poznámka" : "Podrobnosti"}</label>
      <textarea id="u-body" className="input" rows={isIdea ? 3 : 4} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} />
      {isIdea && (
        <label className="check"><input type="checkbox" checked={starred} onChange={(e) => setStarred(e.target.checked)} /> Top – líbí se mi nejvíc</label>
      )}
      {err && <p className="error">{err}</p>}
      <button className="btn dark tap wide" disabled={!canSave || !!busy || (!!urlText.trim() && !url)} onClick={() => void save()}>
        {busy === "save" ? "Ukládám…" : note ? "Uložit" : "Přidat"}
      </button>
      {note && <button className="btn tap wide" disabled={!!busy} onClick={() => { if (window.confirm("Smazat?")) { remove.mutate(note); close(); } }}>Smazat</button>}
    </Sheet>
  );
}
