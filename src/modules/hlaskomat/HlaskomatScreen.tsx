import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Burst } from "../../components/Burst";
import { Sheet } from "../../components/Sheet";
import { Sprite } from "../../components/Sprite";
import { useToast } from "../../components/Toast";
import { Tabs } from "../../components/Tabs";
import { Topbar } from "../../components/Topbar";
import { quoteSaved } from "../../lib/copy";
import { formatDate, plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import {
  authorRanking, countThisMonth, matches, suggestions, useAddQuote, useDeleteQuote, useQuotes, useUpdateQuote, type Quote,
} from "./data";

const MODULE = MODULE_BY_KEY.hlaskomat;
const HLASEK: [string, string, string] = ["hláška", "hlášky", "hlášek"];

type Filter = { kind: "all" } | { kind: "starred" } | { kind: "author"; author: string };

export function HlaskomatScreen() {
  const { data: quotes = [], isLoading, error } = useQuotes();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [editing, setEditing] = useState<Quote | "new" | null>(null);
  const [jump, setJump] = useState(0);
  const [tab, setTab] = useState<"hlasky" | "slava">("hlasky");
  const update = useUpdateQuote();
  const toast = useToast();

  const ranking = useMemo(() => authorRanking(quotes), [quotes]);
  const visible = quotes.filter((q) =>
    matches(q, search) &&
    (filter.kind === "all" || (filter.kind === "starred" ? q.starred : q.author?.trim() === filter.author)));

  // ?nova=1 (z obrazovky Dnes nebo z tlačítka +) otevře formulář pro novou hlášku
  const wantsNew = params.has("nova");
  useEffect(() => {
    if (wantsNew) setEditing("new");
  }, [wantsNew]);

  const closeSheet = () => {
    setEditing(null);
    if (params.has("nova")) setParams({}, { replace: true });
  };

  // pódium: 2. – 1. – 3.
  const podium = [ranking[1], ranking[0], ranking[2]];

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
      <Topbar title="Hláškomat" />

      <div className="hero">
        <span key={jump} className={`sprite-tile ${jump ? "anim-jump" : ""}`}><Sprite name="hlaskomat" size={96} /></span>
        <Burst trigger={jump} />
        <span className="hero-num">{quotes.length}</span>
        <span className="hero-cap">{plural(quotes.length, HLASEK)} v archivu</span>
        <p className="hero-line">Tento měsíc přibylo {countThisMonth(quotes)}</p>
      </div>

      <button className="btn-hero" onClick={() => setEditing("new")}>
        <Sprite name="i-plus" size={24} /> Zapsat hlášku
      </button>
      </div>

      <Tabs
        label="Zobrazení"
        value={tab}
        onChange={setTab}
        items={[{ id: "hlasky", label: "Hlášky" }, { id: "slava", label: "Síň slávy" }]}
      />

      {error && <p className="error">Nepodařilo se načíst hlášky. Zkontroluj připojení.</p>}

      {tab === "hlasky" && (<div className="tab-panel">
      <input
        className="input"
        type="search"
        placeholder="Hledat hlášku, autora nebo kontext"
        aria-label="Hledat"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="chips" role="group" aria-label="Filtr">
        <FilterChip on={filter.kind === "all"} onClick={() => setFilter({ kind: "all" })}>Vše</FilterChip>
        <FilterChip on={filter.kind === "starred"} onClick={() => setFilter({ kind: "starred" })}>
          <Sprite name="i-star" size={16} /> Oblíbené
        </FilterChip>
        {ranking.map(({ author, count }) => (
          <FilterChip key={author} on={filter.kind === "author" && filter.author === author} onClick={() => setFilter({ kind: "author", author })}>
            {author} <span className="chip-count">{count}</span>
          </FilterChip>
        ))}
      </div>

      {isLoading ? (
        <p className="empty">Načítám…</p>
      ) : visible.length === 0 ? (
        <p className="empty">
          {quotes.length === 0 ? "Zatím ticho. Zapiš první hlášku, nebo nahraj zálohu v Profilu." : "Na tohle hledání nic. Zkus jiné slovo."}
        </p>
      ) : (
        <ul className="quote-list">
          {visible.map((q) => (
            <li key={q.id} className="quote-item">
              <div className="bubble">
                <button className="quote-body" onClick={() => setEditing(q)} aria-label={`Upravit hlášku: ${q.text}`}>
                  <p className="bubble-text">„{q.text}“</p>
                </button>
                <button
                  className={`star-btn${q.starred ? " on" : ""}`}
                  aria-pressed={q.starred}
                  aria-label={q.starred ? "Odebrat z oblíbených" : "Přidat do oblíbených"}
                  onClick={() => update.mutate({ ...q, starred: !q.starred })}
                >
                  <Sprite name="i-star" size={22} />
                </button>
              </div>
              <div className="who">
                {q.author && <span className="nameplate">{q.author}</span>}
                <span className="small">{[q.context, formatDate(new Date(q.said_at), true)].filter(Boolean).join(", ")}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      </div>)}

      {tab === "slava" && (
        <div className="tab-panel">
          {ranking.length < 2 ? <p className="empty">Síň slávy se otevře, až budou hlášky aspoň od dvou lidí.</p> : (
          <div className="panel">
            <h3>Kdo má nejvíc hlášek</h3>
            <div className="podium">
              {podium.map((r, i) => r ? (
                <div key={r.author} className="podium-step">
                  {i === 1 && <Sprite name="crown" size={40} />}
                  <span className="podium-name">{r.author}</span>
                  <span className="podium-block">{r.count}</span>
                </div>
              ) : <div key={i} />)}
            </div>
            {ranking.length > 3 && (
              <ul className="rest">
                {ranking.slice(3, 10).map((r, i) => (
                  <li key={r.author}><span>{i + 4}. {r.author}</span><b className="num">{r.count}</b></li>
                ))}
              </ul>
            )}
          </div>
          )}
        </div>
      )}

      {editing && (
        <QuoteSheet
          quote={editing === "new" ? null : editing}
          quotes={quotes}
          onClose={closeSheet}
          onSaved={(text, isNew) => { toast.show(text); if (isNew) setJump((j) => j + 1); }}
        />
      )}
      {toast.element}
    </div>
  );
}

function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return <button className={`chip${on ? " on" : ""}`} aria-pressed={on} onClick={onClick}>{children}</button>;
}

/** Datum ve tvaru RRRR-MM-DD v místním čase. */
const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = () => localDay(new Date());

function QuoteSheet({ quote, quotes, onClose, onSaved }: { quote: Quote | null; quotes: Quote[]; onClose: () => void; onSaved: (text: string, isNew: boolean) => void }) {
  const [text, setText] = useState(quote?.text ?? "");
  const [author, setAuthor] = useState(quote?.author ?? "");
  const [context, setContext] = useState(quote?.context ?? "");
  const [day, setDay] = useState(quote ? localDay(new Date(quote.said_at)) : today());
  const [starred, setStarred] = useState(quote?.starred ?? false);
  const add = useAddQuote();
  const update = useUpdateQuote();
  const remove = useDeleteQuote();
  const authors = useMemo(() => suggestions(quotes, "author"), [quotes]);
  const contexts = useMemo(() => suggestions(quotes, "context"), [quotes]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    // u nové hlášky dnes = teď; jinak poledne zvoleného dne (aby datum sedělo v každém pásmu)
    const sameDay = quote && localDay(new Date(quote.said_at)) === day;
    const saidAt = sameDay ? quote.said_at : day === today() && !quote ? new Date().toISOString() : new Date(`${day}T12:00:00`).toISOString();
    const next: Quote = {
      id: quote?.id ?? crypto.randomUUID(),
      text: text.trim(),
      author: author.trim() || null,
      context: context.trim() || null,
      said_at: saidAt,
      starred,
    };
    if (quote) update.mutate(next);
    else add.mutate(next);
    onSaved(quote ? "Hláška upravena" : quoteSaved(), !quote);
    onClose();
  };

  return (
    <Sheet title={quote ? "Upravit hlášku" : "Nová hláška"} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label htmlFor="q-text" className="field-label">Hláška</label>
        <textarea id="q-text" className="input" rows={3} required value={text} onChange={(e) => setText(e.target.value)} />

        <label htmlFor="q-author" className="field-label">Kdo to řekl</label>
        <input id="q-author" className="input" list="q-authors" autoComplete="off" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <datalist id="q-authors">{authors.map((a) => <option key={a} value={a} />)}</datalist>

        <label htmlFor="q-context" className="field-label">Kontext</label>
        <input id="q-context" className="input" list="q-contexts" autoComplete="off" placeholder="Např. Afterka u Jáchyma" value={context} onChange={(e) => setContext(e.target.value)} />
        <datalist id="q-contexts">{contexts.map((c) => <option key={c} value={c} />)}</datalist>

        <label htmlFor="q-day" className="field-label">Kdy</label>
        <input id="q-day" className="input" type="date" max={today()} value={day} onChange={(e) => setDay(e.target.value)} />

        <label className="check">
          <input type="checkbox" checked={starred} onChange={(e) => setStarred(e.target.checked)} />
          Oblíbená
        </label>

        <button className="btn dark tap wide" type="submit" disabled={!text.trim()}>{quote ? "Uložit" : "Zapsat hlášku"}</button>
        {quote && (
          <button type="button" className="btn tap wide" onClick={() => { remove.mutate(quote.id); onSaved("Hláška smazána", false); onClose(); }}>
            Smazat hlášku
          </button>
        )}
      </form>
    </Sheet>
  );
}
