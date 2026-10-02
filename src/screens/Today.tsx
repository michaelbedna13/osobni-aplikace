import { useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Sprite } from "../components/Sprite";
import { nameDay, publicHoliday } from "../lib/calendar";
import { formatDate } from "../lib/format";
import { MODULE_BY_KEY } from "../lib/modules";
import { usePinnedModules } from "../lib/settings";
import { isDemo } from "../lib/supabase";
import { quoteOfDay, useQuotes } from "../modules/hlaskomat/data";
import { computeGratitudeStats, useGratitude } from "../modules/vdecnost/data";
import { GratitudeForm } from "../modules/vdecnost/GratitudeForm";
import { ShelfCard } from "./ShelfCard";

function Gratitude() {
  const { data: list = [] } = useGratitude();
  const stats = useMemo(() => computeGratitudeStats(list), [list]);
  return (
    <section className="sec" style={{ "--accent": MODULE_BY_KEY.vdecnost.color } as CSSProperties}>
      <div className="sec-head">
        <h2>Za co jsem dnes vděčný?</h2>
        {stats.streak > 0 && <Link to="/m/vdecnost" className="streak"><Sprite name="flame" size={20} />{stats.streak}</Link>}
      </div>
      <div className="panel thanks-panel">
        {stats.today.length > 0 && (
          <ul className="thanks-list">
            {[...stats.today].reverse().map((g) => <li key={g.id}>{g.text}</li>)}
          </ul>
        )}
        <GratitudeForm todayCount={stats.today.length} />
      </div>
    </section>
  );
}

function QuoteOfDay() {
  const { data: quotes = [] } = useQuotes();
  const quote = quoteOfDay(quotes);
  if (!quote) return null;
  return (
    <section className="sec">
      <h2>Hláška dne</h2>
      <Link to="/m/hlaskomat" className="quote-card tap">
        <p className="bubble-text">„{quote.text}“</p>
        <p className="quote-meta">
          {quote.author && <b>{quote.author}</b>}
          <span>{[quote.context, formatDate(new Date(quote.said_at), true)].filter(Boolean).join(", ")}</span>
        </p>
      </Link>
    </section>
  );
}

export function Today() {
  const { pinned } = usePinnedModules();
  const now = new Date();
  const weekday = now.toLocaleDateString("cs-CZ", { weekday: "long" });
  const date = now.toLocaleDateString("cs-CZ", { day: "numeric", month: "long" });
  const names = nameDay(now);
  const holiday = publicHoliday(now);

  return (
    <div className="screen">
      <header className="today-head">
        <div>
          <h1>{date}</h1>
          <p className="today-day">{weekday[0].toUpperCase() + weekday.slice(1)}{names && <> · svátek má <b>{names}</b></>}</p>
          {holiday && <p className="today-holiday">Státní svátek: {holiday}</p>}
        </div>
        <Link to="/profil" className="avatar" aria-label="Profil">M</Link>
      </header>

      {isDemo && <p className="demo-note">Ukázkový režim: data se ukládají jen v tomhle prohlížeči.</p>}

      <section className="sec">
        <h2>Moje moduly</h2>
        <div className="shelf" aria-label="Oblíbené moduly, posuň do boku">
          {pinned.map((key) => <ShelfCard key={key} moduleKey={key} />)}
        </div>
      </section>

      <Gratitude />

      <QuoteOfDay />
    </div>
  );
}
