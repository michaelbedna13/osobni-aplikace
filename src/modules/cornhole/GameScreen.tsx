import { useState, type CSSProperties } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Burst } from "../../components/Burst";
import { Sprite } from "../../components/Sprite";
import { Topbar } from "../../components/Topbar";
import { plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { useActiveGame, type ActiveGame } from "./active";
import { useAddGame, type Game } from "./data";
import { BAGS, MODE_NAMES, rawPoints, roundScores, runningTotals, standings, totals, winnerOf, type Throw } from "./scoring";

const MODULE = MODULE_BY_KEY.cornhole;
const empty = (n: number): Throw[] => Array.from({ length: n }, () => ({ board: 0, hole: 0 }));

export function GameScreen() {
  const { active, update, clear } = useActiveGame();
  const add = useAddGame();
  const navigate = useNavigate();
  const [input, setInput] = useState<Throw[]>(() => empty(active?.teams.length ?? 0));
  const [burst, setBurst] = useState(0);
  const [saved, setSaved] = useState<Game | null>(null);

  if (saved) return <Finished game={saved} />;
  if (!active) return <Navigate to="/m/cornhole" replace />;

  const n = active.teams.length;
  const scores = totals(active.rounds, active.mode, n);
  const winner = winnerOf(active.rounds, active.mode, n, active.target);
  const order = standings(scores);
  const lastRound = active.rounds.length ? roundScores(active.rounds[active.rounds.length - 1], active.mode) : null;

  const change = (team: number, field: keyof Throw, delta: number) =>
    setInput((list) => list.map((t, i) => {
      if (i !== team) return t;
      const next = { ...t, [field]: Math.max(0, t[field] + delta) };
      return next.board + next.hole <= BAGS ? next : t;
    }));

  const record = () => {
    update((g) => ({ ...g, rounds: [...g.rounds, input] }));
    setInput(empty(n));
    setBurst((b) => b + 1);
  };

  const undo = () => update((g) => ({ ...g, rounds: g.rounds.slice(0, -1) }));

  const save = (g: ActiveGame, win: number | null) => {
    const game: Game = { id: crypto.randomUUID(), started_at: g.started_at, finished_at: new Date().toISOString(), mode: g.mode, target: g.target, teams: g.teams, rounds: g.rounds, winner: win };
    add.mutate(game);
    clear();
    setSaved(game);
  };

  return (
    <div className="screen module cornhole-game" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <Topbar title={winner === null ? `Kolo ${active.rounds.length + 1}` : "Konec hry"} back="/m/cornhole" right={<span className="game-mode">{MODE_NAMES[active.mode]} do {active.target}</span>} />

      {winner !== null && (
        <div className="panel win-panel" style={{ "--team": active.teams[winner].color } as CSSProperties}>
          <Burst trigger={1} text="Výhra!" />
          <span className="bag big" style={{ background: active.teams[winner].color }} aria-hidden="true" />
          <h2>Vyhrává {active.teams[winner].name}!</h2>
          <p className="small muted">{scores[winner]} bodů po {active.rounds.length} {plural(active.rounds.length, ["kole", "kolech", "kolech"])}</p>
          <button className="btn-hero" onClick={() => save(active, winner)}><Sprite name="trophy" size={32} /> Uložit hru</button>
          <button className="link" onClick={undo}>Vrátit poslední kolo</button>
        </div>
      )}

      <div className="ch-teams">
        {active.teams.map((t, i) => {
          const rank = order.indexOf(i);
          const raw = rawPoints(input[i] ?? { board: 0, hole: 0 });
          return (
            <section key={t.team_id} className={`ch-team${winner === i ? " won" : ""}`} style={{ "--team": t.color } as CSSProperties}>
              <div className="ch-head">
                <span className="bag" style={{ background: t.color }} aria-hidden="true" />
                <div className="grow">
                  <b>{t.name}</b>
                  {t.players.length > 0 && <span className="occasion-kind">{t.players.join(", ")}</span>}
                </div>
                <div className="ch-score">
                  {rank === 0 && scores[i] > 0 && <Sprite name="crown" size={24} />}
                  <span>{scores[i]}</span>
                  {lastRound && lastRound[i] > 0 && <small>+{lastRound[i]}</small>}
                </div>
              </div>
              <div className="ch-progress" aria-hidden="true"><i style={{ width: `${Math.min(100, (scores[i] / active.target) * 100)}%` }} /></div>
              {winner === null && (
                <div className="ch-input">
                  <Counter label="Na desce" value={input[i]?.board ?? 0} onMinus={() => change(i, "board", -1)} onPlus={() => change(i, "board", 1)} canPlus={(input[i]?.board ?? 0) + (input[i]?.hole ?? 0) < BAGS} />
                  <Counter label="V díře" value={input[i]?.hole ?? 0} onMinus={() => change(i, "hole", -1)} onPlus={() => change(i, "hole", 1)} canPlus={(input[i]?.board ?? 0) + (input[i]?.hole ?? 0) < BAGS} />
                  <span className="ch-raw" aria-label={`${raw} bodů v kole`}>{raw} b.</span>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {winner === null && (
        <>
          <button className="btn-hero" onClick={record}>
            <Sprite name="i-plus" size={24} /> Zapsat kolo
            <Burst trigger={burst} />
          </button>
          {active.mode === "rozdil" && <p className="small muted note-center">Rozdílem: boduje jen tým s nejvíc body v kole.</p>}
        </>
      )}

      {active.rounds.length > 0 && <RoundsTable game={active} />}

      <div className="game-actions">
        {active.rounds.length > 0 && winner === null && <button className="link" onClick={undo}>Vrátit poslední kolo</button>}
        {winner === null && (
          <button className="link" onClick={() => {
            if (active.rounds.length === 0) { clear(); navigate("/m/cornhole", { replace: true }); return; }
            const choice = window.confirm("Ukončit hru a uložit ji bez vítěze? (Zrušit = hrát dál)");
            if (choice) save(active, null);
          }}>Ukončit hru</button>
        )}
        <button className="link" onClick={() => {
          if (window.confirm("Zahodit tuhle hru bez uložení?")) { clear(); navigate("/m/cornhole", { replace: true }); }
        }}>Zahodit</button>
      </div>
    </div>
  );
}

function Counter({ label, value, onMinus, onPlus, canPlus }: { label: string; value: number; onMinus: () => void; onPlus: () => void; canPlus: boolean }) {
  return (
    <div className="counter">
      <span className="counter-label">{label}</span>
      <div className="counter-row">
        <button className="icon-btn" aria-label={`${label} méně`} disabled={value === 0} onClick={onMinus}>−</button>
        <span className="counter-value" aria-live="polite">{value}</span>
        <button className="icon-btn" aria-label={`${label} víc`} disabled={!canPlus} onClick={onPlus}>+</button>
      </div>
    </div>
  );
}

/** Tabulka kol: kolik si který tým v kole připsal a průběžný součet. */
export function RoundsTable({ game }: { game: Pick<Game, "mode" | "teams" | "rounds"> }) {
  const running = runningTotals(game.rounds, game.mode, game.teams.length);
  return (
    <div className="panel rounds-panel">
      <h3>Průběh</h3>
      <table className="rounds">
        <thead>
          <tr>
            <th scope="col">Kolo</th>
            {game.teams.map((t) => <th key={t.team_id} scope="col"><span className="bag small" style={{ background: t.color }} aria-hidden="true" />{t.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {game.rounds.map((r, k) => {
            const s = roundScores(r, game.mode);
            return (
              <tr key={k}>
                <th scope="row">{k + 1}</th>
                {r.map((t, i) => (
                  <td key={i}>
                    <b>{running[k][i]}</b>
                    <span>{s[i] ? `+${s[i]}` : "·"}{t.hole ? ` · ${t.hole}× díra` : ""}</span>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Finished({ game }: { game: Game }) {
  const w = game.winner !== null ? game.teams[game.winner] : null;
  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="hero summary-hero">
        <span className="sprite-tile anim-jump"><Sprite name={w ? "trophy" : "cornhole"} size={96} /></span>
        <span className="hero-num hero-name">{w ? w.name : "Konec"}</span>
        <span className="hero-cap">{w ? "vyhráli!" : "hra uložená bez vítěze"}</span>
        {w && w.players.length > 0 && <p className="hero-line">{w.players.join(", ")}</p>}
      </div>
      <Link to="/m/cornhole" className="btn-hero">Zpět</Link>
    </div>
  );
}
