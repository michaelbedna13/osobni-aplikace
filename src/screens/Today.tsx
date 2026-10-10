import { useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { nameDay, publicHoliday } from "../lib/calendar";
import { plural } from "../lib/format";
import { MODULE_BY_KEY } from "../lib/modules";
import { usePinnedModules } from "../lib/settings";
import { isDemo } from "../lib/supabase";
import { computeGratitudeStats, useGratitude } from "../modules/vdecnost/data";
import { GratitudeForm } from "../modules/vdecnost/GratitudeForm";
import { soonOccasions, useGiftIdeas, usePeople } from "../modules/lide/data";
import { occasionLabel, whenLabel } from "../modules/lide/LideScreen";
import { useLinks } from "../modules/odkazy/data";
import { domainOf } from "../modules/odkazy/util";
import { groupByCategory, useShopping, useUpdateItems, type ShoppingItem } from "../modules/nakup/data";
import { Row as ShoppingRow } from "../modules/nakup/NakupScreen";
import { ShelfCard } from "./ShelfCard";
import { DebtsToday, WeatherCard } from "./TodayWidgets";

function Gratitude() {
  const { data: list = [] } = useGratitude();
  const stats = useMemo(() => computeGratitudeStats(list), [list]);
  return (
    <section className="sec sec-tab" style={{ "--accent": MODULE_BY_KEY.vdecnost.color } as CSSProperties}>
      <div className="sec-head">
        <h2>Za co jsem dnes vděčný?</h2>
        {stats.streak > 0 && <Link to="/m/vdecnost" className="streak"><Icon name="flame" size={20} />{stats.streak}</Link>}
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

/** Kdo brzy slaví: co a kdy slaví a rovnou nápady na dárek, když nějaké jsou. */
function SoonCelebrating() {
  const { data: people = [] } = usePeople();
  const { data: ideas = [] } = useGiftIdeas();
  const soon = useMemo(() => soonOccasions(people, 7), [people]);
  if (soon.length === 0) return null;
  const lide = MODULE_BY_KEY.lide;
  return (
    <section className="sec sec-tab" style={{ "--accent": lide.color, "--deep": lide.deep } as CSSProperties}>
      <h2>Brzy slaví</h2>
      <ul className="list celebrate">
        {soon.map((o) => {
          const open = ideas.filter((i) => i.person_id === o.person.id && !i.given_at).length;
          return (
            <li key={`${o.person.id}-${o.kind}`}>
              <Link to={`/m/lide/${o.person.id}`} className={`list-btn${o.days === 0 ? " today" : ""}`}>
                <span className="grow">
                  <b>{o.person.name}</b>
                  <span className="occasion-kind">{occasionLabel(o)} · {o.date.toLocaleDateString("cs-CZ", { weekday: "short", day: "numeric", month: "numeric" })}</span>
                  {open > 0 && <span className="gift-hint"><Icon name="lide" size={14} /> {open} {plural(open, ["nápad", "nápady", "nápadů"])} na dárek</span>}
                </span>
                <span className="when-pill">{whenLabel(o.days)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
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
      <WeatherCard />

      {isDemo && <p className="demo-note">Ukázkový režim: data se ukládají jen v tomhle prohlížeči.</p>}

      {/* pás modulů bez nadpisu – barevné karty mluví samy za sebe */}
      <section className="sec shelf-sec" aria-label="Moje moduly">
        <div className="shelf" aria-label="Oblíbené moduly, posuň do boku">
          {pinned.map((key) => <ShelfCard key={key} moduleKey={key} />)}
        </div>
      </section>

      <Shopping />

      {/* vděčnost hned pod nákupem (když je co koupit), jinak jako první sekce */}
      <Gratitude />

      <SoonCelebrating />

      <DebtsToday />

      <LaterLink />

    </div>
  );
}
