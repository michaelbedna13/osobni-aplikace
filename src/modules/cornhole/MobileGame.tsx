import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Burst } from "../../components/Burst";
import { Sheet } from "../../components/Sheet";
import { Sprite } from "../../components/Sprite";
import { Topbar } from "../../components/Topbar";
import { MODULE_BY_KEY } from "../../lib/modules";
import { playTone, unlockAudio } from "../../lib/sound";
import { usePeople } from "../lide/data";
import { TEAM_COLORS, useTeams } from "./data";
import {
  addResult, headToHead, loadMatch, loadResults, loadSetup, modeOf, newMatch, nextStarter, rollWind, saveMatch, saveSetup, windForce,
  type MobileMatch, type MobileSetup,
} from "./mobile";
import { drawScene, makeView, type View } from "./render";
import { MODE_HINTS, MODE_NAMES, rawPoints, roundScores, standings, totals, winnerOf, type Mode } from "./scoring";
import { BAGS_EACH, MAX_PLAYERS, countRound, launch, settled, step, throwerAt, throwsFor, type Bag, type Player, type SimEvent } from "./sim";

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
          onRematch={(m, loser) => start({ names: m.names, colors: m.colors, mode: modeOf(m), target: m.target, wind: m.wind }, loser)}
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
  const wins = headToHead(results, setup.names);
  const count = setup.names.length;

  // při přechodu mezi dvěma a třemi hráči se přepne i počítání (pak si ho jde zvolit ručně)
  const withCount = (s: MobileSetup, names: string[], colors: string[]): MobileSetup => {
    const mode = names.length >= 3 && s.names.length === 2 ? "soucet" : names.length === 2 && s.names.length >= 3 ? "rozdil" : s.mode;
    return { ...s, names, colors, mode };
  };
  const addPlayer = () => setSetup((s) => withCount(s, [...s.names, `Hráč ${s.names.length + 1}`], [...s.colors, TEAM_COLORS.find((c) => !s.colors.includes(c)) ?? TEAM_COLORS[0]]));
  const removePlayer = (p: Player) => setSetup((s) => withCount(s, s.names.filter((_, i) => i !== p), s.colors.filter((_, i) => i !== p)));

  return (
    <>
      <Topbar title="Cornhole v mobilu" back="/m/cornhole" />
      <p className="hero-line ch-intro">Jeden telefon, 2 až {MAX_PLAYERS} hráčů. Házíte dokola, každý má 4 pytlíky na kolo.</p>

      <div className="ch-duel">
        {setup.names.map((name, p) => (
          <button key={p} className="ch-slot" style={{ "--team": setup.colors[p] } as CSSProperties} onClick={() => setEditing(p)}>
            <span className="bag big" style={{ background: setup.colors[p] }} aria-hidden="true" />
            <b>{name}</b>
            <span className="small muted">změnit</span>
          </button>
        ))}
        {count === 2 && <span className="ch-vs" aria-hidden="true">vs</span>}
      </div>
      {count < MAX_PLAYERS && (
        <button className="btn tap wide" onClick={addPlayer}><Sprite name="i-plus" size={20} /> Přidat hráče</button>
      )}
      {wins.some((w) => w > 0) && (
        <p className="ch-h2h">
          {count === 2 ? <>Vzájemně <b>{wins[0]} : {wins[1]}</b></> : <>Výhry v téhle partě: {setup.names.map((n, i) => `${n} ${wins[i]}`).join(" · ")}</>}
        </p>
      )}

      <span className="field-label">Počítání bodů</span>
      <div className="seg seg-wide" role="group" aria-label="Počítání bodů">
        {(["rozdil", "soucet"] as Mode[]).map((m) => (
          <button key={m} className={`seg-btn${setup.mode === m ? " on" : ""}`} aria-pressed={setup.mode === m} onClick={() => setSetup((s) => ({ ...s, mode: m }))}>{MODE_NAMES[m]}</button>
        ))}
      </div>
      <p className="small muted mode-hint">{MODE_HINTS[setup.mode]}</p>
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
          <li>Deska 1 bod, díra 3 body. {setup.mode === "rozdil" ? "Body se v kole ruší, připíše si je jen nejlepší." : "Každý si přičte, co hodil."}</li>
          <li>Pytlíky na desce můžeš trefit a shodit, nebo dorazit do díry.</li>
        </ul>
      </div>

      <button className="btn-hero" onClick={() => onStart(setup)}>Hrát</button>

      {editing !== null && (
        <PlayerSheet
          setup={setup}
          player={editing}
          onClose={() => setEditing(null)}
          onRemove={count > 2 ? () => removePlayer(editing) : undefined}
          onSave={(name, color) => setSetup((s) => ({
            ...s,
            names: s.names.map((n, i) => (i === editing ? name : n)),
            colors: s.colors.map((c, i) => (i === editing ? color : c)),
          }))}
        />
      )}
    </>
  );
}

