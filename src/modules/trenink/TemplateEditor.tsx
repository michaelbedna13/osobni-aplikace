import { useState, type CSSProperties } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { Topbar } from "../../components/Topbar";
import { MODULE_BY_KEY } from "../../lib/modules";
import { DEFAULT_REST_BETWEEN, estimateTemplate, formatMinutes, formatSeconds, setMode, setSeconds, useAddTemplate, useDeleteTemplate, useExercises, useTemplates, useUpdateTemplate, useWorkouts, type TemplateItem, type WorkoutTemplate } from "./data";
import { ExercisePicker } from "./ExercisePicker";

const MODULE = MODULE_BY_KEY.trenink;

/** Vytvoření nebo úprava tréninku (šablony): název a cviky s počtem sérií. */
export function TemplateEditor() {
  const { id } = useParams();
  const { data: templates = [], isLoading } = useTemplates();
  const existing = templates.find((t) => t.id === id);
  if (id !== "nova" && !existing) return isLoading ? <div className="screen" /> : <Navigate to="/m/trenink" replace />;
  return <Editor key={existing?.id ?? "nova"} initial={existing ?? null} />;
}

const REST_OPTIONS = [0, 30, 45, 60, 90, 120, 150, 180, 240, 300];
const restLabel = (s: number) => (s === 0 ? "bez pauzy" : s < 60 ? `${s} s` : s % 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} min` : `${s / 60} min`);

function Editor({ initial }: { initial: WorkoutTemplate | null }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [items, setItems] = useState<TemplateItem[]>(initial?.items ?? []);
  const [picking, setPicking] = useState(false);
  const [restBetween, setRestBetween] = useState(initial?.rest_between_s ?? DEFAULT_REST_BETWEEN);
  const { byId } = useExercises();
  const { data: workouts = [] } = useWorkouts();
  const estimate = estimateTemplate(items, byId, workouts, restBetween);
  const add = useAddTemplate();
  const update = useUpdateTemplate();
  const remove = useDeleteTemplate();
  const navigate = useNavigate();
  const valid = name.trim().length > 0 && items.length > 0;

  const change = (i: number, patch: Partial<TemplateItem>) => setItems((list) => list.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const move = (i: number, dir: -1 | 1) => setItems((list) => {
    const to = i + dir;
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    [next[i], next[to]] = [next[to], next[i]];
    return next;
  });

  const save = () => {
    const t = { id: initial?.id ?? crypto.randomUUID(), name: name.trim(), items, rest_between_s: restBetween, created_at: initial?.created_at ?? new Date().toISOString() };
    if (initial) update.mutate(t);
    else add.mutate(t);
    navigate("/m/trenink", { replace: true });
  };

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <Topbar title={initial ? "Upravit trénink" : "Nový trénink"} back="/m/trenink" />
      <label htmlFor="tpl-name" className="field-label">Název</label>
      <input id="tpl-name" className="input" maxLength={80} placeholder="Třeba Horní polovina" value={name} onChange={(e) => setName(e.target.value)} />

      <h2 className="sec-title">Cviky</h2>
      <p className="small muted tpl-how">
        Cviky jdou popořadě. U každého odcvičíš všechny série za sebou (mezi nimi pauza), pak pauza mezi cviky a další cvik.
        Série = jedno kolo cviku, třeba 10 kliků. Kolik opakování nebo vteřin jsi zvládl, zapisuješ během tréninku.
      </p>
      {items.length === 0 ? <p className="empty">Zatím žádné cviky.</p> : (
        <ol className="tpl-list">
          {items.map((it, i) => {
            const ex = byId.get(it.exercise_id);
            const timed = setMode(it.mode, ex) === "time";
            const rest = it.rest_s ?? ex?.rest_s ?? 90;
            const target = it.target;
            const step = timed ? 5 : 1;
            const kindNote = !ex ? "" : ex.kind === "weight_reps" ? "s váhou" : ex.kind === "time" ? "výdrž" : "bez váhy";
            return (
              <li key={`${it.exercise_id}-${i}`} className="tpl-item">
                <div className="tpl-head">
                  <span className="tpl-num">{i + 1}</span>
                  <span className="grow">
                    <b>{ex?.name ?? "Smazaný cvik"}</b>
                    <small>{kindNote}{kindNote && " · "}≈ {formatMinutes(it.sets * setSeconds(ex, workouts, target, it.mode) + Math.max(0, it.sets - 1) * rest)}</small>
                  </span>
                  <button className="icon-btn sm" aria-label="Posunout nahoru" disabled={i === 0} onClick={() => move(i, -1)}><Icon name="i-up" size={14} /></button>
                  <button className="icon-btn sm" aria-label="Posunout dolů" disabled={i === items.length - 1} onClick={() => move(i, 1)}><Icon name="i-down" size={14} /></button>
                  <button className="icon-btn sm" aria-label={`Odebrat ${ex?.name ?? "cvik"}`} onClick={() => setItems((list) => list.filter((_, j) => j !== i))}><Icon name="i-trash" size={16} /></button>
                </div>
                <div className="tpl-rows">
                  {ex?.kind !== "time" && (
                    <>
                      <span className="tpl-label">Série měřím</span>
                      <span className="seg tpl-mode" role="group" aria-label="Jak se měří série">
                        <button type="button" className={`seg-btn${!timed ? " on" : ""}`} aria-pressed={!timed} onClick={() => change(i, { mode: undefined, target: undefined })}>Opakování</button>
                        <button type="button" className={`seg-btn${timed ? " on" : ""}`} aria-pressed={timed} onClick={() => change(i, { mode: "time", target: it.mode === "time" ? it.target : 60 })}>Na čas</button>
                      </span>
                    </>
                  )}
                  <span className="tpl-label">Série</span>
                  <span className="tpl-step">
                    <button className="icon-btn sm" aria-label="Méně sérií" disabled={it.sets <= 1} onClick={() => change(i, { sets: it.sets - 1 })}>−</button>
                    <b>{it.sets}×</b>
                    <button className="icon-btn sm" aria-label="Více sérií" disabled={it.sets >= 10} onClick={() => change(i, { sets: it.sets + 1 })}>+</button>
                  </span>
                  <span className="tpl-label">{timed ? "Délka série (cíl)" : "Opakování (cíl)"}</span>
                  <span className="tpl-step">
                    <button className="icon-btn sm" aria-label={timed ? "Kratší" : "Méně opakování"} disabled={!target} onClick={() => change(i, { target: target && target - step >= step ? target - step : undefined })}>−</button>
                    <b className={target ? undefined : "muted"}>{target ? (timed ? formatSeconds(target) : `${target}×`) : "volně"}</b>
                    <button className="icon-btn sm" aria-label={timed ? "Delší" : "Více opakování"} onClick={() => change(i, { target: target ? target + step : timed ? 30 : 10 })}>+</button>
                  </span>
                  <span className="tpl-label">Pauza mezi sériemi</span>
                  <select className="input tpl-select" value={rest} onChange={(e) => change(i, { rest_s: Number(e.target.value) })}>
                    {REST_OPTIONS.map((sec) => <option key={sec} value={sec}>{restLabel(sec)}</option>)}
                  </select>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <button className="btn tap wide" onClick={() => setPicking(true)}><Icon name="i-plus" size={20} /> Přidat cvik</button>

      {items.length > 1 && (
        <label className="tpl-rest between">
          <span>Pauza mezi cviky</span>
          <select className="input" value={restBetween} onChange={(e) => setRestBetween(Number(e.target.value))}>
            {REST_OPTIONS.map((s) => <option key={s} value={s}>{restLabel(s)}</option>)}
          </select>
        </label>
      )}

      {items.length > 0 && (
        <div className="panel estimate" aria-live="polite">
          <span className="small muted">Celkem i s pauzami</span>
          <b>≈ {formatMinutes(estimate.total)}</b>
          <span className="small">cvičení {formatMinutes(estimate.work)} + pauzy {formatMinutes(estimate.rest)}</span>
        </div>
      )}
      <button className="btn-hero" disabled={!valid} onClick={save}>Uložit trénink</button>
      {initial && (
        <button className="btn tap wide" onClick={() => {
          if (!window.confirm(`Smazat trénink ${initial.name}? Historie zůstane.`)) return;
          remove.mutate(initial.id);
          navigate("/m/trenink", { replace: true });
        }}>Smazat trénink</button>
      )}
      {picking && <ExercisePicker onClose={() => setPicking(false)} onPick={(e) => setItems((list) => [...list, { exercise_id: e.id, sets: 3 }])} />}
    </div>
  );
}
