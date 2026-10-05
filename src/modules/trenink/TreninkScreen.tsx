import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Columns } from "../../components/Charts";
import { Sheet } from "../../components/Sheet";
import { Sprite } from "../../components/Sprite";
import { Tabs } from "../../components/Tabs";
import { Topbar } from "../../components/Topbar";
import { relativeTime, WEEKDAYS_SHORT } from "../../lib/dates";
import { formatDate, formatNumber, plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { useSettings } from "../../lib/settings";
import { SOUND_NAMES, playSound, unlockAudio } from "../../lib/sound";
import { soundPrefs, useSoundPrefs } from "../../lib/soundPrefs";
import { SoundPicker } from "../../components/SoundPicker";
import { useActiveWorkout } from "./active";
import {
  computeTrainingStats, doneSetCount, estimateTemplate, formatMinutes, formatKg, formatSeconds, formatSet, personalRecords, prefillSets, useDeleteWorkout, useExercises,
  useTemplates, useWorkouts, workoutVolume, type Workout, type WorkoutTemplate,
} from "./data";

const MODULE = MODULE_BY_KEY.trenink;
const TRENINKU: [string, string, string] = ["trénink", "tréninky", "tréninků"];

const minutesOf = (w: Workout) => Math.max(1, Math.round((new Date(w.finished_at).getTime() - new Date(w.started_at).getTime()) / 60000));

export function TreninkScreen() {
  const { data: workouts = [], error } = useWorkouts();
  const { data: templates = [] } = useTemplates();
  const { byId } = useExercises();
  const { settings, update: updateSettings } = useSettings();
  const goal = settings.workout_weekly_goal;
  const stats = useMemo(() => computeTrainingStats(workouts, goal), [workouts, goal]);
  const records = useMemo(() => personalRecords(workouts), [workouts]);
  const { active, start } = useActiveWorkout();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<"treninky" | "tyden" | "historie" | "rekordy">("treninky");
  const [starting, setStarting] = useState(false);
  const [soundsOpen, setSoundsOpen] = useState(false);
  const { prefs, update: updateSounds } = useSoundPrefs();
  const [goalOpen, setGoalOpen] = useState(false);
  const [detail, setDetail] = useState<Workout | null>(null);
  const goalDone = stats.weekCount >= goal;

  // ?start=1 z karty na obrazovce Dnes
  useEffect(() => {
    if (!params.has("start")) return;
    setParams({}, { replace: true });
    if (active) navigate("/m/trenink/trenink");
    else setStarting(true);
  }, [params, setParams, active, navigate]);

  const begin = (t: WorkoutTemplate | null) => {
    if (active && !window.confirm("Už máš rozdělaný trénink. Zahodit ho a začít nový?")) return;
    unlockAudio();
    playSound(soundPrefs().workoutStart);
    start({
      name: t?.name ?? "Trénink",
      template_id: t?.id ?? null,
      started_at: new Date().toISOString(),
      exercises: t ? t.items.map((it) => ({ exercise_id: it.exercise_id, sets: prefillSets(it.exercise_id, it.sets, workouts), ...(it.rest_s !== undefined ? { rest_s: it.rest_s } : {}) })) : [],
      rest_until: null,
      rest_total: 0,
    });
    navigate("/m/trenink/trenink");
  };

  const lastDone = (t: WorkoutTemplate) => workouts.find((w) => w.template_id === t.id);
  const recordList = [...records.values()]
    .map((r) => ({ r, e: byId.get(r.exercise_id) }))
    .filter((x) => x.e)
    .sort((a, b) => a.e!.name.localeCompare(b.e!.name, "cs"));

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar title="Trénink" />
        <div className="hero">
          <span className="sprite-tile"><Sprite name="trenink" size={96} /></span>
          <span className="hero-num">{stats.weekCount}<span style={{ fontSize: "0.45em" }}>/{goal}</span></span>
          <span className="hero-cap">{goalDone ? "cíl na týden splněný!" : `${plural(stats.weekCount, TRENINKU)} tento týden`}</span>
          <p className="hero-line">
            {stats.weekStreak > 0 ? `Série ${stats.weekStreak} ${plural(stats.weekStreak, ["týden", "týdny", "týdnů"])} se splněným cílem` : `Celkem ${stats.total} ${plural(stats.total, TRENINKU)}`}
          </p>
        </div>
        {active ? (
          <button className="btn-hero" onClick={() => navigate("/m/trenink/trenink")}><Sprite name="i-play" size={24} /> Pokračovat v tréninku</button>
        ) : (
          <button className="btn-hero" onClick={() => setStarting(true)}><Sprite name="i-play" size={24} /> Začít trénink</button>
        )}
        <button className="link sound-link" onClick={() => setSoundsOpen(true)}>
          Zvuky: začátek {SOUND_NAMES[prefs.workoutStart].toLowerCase()} · pauza {SOUND_NAMES[prefs.restEnd].toLowerCase()} · konec {SOUND_NAMES[prefs.workoutEnd].toLowerCase()}
        </button>
      </div>

      {error && <p className="error">Nepodařilo se načíst tréninky. Zkontroluj připojení.</p>}

      <Tabs
        label="Zobrazení"
        value={tab}
        onChange={setTab}
        items={[{ id: "treninky", label: "Tréninky" }, { id: "tyden", label: "Týden" }, { id: "historie", label: "Historie" }, { id: "rekordy", label: "Rekordy" }]}
      />

      {tab === "treninky" && (
        <div className="tab-panel">
          {templates.length === 0 && <p className="empty">Postav si první trénink: vyber cviky a počet sérií. Pak ho spustíš jedním ťuknutím.</p>}
          {templates.length > 0 && (
            <ul className="list">
              {templates.map((t) => {
                const last = lastDone(t);
                return (
                  <li key={t.id} className="idea-row">
                    <button className="list-btn" onClick={() => begin(t)} aria-label={`Začít ${t.name}`}>
                      <span className="grow">
                        <b>{t.name}</b>
                        <span className="occasion-kind">
                          {t.items.length} {plural(t.items.length, ["cvik", "cviky", "cviků"])} · ≈ {formatMinutes(estimateTemplate(t.items, byId, workouts, t.rest_between_s).total)}
                          {last ? ` · naposledy ${relativeTime(new Date(last.started_at)).toLowerCase()}` : ""}
                        </span>
                      </span>
                      <Sprite name="i-play" size={20} />
                    </button>
                    <button className="idea-given" onClick={() => navigate(`/m/trenink/sablona/${t.id}`)}>Upravit</button>
                  </li>
                );
              })}
            </ul>
          )}
          <button className="btn tap wide" onClick={() => navigate("/m/trenink/sablona/nova")}><Sprite name="i-plus" size={20} /> Nový trénink</button>
        </div>
      )}

      {tab === "tyden" && (
        <div className="tab-panel">
          <div className="panel">
            <div className="row-between">
              <h3>Cíl {goal}× týdně</h3>
              <button className="link" onClick={() => setGoalOpen(true)}>Změnit</button>
            </div>
            <div className="week-blocks">
              {WEEKDAYS_SHORT.map((d, i) => {
                const v = stats.thisWeek[i];
                return (
                  <div key={d} className="week-block">
                    <i className={v === null ? "future" : v > 0 ? "done" : undefined}>{v ? <Sprite name="check" size={28} tone="trenink" /> : null}</i>
                    <span className={i === stats.todayIndex ? "today" : undefined}>{d}</span>
                    <span className="sr-only">{v === null ? "ještě nebylo" : v > 0 ? `${v}× trénink` : "bez tréninku"}</span>
                  </div>
                );
              })}
            </div>
            <p className="goal-line">
              {stats.weekStreak > 0 && <Sprite name="flame" size={24} tone="trenink" />}
              {goalDone ? "Splněno! " : `Ještě ${goal - stats.weekCount}× a máš to. `}
              {stats.weekStreak > 0 && `Série ${stats.weekStreak} ${plural(stats.weekStreak, ["týden", "týdny", "týdnů"])}.`}
            </p>
          </div>
          <div className="score" style={{ marginTop: 0 }}>
            <div><b>{stats.monthCount}</b><span>tento měsíc</span></div>
            <div><b>{stats.total}</b><span>celkem</span></div>
            <div><b>{formatNumber(stats.weekVolume, 0)}</b><span>kg objem týdne</span></div>
          </div>
          <div className="panel">
            <h3>Posledních 12 týdnů</h3>
            <Columns
              values={stats.lastWeeks.map((w) => w.count)}
              labels={stats.lastWeeks.map((w, i) => (i === 11 ? "teď" : i % 3 === 2 ? formatDate(w.start) : ""))}
              highlight={11}
              color={MODULE.color}
              label={`Tréninky po týdnech: ${stats.lastWeeks.map((w) => `od ${formatDate(w.start)} ${w.count}`).join(", ")}`}
            />
          </div>
        </div>
      )}

      {tab === "historie" && (
        <div className="tab-panel">
          {workouts.length === 0 ? <p className="empty">Zatím žádný odcvičený trénink.</p> : (
            <ul className="list">
              {workouts.slice(0, 60).map((w) => (
                <li key={w.id}>
                  <button className="list-btn" onClick={() => setDetail(w)}>
                    <span className="grow">
                      <b>{w.name}</b>
                      <span className="occasion-kind">
                        {relativeTime(new Date(w.started_at))} · {minutesOf(w)} min · {doneSetCount(w)} {plural(doneSetCount(w), ["série", "série", "sérií"])}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "rekordy" && (
        <div className="tab-panel">
          {recordList.length === 0 ? <p className="empty">Rekordy se ukážou po prvním tréninku.</p> : (
            <ul className="list">
              {recordList.map(({ r, e }) => (
                <li key={r.exercise_id}>
                  <div className="list-btn record-row">
                    <span className="grow">
                      <b>{e!.name}</b>
                      <span className="occasion-kind">
                        {r.workouts}× cvičeno{r.best1rm && r.heaviest && r.heaviest.reps > 1 ? ` · max na 1 opakování ≈ ${formatKg(Math.round(r.best1rm * 2) / 2)}` : ""}
                      </span>
                    </span>
                    <span className="record-value">
                      {r.heaviest ? `${formatKg(r.heaviest.weight)} × ${r.heaviest.reps}` : r.maxSeconds ? formatSeconds(r.maxSeconds.seconds) : r.maxReps ? `${r.maxReps.reps}×` : "–"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {soundsOpen && (
        <Sheet title="Zvuky tréninku" onClose={() => setSoundsOpen(false)}>
          <p className="small muted">Ťuknutím zvuk vybereš a rovnou uslyšíš. Na iPhonu musí být vypnutý tichý režim.</p>
          <SoundPicker label="Začátek tréninku" value={prefs.workoutStart} onChange={(v) => updateSounds({ workoutStart: v })} />
          <SoundPicker label="Konec pauzy mezi sériemi" value={prefs.restEnd} onChange={(v) => updateSounds({ restEnd: v })} />
          <SoundPicker label="Konec tréninku" value={prefs.workoutEnd} onChange={(v) => updateSounds({ workoutEnd: v })} />
          <button className="btn dark tap wide" onClick={() => setSoundsOpen(false)}>Hotovo</button>
        </Sheet>
      )}
      {starting && (
        <Sheet title="Začít trénink" onClose={() => setStarting(false)}>
          {templates.length > 0 && (
            <ul className="list">
              {templates.map((t) => (
                <li key={t.id}>
                  <button className="list-btn" onClick={() => begin(t)}>
                    <span className="grow"><b>{t.name}</b><span className="occasion-kind">{t.items.map((it) => byId.get(it.exercise_id)?.name).filter(Boolean).join(", ")}</span></span>
                    <Sprite name="i-play" size={20} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button className="btn dark tap wide" onClick={() => begin(null)}>Prázdný trénink</button>
          <button className="btn tap wide" onClick={() => navigate("/m/trenink/sablona/nova")}>Postavit nový trénink</button>
        </Sheet>
      )}
      {goalOpen && <GoalSheet goal={goal} onClose={() => setGoalOpen(false)} onSave={(g) => updateSettings({ workout_weekly_goal: g })} />}
      {detail && <WorkoutDetail workout={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function WorkoutDetail({ workout, onClose }: { workout: Workout; onClose: () => void }) {
  const { byId } = useExercises();
  const remove = useDeleteWorkout();
  const volume = workoutVolume(workout);
  return (
    <Sheet title={workout.name} onClose={onClose}>
      <p className="small muted">{relativeTime(new Date(workout.started_at))} · {minutesOf(workout)} min{volume ? ` · objem ${formatNumber(volume, 0)} kg` : ""}</p>
      <ul className="detail-list">
        {workout.exercises.map((we, i) => (
          <li key={i}><b>{byId.get(we.exercise_id)?.name ?? "Smazaný cvik"}</b><span>{we.sets.map(formatSet).join(" · ")}</span></li>
        ))}
      </ul>
      <button className="btn tap wide" onClick={() => {
        if (!window.confirm("Smazat tenhle trénink?")) return;
        remove.mutate(workout.id);
        onClose();
      }}>Smazat trénink</button>
    </Sheet>
  );
}

function GoalSheet({ goal, onClose, onSave }: { goal: number; onClose: () => void; onSave: (goal: number) => void }) {
  const [value, setValue] = useState(goal);
  return (
    <Sheet title="Cíl tréninků za týden" onClose={onClose}>
      <div className="stepper">
        <button className="icon-btn big tap" aria-label="Méně" disabled={value <= 1} onClick={() => setValue((v) => v - 1)}>−</button>
        <span className="stepper-value" aria-live="polite">{value}×</span>
        <button className="icon-btn big tap" aria-label="Více" disabled={value >= 14} onClick={() => setValue((v) => v + 1)}>+</button>
      </div>
      <button className="btn dark tap wide" onClick={() => { onSave(value); onClose(); }}>Uložit cíl</button>
    </Sheet>
  );
}
