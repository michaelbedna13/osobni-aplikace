import { Link } from "react-router-dom";
import { Symbol } from "../components/Symbol";
import { usePinnedModules } from "../lib/settings";
import { isDemo } from "../lib/supabase";
import { ShelfCard } from "./ShelfCard";
import { quoteOfDay, useQuotes } from "../modules/hlaskomat/data";
import { formatDate } from "../lib/format";

function QuoteOfDay() {
  const { data: quotes = [] } = useQuotes();
  const quote = quoteOfDay(quotes);
  if (!quote) return null;
  return (
    <section className="pad">
      <h2 className="sec-title">Hláška dne</h2>
      <Link to="/m/hlaskomat" className="card quote-day tap">
        <Symbol module="hlaskomat" size={32} bg="#FFFFFF" />
        <p className="quote-day-text">„{quote.text}“</p>
        <p className="quote-day-who">{[quote.author, quote.context].filter(Boolean).join(", ")}, {formatDate(new Date(quote.said_at), true)}</p>
      </Link>
    </section>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Today() {
  const { pinned } = usePinnedModules();
  const now = new Date();
  const weekday = capitalize(now.toLocaleDateString("cs-CZ", { weekday: "long" }));
  const date = now.toLocaleDateString("cs-CZ", { day: "numeric", month: "long" });

  return (
    <div className="screen">
      <header className="today-head pad">
        <div>
          <p className="muted">{weekday}</p>
          <h1>{date}</h1>
        </div>
        <Link to="/profil" className="avatar" aria-label="Profil">M</Link>
      </header>

      {isDemo && (
        <p className="demo-note pad">Ukázkový režim: Supabase zatím není připojený, nastavení se ukládá jen v tomto prohlížeči.</p>
      )}

      <section className="pad">
        <div className="sec-row">
          <h2 className="sec-title">Moje moduly</h2>
          <Link to="/profil#moduly" className="link">Upravit</Link>
        </div>
        <div className="shelf" aria-label="Oblíbené moduly, posuň do boku">
          {pinned.map((key) => <ShelfCard key={key} moduleKey={key} />)}
          <Link to="/profil#moduly" className="fav fav-edit">Přidat modul</Link>
        </div>
      </section>

      <QuoteOfDay />

      <section className="pad">
        <h2 className="sec-title">Brzy tady</h2>
        <div className="card soon">
          <div className="soon-row"><Symbol module="lide" size={32} /><span>Nejbližší narozeniny</span></div>
          <div className="soon-row"><Symbol module="denik" size={32} /><span>Za co jsem dnes vděčný?</span></div>
        </div>
      </section>
    </div>
  );
}
