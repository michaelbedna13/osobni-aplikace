import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Sheet } from "../../components/Sheet";
import { Icon } from "../../components/Icon";
import { Tabs } from "../../components/Tabs";
import { useToast } from "../../components/Toast";
import { Topbar } from "../../components/Topbar";
import { formatDate, plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { useSettings } from "../../lib/settings";
import { usePeople } from "../lide/data";
import {
  KIND_NAMES, STATUS_NAMES, alreadyHave, computeMediaStats, newMedia, useAddMedia, useDeleteMedia, useMedia, useUpdateMedia, withStatus,
  type MediaItem, type Status,
} from "./data";
import type { Kind } from "./search";

const MODULE = MODULE_BY_KEY.filmy;
const KINDS: Kind[] = ["film", "serial", "kniha"];

function Stars({ value, onChange, size = 28 }: { value: number | null; onChange?: (v: number | null) => void; size?: number }) {
  return (
    <span className={`stars${onChange ? " editable" : ""}`} role={onChange ? "radiogroup" : "img"} aria-label={`Hodnocení ${value ?? 0} z 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = (value ?? 0) >= n;
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} z 5`} className={on ? "on" : ""} onClick={() => onChange(value === n ? null : n)}>
            <Icon name="star" size={size} />
          </button>
        ) : <span key={n} className={on ? "on" : ""}><Icon name="star" size={size} /></span>;
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
  const [sheet, setSheet] = useState<{ kind: "add" } | { kind: "detail"; id: string } | { kind: "goal" } | null>(null);
  const goal = settings.reading_goal;
  const toast = useToast();
  // právě přidaná položka: přepne na její záložku a na chvíli se v seznamu zvýrazní
  const [justAdded, setJustAdded] = useState<string | null>(null);
  useEffect(() => {
    if (!justAdded) return;
    // posunout k nové položce, ať je vidět (seznam je pod hlavičkou a výzvou)
    // (až po zavření panelu, který při zavření vrací stránku na původní místo, a až je položka v seznamu)
    const scroll = window.setTimeout(() => document.querySelector(".media-row.just-added")?.scrollIntoView({ block: "center", behavior: "smooth" }), 320);
    const t = window.setTimeout(() => setJustAdded(null), 2400);
    return () => { window.clearTimeout(scroll); window.clearTimeout(t); };
  }, [justAdded]);
  const onAdded = (item: MediaItem) => {
    setSheet(null);
    if (item.status !== "vzdano") setTab(item.status);
    setKind("vse");
    setJustAdded(item.id);
    toast.show(`Přidáno: ${item.title}`, [{ label: "Přidat další", run: () => setSheet({ kind: "add" }) }]);
  };

  useEffect(() => {
    if (!params.has("nova")) return;
    setParams({}, { replace: true });
    setSheet({ kind: "add" });
  }, [params, setParams]);

  const visible = items
    .filter((m) => (kind === "vse" || m.kind === kind) && (tab === "hotovo" ? m.status === "hotovo" || m.status === "vzdano" : m.status === tab))
    .sort((a, b) => (tab === "hotovo" ? (b.finished_at ?? "").localeCompare(a.finished_at ?? "") : 0));
  const detail = sheet?.kind === "detail" ? items.find((m) => m.id === sheet.id) : null;
  const year = new Date().getFullYear();

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar title={MODULE.name} />
        <div className="hero">
          <span className="icon-slot"><Icon name="filmy" size={96} /></span>
          <span className="hero-num">{stats.wanted}</span>
          <span className="hero-cap">na seznamu „chci“</span>
          <p className="hero-line">
            Letos: {stats.doneThisYear.film} {plural(stats.doneThisYear.film, ["film", "filmy", "filmů"])}, {stats.doneThisYear.serial} {plural(stats.doneThisYear.serial, ["seriál", "seriály", "seriálů"])}, {stats.doneThisYear.kniha} {plural(stats.doneThisYear.kniha, ["kniha", "knihy", "knih"])}
          </p>
        </div>
        <button className="btn-hero" onClick={() => setSheet({ kind: "add" })}><Icon name="i-plus" size={24} /> Přidat</button>
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
        <ul className="list">
          {visible.map((m) => (
            <li key={m.id}>
              <button className={`list-btn media-row${justAdded === m.id ? " just-added" : ""}`} onClick={() => setSheet({ kind: "detail", id: m.id })}>
                <span className={`kind-tag kind-${m.kind}`}>{KIND_NAMES[m.kind].one}</span>
                <span className="grow">
                  <b>{m.title}</b>
                  {(m.creator || m.recommended_by || m.year) && (
                    <span className="occasion-kind">{[m.creator, m.year, m.recommended_by ? `doporučil(a) ${m.recommended_by}` : null].filter(Boolean).join(" · ")}</span>
                  )}
                </span>
                {tab === "hotovo" && m.rating ? <Stars value={m.rating} size={14} /> : null}
              </button>
            </li>
          ))}
        </ul>
      )}

      {sheet?.kind === "add" && <AddSheet items={items} onClose={() => setSheet(null)} onAdded={onAdded} />}
      {detail && <DetailSheet item={detail} onClose={() => setSheet(null)} />}
      {sheet?.kind === "goal" && <GoalSheet goal={goal} onClose={() => setSheet(null)} onSave={(g) => updateSettings({ reading_goal: g })} />}
      {toast.element}
    </div>
  );
}

