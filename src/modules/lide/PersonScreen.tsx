import { useMemo, useState, type CSSProperties } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { Topbar } from "../../components/Topbar";
import { MODULE_BY_KEY } from "../../lib/modules";
import { newIdea, upcomingOccasions, useAddIdea, useGiftIdeas, usePeople, useUpdateIdea, type GiftIdea } from "./data";
import { IdeaList, occasionLabel, whenLabel } from "./LideScreen";
import { IdeaSheet, MONTHS, PersonSheet, formatNameday } from "./Sheets";

const MODULE = MODULE_BY_KEY.lide;

export function PersonScreen() {
  const { id } = useParams();
  const { data: people = [], isLoading } = usePeople();
  const { data: ideas = [] } = useGiftIdeas();
  const person = people.find((p) => p.id === id);
  const [editing, setEditing] = useState(false);
  const [idea, setIdea] = useState<GiftIdea | null>(null);
  const [text, setText] = useState("");
  const [showGiven, setShowGiven] = useState(false);
  const add = useAddIdea();
  const update = useUpdateIdea();
  const occasions = useMemo(() => (person ? upcomingOccasions([person]) : []), [person]);

  if (!person) return isLoading ? <div className="screen" /> : <Navigate to="/m/lide" replace />;

  const mine = ideas.filter((i) => i.person_id === person.id);
  const open = mine.filter((i) => !i.given_at);
  const given = mine.filter((i) => i.given_at);
  const addIdea = () => {
    if (!text.trim()) return;
    add.mutate(newIdea(person.id, text));
    setText("");
  };

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <Topbar title={person.name} back="/m/lide" right={
        <button className="link" onClick={() => setEditing(true)}>Upravit</button>
      } />

      <div className="panel person-facts">
        <div>
          <span className="muted small">Narozeniny</span>
          <b>{person.birth_day && person.birth_month ? `${person.birth_day}. ${MONTHS[person.birth_month - 1]}${person.birth_year ? ` ${person.birth_year}` : ""}` : "–"}</b>
        </div>
        <div>
          <span className="muted small">Svátek</span>
          <b>{person.nameday ? formatNameday(person.nameday) : "–"}</b>
        </div>
      </div>
      {occasions.length > 0 && (
        <ul className="plan person-next">
          {occasions.map((o) => <li key={o.kind}><Icon name={o.kind === "narozeniny" ? "lide" : "star"} size={20} />{occasionLabel(o)} {whenLabel(o.days).toLowerCase()}</li>)}
        </ul>
      )}
      {person.note && <p className="person-note">{person.note}</p>}

      <section className="sec">
        <h2>Nápady na dárky</h2>
        <form className="inline-form" onSubmit={(e) => { e.preventDefault(); addIdea(); }}>
          <input className="input" aria-label="Nový nápad" placeholder="Nový nápad…" maxLength={300} value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn dark tap" type="submit" disabled={!text.trim()}>Přidat</button>
        </form>
        {open.length > 0 ? (
          <IdeaList ideas={open} onEdit={setIdea} onGiven={(i) => update.mutate({ ...i, given_at: new Date().toISOString() })} />
        ) : <p className="empty">Zatím žádný nápad.</p>}
        {given.length > 0 && (
          <>
            <button className="link" onClick={() => setShowGiven((s) => !s)}>{showGiven ? "Skrýt" : "Ukázat"} už dané ({given.length})</button>
            {showGiven && <IdeaList ideas={given} onEdit={setIdea} onGiven={(i) => update.mutate({ ...i, given_at: null })} givenLabel="Vrátit" />}
          </>
        )}
      </section>

      {editing && <PersonSheet person={person} people={people} onClose={() => setEditing(false)} />}
      {idea && <IdeaSheet idea={idea} people={people} onClose={() => setIdea(null)} />}
    </div>
  );
}
