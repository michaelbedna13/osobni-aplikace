import { useEffect, useState, type CSSProperties } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Burst } from "../../components/Burst";
import { Sprite } from "../../components/Sprite";
import { Topbar } from "../../components/Topbar";
import { MODULE_BY_KEY } from "../../lib/modules";
import { useActiveDarts, type ActiveDarts } from "./active";
import {
  average, checkout, checkoutText, dartLabel, dartValue, play, possibleVisit, ranking, settingsLabel,
  type Dart, type DartState, type VisitInfo,
} from "./darts";
import { playerColor, useAddDartGame } from "./data";

const MODULE = MODULE_BY_KEY.skore;
const QUICK = [26, 41, 45, 60, 81, 85, 100, 140, 180];
const INPUT_KEY = "sipky:vstup";
type InputMode = "sipky" | "soucet";

function loadInput(): InputMode {
  try {
    return localStorage.getItem(INPUT_KEY) === "soucet" ? "soucet" : "sipky";
  } catch {
    return "sipky";
  }
}

export function PlayScreen() {
  const { active, update, clear, start } = useActiveDarts();
  const add = useAddDartGame();
  const navigate = useNavigate();
  const [input, setInput] = useState<InputMode>(loadInput);

  // při hře bez spodní lišty, ať se tlačítka vejdou
  useEffect(() => {
    document.documentElement.classList.add("focus-mode");
    return () => document.documentElement.classList.remove("focus-mode");
  }, []);

  if (!active) return <Navigate to="/m/skore" replace />;

  const { settings, players, turns } = active;
  const pending = active.pending ?? [];
  const state = play(settings, players.length, turns);
  const over = state.winner !== null;
  const order = ranking(state);
  const cur = state.current;
  const pendingSum = pending.reduce((s, d) => s + dartValue(d), 0);
  const rest = cur !== null ? state.scores[cur] - pendingSum : 0;
  const suggestion = cur !== null ? checkout(rest, 3 - pending.length, settings.out) : null;
  const lastVisit = state.log.at(-1);
  const legJustEnded = !over && lastVisit?.checkout && state.legsWon.some((l) => l > 0);

  const chooseInput = (m: InputMode) => {
    setInput(m);
    try {
      localStorage.setItem(INPUT_KEY, m);
    } catch {
      // jen se nezapamatuje
    }
  };

  const record = (v: number, extra: { darts?: Dart[]; ok?: boolean } = {}) =>
    update((g) => (cur === null ? g : { ...g, pending: [], turns: [...g.turns, { p: cur, v, ...extra }] }));

  /** Další šipka: nához se zapíše sám po třetí šipce, po přehozu nebo po zavření. */
  const throwDart = (d: Dart) => {
    if (cur === null) return;
    const darts = [...pending, d];
    const sum = darts.reduce((s, x) => s + dartValue(x), 0);
    const left = state.scores[cur] - sum;
    const done = darts.length === 3 || left <= 0 || (settings.out !== "straight" && left === 1);
    if (done) record(sum, { darts });
    else update((g) => ({ ...g, pending: darts }));
  };

  const undo = () =>
    update((g) => (g.pending?.length ? { ...g, pending: g.pending.slice(0, -1) } : { ...g, pending: [], turns: g.turns.slice(0, -1) }));

  const save = (g: ActiveDarts) => {
    add.mutate({
      id: crypto.randomUUID(), kind: "sipky", settings: g.settings, players: g.players, turns: g.turns,
      winner: state.winner, started_at: g.started_at, finished_at: new Date().toISOString(),
    });
  };
  const rematch = () => {
    save(active);
    // v odvetě začíná další hráč v pořadí
    start({ started_at: new Date().toISOString(), settings, players: [...players.slice(1), players[0]], turns: [] });
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

  return (
    <div className="screen module sc-play" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <Topbar title={over ? "Konec hry" : settings.legs > 1 ? `Leg ${state.leg + 1}` : "Šipky"} back="/m/skore" right={<span className="game-mode">{settingsLabel(settings)}</span>} />

      {over && state.winner !== null && (
        <div className="panel win-panel" style={{ "--team": playerColor(state.winner) } as CSSProperties}>
          <Burst trigger={1} text="Game shot!" />
          <span className="bag big" style={{ background: playerColor(state.winner) }} aria-hidden="true" />
          <h2>Vyhrává {players[state.winner]}</h2>
          {lastVisit?.checkout && <p className="small muted">zavřel {lastVisit.v}{lastVisit.darts ? ` (${lastVisit.darts.map(dartLabel).join(" · ")})` : ""}</p>}
          <button className="btn-hero" onClick={rematch}>Uložit a odveta</button>
          <button className="btn tap wide" onClick={done}>Uložit a konec</button>
          <button className="link" onClick={undo}>Vrátit poslední nához</button>
        </div>
      )}

      <ul className="sc-board">
        {(over ? order : players.map((_, i) => i)).map((p) => (
          <PlayerRow key={p} index={p} name={players[p]} state={state} legs={settings.legs} on={!over && cur === p} out={settings.out} />
        ))}
      </ul>

      {!over && cur !== null && (
        <div className="panel sc-input">
          {legJustEnded && lastVisit && <p className="sc-leg-won">Leg pro {players[lastVisit.p]}! Další leg začíná {players[cur]}.</p>}
          <p className="sc-turn">Hází <b>{players[cur]}</b> · zbývá {rest}</p>
          {suggestion && <p className="sc-checkout">Na zavření <b>{checkoutText(suggestion)}</b></p>}
          {!suggestion && rest <= 170 && rest > 1 && <p className="sc-checkout dim">Tohle se teď zavřít nedá, nahraj si.</p>}

          <div className="seg seg-wide sc-mode" role="group" aria-label="Zadávání">
            <button className={`seg-btn${input === "sipky" ? " on" : ""}`} aria-pressed={input === "sipky"} onClick={() => chooseInput("sipky")}>Po šipkách</button>
            <button className={`seg-btn${input === "soucet" ? " on" : ""}`} aria-pressed={input === "soucet"} onClick={() => chooseInput("soucet")} disabled={pending.length > 0}>Součtem</button>
          </div>

          {input === "sipky" || pending.length > 0 ? (
            <DartPad pending={pending} onDart={throwDart} />
          ) : (
            <TotalPad key={turns.length} remaining={state.scores[cur]} out={settings.out} onSubmit={record} />
          )}

          <div className="sc-actions">
            <button className="btn tap" disabled={!turns.length && !pending.length} onClick={undo}><Sprite name="i-back" size={20} /> {pending.length ? "Vrátit šipku" : "Vrátit nához"}</button>
          </div>
        </div>
      )}

      <VisitLog players={players} log={state.log} />

      {!over && <button className="link sc-cancel" onClick={cancel}>Zrušit hru bez uložení</button>}
    </div>
  );
}

function PlayerRow({ index, name, state, legs, on, out }: { index: number; name: string; state: DartState; legs: number; on: boolean; out: ActiveDarts["settings"]["out"] }) {
  const avg = average(state, index);
  const left = state.scores[index];
  const route = state.winner === null && left <= 170 ? checkout(left, 3, out) : null;
  return (
    <li className={`sc-row${on ? " on" : ""}${state.winner === index ? " won" : ""}`} style={{ "--team": playerColor(index) } as CSSProperties}>
      <span className="bag small" style={{ background: playerColor(index) }} aria-hidden="true" />
      <span className="grow">
        <b>{name}</b>
        {legs > 1 && (
          <span className="sc-legs" aria-label={`${state.legsWon[index]} z ${legs} legů`}>
            {Array.from({ length: legs }, (_, i) => <i key={i} className={i < state.legsWon[index] ? "full" : ""} />)}
          </span>
        )}
        <span className="small muted">{avg !== null ? `průměr ${String(avg).replace(".", ",")}` : "zatím neházel"}</span>
        {route && !on && <span className="sc-route">{checkoutText(route)}</span>}
      </span>
      <span className="sc-score">{left}</span>
    </li>
  );
}

/** Zadávání po šipkách: double / triple, číslo, 25, vedle. */
function DartPad({ pending, onDart }: { pending: Dart[]; onDart: (d: Dart) => void }) {
  const [mult, setMult] = useState<"S" | "D" | "T">("S");
  const hit = (n: number) => {
    onDart(`${mult}${n}`);
    setMult("S");
  };
  const sum = pending.reduce((s, d) => s + dartValue(d), 0);
  return (
    <>
      <div className="sc-darts" aria-live="polite">
        {[0, 1, 2].map((i) => <span key={i} className={`sc-dart${pending[i] ? " set" : ""}`}>{pending[i] ? dartLabel(pending[i]) : `${i + 1}.`}</span>)}
        <span className="sc-dart-sum">= {sum}</span>
      </div>
      <div className="sc-mult" role="group" aria-label="Násobek">
        <button className={`sc-key${mult === "D" ? " on" : ""}`} aria-pressed={mult === "D"} onClick={() => setMult((m) => (m === "D" ? "S" : "D"))}>Double</button>
        <button className={`sc-key${mult === "T" ? " on" : ""}`} aria-pressed={mult === "T"} onClick={() => setMult((m) => (m === "T" ? "S" : "T"))}>Triple</button>
      </div>
      <div className="sc-grid numbers">
        {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
          <button key={n} className="sc-key" onClick={() => hit(n)}>{n}</button>
        ))}
      </div>
      <div className="sc-grid extras">
        <button className="sc-key" disabled={mult === "T"} onClick={() => { onDart(mult === "D" ? "DB" : "SB"); setMult("S"); }}>{mult === "D" ? "Bull" : "25"}</button>
        <button className="sc-key miss" onClick={() => { onDart("M"); setMult("S"); }}>Vedle</button>
      </div>
    </>
  );
}

