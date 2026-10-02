import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Sheet } from "../../components/Sheet";
import { Sprite } from "../../components/Sprite";
import { Tabs } from "../../components/Tabs";
import { Topbar } from "../../components/Topbar";
import { formatDate, plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { useSettings } from "../../lib/settings";
import { normalize } from "../hlaskomat/data";
import { usePeople } from "../lide/data";
import {
  KIND_NAMES, STATUS_NAMES, alreadyHave, computeMediaStats, newMedia, useAddMedia, useDeleteMedia, useMedia, useUpdateMedia, withStatus,
  type MediaItem, type Status,
} from "./data";
import { search, type Found, type Kind } from "./search";

const MODULE = MODULE_BY_KEY.filmy;
const KINDS: Kind[] = ["film", "serial", "kniha"];

/** Plakát / obálka; bez obrázku dlaždice s názvem. */
function Cover({ item, size = "md" }: { item: Pick<MediaItem, "title" | "image_url" | "kind">; size?: "sm" | "md" | "lg" }) {
  const [broken, setBroken] = useState(false);
  if (item.image_url && !broken) {
    return <img className={`cover cover-${size}`} src={item.image_url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} />;
  }
  return <span className={`cover cover-${size} cover-empty`} aria-hidden="true"><span>{item.title}</span></span>;
}

function Stars({ value, onChange, size = 28 }: { value: number | null; onChange?: (v: number | null) => void; size?: number }) {
  return (
    <span className={`stars${onChange ? " editable" : ""}`} role={onChange ? "radiogroup" : "img"} aria-label={`Hodnocení ${value ?? 0} z 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = (value ?? 0) >= n;
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} z 5`} className={on ? "on" : ""} onClick={() => onChange(value === n ? null : n)}>
            <Sprite name="star" size={size} />
          </button>
        ) : <span key={n} className={on ? "on" : ""}><Sprite name="star" size={size} /></span>;
      })}
    </span>
  );
}

