import { useState, type CSSProperties } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Sprite } from "../../components/Sprite";
import { Topbar } from "../../components/Topbar";
import { MODULE_BY_KEY } from "../../lib/modules";
import { useAddTemplate, useDeleteTemplate, useExercises, useTemplates, useUpdateTemplate, type TemplateItem } from "./data";
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

function Editor({ initial }: { initial: { id: string; name: string; items: TemplateItem[]; created_at: string } | null }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [items, setItems] = useState<TemplateItem[]>(initial?.items ?? []);
  const [picking, setPicking] = useState(false);
  const { byId } = useExercises();
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
    const t = { id: initial?.id ?? crypto.randomUUID(), name: name.trim(), items, created_at: initial?.created_at ?? new Date().toISOString() };
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
      {items.length === 0 ? <p className="empty">Zatím žádné cviky.</p> : (
        <ol className="tpl-list">
          {items.map((it, i) => (
            <li key={`${it.exercise_id}-${i}`} className="tpl-item">
              <div className="tpl-order">
                <button className="icon-btn" aria-label="Posunout nahoru" disabled={i === 0} onClick={() => move(i, -1)}><Sprite name="i-up" size={16} /></button>
                <button className="icon-btn" aria-label="Posunout dolů" disabled={i === items.length - 1} onClick={() => move(i, 1)}><Sprite name="i-down" size={16} /></button>
              </div>
              <div className="grow">
                <b>{byId.get(it.exercise_id)?.name ?? "Smazaný cvik"}</b>
                <div className="tpl-sets">
                  <button className="icon-btn" aria-label="Méně sérií" disabled={it.sets <= 1} onClick={() => change(i, { sets: it.sets - 1 })}>−</button>
                  <span>{it.sets} {it.sets === 1 ? "série" : it.sets < 5 ? "série" : "sérií"}</span>
                  <button className="icon-btn" aria-label="Více sérií" disabled={it.sets >= 10} onClick={() => change(i, { sets: it.sets + 1 })}>+</button>
                </div>
              </div>
              <button className="link" onClick={() => setItems((list) => list.filter((_, j) => j !== i))}>Odebrat</button>
            </li>
          ))}
        </ol>
      )}
      <button className="btn tap wide" onClick={() => setPicking(true)}><Sprite name="i-plus" size={20} /> Přidat cvik</button>
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
