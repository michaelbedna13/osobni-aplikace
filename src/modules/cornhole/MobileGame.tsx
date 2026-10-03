import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Burst } from "../../components/Burst";
import { Sheet } from "../../components/Sheet";
import { Topbar } from "../../components/Topbar";
import { MODULE_BY_KEY } from "../../lib/modules";
import { playTone, unlockAudio } from "../../lib/sound";
import { usePeople } from "../lide/data";
import { TEAM_COLORS, useTeams } from "./data";
import {
  addResult, headToHead, loadMatch, loadResults, loadSetup, newMatch, rollWind, saveMatch, saveSetup, windForce,
  type MobileMatch, type MobileSetup,
} from "./mobile";
import { drawScene, makeView, type View } from "./render";
import { rawPoints, roundScores, totals, winnerOf } from "./scoring";
import { BAGS_EACH, THROWS, countRound, launch, settled, step, throwerAt, type Bag, type Player, type SimEvent } from "./sim";

const MODULE = MODULE_BY_KEY.cornhole;
const DT = 1 / 120;
const MIN_POWER = 0.06;

type Phase = "aim" | "flight" | "round" | "over";

export function MobileGameScreen() {
  const [match, setMatch] = useState<MobileMatch | null>(loadMatch);

  // obrazovka hry patří jen hře: bez spodní lišty
  useEffect(() => {
    document.documentElement.classList.add("focus-mode");
    return () => document.documentElement.classList.remove("focus-mode");
  }, []);

  const start = (setup: MobileSetup, starter: Player = 0) => {
    saveSetup(setup);
    const m = newMatch(setup, starter);
    saveMatch(m);
    setMatch(m);
  };

  return (
    <div className="screen module ch-mobile" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      {match ? (
        <Play
          key={match.started_at}
          initial={match}
          onRematch={(m, loser) => start({ names: m.names, colors: m.colors, target: m.target, wind: m.wind }, loser)}
          onQuit={() => { saveMatch(null); setMatch(null); }}
        />
      ) : (
        <Setup onStart={start} />
      )}
    </div>
  );
}

/* ---------- nastavení hry ---------- */

function Setup({ onStart }: { onStart: (s: MobileSetup) => void }) {
  const [setup, setSetup] = useState<MobileSetup>(loadSetup);
  const [editing, setEditing] = useState<Player | null>(null);
  const results = useMemo(loadResults, []);
  const [a, b] = headToHead(results, setup.names);

  return (
    <>
      <Topbar title="Cornhole v mobilu" back="/m/cornhole" />
      <p className="hero-line ch-intro">Dva hráči, jeden telefon. Házíte střídavě, každý má 4 pytlíky na kolo.</p>

      <div className="ch-duel">
        {([0, 1] as Player[]).map((p) => (
          <button key={p} className="ch-slot" style={{ "--team": setup.colors[p] } as CSSProperties} onClick={() => setEditing(p)}>
            <span className="bag big" style={{ background: setup.colors[p] }} aria-hidden="true" />
            <b>{setup.names[p]}</b>
            <span className="small muted">změnit</span>
          </button>
        ))}
        <span className="ch-vs" aria-hidden="true">vs</span>
      </div>
      {a + b > 0 && <p className="ch-h2h">Vzájemně <b>{a} : {b}</b></p>}

      <span className="field-label">Hraje se do</span>
      <div className="seg seg-wide" role="group" aria-label="Hraje se do">
        {[11, 21].map((t) => (
          <button key={t} className={`seg-btn${setup.target === t ? " on" : ""}`} aria-pressed={setup.target === t} onClick={() => setSetup((s) => ({ ...s, target: t }))}>{t} bodů</button>
        ))}
      </div>
      <span className="field-label">Vítr</span>
      <div className="seg seg-wide" role="group" aria-label="Vítr">
        {[true, false].map((w) => (
          <button key={String(w)} className={`seg-btn${setup.wind === w ? " on" : ""}`} aria-pressed={setup.wind === w} onClick={() => setSetup((s) => ({ ...s, wind: w }))}>{w ? "Fouká" : "Bezvětří"}</button>
        ))}
      </div>

      <div className="panel ch-rules">
        <h3>Jak se hází</h3>
        <ul>
          <li>Polož prst kamkoli na hřiště, <b>táhni dolů</b> a pusť. Čím dál táhneš, tím silnější hod.</li>
          <li>Míříš opačně, jako prakem: táhni doleva a pytlík poletí doprava.</li>
          <li>Deska 1 bod, díra 3 body. Body se v kole ruší, připíše si je jen lepší z vás.</li>
          <li>Pytlíky na desce můžeš trefit a shodit, nebo dorazit do díry.</li>
        </ul>
      </div>

      <button className="btn-hero" onClick={() => onStart(setup)}>Hrát</button>

      {editing !== null && (
        <PlayerSheet
          setup={setup}
          player={editing}
          onClose={() => setEditing(null)}
          onSave={(name, color) => setSetup((s) => {
            const names = [...s.names] as [string, string];
            const colors = [...s.colors] as [string, string];
            names[editing] = name;
            colors[editing] = color;
            return { ...s, names, colors };
          })}
        />
      )}
    </>
  );
}

