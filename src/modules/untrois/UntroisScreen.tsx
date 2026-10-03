import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Sheet } from "../../components/Sheet";
import { Sprite } from "../../components/Sprite";
import { Tabs } from "../../components/Tabs";
import { Topbar } from "../../components/Topbar";
import { formatDate, plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { IDEA_CATEGORIES, daysUntil, nextFriday13, useAddNote, useDeleteNote, useUntroisNotes, useUpdateNote, type UntroisNote } from "./data";
import { MEANINGS, MEANING_CATEGORIES } from "./meanings";

const MODULE = MODULE_BY_KEY.untrois;

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
  const friday = nextFriday13();
  const fridayIn = daysUntil(friday);
  const now = new Date();
  const isThirteenth = now.getDate() === 13;

  const visibleIdeas = [...ideas].filter((n) => !cat || n.category === cat).sort((a, b) => Number(b.starred) - Number(a.starred));
  const ideaCats = useMemo(() => [...new Set(ideas.map((n) => n.category))], [ideas]);
  const meanings = [...mine.map((n) => ({ category: n.category, title: n.title, body: n.body ?? "", note: n })), ...MEANINGS.map((m) => ({ ...m, note: null as UntroisNote | null }))];

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar title="13 – Untrois" />
        <div className="hero">
          <span className="sprite-tile"><Sprite name="untrois" size={96} /></span>
          <span className="hero-num">{ideas.length}</span>
          <span className="hero-cap">{plural(ideas.length, ["nápad", "nápady", "nápadů"])} na brand</span>
          <p className="hero-line">
            {isThirteenth ? "Dnes je třináctého. Tvůj den." : fridayIn === 0 ? "Dnes je pátek 13.!" : `Příští pátek 13.: ${formatDate(friday, true)} (za ${fridayIn} ${plural(fridayIn, ["den", "dny", "dní"])})`}
          </p>
        </div>
        <button className="btn-hero" onClick={() => setSheet({ note: null, kind: tab === "vyznamy" ? "vyznam" : "napad" })}>
          <Sprite name="i-plus" size={24} /> {tab === "vyznamy" ? "Přidat význam" : "Zapsat nápad"}
        </button>
      </div>

      {error && <p className="error">Nepodařilo se načíst poznámky. Zkontroluj připojení.</p>}

      <Tabs label="Část" value={tab} onChange={(t) => { setTab(t); setCat(null); }} items={[{ id: "napady", label: "Nápady" }, { id: "vyznamy", label: "Co je 13" }]} />

      {tab === "napady" && (
        <div className="tab-panel">
          {ideaCats.length > 1 && (
            <div className="chips" role="group" aria-label="Kategorie">
              <button className={`chip${!cat ? " on" : ""}`} onClick={() => setCat(null)}>Vše</button>
              {ideaCats.map((c) => <button key={c} className={`chip${cat === c ? " on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}
            </div>
          )}
          {visibleIdeas.length === 0 ? <p className="empty">Zatím nic. Logo, produkty, slogany, barvy – všechno sem.</p> : (
            <ul className="idea-list">
              {visibleIdeas.map((n) => (
                <li key={n.id}>
                  <button className="idea-card" onClick={() => setSheet({ note: n, kind: "napad" })}>
                    <span className="idea-cat">{n.category}</span>
                    <b>{n.title}</b>
                    {n.body && <span className="idea-body">{n.body}</span>}
                    {n.starred && <span className="idea-star"><Sprite name="star" size={20} /></span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "vyznamy" && (
        <div className="tab-panel">
          <div className="chips" role="group" aria-label="Kategorie">
            <button className={`chip${!cat ? " on" : ""}`} onClick={() => setCat(null)}>Vše</button>
            {[...MEANING_CATEGORIES, ...(mine.length ? ["Moje"] : [])].map((c) => <button key={c} className={`chip${cat === c ? " on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          {(cat === "Moje" ? meanings.filter((m) => m.note) : meanings.filter((m) => !cat || m.category === cat)).map((m) => {
            const id = m.note?.id ?? m.title;
            const expanded = open === id;
            return (
              <button key={id} className={`meaning${expanded ? " open" : ""}${m.note ? " mine" : ""}`} aria-expanded={expanded} onClick={() => (m.note && expanded ? setSheet({ note: m.note, kind: "vyznam" }) : setOpen(expanded ? null : id))}>
                <span className="meaning-head"><b>{m.title}</b><span className="meaning-cat">{m.note ? "moje" : m.category}</span></span>
                {expanded && <span className="meaning-body">{m.body}{m.note && <span className="small muted"> · ťukni znovu pro úpravu</span>}</span>}
              </button>
            );
          })}
        </div>
      )}

      {sheet && <NoteSheet note={sheet.note} kind={sheet.kind} onClose={() => setSheet(null)} />}
    </div>
  );
}

function NoteSheet({ note, kind, onClose }: { note: UntroisNote | null; kind: "napad" | "vyznam"; onClose: () => void }) {
  const cats = kind === "napad" ? IDEA_CATEGORIES : [...MEANING_CATEGORIES];
  const [category, setCategory] = useState(note?.category ?? cats[0]);
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [starred, setStarred] = useState(note?.starred ?? false);
  const add = useAddNote();
  const update = useUpdateNote();
  const remove = useDeleteNote();

  const save = () => {
    const fields = { category, title: title.trim(), body: body.trim() || null, starred };
    if (note) update.mutate({ ...note, ...fields });
    else add.mutate({ id: crypto.randomUUID(), kind, created_at: new Date().toISOString(), ...fields });
    onClose();
  };

  return (
    <Sheet title={note ? "Upravit" : kind === "napad" ? "Nápad na brand" : "Význam čísla 13"} onClose={onClose}>
      <div className="chips">
        {cats.map((c) => <button key={c} type="button" className={`chip${category === c ? " on" : ""}`} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}
      </div>
      <label htmlFor="u-title" className="field-label">{kind === "napad" ? "Nápad" : "Co to je"}</label>
      <input id="u-title" className="input" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
      <label htmlFor="u-body" className="field-label">Podrobnosti</label>
      <textarea id="u-body" className="input" rows={4} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} />
      {kind === "napad" && (
        <label className="check"><input type="checkbox" checked={starred} onChange={(e) => setStarred(e.target.checked)} /> Top nápad</label>
      )}
      <button className="btn dark tap wide" disabled={!title.trim()} onClick={save}>{note ? "Uložit" : "Přidat"}</button>
      {note && <button className="btn tap wide" onClick={() => { if (window.confirm("Smazat?")) { remove.mutate(note.id); onClose(); } }}>Smazat</button>}
    </Sheet>
  );
}
