import { useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { LedBoard } from "../components/LedBoard";
import { Sprite } from "../components/Sprite";
import { nameDay, publicHoliday } from "../lib/calendar";
import { formatDate } from "../lib/format";
import { MODULE_BY_KEY } from "../lib/modules";
import { usePinnedModules } from "../lib/settings";
import { isDemo } from "../lib/supabase";
import { quoteOfDay, useQuotes } from "../modules/hlaskomat/data";
import { computeGratitudeStats, useGratitude } from "../modules/vdecnost/data";
import { GratitudeForm } from "../modules/vdecnost/GratitudeForm";
import { soonOccasions, usePeople } from "../modules/lide/data";
import { OccasionRow } from "../modules/lide/LideScreen";
import { useLinks } from "../modules/odkazy/data";
import { domainOf } from "../modules/odkazy/util";
import { groupByCategory, useShopping, useUpdateItems, type ShoppingItem } from "../modules/nakup/data";
import { Row as ShoppingRow } from "../modules/nakup/NakupScreen";
import { ShelfCard } from "./ShelfCard";
import { DaySummary, DebtsToday, WeatherCard } from "./TodayWidgets";

function Gratitude() {
  const { data: list = [] } = useGratitude();
  const stats = useMemo(() => computeGratitudeStats(list), [list]);
  return (
    <section className="sec sec-tab" style={{ "--accent": MODULE_BY_KEY.vdecnost.color } as CSSProperties}>
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

/** Nákupní seznam, jen když na něm něco je. Odškrtávat jde rovnou tady. */
function Shopping() {
  const { data: all = [] } = useShopping();
  const update = useUpdateItems();
  const active = all.filter((i) => !i.archived);
  const toBuy = groupByCategory(active.filter((i) => !i.done)).flatMap((g) => g.items);
  if (toBuy.length === 0) return null;
  const inCart = active.filter((i) => i.done).sort((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? ""));
  const toggle = (i: ShoppingItem) => update.mutate([{ ...i, done: !i.done, done_at: i.done ? null : new Date().toISOString() }]);
  const shown = toBuy.slice(0, 8);
  return (
    <section className="sec sec-tab" style={{ "--accent": MODULE_BY_KEY.nakup.color } as CSSProperties}>
      <div className="sec-head">
        <h2>Nákup</h2>
        <Link to="/m/nakup" className="link">{toBuy.length > shown.length ? `Všech ${toBuy.length}` : "Seznam"}</Link>
      </div>
      <ul className="list">
        {shown.map((i) => <ShoppingRow key={i.id} item={i} onToggle={toggle} />)}
        {inCart.slice(0, 3).map((i) => <ShoppingRow key={i.id} item={i} onToggle={toggle} />)}
      </ul>
    </section>
  );
}

function SoonCelebrating() {
  const { data: people = [] } = usePeople();
  const soon = useMemo(() => soonOccasions(people, 7), [people]);
  if (soon.length === 0) return null;
  return (
    <section className="sec sec-tab" style={{ "--accent": MODULE_BY_KEY.lide.color } as CSSProperties}>
      <h2>Brzy slaví</h2>
      <ul className="list">{soon.map((o) => <OccasionRow key={`${o.person.id}-${o.kind}`} o={o} />)}</ul>
    </section>
  );
}

/** Jeden odkaz „na později“ – každý den jiný. */
function LaterLink() {
  const { data: links = [] } = useLinks();
  const later = links.filter((l) => !l.read_at && l.kind === "link");
  if (later.length === 0) return null;
  const pick = later[Math.floor(Date.now() / 86_400_000) % later.length];
  return (
    <section className="sec sec-tab" style={{ "--accent": MODULE_BY_KEY.odkazy.color } as CSSProperties}>
      <div className="sec-head">
        <h2>Na později</h2>
        <Link to="/m/odkazy" className="link">Všech {later.length}</Link>
      </div>
      <Link to={`/m/odkazy?id=${pick.id}`} className="link-card tap later-card">
        {pick.image_url ? <img className="link-thumb" src={pick.image_url} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="link-thumb link-letter" aria-hidden="true">{(pick.site ?? domainOf(pick.url ?? "?"))[0]?.toUpperCase()}</span>}
        <span className="grow">
          <b>{pick.title ?? pick.url}</b>
          <span className="occasion-kind">{pick.site ?? domainOf(pick.url ?? "")}</span>
        </span>
      </Link>
    </section>
  );
}

/** Hláška dne na LED tabuli nahoře; ťuknutí otevře Hláškomat. */
function QuoteBoard() {
  const { data: quotes = [] } = useQuotes();
  const quote = quoteOfDay(quotes);
  if (!quote) return null;
  const meta = [quote.context, formatDate(new Date(quote.said_at), true)].filter(Boolean).join(", ");
  return (
    <Link to="/m/hlaskomat" className="led-quote" aria-label={`Hláška dne: ${quote.text}${quote.author ? `, ${quote.author}` : ""}`}>
      <LedBoard text={`„${quote.text}“`} color={MODULE_BY_KEY.piva.color} label={quote.text} />
      <span className="led-meta">
        {quote.author && <b>{quote.author}</b>}
        <span>{meta}</span>
      </span>
    </Link>
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

      <WeatherCard />
      <QuoteBoard />
      <DaySummary />

      <section className="sec">
        <h2>Moje moduly</h2>
        <div className="shelf" aria-label="Oblíbené moduly, posuň do boku">
          {pinned.map((key) => <ShelfCard key={key} moduleKey={key} />)}
        </div>
      </section>

      <Shopping />

      <SoonCelebrating />

      <Gratitude />

      <DebtsToday />

      <LaterLink />

    </div>
  );
}