function PlayerSheet({ setup, player, onClose, onSave }: { setup: MobileSetup; player: Player; onClose: () => void; onSave: (name: string, color: string) => void }) {
  const [name, setName] = useState(setup.names[player]);
  const [color, setColor] = useState(setup.colors[player]);
  const { data: teams = [] } = useTeams();
  const { data: people = [] } = usePeople();
  const other = setup.names[1 - player];
  const suggestions = useMemo(() => {
    const names = new Set([...teams.flatMap((t) => t.players), ...people.map((p) => p.name)]);
    return [...names].filter((n) => n !== other).sort((x, y) => x.localeCompare(y, "cs")).slice(0, 16);
  }, [teams, people, other]);

  const save = (n = name) => {
    onSave(n.trim() || `Hráč ${player + 1}`, color);
    onClose();
  };

  return (
    <Sheet title={`Hráč ${player + 1}`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); save(); }}>
        <label htmlFor="ch-player" className="field-label">Jméno</label>
        <input id="ch-player" className="input" maxLength={24} value={name} onChange={(e) => setName(e.target.value)} />
      </form>
      {suggestions.length > 0 && (
        <div className="chips">
          {suggestions.map((s) => <button key={s} type="button" className={`chip${s === name ? " on" : ""}`} onClick={() => setName(s)}>{s}</button>)}
        </div>
      )}
      <span className="field-label">Barva pytlíků</span>
      <div className="swatches" role="radiogroup" aria-label="Barva">
        {TEAM_COLORS.filter((c) => c !== setup.colors[1 - player]).map((c) => (
          <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c} className={`swatch${color === c ? " on" : ""}`} style={{ background: c }} onClick={() => setColor(c)} />
        ))}
      </div>
      <button className="btn dark tap wide" onClick={() => save()}>Hotovo</button>
    </Sheet>
  );
}

/* ---------- samotná hra ---------- */

const sounds: Record<SimEvent, () => void> = {
  board: () => playTone(170, 0.12, 0.18),
  ground: () => playTone(95, 0.1, 0.12),
  hit: () => playTone(260, 0.07, 0.12),
  hole: () => {
    playTone(523, 0.18, 0.12);
    window.setTimeout(() => playTone(784, 0.3, 0.12), 120);
  },
};

const phaseOf = (m: MobileMatch): Phase =>
  winnerOf(m.rounds, "rozdil", 2, m.target) !== null ? "over" : m.thrown >= THROWS ? "round" : "aim";

