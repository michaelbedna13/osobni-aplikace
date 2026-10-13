import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/Icon";
import { plural } from "../../lib/format";
import { haptic } from "../../lib/haptic";
import { playSound, playTone, unlockAudio } from "../../lib/sound";
import { soundPrefs } from "../../lib/soundPrefs";
import { finishWork, nextUp, setProgress, skipExercise, startWork, toggleDone, undoLast, type ActiveWorkout } from "./active";
import { formatKg, formatSeconds, lastSetsFor, formatSet, setMode, type SetEntry, type Workout } from "./data";
import type { Exercise } from "./exercises";

/** Příprava před sérií na čas (s). */
const PREP_S = 5;

const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function useNow(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
}

/** Co se má v sérii udělat: „22 kg × 8“, „15 opakování“, „45 s“. */
function targetText(s: SetEntry | undefined, timed: boolean) {
  if (!s) return "";
  if (timed) return s.seconds ? formatSeconds(s.seconds) : "";
  if (s.weight && s.reps) return `${formatKg(s.weight)} × ${s.reps}`;
  if (s.reps) return `${s.reps} ${plural(s.reps, ["opakování", "opakování", "opakování"])}`;
  return s.weight ? formatKg(s.weight) : "";
}

interface Props {
  active: ActiveWorkout;
  update: (fn: (w: ActiveWorkout) => ActiveWorkout) => void;
  byId: Map<string, Exercise>;
  workouts: Workout[];
  restFor: (ex: number) => number;
  onFinish: () => void;
  onEnd: () => void;
  onEdit: () => void;
}

/**
 * Vedený trénink: vždy jen jedna věc přes celou obrazovku. Série → Hotovo → pauza s odpočtem → další série.
 * Série na čas se po pauze rozběhne sama (5 s příprava). Nic se nespouští ručně, nic se tu neupravuje.
 */
