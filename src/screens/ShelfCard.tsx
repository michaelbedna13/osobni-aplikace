import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Burst } from "../components/Burst";
import { Sprite } from "../components/Sprite";
import { plural } from "../lib/format";
import { MODULE_BY_KEY, type ModuleKey } from "../lib/modules";
import { useSettings } from "../lib/settings";
import { unlockAudio } from "../lib/sound";
import { countThisMonth, useQuotes } from "../modules/hlaskomat/data";
import { computeMeditationStats, useMeditations } from "../modules/meditace/data";
import { computeStats, useBeers } from "../modules/piva/data";
import { useBeerCounter } from "../modules/piva/PivaScreen";

interface CardProps {
  moduleKey: ModuleKey;
  num: string;
  sub: string;
  quick?: { label: string; text: ReactNode; run: () => void };
  jump?: number;
}

function Card({ moduleKey, num, sub, quick, jump = 0 }: CardProps) {
  const m = MODULE_BY_KEY[moduleKey];
  return (
    <div className={`fav tap${m.ready ? "" : " locked"}`} style={{ background: m.color }}>
      <Link to={`/m/${moduleKey}`} className="fav-link" aria-label={`${m.name}: ${num}, ${sub}`} />
      <div className="fav-top">
        <span key={jump} className={jump ? "anim-jump" : undefined} style={{ display: "block" }}>
          <Sprite name={moduleKey} size={48} />
        </span>
        {quick && (
          <button className="fav-quick" aria-label={quick.label} onClick={quick.run}>
            {quick.text}
            <Burst trigger={jump} />
          </button>
        )}
        {!m.ready && <Sprite name="lock" size={24} label="Zamčeno" />}
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
  const [jump, setJump] = useState(0);
  return (
    <>
      <Card
        moduleKey="piva"
        num={String(stats.today)}
        sub={`${plural(stats.today, ["pivo", "piva", "piv"])} dnes, týden ${stats.week}`}
        quick={{ label: "Přidat pivo", text: "+1", run: () => { counter.addOne(stats.today); setJump((j) => j + 1); } }}
        jump={jump}
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
      sub={`${plural(quotes.length, ["hláška", "hlášky", "hlášek"])}, měsíc ${countThisMonth(quotes)}`}
      quick={{ label: "Zapsat hlášku", text: <Sprite name="i-plus" size={20} />, run: () => navigate("/m/hlaskomat?nova=1") }}
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
      num={`${stats.weekCount}/${goal}`}
      sub={stats.weekCount >= goal ? "Cíl splněný!" : "tento týden"}
      quick={{ label: "Začít meditaci", text: <Sprite name="i-play" size={20} />, run: () => { unlockAudio(); navigate("/m/meditace?start=1"); } }}
    />
  );
}

/** Karta modulu v pásu „Moje moduly“ na obrazovce Dnes. */
export function ShelfCard({ moduleKey }: { moduleKey: ModuleKey }) {
  if (moduleKey === "piva") return <PivaCard />;
  if (moduleKey === "hlaskomat") return <HlaskomatCard />;
  if (moduleKey === "meditace") return <MeditaceCard />;
  return <Card moduleKey={moduleKey} num="Zamčeno" sub={`Odemkne se ve fázi ${MODULE_BY_KEY[moduleKey].phase}`} />;
}