function Play({ initial, onRematch, onQuit }: { initial: MobileMatch; onRematch: (m: MobileMatch, loser: Player) => void; onQuit: () => void }) {
  const navigate = useNavigate();
  const [game, setGame] = useState(initial);
  const [phase, setPhase] = useState<Phase>(() => phaseOf(initial));
  const [drag, setDrag] = useState<{ power: number; aim: number } | null>(null);
  const [holes, setHoles] = useState(0);

  const arenaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<View | null>(null);
  const bagsRef = useRef<Bag[]>(structuredClone(initial.bags));
  const gameRef = useRef(game);
  const phaseRef = useRef(phase);
  const dragRef = useRef(drag);
  const startRef = useRef<{ x: number; y: number; max: number } | null>(null);
  gameRef.current = game;
  phaseRef.current = phase;
  dragRef.current = drag;

  const scores = totals(game.rounds, "rozdil", 2);
  const winner = winnerOf(game.rounds, "rozdil", 2, game.target);
  const thrower = throwerAt(Math.min(game.thrown, THROWS - 1), game.starter);
  const left = (p: Player) => BAGS_EACH - game.bags.filter((b) => b.owner === p).length - (phase === "flight" && thrower === p ? 1 : 0);
  const lastRound = game.rounds.at(-1);

  const commit = (next: MobileMatch, nextPhase: Phase) => {
    setGame(next);
    setPhase(nextPhase);
    saveMatch(nextPhase === "over" ? null : next);
  };

  // všechno dopadlo: zapsat hod, případně uzavřít kolo
  const onSettled = () => {
    const g = gameRef.current;
    const bags = structuredClone(bagsRef.current);
    const thrown = g.thrown + 1;
    if (thrown < THROWS) {
      commit({ ...g, bags, thrown }, "aim");
      return;
    }
    const rounds = [...g.rounds, countRound(bags)];
    const next = { ...g, bags, thrown, rounds };
    const win = winnerOf(rounds, "rozdil", 2, g.target);
    if (win !== null) {
      const final = totals(rounds, "rozdil", 2) as [number, number];
      addResult({ date: new Date().toISOString(), names: g.names, scores: final, winner: win as Player });
    }
    commit(next, win !== null ? "over" : "round");
  };
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;

  const nextRound = () => {
    const g = gameRef.current;
    const gained = roundScores(g.rounds[g.rounds.length - 1], "rozdil");
    const scorer = gained.findIndex((v) => v > 0);
    bagsRef.current = [];
    // začíná ten, kdo v kole bodoval
    commit({ ...g, bags: [], thrown: 0, starter: scorer >= 0 ? (scorer as Player) : g.starter, windLevel: rollWind(g.wind) }, "aim");
  };

  // velikost plátna: 1 herní pixel = 2 body obrazovky
  useEffect(() => {
    const arena = arenaRef.current;
    const canvas = canvasRef.current;
    if (!arena || !canvas) return;
    const fit = () => {
      const W = Math.max(120, Math.floor(arena.clientWidth / 2));
      const H = Math.max(160, Math.floor(arena.clientHeight / 2));
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = `${W * 2}px`;
      canvas.style.height = `${H * 2}px`;
      viewRef.current = makeView(W, H);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(arena);
    return () => ro.disconnect();
  }, []);

  // herní smyčka: fyzika v pevném kroku, kreslení každý snímek
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let waiting = false;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = gameRef.current;
      if (phaseRef.current === "flight" && !waiting) {
        acc += dt;
        const heard = new Set<SimEvent>();
        while (acc >= DT) {
          for (const e of step(bagsRef.current, DT, windForce(g.windLevel))) heard.add(e);
          acc -= DT;
        }
        heard.forEach((e) => sounds[e]());
        if (heard.has("hole")) setHoles((v) => v + 1);
        if (settled(bagsRef.current)) {
          waiting = true;
          window.setTimeout(() => {
            waiting = false;
            acc = 0;
            settledRef.current();
          }, 550);
        }
      }
      const canvas = canvasRef.current;
      const view = viewRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !view) return;
      const d = dragRef.current;
      const p = throwerAt(Math.min(g.thrown, THROWS - 1), g.starter);
      drawScene(ctx, view, bagsRef.current, g.colors, now / 1000, phaseRef.current === "aim" && d ? { ...d, color: g.colors[p] } : null);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ovládání prakem: táhni dolů a pusť */
  const measure = (e: ReactPointerEvent) => {
    const s = startRef.current;
    if (!s) return null;
    const power = Math.min(1, Math.max(0, (e.clientY - s.y) / s.max));
    const aim = Math.min(1, Math.max(-1, -(e.clientX - s.x) / (s.max * 0.6)));
    return { power, aim };
  };

  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (phase !== "aim") return;
    unlockAudio();
    e.currentTarget.setPointerCapture(e.pointerId);
    const h = arenaRef.current?.clientHeight ?? 500;
    startRef.current = { x: e.clientX, y: e.clientY, max: Math.min(280, Math.max(150, h * 0.42)) };
    setDrag({ power: 0, aim: 0 });
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const m = measure(e);
    if (m) setDrag(m);
  };
  const up = (e: ReactPointerEvent<HTMLDivElement>) => {
    const m = measure(e);
    startRef.current = null;
    setDrag(null);
    if (!m || m.power < MIN_POWER || phaseRef.current !== "aim") return;
    const g = gameRef.current;
    const p = throwerAt(g.thrown, g.starter);
    bagsRef.current = [...bagsRef.current, launch(p, m.power, m.aim)];
    const lastPower = [...g.lastPower] as MobileMatch["lastPower"];
    lastPower[p] = m.power;
    setGame({ ...g, lastPower });
    setPhase("flight");
  };
  const cancel = () => {
    startRef.current = null;
    setDrag(null);
  };

  const wind = game.windLevel;
  const ghost = game.lastPower[thrower];

  return (
    <>
      <Topbar title={phase === "over" ? "Konec hry" : `Kolo ${game.rounds.length + (phase === "round" ? 0 : 1)}`} back="/m/cornhole" right={<span className="game-mode">do {game.target}</span>} />

      <div className="ch-board-score">
        {([0, 1] as Player[]).map((p) => (
          <div key={p} className={`ch-player${phase !== "over" && phase !== "round" && thrower === p ? " on" : ""}${winner === p ? " won" : ""}`} style={{ "--team": game.colors[p] } as CSSProperties}>
            <span className="ch-name"><span className="bag small" style={{ background: game.colors[p] }} aria-hidden="true" />{game.names[p]}</span>
            <span className="ch-points">{scores[p]}</span>
            <span className="ch-pips" aria-label={`${left(p)} pytlíky v ruce`}>
              {Array.from({ length: BAGS_EACH }, (_, i) => <i key={i} className={i < left(p) ? "full" : ""} />)}
            </span>
          </div>
        ))}
      </div>

      <div
        ref={arenaRef}
        className="ch-arena"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={cancel}
        role="application"
        aria-label="Hřiště. Táhni prstem dolů a pusť."
      >
        <canvas ref={canvasRef} aria-hidden="true" />
        <span className="ch-wind" aria-label={wind === 0 ? "Bezvětří" : `Vítr ${Math.abs(wind)} ${wind < 0 ? "doleva" : "doprava"}`}>
          {wind === 0 ? "bezvětří" : `${wind < 0 ? "←".repeat(-wind) : ""} vítr ${Math.abs(wind)} ${wind > 0 ? "→".repeat(wind) : ""}`}
        </span>
        {phase === "aim" && (
          <span className="ch-power" aria-hidden="true">
            <span className="ch-power-fill" style={{ height: `${(drag?.power ?? 0) * 100}%`, background: game.colors[thrower] }} />
            {ghost !== null && <span className="ch-power-ghost" style={{ bottom: `${ghost * 100}%` }} />}
          </span>
        )}
        {phase === "aim" && !drag && (
          <span className="ch-hint" style={{ "--team": game.colors[thrower] } as CSSProperties}>
            <b>{game.names[thrower]}</b> · táhni dolů a pusť
          </span>
        )}
        <Burst trigger={holes} text="Díra!" />

        {phase === "round" && lastRound && (
          <div className="ch-overlay panel">
            <h2>Kolo {game.rounds.length}</h2>
            <RoundLine game={game} round={lastRound} />
            <button className="btn-hero" onClick={nextRound}>Další kolo</button>
          </div>
        )}
        {phase === "over" && winner !== null && (
          <div className="ch-overlay panel win-panel" style={{ "--team": game.colors[winner] } as CSSProperties}>
            <Burst trigger={1} text="Výhra!" />
            <span className="bag big" style={{ background: game.colors[winner] }} aria-hidden="true" />
            <h2>Vyhrává {game.names[winner]}</h2>
            <p className="ch-final">{scores[0]} : {scores[1]}</p>
            {lastRound && <RoundLine game={game} round={lastRound} />}
            <button className="btn-hero" onClick={() => onRematch(game, (1 - winner) as Player)}>Odveta</button>
            <button className="btn tap wide" onClick={() => { onQuit(); navigate("/m/cornhole"); }}>Hotovo</button>
          </div>
        )}
      </div>

      {phase !== "over" && (
        <button className="link ch-quit" onClick={() => { if (window.confirm("Ukončit rozehranou hru?")) onQuit(); }}>Ukončit hru</button>
      )}
    </>
  );
}

function RoundLine({ game, round }: { game: MobileMatch; round: MobileMatch["rounds"][number] }) {
  const gained = roundScores(round, "rozdil");
  return (
    <ul className="ch-round">
      {([0, 1] as Player[]).map((p) => (
        <li key={p}>
          <span className="bag small" style={{ background: game.colors[p] }} aria-hidden="true" />
          <span className="grow">{game.names[p]}</span>
          <span className="small muted">{round[p].hole ? `${round[p].hole}× díra` : ""}{round[p].hole && round[p].board ? ", " : ""}{round[p].board ? `${round[p].board}× deska` : ""}{!round[p].hole && !round[p].board ? "nic" : ""}</span>
          <b>{rawPoints(round[p])}</b>
          {gained[p] > 0 && <span className="ch-gain">+{gained[p]}</span>}
        </li>
      ))}
    </ul>
  );
}
