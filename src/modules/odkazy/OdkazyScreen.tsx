import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Sheet } from "../../components/Sheet";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { Topbar } from "../../components/Topbar";
import { relativeTime } from "../../lib/dates";
import { plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { isDemo } from "../../lib/supabase";
import { normalize } from "../hlaskomat/data";
import { fetchPreview, newLink, uploadImage, useAddLink, useDeleteLink, useLinks, useShareToken, useSignedUrls, useUpdateLink, type Link } from "./data";
import { domainOf, extractUrl } from "./util";

const MODULE = MODULE_BY_KEY.odkazy;
const ODKAZU: [string, string, string] = ["odkaz", "odkazy", "odkazů"];

type Filter = { kind: "all" } | { kind: "later" } | { kind: "images" } | { kind: "collection"; name: string };

const matches = (l: Link, q: string) =>
  !q || [l.title, l.url, l.site, l.note, l.collection, l.description].some((v) => v && normalize(v).includes(q));

/** Obrázek odkazu: náhled webu, nahraný obrázek (podepsaná adresa), nebo dlaždice s písmenem. */
function Thumb({ link, src, big }: { link: Link; src: string | null; big?: boolean }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return <img className={big ? "link-image" : "link-thumb"} src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} />;
  }
  const letter = (link.site ?? (link.url ? domainOf(link.url) : "?"))[0]?.toUpperCase() ?? "?";
  return <span className={`${big ? "link-image" : "link-thumb"} link-letter`} aria-hidden="true">{link.kind === "image" ? <Icon name="i-grid" size={24} /> : letter}</span>;
}

