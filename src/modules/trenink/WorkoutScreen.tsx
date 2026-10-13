import { useEffect, useState, type CSSProperties } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Burst } from "../../components/Burst";
import { Icon } from "../../components/Icon";
import { Topbar } from "../../components/Topbar";
import { formatNumber, plural } from "../../lib/format";
import { haptic } from "../../lib/haptic";
import { MODULE_BY_KEY } from "../../lib/modules";
import { playSound, unlockAudio } from "../../lib/sound";
import { soundPrefs } from "../../lib/soundPrefs";
import { useWakeLock } from "../../lib/wakeLock";
import { addSet, moveExercise, nextUp, removeExercise, removeSet, setField, toggleDone, useActiveWorkout } from "./active";
import { doneSetCount, formatSet, lastSetsFor, newRecords, prefillSets, setMode, useAddWorkout, useExercises, useWorkouts, workoutVolume, type SetEntry, type Workout } from "./data";
import { ExercisePicker } from "./ExercisePicker";
import type { Exercise } from "./exercises";
import { choose, confirmAction } from "../../components/Confirm";
import { WorkoutPlayer } from "./Player";

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
  // prázdný trénink začíná v úpravách (přidat cviky), jinak vede přehrávač
  const [editing, setEditing] = useState(() => !!active && active.exercises.length === 0);
  useWakeLock(!!active);
  const current = active ? nextUp(active)?.ex ?? null : null;

  // během tréninku bez spodní lišty
  useEffect(() => {
    document.documentElement.classList.toggle("focus-mode", !!active && !summary);
    return () => document.documentElement.classList.remove("focus-mode");
  }, [active, summary]);

  if (summary) return <SummaryView summary={summary} />;
  if (!active) return <Navigate to="/m/trenink" replace />;

  const finish = async () => {
    const exercises = active.exercises
      .map((we) => ({ ...we, sets: we.sets.filter((s) => s.done) }))
      .filter((we) => we.sets.length > 0);
    if (exercises.length === 0) {
      if (await confirmAction("Žádná série není odškrtnutá. Zahodit trénink?", "Zahodit trénink")) { clear(); navigate("/m/trenink", { replace: true }); }
      return;
    }
    const workout: Workout = {
      id: crypto.randomUUID(), name: active.name, template_id: active.template_id, started_at: active.started_at,
      finished_at: new Date().toISOString(), exercises, note: null,
    };
    const records = newRecords(workout, workouts).map((r) => ({ name: byId.get(r.exercise_id)?.name ?? "Cvik", text: r.text }));
    add.mutate(workout);
    clear();
    playSound(soundPrefs().workoutEnd);
    setSummary({ workout, records });
  };

  const restFor = (ex: number) => active.exercises[ex]?.rest_s ?? byId.get(active.exercises[ex]?.exercise_id)?.rest_s ?? 90;

  const addExercise = (e: Exercise) =>
    update((w) => ({ ...w, exercises: [...w.exercises, { exercise_id: e.id, sets: prefillSets(e.id, 3, workouts) }] }));

  const end = async () => {
    const choice = await choose("Ukončit trénink?", [
      { label: "Uložit a ukončit", value: "save" as const },
      { label: "Zahodit trénink", value: "drop" as const, destructive: true },
    ], "Pokračovat");
    if (choice === "save") void finish();
    if (choice === "drop") { clear(); navigate("/m/trenink", { replace: true }); }
  };

  if (!editing) {
    return (
      <div className="screen module workout-play" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
        <Topbar title={active.name} back="/m/trenink" right={<Elapsed since={active.started_at} />} />
        <WorkoutPlayer active={active} update={update} byId={byId} workouts={workouts} restFor={restFor} onFinish={finish} onEnd={end} onEdit={() => setEditing(true)} />
      </div>
    );
  }

  return (
    <div className="screen module workout" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <Topbar title={active.name} back="/m/trenink" right={<Elapsed since={active.started_at} />} />
      {active.exercises.length > 0 && (
        <button className="btn-hero wx-back" onClick={() => setEditing(false)}><Icon name="i-play" size={24} /> Zpět k tréninku</button>
      )}
      <p className="small muted">Tady opravíš váhy a opakování, přidáš nebo přeuspořádáš cviky.</p>

      {active.exercises.length === 0 && <p className="empty">Přidej první cvik.</p>}
      {active.exercises.map((we, ex) => {
        const exercise = byId.get(we.exercise_id);
        const rest = restFor(ex);
        return (
          <ExerciseCard
            key={`${we.exercise_id}-${ex}`}
            id={`wx-${ex}`}
            current={current === ex}
            exercise={exercise}
            mode={setMode(we.mode, exercise)}
            sets={we.sets}
            last={lastSetsFor(we.exercise_id, workouts)}
            isFirst={ex === 0}
            isLast={ex === active.exercises.length - 1}
            onChange={(set, patch) => update((w) => setField(w, ex, set, patch))}
            onToggle={(set) => { unlockAudio(); haptic(); update((w) => toggleDone(w, ex, set, rest)); }}
            onAddSet={() => update((w) => addSet(w, ex))}
            onRemoveSet={() => update((w) => removeSet(w, ex))}
            onMove={(dir) => update((w) => moveExercise(w, ex, dir))}
            onRemove={() => void confirmAction(`Odebrat ${exercise?.name ?? "cvik"} z tréninku?`, "Odebrat").then((ok) => ok && update((w) => removeExercise(w, ex)))}
          />
        );
      })}

      <button className="btn tap wide" onClick={() => setPicking(true)}><Icon name="i-plus" size={20} /> Přidat cvik</button>
      <button className="link timer-cancel" onClick={end}>Ukončit trénink</button>

      {picking && <ExercisePicker onClose={() => setPicking(false)} onPick={addExercise} exclude={active.exercises.map((e) => e.exercise_id)} />}
    </div>
  );
}

