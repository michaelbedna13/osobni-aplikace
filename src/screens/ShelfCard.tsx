import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Symbol } from "../components/Symbol";
import { plural } from "../lib/format";
import { MODULE_BY_KEY, type ModuleKey } from "../lib/modules";
import { computeStats, useBeers } from "../modules/piva/data";
import { useBeerCounter } from "../modules/piva/PivaScreen";
import { countThisMonth, useQuotes } from "../modules/hlaskomat/data";
import { computeMeditationStats, useMeditations } from "../modules/meditace/data";
import { useSettings } from "../lib/settings";
import { unlockAudio } from "../lib/sound";

interface CardProps {
  moduleKey: ModuleKey;
  num: string;
  sub: string;
  quick?: { label: string; text: string; run: () => void };
}

function Card({ moduleKey, num, sub, quick }: CardProps) {
  const m = MODULE_BY_KEY[moduleKey];
  return (
    <div className="fav tap" style={{ background: `${m.color}66` }}>
      <Link to={`/m/${moduleKey}`} className="fav-link" aria-label={`${m.name}: ${num} ${sub}`} />
      <div className="fav-top">
        <Symbol module={moduleKey} size={40} />
        {quick && <button className="fav-quick" aria-label={quick.label} onClick={quick.run}>{quick.text}</button>}
      </div>
      <span className="fav-name">{m.name}</span>
      <span className="fav-num">{num}</span>
      <span className="fav-sub">{sub}</span>
    </div>
  );
}

function PivaCard() {
  const { data: beers = [] } = useBeers();
  const stats = useMemo(() => computeStats(beers), [beers]);
  const counter = useBeerCounter();
  return (
    <>
      <Card
        moduleKey="piva"
        num={String(stats.week)}
        sub={`${plural(stats.week, ["pivo", "piva", "piv"])} tento týden, dnes ${stats.today}`}
        quick={{ label: "Přidat pivo", text: "+1", run: () => counter.addOne(stats.today) }}
      />
      {counter.toast}
    </>
  );
}

function HlaskomatCard() {
  const { data: quotes = [] } = useQuotes();
  const navigate = useNavigate();
  return (
    <Card
      moduleKey="hlaskomat"
      num={String(quotes.length)}
      sub={`${plural(quotes.length, ["hláška", "hlášky", "hlášek"])}, tento měsíc ${countThisMonth(quotes)}`}
      quick={{ label: "Zapsat hlášku", text: "+", run: () => navigate("/m/hlaskomat?nova=1") }}
    />
  );
}

function MeditaceCard() {
  const { data: list = [] } = useMeditations();
  const { settings } = useSettings();
  const goal = settings.meditation_weekly_goal;
  const stats = useMemo(() => computeMeditationStats(list, goal), [list, goal]);
  const navigate = useNavigate();
  return (
    <Card
      moduleKey="meditace"
      num={`${stats.weekCount} z ${goal}`}
      sub={stats.weekCount >= goal ? "cíl splněný" : "tento týden"}
      quick={{ label: "Začít meditaci", text: "▶", run: () => { unlockAudio(); navigate("/m/meditace?start=1"); } }}
    />
  );
}

/** Karta modulu v pásu „Moje moduly“ na obrazovce Dnes. */
export function ShelfCard({ moduleKey }: { moduleKey: ModuleKey }) {
  if (moduleKey === "piva") return <PivaCard />;
  if (moduleKey === "hlaskomat") return <HlaskomatCard />;
  if (moduleKey === "meditace") return <MeditaceCard />;
  return <Card moduleKey={moduleKey} num="–" sub={`Spustí se ve fázi ${MODULE_BY_KEY[moduleKey].phase}`} />;
}
