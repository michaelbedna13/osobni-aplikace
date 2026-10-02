import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet } from "../../components/Sheet";
import { authorRanking, normalize, useQuotes } from "../hlaskomat/data";
import {
  namedayFor, newIdea, newPerson, useAddIdea, useAddPerson, useDeleteIdea, useDeletePerson, useUpdateIdea, useUpdatePerson,
  type GiftIdea, type Person,
} from "./data";

export const MONTHS = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
const MONTH_NAMES = ["leden", "únor", "březen", "duben", "květen", "červen", "červenec", "srpen", "září", "říjen", "listopad", "prosinec"];

/** „12. 5.“ z „05-12“ */
export const formatNameday = (md: string) => {
  const [m, d] = md.split("-").map(Number);
  return `${d}. ${m}.`;
};

/** Přidání nebo úprava člověka. */
export function PersonSheet({ person, people, onClose, onSaved }: {
  person: Person | null;
  people: Person[];
  onClose: () => void;
  onSaved?: (p: Person) => void;
}) {
  const [name, setName] = useState(person?.name ?? "");
  const [day, setDay] = useState(person?.birth_day ? String(person.birth_day) : "");
  const [month, setMonth] = useState(person?.birth_month ? String(person.birth_month) : "");
  const [year, setYear] = useState(person?.birth_year ? String(person.birth_year) : "");
  const [useNameday, setUseNameday] = useState(person ? person.nameday !== null : true);
  const [note, setNote] = useState(person?.note ?? "");
  const add = useAddPerson();
  const update = useUpdatePerson();
  const remove = useDeletePerson();
  const navigate = useNavigate();
  const { data: quotes = [] } = useQuotes();

  // autoři hlášek, kteří ještě nejsou mezi lidmi
  const authors = useMemo(() => {
    const known = new Set(people.map((p) => normalize(p.name)));
    return authorRanking(quotes).map((r) => r.author).filter((a) => !known.has(normalize(a))).slice(0, 12);
  }, [quotes, people]);

  const nameday = person?.nameday && normalize(person.name.split(" ")[0]) === normalize(name.trim().split(" ")[0]) ? person.nameday : namedayFor(name);
  const yearNum = year ? Number(year) : null;
  const dayValid = !day === !month && (!day || Number(day) <= new Date(2000, Number(month), 0).getDate());
  const yearValid = yearNum === null || (Number.isInteger(yearNum) && yearNum >= 1900 && yearNum <= new Date().getFullYear());
  const valid = name.trim().length > 0 && dayValid && yearValid;

  const save = () => {
    const fields = {
      name: name.trim(),
      birth_day: day ? Number(day) : null,
      birth_month: month ? Number(month) : null,
      birth_year: day ? yearNum : null,
      nameday: useNameday ? nameday : null,
      note: note.trim() || null,
    };
    if (person) {
      update.mutate({ ...person, ...fields });
      onSaved?.({ ...person, ...fields });
    } else {
      const p = newPerson(fields);
      add.mutate(p);
      onSaved?.(p);
    }
    onClose();
  };

  return (
    <Sheet title={person ? "Upravit" : "Nový člověk"} onClose={onClose}>
      <label htmlFor="person-name" className="field-label">Jméno</label>
      <input id="person-name" className="input" value={name} maxLength={80} autoComplete="off" onChange={(e) => setName(e.target.value)} />
      {!person && authors.length > 0 && (
        <div className="chips" aria-label="Z Hláškomatu">
          {authors.map((a) => <button key={a} type="button" className="chip" onClick={() => setName(a)}>{a}</button>)}
        </div>
      )}

      <span className="field-label">Narozeniny</span>
      <div className="date-fields">
        <select className="input" aria-label="Den" value={day} onChange={(e) => setDay(e.target.value)}>
          <option value="">Den</option>
          {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}.</option>)}
        </select>
        <select className="input" aria-label="Měsíc" value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">Měsíc</option>
          {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <input className="input" aria-label="Rok (nepovinný)" placeholder="Rok" inputMode="numeric" maxLength={4} value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))} />
      </div>
      {!dayValid && <p className="error">Vyber den i měsíc (a takový den, který v měsíci je).</p>}
      {!yearValid && <p className="error">Rok zadej celý, třeba 1996.</p>}

      {nameday && (
        <label className="check">
          <input type="checkbox" checked={useNameday} onChange={(e) => setUseNameday(e.target.checked)} />
          Slaví jmeniny {formatNameday(nameday)}
        </label>
      )}

      <label htmlFor="person-note" className="field-label">Poznámka</label>
      <textarea id="person-note" className="input" rows={2} maxLength={1000} placeholder="Velikost trička, co nesnáší…" value={note} onChange={(e) => setNote(e.target.value)} />

      <button className="btn dark tap wide" disabled={!valid} onClick={save}>{person ? "Uložit" : "Přidat"}</button>
      {person && (
        <button className="btn tap wide" onClick={() => {
          if (!window.confirm(`Smazat ${person.name} i s nápady na dárky?`)) return;
          remove.mutate(person.id);
          onClose();
          navigate("/m/lide", { replace: true });
        }}>Smazat</button>
      )}
    </Sheet>
  );
}

/** Nový nebo upravovaný nápad na dárek. */
export function IdeaSheet({ idea, people, personId, onClose }: {
  idea: GiftIdea | null;
  people: Person[];
  personId?: string;
  onClose: () => void;
}) {
  const [text, setText] = useState(idea?.text ?? "");
  const [url, setUrl] = useState(idea?.url ?? "");
  const [who, setWho] = useState(idea?.person_id ?? personId ?? "");
  const add = useAddIdea();
  const update = useUpdateIdea();
  const remove = useDeleteIdea();
  const valid = text.trim().length > 0 && who !== "";

  const save = () => {
    const link = url.trim() || null;
    if (idea) update.mutate({ ...idea, text: text.trim(), url: link });
    else add.mutate(newIdea(who, text, link));
    onClose();
  };

  return (
    <Sheet title={idea ? "Upravit nápad" : "Nápad na dárek"} onClose={onClose}>
      {!idea && !personId && (
        <>
          <label htmlFor="idea-who" className="field-label">Pro koho</label>
          <select id="idea-who" className="input" value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="">Vyber…</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </>
      )}
      <label htmlFor="idea-text" className="field-label">Nápad</label>
      <input id="idea-text" className="input" value={text} maxLength={300} placeholder="Třeba lístky na koncert" onChange={(e) => setText(e.target.value)} />
      <label htmlFor="idea-url" className="field-label">Odkaz (nepovinný)</label>
      <input id="idea-url" className="input" type="url" inputMode="url" value={url} placeholder="https://…" onChange={(e) => setUrl(e.target.value)} />
      <button className="btn dark tap wide" disabled={!valid} onClick={save}>{idea ? "Uložit" : "Přidat nápad"}</button>
      {idea && <button className="btn tap wide" onClick={() => { remove.mutate(idea.id); onClose(); }}>Smazat nápad</button>}
    </Sheet>
  );
}