export function WorkoutPlayer({ active, update, byId, workouts, restFor, onFinish, onEnd, onEdit }: Props) {
  const now = useNow(200);
  const next = nextUp(active);
  const { done, total } = setProgress(active);
  const work = active.work;
  const restLeft = active.rest_until ? active.rest_until - now : 0;
  const resting = !work && !!active.rest_until && restLeft > 0;
  const preparing = !!work && !!work.starts && now < work.starts;
  const working = !!work && !preparing && now < work.until;

  const exOf = (i: number) => byId.get(active.exercises[i]?.exercise_id);
  const timedAt = (i: number) => setMode(active.exercises[i]?.mode, exOf(i)) === "time";

  // konec série na čas: pípne, odškrtne a spustí pauzu
  useEffect(() => {
    if (!work || now < work.until) return;
    if (now - work.until < 5000) playSound(soundPrefs().restEnd);
    update((w) => finishWork(w, restFor(work.ex)));
  }, [work, now, update, restFor]);

  // konec pauzy
  useEffect(() => {
    if (!active.rest_until || restLeft > 0 || work) return;
    if (restLeft > -5000) playSound(soundPrefs().restEnd);
    update((w) => ({ ...w, rest_until: null }));
  }, [active.rest_until, restLeft, work, update]);

  // série na čas na řadě a nic neběží → sama se rozběhne s přípravou
  const autoKey = next && !work && !resting && timedAt(next.ex) ? `${next.ex}-${next.set}` : null;
  useEffect(() => {
    if (!autoKey || !next) return;
    update((w) => startWork(w, next.ex, next.set, w.exercises[next.ex].sets[next.set].seconds || 60, Date.now(), PREP_S));
  }, [autoKey]); // jen při změně série

  // tiknutí v přípravě a start
  const prepLeft = preparing && work?.starts ? Math.ceil((work.starts - now) / 1000) : 0;
  const lastTick = useRef(0);
  useEffect(() => {
    if (!work?.starts) return;
    const key = preparing ? prepLeft : 0;
    if (lastTick.current === key) return;
    lastTick.current = key;
    if (preparing && prepLeft <= 3) playTone(660, 0.15);
    if (!preparing && now < work.until) playTone(990, 0.3);
  }, [preparing, prepLeft, work, now]);

  const markDone = () => {
    if (!next) return;
    unlockAudio();
    haptic();
    update((w) => toggleDone(w, next.ex, next.set, restFor(next.ex)));
  };

  // co ukázat: při pauze už to, co přijde
  const focusEx = work ? work.ex : next?.ex ?? -1;
  const focusSet = work ? work.set : next?.set ?? -1;
  const exercise = focusEx >= 0 ? exOf(focusEx) : undefined;
  const setCount = focusEx >= 0 ? active.exercises[focusEx].sets.length : 0;
  const timed = focusEx >= 0 && timedAt(focusEx);
  const entry = focusEx >= 0 ? active.exercises[focusEx].sets[focusSet] : undefined;
  const last = exercise ? lastSetsFor(exercise.id, workouts) : [];
  const after = (() => {
    // cvik, který následuje po tom aktuálním
    for (let i = focusEx + 1; i < active.exercises.length; i++) if (active.exercises[i].sets.some((s) => !s.done)) return exOf(i)?.name;
    return null;
  })();

  // kruh: pauza ubývá, série na čas přibývá, příprava ubývá
  let ring = 0;
  if (resting) ring = restLeft / (active.rest_total * 1000);
  else if (preparing && work?.starts) ring = (work.starts - now) / (PREP_S * 1000);
  else if (working && work) ring = 1 - (work.until - now) / (work.total * 1000);
  const R = 120;
  const C = 2 * Math.PI * R;

  const phase = resting ? "Pauza" : preparing ? "Připrav se" : working ? "Cvič" : next ? `Série ${focusSet + 1} z ${setCount}` : "Hotovo";

  return (
    <div className="wp">
      <div className="wp-progress" role="progressbar" aria-label="Průběh tréninku" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-valuetext={`${done} z ${total} sérií`}>
        {active.exercises.map((we, i) => (
          <span key={i} style={{ flexGrow: we.sets.length }}>
            <i style={{ transform: `scaleX(${we.sets.filter((x) => x.done).length / we.sets.length})` }} />
          </span>
        ))}
      </div>
      <p className="wp-count">{next ? `Cvik ${next.ex + 1} z ${active.exercises.length}` : "Všechny cviky"} · {done} z {total} {plural(total, ["série", "série", "sérií"])}</p>

      <div className="wp-stage">
        <p className={`wp-phase${resting ? " rest" : ""}`} aria-live="polite">{phase}</p>

        {next || work ? (
          <>
            <div className={`wp-ring${resting ? " rest" : ""}${working ? " work" : ""}`}>
              <svg viewBox="0 0 260 260" aria-hidden="true">
                <circle className="wp-ring-track" cx="130" cy="130" r={R} />
                {(resting || preparing || working) && (
                  <circle className="wp-ring-fill" cx="130" cy="130" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - Math.max(0, Math.min(1, ring)))} />
                )}
              </svg>
              <div className="wp-ring-label">
                {resting ? <b role="timer">{clock(restLeft)}</b>
                  : preparing ? <b role="timer">{prepLeft}</b>
                  : working && work ? <b role="timer">{clock(work.until - now)}</b>
                  : <b className="wp-target">{targetText(entry, timed) || "Jdi na to"}</b>}
              </div>
            </div>

            <h2 className="wp-name">{exercise?.name ?? "Cvik"}</h2>
            <p className="wp-sub">
              {resting
                ? `Další: série ${focusSet + 1} z ${setCount}${targetText(entry, timed) ? ` · ${targetText(entry, timed)}` : ""}`
                : working || preparing ? `Série ${focusSet + 1} z ${setCount}` : last.length ? `Minule ${last.map(formatSet).join(", ")}` : "Poprvé"}
            </p>
          </>
        ) : (
          <>
            <div className="wp-ring done"><div className="wp-ring-label"><Icon name="check" size={96} /></div></div>
            <h2 className="wp-name">Všechno odcvičeno</h2>
            <p className="wp-sub">Ulož trénink a máš hotovo.</p>
          </>
        )}
      </div>

      <div className="wp-actions">
        {resting ? (
          <>
            <div className="wp-shift">
              <button className="btn tap" onClick={() => update((w) => (w.rest_until ? { ...w, rest_until: w.rest_until - 15000, rest_total: Math.max(1, w.rest_total - 15) } : w))}>−15 s</button>
              <button className="btn tap" onClick={() => update((w) => (w.rest_until ? { ...w, rest_until: w.rest_until + 15000, rest_total: w.rest_total + 15 } : w))}>+15 s</button>
            </div>
            <button className="btn-hero" onClick={() => update((w) => ({ ...w, rest_until: null }))}>Přeskočit pauzu</button>
          </>
        ) : work ? (
          <button className="btn-hero" onClick={() => update((w) => finishWork(w, restFor(work.ex)))}><Icon name="check" size={28} /> Hotovo</button>
        ) : next ? (
          <button className="btn-hero" onClick={markDone}><Icon name="check" size={28} /> Hotovo</button>
        ) : (
          <button className="btn-hero" onClick={onFinish}><Icon name="check" size={28} /> Uložit trénink</button>
        )}
        {after && next && <p className="wp-after">Pak: {after}</p>}
        <div className="wp-links">
          {active.last && <button className="link" onClick={() => update(undoLast)}>Zpět o sérii</button>}
          {next && <button className="link" onClick={() => update((w) => skipExercise(w, focusEx))}>Přeskočit cvik</button>}
          <button className="link" onClick={onEdit}>Upravit</button>
          <button className="link" onClick={onEnd}>Ukončit</button>
        </div>
      </div>
    </div>
  );
}