function Elapsed({ since }: { since: string }) {
  const now = useNow(1000);
  return <span className="elapsed" aria-label="Doba tréninku">{clock(now - new Date(since).getTime())}</span>;
}

function ExerciseCard({ id, current, exercise, mode, sets, last, isFirst, isLast, onChange, onToggle, onAddSet, onRemoveSet, onMove, onRemove }: {
  id: string;
  /** Cvik, který je právě na řadě. */
  current: boolean;
  exercise: Exercise | undefined;
  /** Série na opakování, nebo na čas (s odpočtem). */
  mode: "reps" | "time";
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
  const kg = kind === "weight_reps";
  const timed = mode === "time";
  const doneCount = sets.filter((s) => s.done).length;
  const complete = doneCount === sets.length;
  return (
    <section id={id} className={`panel wx${kg ? "" : " wx-narrow"}${timed ? " wx-timed" : ""}${current ? " current" : ""}${complete ? " complete" : ""}`} aria-current={current ? "step" : undefined}>
      <div className="wx-head">
        <div className="grow">
          <h3>{exercise?.name ?? "Smazaný cvik"}</h3>
          <p className="wx-status">{complete ? <><Icon name="check" size={16} /> Hotovo</> : current ? `Teď · ${doneCount} z ${sets.length}` : `${doneCount} z ${sets.length}`}</p>
          <p className="small muted">{last.length ? `Minule: ${last.map(formatSet).join(", ")}` : "Poprvé – ať to stojí za to."}</p>
        </div>
        <div className="wx-tools">
          <button className="icon-btn" aria-label="Posunout nahoru" disabled={isFirst} onClick={() => onMove(-1)}><Icon name="i-up" size={16} /></button>
          <button className="icon-btn" aria-label="Posunout dolů" disabled={isLast} onClick={() => onMove(1)}><Icon name="i-down" size={16} /></button>
          <button className="icon-btn" aria-label="Odebrat cvik" onClick={onRemove}>×</button>
        </div>
      </div>
      <div className="wx-row wx-labels" aria-hidden="true">
        <span>#</span>
        {kg && <span>kg</span>}
        {timed ? <span>sekund</span> : <span>opak.</span>}
        <span />
      </div>
      {sets.map((s, i) => (
        <div key={i} className={`wx-row${s.done ? " done" : ""}`}>
          <span className="wx-n">{i + 1}</span>
          {kg && <NumInput label={`Série ${i + 1}, kg`} value={s.weight} decimal onChange={(v) => onChange(i, { weight: v })} />}
          {timed
            ? <NumInput label={`Série ${i + 1}, sekund`} value={s.seconds} onChange={(v) => onChange(i, { seconds: v })} />
            : <NumInput label={`Série ${i + 1}, opakování`} value={s.reps} onChange={(v) => onChange(i, { reps: v })} />}
          <button className={`wx-check${s.done ? " on" : ""}`} aria-pressed={s.done} aria-label={`Série ${i + 1} hotová`} onClick={() => onToggle(i)}>
            {s.done ? <Icon name="check" size={24} /> : null}
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
        <span className="icon-slot anim-jump"><Icon name="trenink" size={96} /></span>
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
            {records.map((r) => <li key={r.name}><Icon name="trophy" size={24} />{r.name}: {r.text}</li>)}
          </ul>
        </div>
      )}
      <Link to="/m/trenink" className="btn-hero">Zpět</Link>
    </div>
  );
}
