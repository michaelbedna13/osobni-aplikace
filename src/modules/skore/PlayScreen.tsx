import { useEffect, useState, type CSSProperties } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Burst } from "../../components/Burst";
import { Sprite } from "../../components/Sprite";
import { Topbar } from "../../components/Topbar";
import { MODULE_BY_KEY } from "../../lib/modules";
import { useActiveScoreGame, type ActiveScoreGame } from "./active";
import { playerColor, useAddScoreGame } from "./data";
import { DART_MAX, KINDS, MOLKKY_TARGET, dartAverage, play, ranking, settingsLabel, type GameState, type TurnInfo } from "./rules";

const MODULE = MODULE_BY_KEY.skore;
const DART_QUICK = [26, 41, 45, 60, 81, 85, 100, 140, 180];

export function PlayScreen() {
  const { active, update, clear, start } = useActiveScoreGame();
  const add = useAddScoreGame();
  const navigate = useNavigate();
  const [team, setTeam] = useState<number | null>(null);

  // při hře bez spodní lišty, ať se klávesnice s body vejde
  useEffect(() => {
    document.documentElement.classList.add("focus-mode");
    return () => document.documentElement.classList.remove("focus-mode");
  }, []);

  if (!active) return <Navigate to="/m/skore" replace />;

  const { kind, settings, players, turns } = active;
  const state = play(kind, settings, players.length, turns, !!active.finished);
  const over = state.winner !== null || !!active.finished;
  const order = ranking(kind, settings, state);

  const record = (p: number, v: number) => update((g) => ({ ...g, turns: [...g.turns, { p, v }] }));
  const undo = () => update((g) => (g.finished ? { ...g, finished: false } : { ...g, turns: g.turns.slice(0, -1) }));

  const save = (g: ActiveScoreGame) => {
    add.mutate({
      id: crypto.randomUUID(), kind: g.kind, settings: g.settings, players: g.players, turns: g.turns,
      winner: state.winner, started_at: g.started_at, finished_at: new Date().toISOString(),
    });
  };
  const rematch = () => {
    save(active);
    // v odvetě začíná další hráč v pořadí
    start({ started_at: new Date().toISOString(), kind, settings, players: [...players.slice(1), players[0]], turns: [] });
  };
  const done = () => {
    save(active);
    clear();
    navigate("/m/skore");
  };
  const cancel = () => {
    if (!window.confirm(turns.length ? "Zrušit rozehranou hru? Nic se neuloží." : "Zrušit hru?")) return;
    clear();
    navigate("/m/skore");
  };

  const title = over ? "Konec hry" : kind === "vlastni" ? `Kolo ${state.rounds + 1}` : KINDS[kind].name;

  return (
    <div className="screen module sc-play" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <Topbar title={title} back="/m/skore" right={<span className="game-mode">{kind === "vlastni" ? `Vlastní ${settingsLabel(kind, settings)}` : settingsLabel(kind, settings)}</span>} />

      {over && (
        <div className="panel win-panel" style={{ "--team": state.winner !== null ? playerColor(state.winner) : "var(--slate)" } as CSSProperties}>
          {state.winner !== null && <Burst trigger={1} text="Výhra!" />}
          <span className="bag big" style={{ background: state.winner !== null ? playerColor(state.winner) : "var(--surface-2)" }} aria-hidden="true" />
          <h2>{state.winner !== null ? `Vyhrává ${players[state.winner]}` : "Remíza"}</h2>
          <button className="btn-hero" onClick={rematch}>Uložit a odveta</button>
          <button className="btn tap wide" onClick={done}>Uložit a konec</button>
          <button className="link" onClick={undo}>Vrátit poslední zápis</button>
        </div>
      )}

      <ul className="sc-board">
        {(over ? order : players.map((_, i) => i)).map((p) => (
          <PlayerRow key={p} index={p} name={players[p]} state={state} kind={kind} on={!over && (state.current === p || team === p)} />
        ))}
      </ul>

      {!over && (
        <div className="panel sc-input">
          {kind === "molkky" && state.current !== null && (
            <>
              <p className="sc-turn">Hází <b>{players[state.current]}</b> – kolik shodil?</p>
              <div className="sc-grid molkky">
                {Array.from({ length: 13 }, (_, v) => (
                  <button key={v} className={`sc-key${v === 0 ? " miss" : ""}`} onClick={() => record(state.current as number, v)}>{v === 0 ? "vedle" : v}</button>
                ))}
              </div>
            </>
          )}
          {kind === "petanque" && (
            <>
              <p className="sc-turn">Kdo v kole bodoval?</p>
              <div className="sc-teams">
                {players.map((name, p) => (
                  <button key={p} className={`seg-btn sc-team${team === p ? " on" : ""}`} style={{ "--team": playerColor(p) } as CSSProperties} aria-pressed={team === p} onClick={() => setTeam(p)}>{name}</button>
                ))}
              </div>
              <div className="sc-grid petanque">
                {[1, 2, 3, 4, 5, 6].map((v) => (
                  <button key={v} className="sc-key" disabled={team === null} onClick={() => { if (team !== null) { record(team, v); setTeam(null); } }}>{v}</button>
                ))}
              </div>
            </>
          )}
          {(kind === "sipky" || kind === "vlastni") && state.current !== null && (
            <Keypad
              key={turns.length}
              who={players[state.current]}
              signed={kind === "vlastni"}
              max={kind === "sipky" ? DART_MAX : 9999}
              quick={kind === "sipky" ? DART_QUICK : []}
              remaining={kind === "sipky" ? state.scores[state.current] : null}
              onSubmit={(v) => record(state.current as number, v)}
            />
          )}
          <div className="sc-actions">
            <button className="btn tap" disabled={!turns.length} onClick={undo}><Sprite name="i-back" size={20} /> Vrátit</button>
            {kind === "vlastni" && turns.length > 0 && (
              <button className="btn tap" onClick={() => { if (window.confirm("Ukončit hru? Vyhraje nejlepší skóre.")) update((g) => ({ ...g, finished: true })); }}>Ukončit hru</button>
            )}
          </div>
        </div>
      )}

      {kind === "vlastni" ? <RoundsTable players={players} state={state} /> : <TurnLog players={players} log={state.log} kind={kind} />}

      {!over && <button className="link sc-cancel" onClick={cancel}>Zrušit hru bez uložení</button>}
    </div>
  );
}