/** Zadávání součtem náhozu; když by zavřel, zeptá se, jestli správně (double / master). */
function TotalPad({ remaining, out, onSubmit }: { remaining: number; out: ActiveDarts["settings"]["out"]; onSubmit: (v: number, extra?: { ok?: boolean }) => void }) {
  const [digits, setDigits] = useState("");
  const [confirm, setConfirm] = useState<number | null>(null);
  const value = Number(digits || 0);
  const valid = possibleVisit(value);
  const press = (d: string) => setDigits((s) => (s === "0" ? d : (s + d).slice(0, 3)));
  const submit = (v: number) => {
    if (out !== "straight" && v === remaining) setConfirm(v);
    else onSubmit(v);
  };

  if (confirm !== null) {
    return (
      <div className="sc-confirm">
        <p>Dojde na nulu. Byla poslední šipka {out === "double" ? "double nebo bull" : "double, triple nebo bull"}?</p>
        <button className="btn-hero" onClick={() => onSubmit(confirm, { ok: true })}>Ano, zavřel</button>
        <button className="btn tap wide" onClick={() => onSubmit(confirm, { ok: false })}>Ne, přehoz</button>
        <button className="link" onClick={() => setConfirm(null)}>Zpět</button>
      </div>
    );
  }

  return (
    <>
      <div className={`sc-display${digits && !valid ? " bad" : ""}`} aria-live="polite">{digits || "0"}</div>
      <div className="sc-quick">
        {QUICK.map((q) => <button key={q} className="chip" onClick={() => submit(q)}>{q}</button>)}
      </div>
      <div className="sc-grid keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => <button key={d} className="sc-key" onClick={() => press(d)}>{d}</button>)}
        <button className="sc-key" aria-label="Smazat vše" onClick={() => setDigits("")}>C</button>
        <button className="sc-key" onClick={() => press("0")}>0</button>
        <button className="sc-key" aria-label="Smazat číslici" onClick={() => setDigits((s) => s.slice(0, -1))}>⌫</button>
      </div>
      <button className="btn-hero" disabled={!valid} onClick={() => submit(value)}>
        {valid ? `Zapsat ${digits || "0"}` : "Tolik hodit nejde"}
      </button>
    </>
  );
}

function VisitLog({ players, log }: { players: string[]; log: VisitInfo[] }) {
  if (!log.length) return null;
  return (
    <div className="panel sc-log-panel">
      <h3>Poslední náhozy</h3>
      <ol className="sc-log">
        {log.slice(-12).reverse().map((t, i) => (
          <li key={log.length - i}>
            <span className="bag small" style={{ background: playerColor(t.p) }} aria-hidden="true" />
            <span className="grow">{players[t.p]}{t.darts ? <span className="small muted"> {t.darts.map(dartLabel).join(" · ")}</span> : null}</span>
            <b>{t.v}</b>
            <span className={`small sc-after${t.checkout ? " win" : t.bust ? " bust" : " muted"}`}>
              {t.bust ? "přehoz" : t.checkout ? "zavřel!" : `→ ${t.after}`}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
