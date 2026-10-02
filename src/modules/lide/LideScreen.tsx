import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Sprite } from "../../components/Sprite";
import { Tabs } from "../../components/Tabs";
import { Topbar } from "../../components/Topbar";
import { WEEKDAYS_SHORT } from "../../lib/dates";
import { plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { upcomingOccasions, useGiftIdeas, usePeople, useUpdateIdea, type GiftIdea, type Occasion, type Person } from "./data";
import { buildIcs, shareIcs } from "./ics";
import { IdeaSheet, MONTHS, PersonSheet, formatNameday } from "./Sheets";

const MODULE = MODULE_BY_KEY.lide;
const DNI: [string, string, string] = ["den", "dny", "dní"];

export const whenLabel = (days: number) => (days === 0 ? "Dnes" : days === 1 ? "Zítra" : `za ${days} ${plural(days, DNI)}`);
export const occasionLabel = (o: Occasion) =>
  o.kind === "narozeniny" ? (o.age ? `${o.age}. narozeniny` : "narozeniny") : "svátek";

/** Řádek oslavy: datum v bloku, jméno, co slaví a kdy. */
export function OccasionRow({ o }: { o: Occasion }) {
  return (
    <li>
      <Link to={`/m/lide/${o.person.id}`} className={`list-btn occasion${o.days === 0 ? " today" : ""}`}>
        <span className="date-badge" aria-hidden="true">
          <b>{o.date.getDate()}.</b>
          <span>{WEEKDAYS_SHORT[(o.date.getDay() + 6) % 7]}</span>
        </span>
        <span className="grow">
          <b>{o.person.name}</b>
          <span className="occasion-kind">{occasionLabel(o)}</span>
        </span>
        <span className="occasion-when">{whenLabel(o.days)}</span>
      </Link>
    </li>
  );
}

function birthdayText(p: Person) {
  if (!p.birth_day || !p.birth_month) return p.nameday ? `svátek ${formatNameday(p.nameday)}` : "bez data";
  return `${p.birth_day}. ${MONTHS[p.birth_month - 1]}${p.birth_year ? ` ${p.birth_year}` : ""}`;
}

export function LideScreen() {
  const { data: people = [], isLoading, error } = usePeople();
  const { data: ideas = [] } = useGiftIdeas();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<"oslavy" | "lide" | "darky">("oslavy");
  const [sheet, setSheet] = useState<{ kind: "person" } | { kind: "idea"; idea: GiftIdea | null } | null>(null);
  const [icsState, setIcsState] = useState<string | null>(null);
  const update = useUpdateIdea();

  const occasions = useMemo(() => upcomingOccasions(people), [people]);
  const next = occasions[0];
  const openIdeas = ideas.filter((i) => !i.given_at);
  const now = new Date();
  const thisMonth = occasions.filter((o) => o.date.getMonth() === now.getMonth() && o.date.getFullYear() === now.getFullYear()).length;
  const ideasFor = (id: string) => openIdeas.filter((i) => i.person_id === id);

  // ?napad=1 z karty na obrazovce Dnes, ?nova=1 = nový člověk
  useEffect(() => {
    if (isLoading) return;
    if (params.has("napad")) setSheet(people.length ? { kind: "idea", idea: null } : { kind: "person" });
    else if (params.has("nova")) setSheet({ kind: "person" });
    else return;
    setParams({}, { replace: true });
  }, [params, setParams, isLoading, people.length]);

  const exportIcs = async () => {
    await shareIcs(buildIcs(people));
    setIcsState("Otevři soubor a v Kalendáři potvrď „Přidat vše“.");
  };

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar title="Lidé a dárky" />
        <div className="hero">
          <span className="sprite-tile"><Sprite name="lide" size={96} /></span>
          {next ? (
            <>
              <span className="hero-num">{next.days === 0 ? "Dnes" : next.days}</span>
              <span className="hero-cap">{next.days === 0 ? "se slaví!" : `${plural(next.days, DNI)} do oslavy`}</span>
              <p className="hero-line">{next.person.name} · {occasionLabel(next)}</p>
            </>
          ) : (
            <>
              <span className="hero-num">{people.length}</span>
              <span className="hero-cap">{plural(people.length, ["člověk", "lidé", "lidí"])}</span>
              <p className="hero-line">Přidej narozeniny a nic ti neuteče.</p>
            </>
          )}
        </div>
        <button className="btn-hero" onClick={() => setSheet({ kind: "person" })}>
          <Sprite name="i-plus" size={24} /> Přidat člověka
        </button>
      </div>

      {error && <p className="error">Nepodařilo se načíst data. Zkontroluj připojení.</p>}

      <div className="score">
        <div><b>{people.length}</b><span>{plural(people.length, ["člověk", "lidé", "lidí"])}</span></div>
        <div><b>{openIdeas.length}</b><span>{plural(openIdeas.length, ["nápad", "nápady", "nápadů"])}</span></div>
        <div><b>{thisMonth}</b><span>{plural(thisMonth, ["oslava", "oslavy", "oslav"])} v měsíci</span></div>
      </div>

      <Tabs label="Zobrazení" value={tab} onChange={setTab} items={[{ id: "oslavy", label: "Oslavy" }, { id: "lide", label: "Lidé" }, { id: "darky", label: "Dárky" }]} />

      {tab === "oslavy" && (
        <div className="tab-panel">
          {occasions.length === 0 ? <p className="empty">Zatím žádné oslavy. Přidej člověka s narozeninami.</p> : (
            <>
              <ul className="list">
                {occasions.filter((o) => o.days <= 62).map((o) => <OccasionRow key={`${o.person.id}-${o.kind}`} o={o} />)}
              </ul>
              {occasions.some((o) => o.days > 62) && <p className="small muted">Později v roce ještě {occasions.filter((o) => o.days > 62).length} {plural(occasions.filter((o) => o.days > 62).length, ["oslava", "oslavy", "oslav"])}.</p>}
              <div className="panel">
                <h3>Připomínky v iPhonu</h3>
                <p className="small">Přidá narozeniny a svátky do Kalendáře. Připomene se den předem v 9:00. Po přidání nových lidí to zopakuj.</p>
                <button className="btn tap wide" onClick={exportIcs}><Sprite name="i-up" size={20} /> Přidat do Kalendáře</button>
                {icsState && <p className="small note-ok">{icsState}</p>}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "lide" && (
        <div className="tab-panel">
          {people.length === 0 ? <p className="empty">Nikdo tu zatím není.</p> : (
            <ul className="list">
              {people.map((p) => (
                <li key={p.id}>
                  <Link to={`/m/lide/${p.id}`} className="list-btn">
                    <span className="grow"><b>{p.name}</b><span className="occasion-kind">{birthdayText(p)}</span></span>
                    {ideasFor(p.id).length > 0 && <span className="count-badge"><Sprite name="lide" size={16} />{ideasFor(p.id).length}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "darky" && (
        <div className="tab-panel">
          <button className="btn tap wide" disabled={people.length === 0} onClick={() => setSheet({ kind: "idea", idea: null })}>
            <Sprite name="i-plus" size={20} /> Nápad na dárek
          </button>
          {openIdeas.length === 0 ? <p className="empty">Žádné nápady. Až tě něco napadne, hned to sem hoď.</p> : (
            people.filter((p) => ideasFor(p.id).length).map((p) => (
              <section key={p.id}>
                <h3 className="history-label"><Link to={`/m/lide/${p.id}`}>{p.name}</Link><span className="muted">{ideasFor(p.id).length}×</span></h3>
                <IdeaList ideas={ideasFor(p.id)} onEdit={(idea) => setSheet({ kind: "idea", idea })} onGiven={(idea) => update.mutate({ ...idea, given_at: new Date().toISOString() })} />
              </section>
            ))
          )}
        </div>
      )}

      {sheet?.kind === "person" && <PersonSheet person={null} people={people} onClose={() => setSheet(null)} />}
      {sheet?.kind === "idea" && <IdeaSheet idea={sheet.idea} people={people} onClose={() => setSheet(null)} />}
    </div>
  );
}

/** Seznam nápadů s tlačítkem „Dáno“ (nebo „Vrátit“ u daných). */
export function IdeaList({ ideas, onEdit, onGiven, givenLabel = "Dáno" }: {
  ideas: GiftIdea[];
  onEdit: (idea: GiftIdea) => void;
  onGiven: (idea: GiftIdea) => void;
  givenLabel?: string;
}) {
  return (
    <ul className="list">
      {ideas.map((idea) => (
        <li key={idea.id} className="idea-row">
          <button className="list-btn thanks-item" onClick={() => onEdit(idea)} aria-label={`Upravit nápad: ${idea.text}`}>
            <span className="grow">
              {idea.text}
              {idea.url && <span className="occasion-kind">{idea.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}</span>}
            </span>
          </button>
          {idea.url && <a className="idea-link" href={idea.url} target="_blank" rel="noreferrer" aria-label="Otevřít odkaz"><Sprite name="i-up" size={18} /></a>}
          <button className="idea-given" onClick={() => onGiven(idea)}>{givenLabel}</button>
        </li>
      ))}
    </ul>
  );
}
