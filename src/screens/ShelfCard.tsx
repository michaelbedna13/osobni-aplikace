import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
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
import { computeGratitudeStats, useGratitude } from "../modules/vdecnost/data";
import { upcomingOccasions, usePeople } from "../modules/lide/data";
import { computeTrainingStats, useWorkouts } from "../modules/trenink/data";
import { useActiveWorkout } from "../modules/trenink/active";
import { computeCornholeStats, useGames } from "../modules/cornhole/data";
import { useActiveGame } from "../modules/cornhole/active";
import { useActiveDarts } from "../modules/skore/active";
import { computeDartStats, useDartGames } from "../modules/skore/data";
import { useActiveChess } from "../modules/sachy/active";
import { loadHistory } from "../modules/sachy/game";
import { useLinks } from "../modules/odkazy/data";
import { computeMediaStats, useMedia } from "../modules/filmy/data";
import { computeWishStats, formatKc, useWishes } from "../modules/wishlist/data";
import { usePlaces } from "../modules/mista/data";
import { computeBreathStats, useBreathSessions } from "../modules/dech/data";
import { daysUntil as daysTo13, nextFriday13, useUntroisNotes } from "../modules/untrois/data";
import { computeFinanceStats, daysUntil, debts, expenses, nextDue, nextRenewal, savings, subscriptions } from "../modules/finance/data";

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
    <div className={`fav tap${m.ready ? "" : " locked"}`} style={{ "--accent": m.color } as CSSProperties}>
      <Link to={`/m/${moduleKey}`} className="fav-link" aria-label={`${m.name}: ${num}, ${sub}`} />
      <div className="fav-top">
        <span key={jump} className={`sprite-tile${jump ? " anim-jump" : ""}`}>
          <Sprite name={moduleKey} size={44} />
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

function VdecnostCard() {
  const { data: list = [] } = useGratitude();
  const stats = useMemo(() => computeGratitudeStats(list), [list]);
  const navigate = useNavigate();
  return (
    <Card
      moduleKey="vdecnost"
      num={String(stats.today.length)}
      sub={`${plural(stats.today.length, ["věc", "věci", "věcí"])} dnes${stats.streak ? `, série ${stats.streak}` : ""}`}
      quick={{ label: "Zapsat vděčnost", text: <Sprite name="i-plus" size={20} />, run: () => navigate("/m/vdecnost?nova=1") }}
    />
  );
}

function LideCard() {
  const { data: people = [] } = usePeople();
  const next = useMemo(() => upcomingOccasions(people)[0], [people]);
  const navigate = useNavigate();
  return (
    <Card
      moduleKey="lide"
      num={next ? (next.days === 0 ? "Dnes" : `${next.days} d`) : String(people.length)}
      sub={next ? `${next.person.name}, ${next.kind === "narozeniny" ? "narozeniny" : "svátek"}` : "lidí, přidej narozeniny"}
      quick={{ label: "Přidat nápad na dárek", text: <Sprite name="i-plus" size={20} />, run: () => navigate("/m/lide?napad=1") }}
    />
  );
}

function TreninkCard() {
  const { data: workouts = [] } = useWorkouts();
  const { settings } = useSettings();
  const goal = settings.workout_weekly_goal;
  const stats = useMemo(() => computeTrainingStats(workouts, goal), [workouts, goal]);
  const { active } = useActiveWorkout();
  const navigate = useNavigate();
  return (
    <Card
      moduleKey="trenink"
      num={`${stats.weekCount}/${goal}`}
      sub={active ? "trénink běží" : stats.weekCount >= goal ? "Cíl splněný!" : "tento týden"}
      quick={{ label: active ? "Pokračovat v tréninku" : "Začít trénink", text: <Sprite name="i-play" size={20} />, run: () => { unlockAudio(); navigate(active ? "/m/trenink/trenink" : "/m/trenink?start=1"); } }}
    />
  );
}

function CornholeCard() {
  const { data: games = [] } = useGames();
  const stats = useMemo(() => computeCornholeStats(games), [games]);
  const { active } = useActiveGame();
  const navigate = useNavigate();
  const leader = stats.teams[0];
  return (
    <Card
      moduleKey="cornhole"
      num={String(stats.games)}
      sub={active ? "hra běží" : leader?.wins ? `${plural(stats.games, ["hra", "hry", "her"])}, vede ${leader.name}` : plural(stats.games, ["hra", "hry", "her"])}
      quick={{ label: active ? "Pokračovat ve hře" : "Nová hra", text: <Sprite name="i-play" size={20} />, run: () => navigate(active ? "/m/cornhole/hra" : "/m/cornhole?hra=1") }}
    />
  );
}

function SkoreCard() {
  const { data: games = [] } = useDartGames();
  const stats = useMemo(() => computeDartStats(games), [games]);
  const { active } = useActiveDarts();
  const navigate = useNavigate();
  const leader = stats.players[0];
  return (
    <Card
      moduleKey="skore"
      num={String(stats.games)}
      sub={active ? "hra běží" : leader?.wins ? `${plural(stats.games, ["hra", "hry", "her"])}, vede ${leader.name}` : plural(stats.games, ["hra", "hry", "her"])}
      quick={{ label: active ? "Pokračovat ve hře" : "Nová hra", text: <Sprite name="i-play" size={20} />, run: () => navigate(active ? "/m/skore/hra" : "/m/skore?nova=1") }}
    />
  );
}