export function OdkazyScreen() {
  const { data: links = [], isLoading, error } = useLinks();
  const update = useUpdateLink();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [sheet, setSheet] = useState<{ kind: "add" } | { kind: "detail"; id: string } | { kind: "share" } | null>(null);
  const toast = useToast();

  const signed = useSignedUrls(links.filter((l) => l.storage_path).map((l) => l.storage_path!));
  const srcOf = (l: Link) => (l.storage_path ? signed.data?.[l.storage_path] ?? null : l.image_url);

  const collections = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of links) if (l.collection) counts.set(l.collection, (counts.get(l.collection) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "cs")).map(([name, count]) => ({ name, count }));
  }, [links]);
  const unread = links.filter((l) => !l.read_at);
  const q = normalize(search.trim());
  const visible = links.filter((l) => matches(l, q) && (
    filter.kind === "all" || (filter.kind === "later" ? !l.read_at : filter.kind === "images" ? l.kind === "image" : l.collection === filter.name)));

  // ?nova=1 z karty na Dnes, ?id=… otevře detail
  useEffect(() => {
    const id = params.get("id");
    if (params.has("nova")) setSheet({ kind: "add" });
    else if (id) setSheet({ kind: "detail", id });
    else return;
    setParams({}, { replace: true });
  }, [params, setParams]);

  // náhledy pro nově uložené odkazy (i ty ze Zkratky) – po jednom, max. 5 najednou
  const fetching = useRef(new Set<string>());
  useEffect(() => {
    const todo = links.filter((l) => l.kind === "link" && l.url && !l.preview_done && !fetching.current.has(l.id)).slice(0, 5);
    if (!todo.length) return;
    todo.forEach((l) => fetching.current.add(l.id));
    void (async () => {
      for (const l of todo) {
        const p = await fetchPreview(l.url!);
        update.mutate({ ...l, title: l.title ?? p.title, description: l.description ?? p.description, image_url: l.image_url ?? p.image_url, site: l.site ?? p.site, preview_done: true });
      }
    })();
  }, [links, update]);

  const detail = sheet?.kind === "detail" ? links.find((l) => l.id === sheet.id) : null;

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar title="Odkazy" right={<button className="link" onClick={() => setSheet({ kind: "share" })}>Z iPhonu</button>} />
        <div className="hero">
          <span className="icon-slot"><Icon name="odkazy" size={96} /></span>
          <span className="hero-num">{unread.length}</span>
          <span className="hero-cap">na později</span>
          <p className="hero-line">Celkem {links.length} {plural(links.length, ODKAZU)}{collections.length ? ` v ${collections.length} ${plural(collections.length, ["kolekci", "kolekcích", "kolekcích"])}` : ""}</p>
        </div>
        <button className="btn-hero" onClick={() => setSheet({ kind: "add" })}><Icon name="i-plus" size={24} /> Uložit odkaz</button>
      </div>

      {error && <p className="error">Nepodařilo se načíst odkazy. Zkontroluj připojení.</p>}

      <input className="input search" type="search" placeholder="Hledat v odkazech" aria-label="Hledat" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="chips" role="group" aria-label="Filtr">
        <button className={`chip${filter.kind === "all" ? " on" : ""}`} aria-pressed={filter.kind === "all"} onClick={() => setFilter({ kind: "all" })}>Vše</button>
        <button className={`chip${filter.kind === "later" ? " on" : ""}`} aria-pressed={filter.kind === "later"} onClick={() => setFilter({ kind: "later" })}>Na později <span className="chip-count">{unread.length}</span></button>
        {links.some((l) => l.kind === "image") && (
          <button className={`chip${filter.kind === "images" ? " on" : ""}`} aria-pressed={filter.kind === "images"} onClick={() => setFilter({ kind: "images" })}>Obrázky</button>
        )}
        {collections.map((c) => {
          const on = filter.kind === "collection" && filter.name === c.name;
          return <button key={c.name} className={`chip${on ? " on" : ""}`} aria-pressed={on} onClick={() => setFilter({ kind: "collection", name: c.name })}>{c.name} <span className="chip-count">{c.count}</span></button>;
        })}
      </div>

      {isLoading ? <p className="empty">Načítám…</p> : visible.length === 0 ? (
        <p className="empty">{links.length === 0 ? "Zatím nic. Ulož první odkaz – tlačítkem nahoře, nebo rovnou ze Sdílet (Z iPhonu)." : "Nic takového tu není."}</p>
      ) : (
        <ul className="link-list">
          {visible.map((l) => (
            <li key={l.id}>
              <button className={`link-card${l.read_at ? "" : " unread"}`} onClick={() => setSheet({ kind: "detail", id: l.id })}>
                <Thumb link={l} src={srcOf(l)} />
                <span className="grow">
                  <b>{l.title ?? (l.kind === "image" ? "Obrázek" : l.url)}</b>
                  <span className="occasion-kind">
                    {[l.kind === "link" ? l.site ?? (l.url ? domainOf(l.url) : null) : null, relativeTime(new Date(l.created_at)), l.collection].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {!l.read_at && <span className="unread-dot" aria-label="Na později" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {sheet?.kind === "add" && <AddSheet collections={collections.map((c) => c.name)} onClose={() => setSheet(null)} onSaved={(n) => toast.show(n > 1 ? `Uloženo ${n} obrázků` : "Uloženo")} />}
      {detail && <DetailSheet link={detail} src={srcOf(detail)} collections={collections.map((c) => c.name)} onClose={() => setSheet(null)} />}
      {sheet?.kind === "share" && <ShareSheet onClose={() => setSheet(null)} onCopied={() => toast.show("Zkopírováno")} />}
      {toast.element}
    </div>
  );
}

function CollectionField({ value, onChange, collections }: { value: string; onChange: (v: string) => void; collections: string[] }) {
  return (
    <>
      <label htmlFor="link-collection" className="field-label">Kolekce (nepovinná)</label>
      <input id="link-collection" className="input" maxLength={60} placeholder="Třeba Byt, Recepty…" value={value} onChange={(e) => onChange(e.target.value)} />
      {collections.length > 0 && (
        <div className="chips">
          {collections.map((c) => <button key={c} type="button" className={`chip${value === c ? " on" : ""}`} onClick={() => onChange(value === c ? "" : c)}>{c}</button>)}
        </div>
      )}
    </>
  );
}

function AddSheet({ collections, onClose, onSaved }: { collections: string[]; onClose: () => void; onSaved: (n: number) => void }) {
  const [text, setText] = useState("");
  const [collection, setCollection] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const add = useAddLink();
  const url = extractUrl(text);

  const paste = async () => {
    try {
      setText(await navigator.clipboard.readText());
    } catch {
      setErr("Schránku se nepodařilo přečíst. Vlož odkaz podržením prstu v políčku.");
    }
  };

  const save = () => {
    if (!url) return;
    add.mutate(newLink({ kind: "link", url, site: domainOf(url), collection: collection.trim() || null, note: note.trim() || null }));
    onSaved(1);
    onClose();
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setErr(null);
    try {
      for (const file of Array.from(files)) {
        const stored = await uploadImage(file);
        add.mutate(newLink({ kind: "image", ...stored, title: file.name.replace(/\.[^.]+$/, "").slice(0, 300), collection: collection.trim() || null, note: note.trim() || null, preview_done: true }));
      }
      onSaved(files.length);
      onClose();
    } catch (e) {
      setErr(`Nahrání se nepovedlo: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="Uložit" onClose={onClose}>
      <label htmlFor="link-url" className="field-label">Odkaz</label>
      <div className="inline-form">
        <input id="link-url" className="input" inputMode="url" autoComplete="off" placeholder="https://…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn tap" type="button" onClick={paste}>Vložit</button>
      </div>
      {text.trim() && !url && <p className="error">Tohle nevypadá jako odkaz.</p>}
      <CollectionField value={collection} onChange={setCollection} collections={collections} />
      <label htmlFor="link-note" className="field-label">Poznámka (nepovinná)</label>
      <input id="link-note" className="input" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn dark tap wide" disabled={!url} onClick={save}>Uložit odkaz</button>
      <label className={`btn tap wide file-btn${busy ? " busy" : ""}`}>
        <Icon name="i-up" size={20} /> {busy ? "Nahrávám…" : "Nahrát obrázek nebo screenshot"}
        <input type="file" accept="image/*" multiple disabled={busy} onChange={(e) => void upload(e.target.files)} />
      </label>
      {isDemo && <p className="small muted">V ukázkovém režimu se obrázky ukládají zmenšené jen v tomhle prohlížeči.</p>}
      {err && <p className="error">{err}</p>}
    </Sheet>
  );
}

function DetailSheet({ link, src, collections, onClose }: { link: Link; src: string | null; collections: string[]; onClose: () => void }) {
  const [title, setTitle] = useState(link.title ?? "");
  const [collection, setCollection] = useState(link.collection ?? "");
  const [note, setNote] = useState(link.note ?? "");
  const update = useUpdateLink();
  const remove = useDeleteLink();
  const changed = title !== (link.title ?? "") || collection !== (link.collection ?? "") || note !== (link.note ?? "");
  const markRead = (read: boolean) => update.mutate({ ...link, read_at: read ? new Date().toISOString() : null });

  return (
    <Sheet title={link.kind === "image" ? "Obrázek" : "Odkaz"} onClose={onClose}>
      {src && (link.kind === "image"
        ? <a href={src} target="_blank" rel="noreferrer"><Thumb link={link} src={src} big /></a>
        : <Thumb link={link} src={src} big />)}
      {link.title && <h3 className="link-title">{link.title}</h3>}
      {link.url && <p className="small muted link-url">{link.url}</p>}
      {link.description && <p className="link-desc">{link.description}</p>}
      {link.url && (
        <a className="btn-hero" href={link.url} target="_blank" rel="noreferrer" onClick={() => !link.read_at && markRead(true)}>
          Otevřít {link.site ?? domainOf(link.url)}
        </a>
      )}
      <button className="btn tap wide" onClick={() => markRead(!link.read_at)}>{link.read_at ? "Vrátit na později" : "Hotovo, přečteno"}</button>

      <label htmlFor="link-title" className="field-label">Název</label>
      <input id="link-title" className="input" maxLength={300} value={title} onChange={(e) => setTitle(e.target.value)} />
      <CollectionField value={collection} onChange={setCollection} collections={collections} />
      <label htmlFor="link-note-edit" className="field-label">Poznámka</label>
      <textarea id="link-note-edit" className="input" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn dark tap wide" disabled={!changed} onClick={() => {
        update.mutate({ ...link, title: title.trim() || null, collection: collection.trim() || null, note: note.trim() || null });
        onClose();
      }}>Uložit změny</button>
      <button className="btn tap wide" onClick={() => {
        if (!window.confirm("Smazat?")) return;
        remove.mutate(link);
        onClose();
      }}>Smazat</button>
    </Sheet>
  );
}

/** Návod na Zkratku „Uložit do appky“ s hodnotami ke zkopírování. */
function ShareSheet({ onClose, onCopied }: { onClose: () => void; onCopied: () => void }) {
  const { token, error, regenerate } = useShareToken();
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      onCopied();
    } catch {
      window.prompt("Zkopíruj:", value);
    }
  };
  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="copy-row">
      <span className="small muted">{label}</span>
      <code>{value}</code>
      <button className="btn tap" onClick={() => void copy(value)}>Kopírovat</button>
    </div>
  );

  return (
    <Sheet title="Ukládání ze Sdílet" onClose={onClose}>
      {isDemo ? <p>Funguje jen s přihlášením (ne v ukázkovém režimu).</p> : (
        <>
          <p className="small">Jednou si v iPhonu vytvoříš Zkratku. Pak v Safari, YouTube, Instagramu i jinde ťukneš na <b>Sdílet → Uložit do appky</b> a odkaz se uloží sem. Appku ani nemusíš otevírat.</p>
          <ol className="steps">
            <li>Otevři appku <b>Zkratky</b> → <b>+</b> → pojmenuj ji <b>Uložit do appky</b>.</li>
            <li>Dole ťukni na ikonu <b>Podrobnosti</b> a zapni <b>Zobrazit v listu sdílení</b>. Typy vstupu nech <b>Adresy URL</b> a <b>Text</b>.</li>
            <li>Přidej akci <b>Načíst obsah URL</b> (zelená ikona). Do URL vlož adresu níže.</li>
            <li>V akci rozbal <b>Zobrazit více</b>: Metoda <b>POST</b>. Hlavičky: <b>apikey</b> = klíč appky, <b>Content-Type</b> = <b>application/json</b>.</li>
            <li>Tělo požadavku <b>JSON</b>, dvě položky typu Text: <b>p_token</b> = tvůj klíč, <b>p_url</b> = proměnná <b>Vstup zkratky</b>.</li>
            <li>Přidej akci <b>Zobrazit oznámení</b> s textem „Uloženo do appky“. Hotovo.</li>
          </ol>
          {base && <Row label="Adresa (URL)" value={`${base}/rest/v1/rpc/save_link`} />}
          {key && <Row label="Klíč appky (apikey) – veřejný" value={key} />}
          {token ? <Row label="Tvůj klíč (p_token) – nikomu neposílej" value={token} /> : <p className="small muted">Načítám tvůj klíč…</p>}
          {error && <p className="error">Klíč se nepodařilo načíst. Je nasazená nová databáze?</p>}
          {token && (
            <button className="link" onClick={() => {
              if (window.confirm("Vyměnit klíč? Starou Zkratku pak musíš upravit novým klíčem.")) regenerate();
            }}>Vyměnit klíč</button>
          )}
        </>
      )}
    </Sheet>
  );
}
