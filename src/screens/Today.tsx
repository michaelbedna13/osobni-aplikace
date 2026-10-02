import { Link } from "react-router-dom";
import { greeting } from "../lib/copy";
import { formatDate } from "../lib/format";
import { usePinnedModules } from "../lib/settings";
import { isDemo } from "../lib/supabase";
import { quoteOfDay, useQuotes } from "../modules/hlaskomat/data";
import { ShelfCard } from "./ShelfCard";

function QuoteOfDay() {
  const { data: quotes = [] } = useQuotes();
  const quote = quoteOfDay(quotes);
  if (!quote) return null;
  return (
    <section className="sec">
      <h2>Hláška dne</h2>
      <Link to="/m/hlaskomat" className="quote-day">
        <div className="bubble tap">
          <p className="bubble-text">„{quote.text}“</p>
        </div>
        <div className="who">
          {quote.author && <span className="nameplate">{quote.author}</span>}
          <span className="small muted">{[quote.context, formatDate(new Date(quote.said_at), true)].filter(Boolean).join(", ")}</span>
        </div>
      </Link>
    </section>
  );
}

export function Today() {
  const { pinned } = usePinnedModules();
  const now = new Date();
  const weekday = now.toLocaleDateString("cs-CZ", { weekday: "long" });
  const date = now.toLocaleDateString("cs-CZ", { day: "numeric", month: "long" });

  return (
    <div className="screen">
      <header className="today-head">
        <div>
          <h1>{date}</h1>
          <p>{greeting(now)}, je {weekday}.</p>
        </div>
        <Link to="/profil" className="avatar" aria-label="Profil">M</Link>
      </header>

      {isDemo && <p className="demo-note">Ukázkový režim: data se ukládají jen v tomhle prohlížeči.</p>}

      <section className="sec">
        <div className="sec-head">
          <h2>Moje moduly</h2>
          <Link to="/profil#moduly" className="link">Upravit</Link>
        </div>
        <div className="shelf" aria-label="Oblíbené moduly, posuň do boku">
          {pinned.map((key) => <ShelfCard key={key} moduleKey={key} />)}
          <Link to="/profil#moduly" className="fav fav-edit">+ Přidat modul</Link>
        </div>
      </section>

      <QuoteOfDay />

    </div>
  );
}