function PlayerSheet({ setup, player, onClose, onSave, onRemove }: {
  setup: MobileSetup;
  player: Player;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
  onRemove?: () => void;
}) {
  const [name, setName] = useState(setup.names[player]);
  const [color, setColor] = useState(setup.colors[player]);
  const { data: teams = [] } = useTeams();
  const { data: people = [] } = usePeople();
  const taken = setup.colors.filter((_, i) => i !== player);
  const suggestions = useMemo(() => {
    const others = setup.names.filter((_, i) => i !== player);
    const names = new Set([...teams.flatMap((t) => t.players), ...people.map((p) => p.name)]);
    return [...names].filter((n) => !others.includes(n)).sort((x, y) => x.localeCompare(y, "cs")).slice(0, 16);
  }, [teams, people, setup.names, player]);

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
        {TEAM_COLORS.filter((c) => !taken.includes(c)).map((c) => (
          <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c} className={`swatch${color === c ? " on" : ""}`} style={{ background: c }} onClick={() => setColor(c)} />
        ))}
      </div>
      <button className="btn dark tap wide" onClick={() => save()}>Hotovo</button>
      {onRemove && <button className="btn tap wide" onClick={() => { onRemove(); onClose(); }}>Odebrat hráče</button>}
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
  winnerOf(m.rounds, modeOf(m), m.names.length, m.target) !== null ? "over" : m.thrown >= throwsFor(m.names.length) ? "round" : "aim";

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

  const n = game.names.length;
  const mode = modeOf(game);
  const scores = totals(game.rounds, mode, n);
  const winner = winnerOf(game.rounds, mode, n, game.target);
  const thrower = throwerAt(Math.min(game.thrown, throwsFor(n) - 1), game.starter, n);
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
    const count = g.names.length;
    const thrown = g.thrown + 1;
    if (thrown < throwsFor(count)) {
      commit({ ...g, bags, thrown }, "aim");
      return;
    }
    const rounds = [...g.rounds, countRound(bags, count)];
    const next = { ...g, bags, thrown, rounds };
    const win = winnerOf(rounds, modeOf(g), count, g.target);
    if (win !== null) addResult({ date: new Date().toISOString(), names: g.names, scores: totals(rounds, modeOf(g), count), winner: win });
    commit(next, win !== null ? "over" : "round");
  };
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;

  const nextRound = () => {
    const g = gameRef.current;
    bagsRef.current = [];
    // začíná ten, kdo byl v kole nejlepší
    const starter = nextStarter(g.rounds[g.rounds.length - 1], modeOf(g), g.starter);
    commit({ ...g, bags: [], thrown: 0, starter, windLevel: rollWind(g.wind) }, "aim");
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
      const count = g.names.length;
      const p = throwerAt(Math.min(g.thrown, throwsFor(count) - 1), g.starter, count);
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
    const p = throwerAt(g.thrown, g.starter, g.names.length);
    bagsRef.current = [...bagsRef.current, launch(p, m.power, m.aim)];
    const lastPower = g.names.map((_, i) => g.lastPower[i] ?? null);
    lastPower[p] = m.power;
    setGame({ ...g, lastPower });
    setPhase("flight");
  };
  const cancel = () => {
    startRef.current = null;
    setDrag(null);
  };

  const wind = game.windLevel;
  const ghost = game.lastPower[thrower] ?? null;
  const order = standings(scores);
  const last = order[order.length - 1];

  return (
    <>
      <Topbar title={phase === "over" ? "Konec hry" : `Kolo ${game.rounds.length + (phase === "round" ? 0 : 1)}`} back="/m/cornhole" right={<span className="game-mode">{MODE_NAMES[mode]} do {game.target}</span>} />

      <div className={`ch-board-score${n > 2 ? " many" : ""}`} style={{ "--cols": n === 4 ? 4 : Math.min(n, 3) } as CSSProperties}>
        {game.names.map((_, p) => (
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
            {n === 2 ? <p className="ch-final">{scores[0]} : {scores[1]}</p> : (
              <ol className="ch-round ch-standings">
                {order.map((p, i) => (
                  <li key={p}>
                    <span className="rank">{i + 1}.</span>
                    <span className="bag small" style={{ background: game.colors[p] }} aria-hidden="true" />
                    <span className="grow">{game.names[p]}</span>
                    <b>{scores[p]}</b>
                  </li>
                ))}
              </ol>
            )}
            {n === 2 && lastRound && <RoundLine game={game} round={lastRound} />}
            <button className="btn-hero" onClick={() => onRematch(game, last)}>Odveta</button>
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
  const gained = roundScores(round, modeOf(game));
  return (
    <ul className="ch-round">
      {game.names.map((_, p) => (
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