function AddSheet({ items, onClose, onAdded }: { items: MediaItem[]; onClose: () => void; onAdded: (item: MediaItem) => void }) {
  const [kind, setKind] = useState<Kind>("film");
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [status, setStatus] = useState<Status>("chci");
  const add = useAddMedia();
  const duplicate = title.trim() && alreadyHave(items, { kind, title: title.trim(), source: "rucne", source_id: null });

  // po přidání se panel zavře, seznam přepne na záložku položky a potvrzení dole nabídne „Přidat další“
  const save = () => {
    const t = title.trim();
    if (!t) return;
    const item = withStatus(newMedia({ kind, title: t, creator: creator.trim() || null }), status);
    add.mutate(item);
    onAdded(item);
  };

  return (
    <Sheet title="Přidat" onClose={onClose}>
      <div className="seg seg-wide" role="group" aria-label="Druh">
        {KINDS.map((k) => <button key={k} type="button" className={`seg-btn${kind === k ? " on" : ""}`} aria-pressed={kind === k} onClick={() => setKind(k)}>{KIND_NAMES[k].one}</button>)}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); save(); }}>
        <label htmlFor="media-title" className="field-label">Název</label>
        <input id="media-title" className="input" maxLength={300} autoComplete="off" value={title} onChange={(e) => setTitle(e.target.value)} />
        {duplicate && <p className="small muted">Tohle už v seznamu máš.</p>}
        <label htmlFor="media-creator" className="field-label">{kind === "kniha" ? "Autor" : kind === "film" ? "Režisér" : "Stanice / platforma"} (nepovinné)</label>
        <input id="media-creator" className="input" maxLength={200} autoComplete="off" value={creator} onChange={(e) => setCreator(e.target.value)} />
        <div className="status-grid" role="group" aria-label="Stav">
          {(["chci", "ted", "hotovo"] as Status[]).map((s) => (
            <button key={s} type="button" className={`chip${status === s ? " on" : ""}`} aria-pressed={status === s} onClick={() => setStatus(s)}>
              {s === "chci" ? `Chci ${KIND_NAMES[kind].verb}` : s === "ted" ? KIND_NAMES[kind].now : KIND_NAMES[kind].done}
            </button>
          ))}
        </div>
        <button className="btn dark tap wide" type="submit" disabled={!title.trim()}>Přidat</button>
      </form>
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
        <div>
          <p className="small muted">{[names.one, item.year, item.creator].filter(Boolean).join(" · ")}</p>
          {item.status === "hotovo" && item.finished_at && <p className="small">Dokončeno {formatDate(new Date(item.finished_at), true)}</p>}
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
