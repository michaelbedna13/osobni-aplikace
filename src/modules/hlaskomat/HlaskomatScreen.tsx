import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BackIcon } from "../../components/Icons";
import { Sheet } from "../../components/Sheet";
import { Symbol } from "../../components/Symbol";
import { useToast } from "../../components/Toast";
import { formatDate, plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import {
  authorRanking, countThisMonth, matches, suggestions, useAddQuote, useDeleteQuote, useQuotes, useUpdateQuote, type Quote,
} from "./data";

const COLOR = MODULE_BY_KEY.hlaskomat.color;
const HLASEK: [string, string, string] = ["hláška", "hlášky", "hlášek"];

type Filter = { kind: "all" } | { kind: "starred" } | { kind: "author"; author: string };

export function HlaskomatScreen() {
  const { data: quotes = [], isLoading, error } = useQuotes();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [editing, setEditing] = useState<Quote | "new" | null>(null);
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

  return (
    <div className="screen">
      <header className="poster" style={{ background: COLOR }}>
        <span className="poster-art"><Symbol module="hlaskomat" size={170} bg="#FFFFFF" /></span>
        <div className="quote-hero">
          <div className="poster-title">
            <Link to="/moduly" className="back" aria-label="Zpět na moduly"><BackIcon /></Link>
            <h1>Hláškomat</h1>
          </div>
          <p className="beer-hero-sub">
            {quotes.length} {plural(quotes.length, HLASEK)}, tento měsíc {countThisMonth(quotes)}
          </p>
        </div>
      </header>

      <div className="pad">
        <button className="plus-one" onClick={() => setEditing("new")}>
          <Symbol module="hlaskomat" size={34} /> Zapsat hlášku
        </button>

        {error && <p className="error">Nepodařilo se načíst hlášky. Zkontroluj připojení.</p>}

        <input
          className="input search"
          type="search"
          placeholder="Hledat v hláškách, autorech a kontextu"
          aria-label="Hledat"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="chips-row" role="group" aria-label="Filtr">
          <FilterChip on={filter.kind === "all"} onClick={() => setFilter({ kind: "all" })}>Vše</FilterChip>
          <FilterChip on={filter.kind === "starred"} onClick={() => setFilter({ kind: "starred" })}>★ Oblíbené</FilterChip>
          {ranking.map(({ author, count }) => (
            <FilterChip
              key={author}
              on={filter.kind === "author" && filter.author === author}
              onClick={() => setFilter({ kind: "author", author })}
            >
              {author} <span className="chip-count">{count}</span>
            </FilterChip>
          ))}
        </div>

        {isLoading ? (
          <p className="muted">Načítám…</p>
        ) : visible.length === 0 ? (
          <p className="muted empty">
            {quotes.length === 0 ? "Zatím žádná hláška. Zapiš první, nebo nahraj zálohu v Profilu." : "Tomuhle hledání nic neodpovídá."}
          </p>
        ) : (
          <ul className="quote-list">
            {visible.map((q) => (
              <li key={q.id} className="quote-card">
                <button className="quote-body" onClick={() => setEditing(q)} aria-label={`Upravit hlášku: ${q.text}`}>
                  <p className="quote-text">„{q.text}“</p>
                  <p className="quote-meta">
                    {[q.author, q.context].filter(Boolean).join(", ")}
                    <span className="muted"> {formatDate(new Date(q.said_at), true)}</span>
                  </p>
                </button>
                <button
                  className={`star${q.starred ? " on" : ""}`}
                  aria-pressed={q.starred}
                  aria-label={q.starred ? "Odebrat z oblíbených" : "Přidat do oblíbených"}
                  onClick={() => update.mutate({ ...q, starred: !q.starred })}
                >
                  ★
                </button>
              </li>
            ))}
          </ul>
        )}

        {ranking.length > 1 && (
          <section className="card">
            <h2 className="card-title">Kdo má nejvíc hlášek</h2>
            <ol className="ranking">
              {ranking.slice(0, 8).map(({ author, count }) => (
                <li key={author}>
                  <span className="grow">{author}</span>
                  <span className="rank-bar" aria-hidden="true"><i style={{ width: `${(count / ranking[0].count) * 100}%`, background: COLOR }} /></span>
                  <b>{count}</b>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      {editing && (
        <QuoteSheet
          quote={editing === "new" ? null : editing}
          quotes={quotes}
          onClose={closeSheet}
          onSaved={(text) => toast.show(text)}
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

function QuoteSheet({ quote, quotes, onClose, onSaved }: { quote: Quote | null; quotes: Quote[]; onClose: () => void; onSaved: (text: string) => void }) {
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
    onSaved(quote ? "Hláška upravena" : "Hláška zapsána");
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
          <button type="button" className="btn tap wide" onClick={() => { remove.mutate(quote.id); onSaved("Hláška smazána"); onClose(); }}>
            Smazat hlášku
          </button>
        )}
      </form>
    </Sheet>
  );
}
