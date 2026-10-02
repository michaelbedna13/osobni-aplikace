import { useState } from "react";
import { Sheet } from "../../components/Sheet";
import { normalize } from "../hlaskomat/data";
import { newCustomExercise, useAddExercise, useExercises } from "./data";
import { CATEGORY_NAMES, KIND_NAMES, type Exercise, type ExerciseCategory, type ExerciseKind } from "./exercises";

/** Výběr cviku z knihovny (vestavěné + vlastní), nebo založení vlastního. */
export function ExercisePicker({ onPick, onClose, exclude = [] }: { onPick: (e: Exercise) => void; onClose: () => void; exclude?: string[] }) {
  const { all } = useExercises();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const needle = normalize(search.trim());
  const visible = all.filter((e) => !exclude.includes(e.id) && normalize(e.name).includes(needle));

  if (creating) return <CustomExerciseForm initialName={search} onClose={onClose} onCreated={(e) => { onPick(e); onClose(); }} />;

  return (
    <Sheet title="Přidat cvik" onClose={onClose}>
      <input className="input" type="search" aria-label="Hledat cvik" placeholder="Hledat cvik" value={search} onChange={(e) => setSearch(e.target.value)} />
      {(Object.keys(CATEGORY_NAMES) as ExerciseCategory[]).map((cat) => {
        const items = visible.filter((e) => e.category === cat);
        if (!items.length) return null;
        return (
          <section key={cat}>
            <h3 className="history-label"><span>{CATEGORY_NAMES[cat]}</span></h3>
            <ul className="list">
              {items.map((e) => (
                <li key={e.id}>
                  <button className="list-btn" onClick={() => { onPick(e); onClose(); }}>
                    <span className="grow"><b>{e.name}</b><span className="occasion-kind">{KIND_NAMES[e.kind]}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {visible.length === 0 && <p className="empty">Takový cvik tu není.</p>}
      <button className="btn tap wide" onClick={() => setCreating(true)}>Vlastní cvik{search.trim() ? `: ${search.trim()}` : ""}</button>
    </Sheet>
  );
}

function CustomExerciseForm({ initialName, onClose, onCreated }: { initialName: string; onClose: () => void; onCreated: (e: Exercise) => void }) {
  const [name, setName] = useState(initialName.trim());
  const [kind, setKind] = useState<ExerciseKind>("weight_reps");
  const [category, setCategory] = useState<ExerciseCategory>("cinky");
  const [rest, setRest] = useState(90);
  const add = useAddExercise();
  const valid = name.trim().length > 0;

  const save = () => {
    const e = newCustomExercise({ name: name.trim(), kind, category, rest_s: rest });
    add.mutate(e);
    onCreated(e);
  };

  return (
    <Sheet title="Vlastní cvik" onClose={onClose}>
      <label htmlFor="ex-name" className="field-label">Název</label>
      <input id="ex-name" className="input" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
      <label htmlFor="ex-kind" className="field-label">Co se zapisuje</label>
      <select id="ex-kind" className="input" value={kind} onChange={(e) => setKind(e.target.value as ExerciseKind)}>
        {(Object.keys(KIND_NAMES) as ExerciseKind[]).map((k) => <option key={k} value={k}>{KIND_NAMES[k]}</option>)}
      </select>
      <label htmlFor="ex-cat" className="field-label">Skupina</label>
      <select id="ex-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value as ExerciseCategory)}>
        {(Object.keys(CATEGORY_NAMES) as ExerciseCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_NAMES[c]}</option>)}
      </select>
      <span className="field-label">Pauza po sérii</span>
      <div className="chips">
        {[30, 45, 60, 90, 120, 180].map((s) => (
          <button key={s} type="button" className={`chip${rest === s ? " on" : ""}`} aria-pressed={rest === s} onClick={() => setRest(s)}>
            {s < 60 ? `${s} s` : `${s / 60} min`}
          </button>
        ))}
      </div>
      <button className="btn dark tap wide" disabled={!valid} onClick={save}>Přidat cvik</button>
    </Sheet>
  );
}
