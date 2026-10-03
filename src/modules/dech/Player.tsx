import { useEffect, useRef, useState, type CSSProperties } from "react";
import { playGong, playTone } from "../../lib/sound";
import { useWakeLock } from "../../lib/wakeLock";
import { PHASE_NAMES, cycleSeconds, phaseAt, type BreathExercise, type PhaseKind } from "./exercises";

const TONES: Record<PhaseKind, number> = { nadech: 660, zadrz: 550, vydech: 440, "zadrz-prazdno": 495 };
/** Velikost „dechové kostky“ na konci fáze (0–1). */
const SIZE_AFTER: Record<PhaseKind, number | null> = { nadech: 1, vydech: 0.4, zadrz: null, "zadrz-prazdno": null };

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export interface Result { duration_s: number; cycles: number; holds: number[] }

function useNow(running: boolean, ms = 100) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [running, ms]);
  return now;
}

/** Kostka, která se při nádechu zvětšuje a při výdechu zmenšuje (v pixelových krocích). */
function Orb({ size, seconds, kind, children }: { size: number; seconds: number; kind: PhaseKind; children?: React.ReactNode }) {
  return (
    <div className="orb-wrap">
      <div className={`orb orb-${kind}`} style={{ "--s": size, "--t": `${seconds}s`, "--steps": Math.max(1, Math.round(seconds * 6)) } as CSSProperties} />
      <div className="orb-label">{children}</div>
    </div>
  );
}

/** Rytmická cvičení (krabice, 4-7-8, rezonance…). */
export function RhythmPlayer({ exercise, minutes, onDone, onCancel }: { exercise: BreathExercise; minutes: number; onDone: (r: Result) => void; onCancel: () => void }) {
  const [start] = useState(() => Date.now());
  const total = minutes * 60;
  const now = useNow(true);
  const elapsed = (now - start) / 1000;
  const at = phaseAt(exercise, Math.min(elapsed, total));
  const lastPhase = useRef(-1);
  const done = useRef(false);
  useWakeLock(true);

  // zvuk při změně fáze
  const key = at.cycle * 100 + at.index;
  useEffect(() => {
    if (lastPhase.current === key) return;
    lastPhase.current = key;
    playTone(TONES[at.phase.kind]);
  }, [key, at.phase.kind]);

  // konec až po dokončení celého cyklu
  const cycles = Math.max(1, Math.round(total / cycleSeconds(exercise)));
  const end = cycles * cycleSeconds(exercise);
  useEffect(() => {
    if (done.current || elapsed < end) return;
    done.current = true;
    playGong();
    onDone({ duration_s: Math.round(end), cycles, holds: [] });
  }, [elapsed, end, cycles, onDone]);

  // velikost: u zadržení zůstává poslední
  let size = 0.4;
  for (let i = 0; i <= at.index; i++) {
    const s = SIZE_AFTER[exercise.phases[i].kind];
    if (s !== null) size = s;
  }
  if (at.index === 0 && SIZE_AFTER[exercise.phases[0].kind] === null) size = 0.4;

  return (
    <div className="breath-player">
      <p className="breath-ex">{exercise.name}</p>
      <Orb size={size} seconds={at.phase.seconds} kind={at.phase.kind}>
        <b>{Math.ceil(at.left)}</b>
      </Orb>
      <p className="breath-phase" aria-live="polite">{at.phase.label ?? PHASE_NAMES[at.phase.kind]}</p>
      <p className="breath-progress">Cyklus {Math.min(at.cycle + 1, cycles)} / {cycles} · zbývá {clock(Math.max(0, end - elapsed))}</p>
      <div className="breath-bar"><i style={{ width: `${Math.min(100, (elapsed / end) * 100)}%` }} /></div>
      <div className="timer-actions">
        <button className="btn tap" onClick={onCancel}>Zrušit</button>
        <button className="btn dark tap" onClick={() => { done.current = true; onDone({ duration_s: Math.round(elapsed), cycles: at.cycle, holds: [] }); }}>Hotovo</button>
      </div>
    </div>
  );
}

type WimStage = { kind: "dychej"; since: number } | { kind: "zadrz"; since: number } | { kind: "nadech"; since: number };
const BREATHS = 30;
const BREATH_S = 3;
const RECOVERY_S = 15;