function SachyCard() {
  const { game } = useActiveChess();
  const history = useMemo(loadHistory, [game]);
  const navigate = useNavigate();
  return (
    <Card
      moduleKey="sachy"
      num={String(history.length)}
      sub={game ? "partie běží" : plural(history.length, ["partie", "partie", "partií"])}
      quick={{ label: game ? "Pokračovat v partii" : "Nová partie", text: <Sprite name="i-play" size={20} />, run: () => navigate(game ? "/m/sachy/hra" : "/m/sachy?nova=1") }}
    />
  );
}

function OdkazyCard() {
  const { data: links = [] } = useLinks();
  const navigate = useNavigate();
  const later = links.filter((l) => !l.read_at).length;
  return (
    <Card
      moduleKey="odkazy"
      num={String(later)}
      sub={`na později, celkem ${links.length}`}
      quick={{ label: "Uložit odkaz", text: <Sprite name="i-plus" size={20} />, run: () => navigate("/m/odkazy?nova=1") }}
    />
  );
}

function FilmyCard() {
  const { data: items = [] } = useMedia();
  const stats = useMemo(() => computeMediaStats(items), [items]);
  const navigate = useNavigate();
  return (
    <Card
      moduleKey="filmy"
      num={String(stats.wanted)}
      sub={stats.inProgress ? `chci, ${stats.inProgress} rozkoukáno` : "na seznamu chci"}
      quick={{ label: "Přidat film nebo knihu", text: <Sprite name="i-plus" size={20} />, run: () => navigate("/m/filmy?nova=1") }}
    />
  );
}

function WishlistCard() {
  const { data: wishes = [] } = useWishes();
  const stats = useMemo(() => computeWishStats(wishes), [wishes]);
  const navigate = useNavigate();
  return (
    <Card
      moduleKey="wishlist"
      num={String(stats.open)}
      sub={`přání za ${formatKc(stats.openTotal)}`}
      quick={{ label: "Přidat přání", text: <Sprite name="i-plus" size={20} />, run: () => navigate("/m/wishlist?nova=1") }}
    />
  );
}

function MistaCard() {
  const { data: places = [] } = usePlaces();
  const navigate = useNavigate();
  const wanted = places.filter((p) => p.status === "chci").length;
  return (
    <Card
      moduleKey="mista"
      num={String(wanted)}
      sub={`chci navštívit, ${places.length - wanted} navštíveno`}
      quick={{ label: "Přidat místo", text: <Sprite name="i-plus" size={20} />, run: () => navigate("/m/mista?nova=1") }}
    />
  );
}

function FinanceCard() {
  const { data: subs = [] } = subscriptions.useList();
  const { data: ds = [] } = debts.useList();
  const { data: goals = [] } = savings.useList();
  const { data: exps = [] } = expenses.useList();
  const stats = useMemo(() => computeFinanceStats(subs, ds, goals, exps), [subs, ds, goals, exps]);
  const navigate = useNavigate();
  const next = [
    ...subs.filter((s) => s.active).map((s) => ({ name: s.name, d: daysUntil(nextRenewal(s.next_date, s.period)) })),
    ...exps.filter((e) => e.active && e.period === "mesic" && e.due_day).map((e) => ({ name: e.name, d: daysUntil(nextDue(e.due_day as number)) })),
  ].sort((a, b) => a.d - b.d)[0];
  return (
    <Card
      moduleKey="finance"
      num={`${Math.round(stats.monthlyTotal).toLocaleString("cs-CZ")}`}
      sub={next && next.d <= 7 ? `Kč/měs, ${next.name} ${next.d === 0 ? "dnes" : `za ${next.d} d`}` : "Kč měsíčně pravidelně"}
      quick={{ label: "Přidat výdaj", text: <Sprite name="i-plus" size={20} />, run: () => navigate("/m/finance?nova=1") }}
    />
  );
}

/** Karta modulu v pásu „Moje moduly“ na obrazovce Dnes. */
function DechCard() {
  const { data: sessions = [] } = useBreathSessions();
  const stats = useMemo(() => computeBreathStats(sessions), [sessions]);
  const navigate = useNavigate();
  return (
    <Card
      moduleKey="dech"
      num={String(stats.weekMinutes)}
      sub={`min tento týden${stats.bestHold ? `, rekord ${Math.floor(stats.bestHold / 60)}:${String(stats.bestHold % 60).padStart(2, "0")}` : ""}`}
      quick={{ label: "Krabicové dýchání", text: <Sprite name="i-play" size={20} />, run: () => { unlockAudio(); navigate("/m/dech?cviceni=krabice"); } }}
    />
  );
}

function UntroisCard() {
  const { data: notes = [] } = useUntroisNotes();
  const navigate = useNavigate();
  const ideas = notes.filter((n) => n.kind === "napad").length;
  const d = daysTo13(nextFriday13());
  return (
    <Card
      moduleKey="untrois"
      num={String(ideas)}
      sub={`nápadů · pátek 13. ${d === 0 ? "dnes!" : `za ${d} d`}`}
      quick={{ label: "Zapsat nápad", text: <Sprite name="i-plus" size={20} />, run: () => navigate("/m/untrois?nova=1") }}
    />
  );
}

const CARDS: Record<ModuleKey, () => ReactNode> = {
  piva: PivaCard, hlaskomat: HlaskomatCard, meditace: MeditaceCard, vdecnost: VdecnostCard, lide: LideCard, trenink: TreninkCard,
  cornhole: CornholeCard, odkazy: OdkazyCard, filmy: FilmyCard, wishlist: WishlistCard, mista: MistaCard, finance: FinanceCard, dech: DechCard, untrois: UntroisCard, skore: SkoreCard, sachy: SachyCard,
};

export function ShelfCard({ moduleKey }: { moduleKey: ModuleKey }) {
  const Component = CARDS[moduleKey];
  return <Component />;
}