function PlayerRow({ index, name, state, kind, on }: { index: number; name: string; state: GameState; kind: ActiveScoreGame["kind"]; on: boolean }) {
  const out = state.out[index];
  const avg = kind === "sipky" ? dartAverage(state, index) : null;
  return (
    <li className={`sc-row${on ? " on" : ""}${out ? " out" : ""}${state.winner === index ? " won" : ""}`} style={{ "--team": playerColor(index) } as CSSProperties}>
      <span className="bag small" style={{ background: playerColor(index) }} aria-hidden="true" />
      <span className="grow">
        <b>{name}</b>
        {kind === "molkky" && (
          <span className="sc-misses" aria-label={out ? "vypadl" : `${state.misses[index]} nuly v řadě`}>
            {out ? "vypadává" : Array.from({ length: 3 }, (_, i) => <i key={i} className={i < state.misses[index] ? "full" : ""} />)}
          </span>
        )}
        {kind === "molkky" && !out && state.scores[index] > 0 && <span className="small muted"> chybí {MOLKKY_TARGET - state.scores[index]}</span>}
        {avg !== null && <span className="small muted">průměr {String(avg).replace(".", ",")}</span>}
      </span>
      <span className="sc-score">{state.scores[index]}</span>
    </li>
  );
}

function Keypad({ who, signed, max, quick, remaining, onSubmit }: {
  who: string;
  signed: boolean;
  max: number;
  quick: number[];
  remaining: number | null;
  onSubmit: (v: number) => void;
}) {
  const [digits, setDigits] = useState("");
  const [negative, setNegative] = useState(false);
  const value = (negative ? -1 : 1) * Number(digits || 0);
  const tooBig = Math.abs(value) > max;
  const press = (d: string) => setDigits((s) => (s === "0" ? d : (s + d).slice(0, 4)));

  return (
    <>
      <p className="sc-turn">Na řadě <b>{who}</b>{remaining !== null ? <> · zbývá {remaining}</> : null}</p>
      <div className={`sc-display${tooBig ? " bad" : ""}`} aria-live="polite">{negative && digits ? "−" : ""}{digits || "0"}</div>
      {quick.length > 0 && (
        <div className="sc-quick">
          {quick.map((q) => <button key={q} className="chip" onClick={() => onSubmit(q)}>{q}</button>)}
        </div>
      )}
      <div className="sc-grid keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => <button key={d} className="sc-key" onClick={() => press(d)}>{d}</button>)}
        {signed
          ? <button className={`sc-key${negative ? " on" : ""}`} aria-pressed={negative} aria-label="Záporné body" onClick={() => setNegative((v) => !v)}>±</button>
          : <button className="sc-key" aria-label="Smazat vše" onClick={() => setDigits("")}>C</button>}
        <button className="sc-key" onClick={() => press("0")}>0</button>
        <button className="sc-key" aria-label="Smazat číslici" onClick={() => setDigits((s) => s.slice(0, -1))}>⌫</button>
      </div>
      <button className="btn-hero" disabled={tooBig} onClick={() => onSubmit(value)}>
        {tooBig ? `Nejvýš ${max}` : `Zapsat ${negative && digits ? "−" : ""}${digits || "0"}`}
      </button>
    </>
  );
}

function TurnLog({ players, log, kind }: { players: string[]; log: TurnInfo[]; kind: ActiveScoreGame["kind"] }) {
  if (!log.length) return null;
  return (
    <div className="panel sc-log-panel">
      <h3>Poslední zápisy</h3>
      <ol className="sc-log" reversed>
        {log.slice(-12).reverse().map((t, i) => (
          <li key={log.length - i}>
            <span className="bag small" style={{ background: playerColor(t.p) }} aria-hidden="true" />
            <span className="grow">{players[t.p]}</span>
            <b>{kind === "molkky" && t.v === 0 ? "vedle" : kind === "sipky" ? t.v : `+${t.v}`}</b>
            <span className="small muted sc-after">
              {t.bust ? "přehoz" : t.reset ? `přes 50 → ${t.after}` : t.out ? "vypadává" : `→ ${t.after}`}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RoundsTable({ players, state }: { players: string[]; state: GameState }) {
  if (!state.log.length) return null;
  const n = players.length;
  const rows: (number | null)[][] = [];
  state.log.forEach((t, i) => {
    const r = Math.floor(i / n);
    rows[r] ??= Array<number | null>(n).fill(null);
    rows[r][t.p] = t.v;
  });
  return (
    <div className="panel rounds-panel">
      <table className="rounds">
        <thead>
          <tr><th scope="col">Kolo</th>{players.map((p, i) => <th key={i} scope="col">{p}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              <th scope="row">{r + 1}</th>
              {row.map((v, i) => <td key={i}>{v === null ? "" : <b>{v}</b>}</td>)}
            </tr>
          ))}
          <tr className="sc-total">
            <th scope="row">Σ</th>
            {state.scores.map((v, i) => <td key={i}><b>{v}</b></td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