/** Wim Hof: 30 nádechů → zadržení na prázdno (stopky) → nádech a 15 s zadržení. */
export function WimHofPlayer({ exercise, rounds, onDone, onCancel }: { exercise: BreathExercise; rounds: number; onDone: (r: Result) => void; onCancel: () => void }) {
  const [startedAt] = useState(() => Date.now());
  const [round, setRound] = useState(1);
  const [stage, setStage] = useState<WimStage>(() => ({ kind: "dychej", since: Date.now() }));
  const [holds, setHolds] = useState<number[]>([]);
  const now = useNow(true);
  const t = (now - stage.since) / 1000;
  const lastBreath = useRef(-1);
  useWakeLock(true);

  const finish = (h: number[]) => { playGong(); onDone({ duration_s: Math.round((Date.now() - startedAt) / 1000), cycles: h.length, holds: h }); };

  // 30 nádechů, pak automaticky zadržení na prázdno
  const breath = Math.floor(t / BREATH_S);
  useEffect(() => {
    if (stage.kind !== "dychej") return;
    if (breath >= BREATHS) { playTone(330, 0.8); setStage({ kind: "zadrz", since: Date.now() }); return; }
    if (lastBreath.current !== breath) { lastBreath.current = breath; playTone(breath === BREATHS - 1 ? 880 : 620, 0.2, 0.05); }
  }, [breath, stage.kind]);

  // 15 s zadržení po nádechu, pak další kolo
  useEffect(() => {
    if (stage.kind !== "nadech" || t < RECOVERY_S) return;
    if (round >= rounds) finish(holds);
    else { setRound((r) => r + 1); lastBreath.current = -1; setStage({ kind: "dychej", since: Date.now() }); }
  }, [t, stage.kind]); // ostatní hodnoty se čtou z aktuálního renderu

  const endHold = () => {
    const h = [...holds, Math.round(t)];
    setHolds(h);
    playTone(660, 0.5);
    setStage({ kind: "nadech", since: Date.now() });
  };

  const inBreath = stage.kind === "dychej" ? (t % BREATH_S) / BREATH_S : 0;
  return (
    <div className="breath-player">
      <p className="breath-ex">{exercise.name} · kolo {round} / {rounds}</p>
      {stage.kind === "dychej" && (
        <>
          <Orb size={inBreath < 0.53 ? 1 : 0.45} seconds={inBreath < 0.53 ? 1.6 : 1.4} kind={inBreath < 0.53 ? "nadech" : "vydech"}><b>{Math.min(breath + 1, BREATHS)}</b></Orb>
          <p className="breath-phase" aria-live="polite">{inBreath < 0.53 ? "Hluboký nádech" : "Pusť to ven"}</p>
          <p className="breath-progress">Nádech {Math.min(breath + 1, BREATHS)} z {BREATHS}</p>
          <button className="link" onClick={() => setStage({ kind: "zadrz", since: Date.now() })}>Přeskočit na zadržení</button>
        </>
      )}
      {stage.kind === "zadrz" && (
        <>
          <Orb size={0.4} seconds={1} kind="zadrz-prazdno"><b>{clock(t)}</b></Orb>
          <p className="breath-phase" aria-live="polite">Vydechni a zadrž na prázdno</p>
          <p className="breath-progress">{holds.length ? `Minulé kolo ${clock(holds[holds.length - 1])}` : "Jak dlouho to jde příjemně"}</p>
          <button className="btn-hero" onClick={endHold}>Nadechnout se</button>
        </>
      )}
      {stage.kind === "nadech" && (
        <>
          <Orb size={1} seconds={1.5} kind="nadech"><b>{Math.max(0, Math.ceil(RECOVERY_S - t))}</b></Orb>
          <p className="breath-phase" aria-live="polite">Nadechni se naplno a zadrž</p>
          <p className="breath-progress">Zadržení: {clock(holds[holds.length - 1] ?? 0)}</p>
        </>
      )}
      {holds.length > 0 && <p className="small muted holds">Kola: {holds.map(clock).join(" · ")}</p>}
      <div className="timer-actions">
        <button className="btn tap" onClick={onCancel}>Zrušit</button>
        <button className="btn dark tap" onClick={() => finish(holds)} disabled={holds.length === 0}>Ukončit</button>
      </div>
    </div>
  );
}
