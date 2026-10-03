import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sheet } from "../../components/Sheet";
import { Sprite } from "../../components/Sprite";
import { Tabs } from "../../components/Tabs";
import { Topbar } from "../../components/Topbar";
import { relativeTime } from "../../lib/dates";
import { formatDate, plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { useActiveGame } from "./active";
import { computeCornholeStats, useDeleteGame, useGames, useTeams, type Game, type Team } from "./data";
import { RoundsTable } from "./GameScreen";
import { MODE_NAMES, totals, type Mode } from "./scoring";
import { NewGameSheet, TeamSheet } from "./Sheets";

const MODULE = MODULE_BY_KEY.cornhole;
const HER: [string, string, string] = ["hra", "hry", "her"];
const VYHER: [string, string, string] = ["výhra", "výhry", "výher"];

const pct = (wins: number, games: number) => (games ? `${Math.round((wins / games) * 100)} %` : "–");

export function CornholeScreen() {
  const { data: teams = [], error } = useTeams();
  const { data: games = [] } = useGames();
  const stats = useMemo(() => computeCornholeStats(games), [games]);
  const { active, start } = useActiveGame();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<"zebricek" | "tymy" | "historie" | "rekordy">("zebricek");
  const [sheet, setSheet] = useState<{ kind: "game" } | { kind: "team"; team: Team | null } | null>(null);
  const [detail, setDetail] = useState<Game | null>(null);
  const leader = stats.teams[0];

  // ?hra=1 z karty na obrazovce Dnes
  useEffect(() => {
    if (!params.has("hra")) return;
    setParams({}, { replace: true });
    if (active) navigate("/m/cornhole/hra");
    else setSheet({ kind: "game" });
  }, [params, setParams, active, navigate]);

  const begin = (chosen: Team[], mode: Mode, target: number) => {
    start({
      started_at: new Date().toISOString(),
      mode,
      target,
      teams: chosen.map((t) => ({ team_id: t.id, name: t.name, color: t.color, players: t.players })),
      rounds: [],
    });
    navigate("/m/cornhole/hra");
  };

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar title="Cornhole" />
        <div className="hero">
          <span className="sprite-tile"><Sprite name="cornhole" size={96} /></span>
          <span className="hero-num">{stats.games}</span>
          <span className="hero-cap">{plural(stats.games, HER)} odehráno</span>
          <p className="hero-line">{leader && leader.wins > 0 ? `Nejvíc výher: ${leader.name} (${leader.wins})` : "Hoď první pytlík."}</p>
        </div>
        {active ? (
          <button className="btn-hero" onClick={() => navigate("/m/cornhole/hra")}><Sprite name="i-play" size={24} /> Pokračovat ve hře</button>
        ) : (
          <button className="btn-hero" onClick={() => setSheet(teams.length ? { kind: "game" } : { kind: "team", team: null })}>
            <Sprite name="i-play" size={24} /> {teams.length ? "Nová hra" : "Založit první tým"}
          </button>
        )}
        <button className="btn tap wide ch-mobile-link" onClick={() => navigate("/m/cornhole/mobil")}>
          <Sprite name="cornhole" size={24} /> Hra v mobilu pro dva
        </button>
      </div>

      {error && <p className="error">Nepodařilo se načíst data. Zkontroluj připojení.</p>}

      <Tabs
        label="Zobrazení"
        value={tab}
        onChange={setTab}
        items={[{ id: "zebricek", label: "Žebříček" }, { id: "tymy", label: "Týmy" }, { id: "historie", label: "Hry" }, { id: "rekordy", label: "Rekordy" }]}
      />

      {tab === "zebricek" && (
        <div className="tab-panel">
          {stats.games === 0 ? <p className="empty">Žebříček se ukáže po první hře.</p> : (
            <>
              <div className="panel">
                <h3>Týmy</h3>
                <ol className="ranking">
                  {stats.teams.map((t, i) => (
                    <li key={t.team_id}>
                      <span className="rank">{i + 1}.</span>
                      <span className="bag small" style={{ background: t.color }} aria-hidden="true" />
                      <span className="grow">{t.name}</span>
                      <b>{t.wins}</b>
                      <span className="small muted">{plural(t.wins, VYHER)} · {pct(t.wins, t.games)}</span>
                    </li>
                  ))}
                </ol>
              </div>
              {stats.players.length > 0 && (
                <div className="panel">
                  <h3>Hráči</h3>
                  <ol className="ranking">
                    {stats.players.map((p, i) => (
                      <li key={p.name}>
                        <span className="rank">{i + 1}.</span>
                        <span className="grow">{p.name}</span>
                        {i === 0 && p.wins > 0 && <Sprite name="crown" size={20} />}
                        <b>{p.wins}</b>
                        <span className="small muted">z {p.games} · {pct(p.wins, p.games)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === "tymy" && (
        <div className="tab-panel">
          {teams.length > 0 && (
            <ul className="list">
              {teams.map((t) => (
                <li key={t.id}>
                  <button className="list-btn" onClick={() => setSheet({ kind: "team", team: t })}>
                    <span className="bag" style={{ background: t.color }} aria-hidden="true" />
                    <span className="grow"><b>{t.name}</b><span className="occasion-kind">{t.players.length ? t.players.join(", ") : "bez hráčů"}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button className="btn tap wide" onClick={() => setSheet({ kind: "team", team: null })}><Sprite name="i-plus" size={20} /> Nový tým</button>
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

      {tab === "rekordy" && (
        <div className="tab-panel">
          {stats.games === 0 ? <p className="empty">Rekordy se ukážou po první hře.</p> : (
            <div className="trophies">
              {stats.bestRound && <Record icon="trophy" value={`${stats.bestRound.points}`} text={`nejvíc bodů v kole: ${stats.bestRound.team}`} date={stats.bestRound.date} gold />}
              {stats.mostHoles && <Record icon="star" value={`${stats.mostHoles.holes}`} text={`nejvíc děr ve hře: ${stats.mostHoles.team}`} date={stats.mostHoles.date} />}
              {stats.fastestWin && <Record value={`${stats.fastestWin.rounds}`} text={`${plural(stats.fastestWin.rounds, ["kolo", "kola", "kol"])} na nejrychlejší výhru: ${stats.fastestWin.team}`} date={stats.fastestWin.date} />}
              {stats.longestGame && <Record value={`${stats.longestGame.rounds}`} text={`${plural(stats.longestGame.rounds, ["kolo", "kola", "kol"])} trvala nejdelší hra`} date={stats.longestGame.date} />}
            </div>
          )}
        </div>
      )}

      {sheet?.kind === "game" && (
        <NewGameSheet teams={teams} onClose={() => setSheet(null)} onStart={begin} onNewTeam={() => setSheet({ kind: "team", team: null })} />
      )}
      {sheet?.kind === "team" && <TeamSheet team={sheet.team} teams={teams} onClose={() => setSheet(null)} />}
      {detail && <GameDetail game={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function Record({ icon, value, text, date, gold }: { icon?: "trophy" | "star"; value: string; text: string; date: string; gold?: boolean }) {
  return (
    <div className={`trophy${gold ? " gold" : ""}`}>
      {icon && <Sprite name={icon} size={40} />}
      <b>{value}</b>
      <span>{text} ({formatDate(new Date(date), true)})</span>
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
