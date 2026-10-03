import { useEffect, useState, type CSSProperties } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Burst } from "../../components/Burst";
import { Sprite } from "../../components/Sprite";
import { Topbar } from "../../components/Topbar";
import { formatNumber, plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { playBeep, unlockAudio } from "../../lib/sound";
import { useWakeLock } from "../../lib/wakeLock";
import { addSet, moveExercise, removeExercise, removeSet, setField, toggleDone, useActiveWorkout, type ActiveWorkout } from "./active";
import { doneSetCount, formatSet, lastSetsFor, newRecords, prefillSets, useAddWorkout, useExercises, useWorkouts, workoutVolume, type SetEntry, type Workout } from "./data";
import { ExercisePicker } from "./ExercisePicker";
import type { Exercise } from "./exercises";

const MODULE = MODULE_BY_KEY.trenink;

function useNow(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
}

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h ? `${h}:${String(m).padStart(2, "0")}` : m}:${String(s % 60).padStart(2, "0")}`;
};

interface Summary {
  workout: Workout;
  records: { name: string; text: string }[];
}

export function WorkoutScreen() {
  const { active, update, clear } = useActiveWorkout();
  const { data: workouts = [] } = useWorkouts();
  const { byId } = useExercises();
  const add = useAddWorkout();
  const navigate = useNavigate();
  const [picking, setPicking] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  useWakeLock(!!active);

  if (summary) return <SummaryView summary={summary} />;
  if (!active) return <Navigate to="/m/trenink" replace />;

  const finish = () => {
    const exercises = active.exercises
      .map((we) => ({ ...we, sets: we.sets.filter((s) => s.done) }))
      .filter((we) => we.sets.length > 0);
    if (exercises.length === 0) {
      if (window.confirm("Žádná série není odškrtnutá. Zahodit trénink?")) { clear(); navigate("/m/trenink", { replace: true }); }
      return;
    }
    const workout: Workout = {
      id: crypto.randomUUID(), name: active.name, template_id: active.template_id, started_at: active.started_at,
      finished_at: new Date().toISOString(), exercises, note: null,
    };
    const records = newRecords(workout, workouts).map((r) => ({ name: byId.get(r.exercise_id)?.name ?? "Cvik", text: r.text }));
    add.mutate(workout);
    clear();
    setSummary({ workout, records });
  };

  const addExercise = (e: Exercise) =>
    update((w) => ({ ...w, exercises: [...w.exercises, { exercise_id: e.id, sets: prefillSets(e.id, 3, workouts) }] }));

  return (
    <div className="screen module workout" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <Topbar title={active.name} back="/m/trenink" right={<Elapsed since={active.started_at} />} />

      {active.exercises.length === 0 && <p className="empty">Přidej první cvik.</p>}
      {active.exercises.map((we, ex) => {
        const exercise = byId.get(we.exercise_id);
        return (
          <ExerciseCard
            key={`${we.exercise_id}-${ex}`}
            exercise={exercise}
            sets={we.sets}
            last={lastSetsFor(we.exercise_id, workouts)}
            isFirst={ex === 0}
            isLast={ex === active.exercises.length - 1}
            onChange={(set, patch) => update((w) => setField(w, ex, set, patch))}
            onToggle={(set) => { unlockAudio(); update((w) => toggleDone(w, ex, set, we.rest_s ?? exercise?.rest_s ?? 90)); }}
            onAddSet={() => update((w) => addSet(w, ex))}
            onRemoveSet={() => update((w) => removeSet(w, ex))}
            onMove={(dir) => update((w) => moveExercise(w, ex, dir))}
            onRemove={() => window.confirm(`Odebrat ${exercise?.name ?? "cvik"} z tréninku?`) && update((w) => removeExercise(w, ex))}
          />
        );
      })}

      <button className="btn tap wide" onClick={() => setPicking(true)}><Sprite name="i-plus" size={20} /> Přidat cvik</button>
      <button className="btn-hero" onClick={finish}><Sprite name="check" size={32} tone="trenink" /> Dokončit trénink</button>
      <button className="link timer-cancel" onClick={() => {
        if (window.confirm("Zrušit trénink bez uložení?")) { clear(); navigate("/m/trenink", { replace: true }); }
      }}>Zrušit bez uložení</button>

      <RestBar active={active} update={update} />
      {picking && <ExercisePicker onClose={() => setPicking(false)} onPick={addExercise} exclude={active.exercises.map((e) => e.exercise_id)} />}
    </div>
  );
}

function Elapsed({ since }: { since: string }) {
  const now = useNow(1000);
  return <span className="elapsed" aria-label="Doba tréninku">{clock(now - new Date(since).getTime())}</span>;
}

/** Pauza po sérii: odpočet nad spodní lištou, na konci pípne. */
function RestBar({ active, update }: { active: ActiveWorkout; update: (fn: (w: ActiveWorkout) => ActiveWorkout) => void }) {
  const now = useNow(250);
  const left = active.rest_until ? active.rest_until - now : 0;

  useEffect(() => {
    if (active.rest_until && left <= 0) {
      // po návratu do appky po dlouhé době už nepípat
      if (left > -5000) {
        playBeep();
        navigator.vibrate?.(200);
      }
      update((w) => ({ ...w, rest_until: null }));
    }
  }, [active.rest_until, left, update]);

  if (!active.rest_until || left <= 0) return null;
  const shift = (s: number) => update((w) => (w.rest_until ? { ...w, rest_until: w.rest_until + s * 1000, rest_total: Math.max(1, w.rest_total + s) } : w));
  return (
    <div className="rest-bar" role="timer" aria-label="Pauza">
      <span className="rest-fill" style={{ width: `${Math.min(100, (left / (active.rest_total * 1000)) * 100)}%` }} />
      <span className="rest-time">Pauza {clock(left + 999)}</span>
      <button onClick={() => shift(-15)} aria-label="O 15 sekund kratší">−15</button>
      <button onClick={() => shift(15)} aria-label="O 15 sekund delší">+15</button>
      <button onClick={() => update((w) => ({ ...w, rest_until: null }))}>Dál</button>
    </div>
  );
}

function ExerciseCard({ exercise, sets, last, isFirst, isLast, onChange, onToggle, onAddSet, onRemoveSet, onMove, onRemove }: {
  exercise: Exercise | undefined;
  sets: SetEntry[];
  last: SetEntry[];
  isFirst: boolean;
  isLast: boolean;
  onChange: (set: number, patch: Partial<SetEntry>) => void;
  onToggle: (set: number) => void;
  onAddSet: () => void;
  onRemoveSet: () => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const kind = exercise?.kind ?? "weight_reps";
  return (
    <section className={`panel wx wx-${kind}`}>
      <div className="wx-head">
        <div className="grow">
          <h3>{exercise?.name ?? "Smazaný cvik"}</h3>
          <p className="small muted">{last.length ? `Minule: ${last.map(formatSet).join(", ")}` : "Poprvé – ať to stojí za to."}</p>
        </div>
        <div className="wx-tools">
          <button className="icon-btn" aria-label="Posunout nahoru" disabled={isFirst} onClick={() => onMove(-1)}><Sprite name="i-up" size={16} /></button>
          <button className="icon-btn" aria-label="Posunout dolů" disabled={isLast} onClick={() => onMove(1)}><Sprite name="i-down" size={16} /></button>
          <button className="icon-btn" aria-label="Odebrat cvik" onClick={onRemove}>×</button>
        </div>
      </div>
      <div className="wx-row wx-labels" aria-hidden="true">
        <span>#</span>
        {kind === "weight_reps" && <span>kg</span>}
        {kind !== "time" ? <span>opak.</span> : <span>sekund</span>}
        <span />
      </div>
      {sets.map((s, i) => (
        <div key={i} className={`wx-row${s.done ? " done" : ""}`}>
          <span className="wx-n">{i + 1}</span>
          {kind === "weight_reps" && <NumInput label={`Série ${i + 1}, kg`} value={s.weight} decimal onChange={(v) => onChange(i, { weight: v })} />}
          {kind !== "time"
            ? <NumInput label={`Série ${i + 1}, opakování`} value={s.reps} onChange={(v) => onChange(i, { reps: v })} />
            : <NumInput label={`Série ${i + 1}, sekund`} value={s.seconds} onChange={(v) => onChange(i, { seconds: v })} />}
          <button className={`wx-check${s.done ? " on" : ""}`} aria-pressed={s.done} aria-label={`Série ${i + 1} hotová`} onClick={() => onToggle(i)}>
            {s.done ? <Sprite name="check" size={24} tone="meditace" /> : null}
          </button>
        </div>
      ))}
      <div className="wx-sets">
        <button className="link" onClick={onAddSet}>+ Série</button>
        {sets.length > 1 && <button className="link" onClick={onRemoveSet}>− Série</button>}
      </div>
    </section>
  );
}

/** Číselné políčko, které snese i desetinnou čárku („22,5“). */
function NumInput({ value, onChange, decimal, label }: { value: number | null; onChange: (v: number | null) => void; decimal?: boolean; label: string }) {
  const show = (v: number | null) => (v === null ? "" : String(v).replace(".", ","));
  const [text, setText] = useState(show(value));
  const parse = (t: string) => {
    const n = decimal ? parseFloat(t.replace(",", ".")) : parseInt(t, 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  useEffect(() => {
    if (parse(text) !== value) setText(show(value));
  }, [value]); // text se schválně nehlídá – jinak by se přepisovalo rozepsané „22,“
  return (
    <input
      className="input wx-input"
      aria-label={label}
      inputMode={decimal ? "decimal" : "numeric"}
      value={text}
      placeholder="–"
      onFocus={(e) => e.target.select()}
      onChange={(e) => { setText(e.target.value); onChange(parse(e.target.value)); }}
    />
  );
}

function SummaryView({ summary }: { summary: Summary }) {
  const { workout, records } = summary;
  const minutes = Math.round((new Date(workout.finished_at).getTime() - new Date(workout.started_at).getTime()) / 60000);
  const volume = workoutVolume(workout);
  const sets = doneSetCount(workout);
  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="hero summary-hero">
        <span className="sprite-tile anim-jump"><Sprite name="trenink" size={96} /></span>
        <Burst trigger={1} text={records.length ? "Rekord!" : "Hotovo!"} />
        <span className="hero-num">{minutes}</span>
        <span className="hero-cap">{plural(minutes, ["minuta", "minuty", "minut"])} makačky</span>
        <p className="hero-line">{workout.name}</p>
      </div>
      <div className="score">
        <div><b>{sets}</b><span>{plural(sets, ["série", "série", "sérií"])}</span></div>
        <div><b>{workout.exercises.length}</b><span>{plural(workout.exercises.length, ["cvik", "cviky", "cviků"])}</span></div>
        <div><b>{volume ? formatNumber(volume, 0) : "–"}</b><span>kg objem</span></div>
      </div>
      {records.length > 0 && (
        <div className="panel" style={{ marginTop: 14 }}>
          <h3>Nové rekordy</h3>
          <ul className="plan">
            {records.map((r) => <li key={r.name}><Sprite name="trophy" size={24} />{r.name}: {r.text}</li>)}
          </ul>
        </div>
      )}
      <Link to="/m/trenink" className="btn-hero">Zpět</Link>
    </div>
  );
}
