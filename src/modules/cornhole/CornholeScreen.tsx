import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sheet } from "../../components/Sheet";
import { Icon } from "../../components/Icon";
import { Tabs } from "../../components/Tabs";
import { Topbar } from "../../components/Topbar";
import { relativeTime } from "../../lib/dates";
import { formatDate, plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { useActiveGame } from "./active";
import { computeCornholeStats, useDeleteGame, useGames, type Game, type GameTeam } from "./data";
import { RoundsTable } from "./GameScreen";
import { MODE_NAMES, totals, type Mode } from "./scoring";
import { NewGameSheet } from "./Sheets";

const MODULE = MODULE_BY_KEY.cornhole;
const ODEHRANO: [string, string, string] = ["hra odehrána", "hry odehrány", "her odehráno"];
const KOL: [string, string, string] = ["kolo", "kola", "kol"];

const pct = (wins: number, games: number) => (games ? `${Math.round((wins / games) * 100)} %` : "–");

export function CornholeScreen() {
  const { data: games = [], error } = useGames();
  const stats = useMemo(() => computeCornholeStats(games), [games]);
  const { active, start } = useActiveGame();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<"zajimavosti" | "historie" | "hraci">("zajimavosti");
  const [newGame, setNewGame] = useState(false);
  const [detail, setDetail] = useState<Game | null>(null);
  const lastWin = games.find((g) => g.winner !== null);

  // ?hra=1 z karty na obrazovce Dnes
  useEffect(() => {
    if (!params.has("hra")) return;
    setParams({}, { replace: true });
    if (active) navigate("/m/cornhole/hra");
    else setNewGame(true);
  }, [params, setParams, active, navigate]);

  const begin = (teams: GameTeam[], mode: Mode, target: number) => {
    start({ started_at: new Date().toISOString(), mode, target, teams, rounds: [] });
    navigate("/m/cornhole/hra");
  };

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar title="Cornhole" />
        <div className="hero">
          <span className="icon-slot"><Icon name="cornhole" size={96} /></span>
          <span className="hero-num">{stats.games}</span>
          <span className="hero-cap">{plural(stats.games, ODEHRANO)}</span>
          <p className="hero-line">{lastWin && lastWin.winner !== null ? `Naposledy vyhrál tým ${lastWin.teams[lastWin.winner].name}` : "Hoď první pytlík."}</p>
        </div>
        {active ? (
          <button className="btn-hero" onClick={() => navigate("/m/cornhole/hra")}><Icon name="i-play" size={24} /> Pokračovat ve hře</button>
        ) : (
          <button className="btn-hero" onClick={() => setNewGame(true)}>
            <Icon name="i-play" size={24} /> Nová hra
          </button>
        )}
        <button className="btn tap wide ch-mobile-link" onClick={() => navigate("/m/cornhole/mobil")}>
          <Icon name="cornhole" size={24} /> Hra v mobilu
        </button>
      </div>

      {error && <p className="error">Nepodařilo se načíst data. Zkontroluj připojení.</p>}

      <Tabs
        label="Zobrazení"
        value={tab}
        onChange={setTab}
        items={[{ id: "zajimavosti", label: "Zajímavosti" }, { id: "historie", label: "Hry" }, ...(stats.players.length ? [{ id: "hraci" as const, label: "Hráči" }] : [])]}
      />

      {tab === "zajimavosti" && (
        <div className="tab-panel">
          {stats.games === 0 ? <p className="empty">Zajímavosti se ukážou po první hře.</p> : (
            <div className="trophies">
              {stats.bestRound && <Record icon="trophy" gold value={stats.bestRound.points} label="nejvíc bodů v kole" meta={stats.bestRound.team} date={stats.bestRound.date} />}
              {stats.tugOfWar && <Record value={`${stats.tugOfWar.changes}×`} label="se otočilo vedení – největší přetahovaná" meta={stats.tugOfWar.teams.join(" × ")} date={stats.tugOfWar.date} />}
              {stats.comeback && <Record value={`−${stats.comeback.deficit}`} label="největší obrat – vyhrál ze ztráty" meta={stats.comeback.team} date={stats.comeback.date} />}
              {stats.closest && <Record value={stats.closest.margin} label={`${plural(stats.closest.margin, ["bod", "body", "bodů"])} rozdíl – nejtěsnější konec`} meta={`vyhrál ${stats.closest.team}`} date={stats.closest.date} />}
              {stats.mostHoles && <Record icon="star" value={stats.mostHoles.holes} label="nejvíc děr v jedné hře" meta={stats.mostHoles.team} date={stats.mostHoles.date} />}
              {stats.fastestWin && <Record value={stats.fastestWin.rounds} label={`${plural(stats.fastestWin.rounds, KOL)} – nejrychlejší výhra`} meta={stats.fastestWin.team} date={stats.fastestWin.date} />}
              {stats.longestGame && <Record value={stats.longestGame.rounds} label={`${plural(stats.longestGame.rounds, KOL)} – nejdelší hra`} date={stats.longestGame.date} />}
            </div>
          )}
        </div>
      )}

      {tab === "hraci" && (
        <div className="tab-panel">
          <div className="panel">
            <h3>Výhry hráčů</h3>
            <ol className="ranking">
              {stats.players.map((p, i) => (
                <li key={p.name}>
                  <span className="rank">{i + 1}.</span>
                  <span className="grow">{p.name}</span>
                  {i === 0 && p.wins > 0 && <Icon name="crown" size={20} />}
                  <b>{p.wins}</b>
                  <span className="small muted">z {p.games} · {pct(p.wins, p.games)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {tab === "historie" && (
        <div className="tab-panel">
          {games.length === 0 ? <p className="empty">Zatím žádná hra.</p> : (
            <ul className="list">
              {games.slice(0, 80).map((g) => {
                const s = totals(g.rounds, g.mode, g.teams.length);
                const w = g.winner !== null ? g.teams[g.winner] : null;
                return (
                  <li key={g.id}>
                    <button className="list-btn" onClick={() => setDetail(g)}>
                      {w ? <span className="bag" style={{ background: w.color }} aria-hidden="true" /> : <span className="bag empty-bag" aria-hidden="true" />}
                      <span className="grow">
                        <b>{w ? `${w.name} vyhrává` : "Bez vítěze"}</b>
                        <span className="occasion-kind">{g.teams.map((t, i) => `${t.name} ${s[i]}`).join(" · ")}</span>
                      </span>
                      <span className="small muted">{relativeTime(new Date(g.started_at))}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {newGame && <NewGameSheet last={games[0]?.teams ?? null} onClose={() => setNewGame(false)} onStart={begin} />}
      {detail && <GameDetail game={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

/** Zajímavost: velké číslo, krátký popisek, pod ním tým a kdy (rok jen u loňských a starších). */
function Record({ icon, value, label, meta, date, gold }: { icon?: "trophy" | "star"; value: number | string; label: string; meta?: string; date: string; gold?: boolean }) {
  const d = new Date(date);
  return (
    <div className={`trophy${gold ? " gold" : ""}`}>
      {icon && <Icon name={icon} size={32} />}
      <b>{value}</b>
      <span>{label}</span>
      <small className="muted">{meta ? `${meta} · ` : ""}{formatDate(d, d.getFullYear() !== new Date().getFullYear())}</small>
    </div>
  );
}

function GameDetail({ game, onClose }: { game: Game; onClose: () => void }) {
  const remove = useDeleteGame();
  return (
    <Sheet title={game.winner !== null ? `Vyhrává ${game.teams[game.winner].name}` : "Hra bez vítěze"} onClose={onClose}>
      <p className="small muted">{relativeTime(new Date(game.started_at))} · {MODE_NAMES[game.mode]} do {game.target}</p>
      <RoundsTable game={game} />
      <button className="btn tap wide" onClick={() => {
        if (!window.confirm("Smazat tuhle hru?")) return;
        remove.mutate(game.id);
        onClose();
      }}>Smazat hru</button>
    </Sheet>
  );
}