export function FilmyScreen() {
  const { data: items = [], isLoading, error } = useMedia();
  const stats = useMemo(() => computeMediaStats(items), [items]);
  const { settings, update: updateSettings } = useSettings();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<"chci" | "ted" | "hotovo">("chci");
  const [kind, setKind] = useState<Kind | "vse">("vse");
  const [sheet, setSheet] = useState<{ kind: "search" } | { kind: "detail"; id: string } | { kind: "goal" } | null>(null);
  const goal = settings.reading_goal;

  useEffect(() => {
    if (!params.has("nova")) return;
    setParams({}, { replace: true });
    setSheet({ kind: "search" });
  }, [params, setParams]);

  const visible = items
    .filter((m) => (kind === "vse" || m.kind === kind) && (tab === "hotovo" ? m.status === "hotovo" || m.status === "vzdano" : m.status === tab))
    .sort((a, b) => (tab === "hotovo" ? (b.finished_at ?? "").localeCompare(a.finished_at ?? "") : 0));
  const detail = sheet?.kind === "detail" ? items.find((m) => m.id === sheet.id) : null;
  const year = new Date().getFullYear();

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar title="Filmy a knihy" />
        <div className="hero">
          <span className="sprite-tile"><Sprite name="filmy" size={96} /></span>
          <span className="hero-num">{stats.wanted}</span>
          <span className="hero-cap">na seznamu „chci“</span>
          <p className="hero-line">
            Letos: {stats.doneThisYear.film} {plural(stats.doneThisYear.film, ["film", "filmy", "filmů"])}, {stats.doneThisYear.serial} {plural(stats.doneThisYear.serial, ["seriál", "seriály", "seriálů"])}, {stats.doneThisYear.kniha} {plural(stats.doneThisYear.kniha, ["kniha", "knihy", "knih"])}
          </p>
        </div>
        <button className="btn-hero" onClick={() => setSheet({ kind: "search" })}><Sprite name="i-plus" size={24} /> Přidat</button>
      </div>

      {error && <p className="error">Nepodařilo se načíst seznam. Zkontroluj připojení.</p>}

      <div className="panel challenge">
        <div className="row-between">
          <h3>Čtenářská výzva {year}</h3>
          <button className="link" onClick={() => setSheet({ kind: "goal" })}>Změnit</button>
        </div>
        <p className="challenge-num"><b>{stats.booksThisYear}</b> / {goal} {plural(goal, ["kniha", "knihy", "knih"])}</p>
        <div className="ch-progress" style={{ "--team": MODULE.color } as CSSProperties}><i style={{ width: `${Math.min(100, (stats.booksThisYear / goal) * 100)}%` }} /></div>
      </div>

      <Tabs label="Seznam" value={tab} onChange={setTab} items={[{ id: "chci", label: `Chci ${stats.wanted || ""}`.trim() }, { id: "ted", label: `Teď ${stats.inProgress || ""}`.trim() }, { id: "hotovo", label: "Hotovo" }]} />
      <div className="chips kind-chips" role="group" aria-label="Druh">
        <button className={`chip${kind === "vse" ? " on" : ""}`} aria-pressed={kind === "vse"} onClick={() => setKind("vse")}>Vše</button>
        {KINDS.map((k) => <button key={k} className={`chip${kind === k ? " on" : ""}`} aria-pressed={kind === k} onClick={() => setKind(k)}>{KIND_NAMES[k].many}</button>)}
      </div>

      {isLoading ? <p className="empty">Načítám…</p> : visible.length === 0 ? (
        <p className="empty">{tab === "chci" ? "Nic na seznamu. Přidej, co chceš vidět nebo přečíst." : tab === "ted" ? "Teď nic nerozkoukáváš." : "Zatím nic dokončeného."}</p>
      ) : (
        <ul className="poster-grid">
          {visible.map((m) => (
            <li key={m.id}>
              <button className="poster" onClick={() => setSheet({ kind: "detail", id: m.id })} aria-label={`${m.title} (${KIND_NAMES[m.kind].one})`}>
                <Cover item={m} />
                <span className="poster-title">{m.title}</span>
                <span className="poster-meta">
                  {tab === "hotovo" && m.rating ? <Stars value={m.rating} size={12} /> : `${KIND_NAMES[m.kind].one}${m.year ? ` · ${m.year}` : ""}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {sheet?.kind === "search" && <SearchSheet items={items} onClose={() => setSheet(null)} />}
      {detail && <DetailSheet item={detail} onClose={() => setSheet(null)} />}
      {sheet?.kind === "goal" && <GoalSheet goal={goal} onClose={() => setSheet(null)} onSave={(g) => updateSettings({ reading_goal: g })} />}
    </div>
  );
}

function SearchSheet({ items, onClose }: { items: MediaItem[]; onClose: () => void }) {
  const [kind, setKind] = useState<Kind>("film");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Found[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const add = useAddMedia();

  // hledá se chvíli po dopsání
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults(null); return; }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      setBusy(true);
      setErr(null);
      try {
        const r = await search(kind, q);
        if (!cancelled) setResults(r);
      } catch {
        if (!cancelled) { setResults([]); setErr("Hledání teď nefunguje. Můžeš přidat ručně."); }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 450);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [kind, query]);

  const addFound = (f: Found) => {
    add.mutate(newMedia({ ...f }));
    setAdded((list) => [...list, `${f.source}:${f.source_id}`]);
  };
  const addManual = () => {
    add.mutate(newMedia({ kind, title: query.trim() }));
    setAdded((list) => [...list, `rucne:${normalize(query.trim())}`]);
  };

  return (
    <Sheet title="Přidat" onClose={onClose}>
      <div className="seg seg-wide" role="group" aria-label="Druh">
        {KINDS.map((k) => <button key={k} className={`seg-btn${kind === k ? " on" : ""}`} aria-pressed={kind === k} onClick={() => setKind(k)}>{KIND_NAMES[k].one}</button>)}
      </div>
      <input className="input search" type="search" aria-label="Hledat" placeholder={kind === "kniha" ? "Název knihy nebo autor" : "Název"} value={query} onChange={(e) => setQuery(e.target.value)} />
      {busy && <p className="small muted">Hledám…</p>}
      {err && <p className="small muted">{err}</p>}
      {results && results.length > 0 && (
        <ul className="list result-list">
          {results.map((f) => {
            const have = added.includes(`${f.source}:${f.source_id}`) || alreadyHave(items, f);
            return (
              <li key={`${f.source}-${f.source_id}`}>
                <button className="list-btn result" disabled={have} onClick={() => addFound(f)}>
                  <Cover item={f} size="sm" />
                  <span className="grow"><b>{f.title}</b><span className="occasion-kind">{[f.year, f.creator].filter(Boolean).join(" · ")}</span></span>
                  <span className="result-add">{have ? "Máš" : "+"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {results && results.length === 0 && !err && <p className="small muted">Nic se nenašlo.</p>}
      {query.trim().length > 0 && (
        <button className="btn tap wide" disabled={added.includes(`rucne:${normalize(query.trim())}`)} onClick={addManual}>
          Přidat ručně: {query.trim()}
        </button>
      )}
      <p className="small muted credits">Hledá v katalogu iTunes (filmy), TVmaze (seriály) a Open Library (knihy).</p>
    </Sheet>
  );
}

function DetailSheet({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const update = useUpdateMedia();
  const remove = useDeleteMedia();
  const { data: people = [] } = usePeople();
  const [note, setNote] = useState(item.note ?? "");
  const [by, setBy] = useState(item.recommended_by ?? "");
  const names = KIND_NAMES[item.kind];
  const statuses: { id: Status; label: string }[] = [
    { id: "chci", label: `Chci ${names.verb}` }, { id: "ted", label: names.now }, { id: "hotovo", label: names.done }, { id: "vzdano", label: STATUS_NAMES.vzdano },
  ];
  const saveText = () => {
    if (note !== (item.note ?? "") || by !== (item.recommended_by ?? "")) update.mutate({ ...item, note: note.trim() || null, recommended_by: by.trim() || null });
  };

  return (
    <Sheet title={item.title} onClose={() => { saveText(); onClose(); }}>
      <div className="media-head">
        <Cover item={item} size="lg" />
        <div>
          <p className="small muted">{[names.one, item.year, item.creator].filter(Boolean).join(" · ")}</p>
          {item.status === "hotovo" && item.finished_at && <p className="small">Dokončeno {formatDate(new Date(item.finished_at), true)}</p>}
          {item.external_url && <a className="link" href={item.external_url} target="_blank" rel="noreferrer">Víc informací</a>}
        </div>
      </div>

      <div className="status-grid" role="group" aria-label="Stav">
        {statuses.map((s) => (
          <button key={s.id} className={`chip${item.status === s.id ? " on" : ""}`} aria-pressed={item.status === s.id} onClick={() => update.mutate(withStatus(item, s.id))}>{s.label}</button>
        ))}
      </div>

      {(item.status === "hotovo" || item.status === "vzdano") && (
        <>
          <span className="field-label">Hodnocení</span>
          <Stars value={item.rating} onChange={(v) => update.mutate({ ...item, rating: v })} />
        </>
      )}

      <label htmlFor="media-by" className="field-label">Doporučil(a)</label>
      <input id="media-by" className="input" maxLength={80} value={by} onChange={(e) => setBy(e.target.value)} onBlur={saveText} />
      {people.length > 0 && (
        <div className="chips">
          {people.slice(0, 12).map((p) => <button key={p.id} type="button" className={`chip${by === p.name ? " on" : ""}`} onClick={() => setBy(by === p.name ? "" : p.name)}>{p.name}</button>)}
        </div>
      )}
      <label htmlFor="media-note" className="field-label">Poznámka</label>
      <textarea id="media-note" className="input" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} onBlur={saveText} />

      <button className="btn dark tap wide" onClick={() => { saveText(); onClose(); }}>Hotovo</button>
      <button className="btn tap wide" onClick={() => {
        if (!window.confirm(`Smazat ${item.title}?`)) return;
        remove.mutate(item.id);
        onClose();
      }}>Smazat</button>
    </Sheet>
  );
}

function GoalSheet({ goal, onClose, onSave }: { goal: number; onClose: () => void; onSave: (goal: number) => void }) {
  const [value, setValue] = useState(goal);
  return (
    <Sheet title="Kolik knih letos?" onClose={onClose}>
      <div className="stepper">
        <button className="icon-btn big tap" aria-label="Méně" disabled={value <= 1} onClick={() => setValue((v) => v - 1)}>−</button>
        <span className="stepper-value" aria-live="polite">{value}</span>
        <button className="icon-btn big tap" aria-label="Více" disabled={value >= 365} onClick={() => setValue((v) => v + 1)}>+</button>
      </div>
      <button className="btn dark tap wide" onClick={() => { onSave(value); onClose(); }}>Uložit</button>
    </Sheet>
  );
}
