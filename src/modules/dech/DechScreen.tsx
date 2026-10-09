import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Burst } from "../../components/Burst";
import { Sheet } from "../../components/Sheet";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { Tabs } from "../../components/Tabs";
import { Topbar } from "../../components/Topbar";
import { relativeTime } from "../../lib/dates";
import { plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { unlockAudio } from "../../lib/sound";
import { computeBreathStats, useAddBreathSession, useBreathSessions, useDeleteBreathSession, type BreathSession } from "./data";
import { EXERCISES, EXERCISE_BY_KEY, type BreathExercise } from "./exercises";
import { RhythmPlayer, WimHofPlayer, type Result } from "./Player";

const MODULE = MODULE_BY_KEY.dech;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function DechScreen() {
  const { data: sessions = [], error } = useBreathSessions();
  const stats = useMemo(() => computeBreathStats(sessions), [sessions]);
  const add = useAddBreathSession();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<"cviceni" | "historie">("cviceni");
  const [detail, setDetail] = useState<BreathExercise | null>(null);
  const [running, setRunning] = useState<{ ex: BreathExercise; length: number; startedAt: string } | null>(null);
  const [burst, setBurst] = useState(0);

  // během cvičení bez spodní lišty (soustředění, nic nepřekrývá tlačítka)
  useEffect(() => {
    document.documentElement.classList.toggle("focus-mode", !!running);
    return () => document.documentElement.classList.remove("focus-mode");
  }, [running]);

  // ?cviceni=krabice z karty na Dnes
  useEffect(() => {
    const k = params.get("cviceni");
    if (!k) return;
    setParams({}, { replace: true });
    if (EXERCISE_BY_KEY[k]) setDetail(EXERCISE_BY_KEY[k]);
  }, [params, setParams]);

  const onDone = useCallback((r: Result) => {
    if (!running) return;
    if (r.duration_s >= 20) {
      add.mutate({ id: crypto.randomUUID(), exercise: running.ex.key, started_at: running.startedAt, created_at: new Date().toISOString(), ...r });
      toast.show(r.holds.length ? `Hotovo. Nejdelší zadržení ${clock(Math.max(...r.holds))}` : `Hotovo, ${Math.max(1, Math.round(r.duration_s / 60))} min dýchání`);
      setBurst((b) => b + 1);
    }
    setRunning(null);
  }, [running, add, toast]);

  if (running) {
    const props = { exercise: running.ex, onDone, onCancel: () => setRunning(null) };
    return (
      <div className="screen module breath-screen" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
        {running.ex.key === "wimhof" ? <WimHofPlayer {...props} rounds={running.length} /> : <RhythmPlayer {...props} minutes={running.length} />}
      </div>
    );
  }

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar title="Dechová cvičení" />
        <div className="hero">
          <span className="icon-slot"><Icon name="dech" size={96} /></span>
          <Burst trigger={burst} />
          <span className="hero-num">{stats.weekMinutes}</span>
          <span className="hero-cap">{plural(stats.weekMinutes, ["minuta", "minuty", "minut"])} tento týden</span>
          <p className="hero-line">{stats.bestHold ? `Nejdelší zadržení dechu ${clock(stats.bestHold)}` : `${stats.weekCount}× tento týden`}</p>
        </div>
      </div>

      {error && <p className="error">Nepodařilo se načíst historii. Zkontroluj připojení.</p>}

      <Tabs label="Zobrazení" value={tab} onChange={setTab} items={[{ id: "cviceni", label: "Cvičení" }, { id: "historie", label: "Historie" }]} />

      {tab === "cviceni" && (
        <ul className="breath-list">
          {EXERCISES.map((e) => (
            <li key={e.key}>
              <button className="breath-card" onClick={() => setDetail(e)}>
                <span className="breath-pattern">{e.pattern}</span>
                <span className="grow">
                  <b>{e.name}</b>
                  <span className="occasion-kind">{e.for}</span>
                </span>
                <Icon name="i-play" size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {tab === "historie" && (
        <div className="tab-panel">
          {sessions.length === 0 ? <p className="empty">Zatím nic. Začni třeba krabicovým dýcháním na 4 minuty.</p> : (
            <ul className="list">
              {sessions.slice(0, 60).map((s) => <HistoryRow key={s.id} s={s} />)}
            </ul>
          )}
        </div>
      )}

      {detail && (
        <DetailSheet
          exercise={detail}
          onClose={() => setDetail(null)}
          onStart={(length) => { unlockAudio(); setDetail(null); setRunning({ ex: detail, length, startedAt: new Date().toISOString() }); }}
        />
      )}
      {toast.element}
    </div>
  );
}

function HistoryRow({ s }: { s: BreathSession }) {
  const remove = useDeleteBreathSession();
  const ex = EXERCISE_BY_KEY[s.exercise];
  return (
    <li>
      <button className="list-btn" onClick={() => window.confirm("Smazat záznam?") && remove.mutate(s.id)}>
        <span className="grow">
          <b>{ex?.name ?? s.exercise}</b>
          <span className="occasion-kind">{relativeTime(new Date(s.started_at))} · {clock(s.duration_s)}{s.holds?.length ? ` · zadržení ${s.holds.map(clock).join(", ")}` : ""}</span>
        </span>
      </button>
    </li>
  );
}

function DetailSheet({ exercise, onClose, onStart }: { exercise: BreathExercise; onClose: () => void; onStart: (length: number) => void }) {
  const [length, setLength] = useState(exercise.defaultLength);
  return (
    <Sheet title={exercise.name} onClose={onClose}>
      <p className="small muted">{exercise.for} · rytmus {exercise.pattern}</p>
      <ol className="steps">{exercise.how.map((h) => <li key={h}>{h}</li>)}</ol>
      <p className="small breath-why">{exercise.why}</p>
      {exercise.caution && <p className="breath-caution">{exercise.caution}</p>}
      <span className="field-label">{exercise.unit === "kol" ? "Počet kol" : "Délka"}</span>
      <div className="chips">
        {exercise.lengths.map((l) => (
          <button key={l} className={`chip${length === l ? " on" : ""}`} aria-pressed={length === l} onClick={() => setLength(l)}>
            {l} {exercise.unit === "kol" ? plural(l, ["kolo", "kola", "kol"]) : "min"}
          </button>
        ))}
      </div>
      <button className="btn-hero" onClick={() => onStart(length)}><Icon name="i-play" size={24} /> Začít</button>
    </Sheet>
  );
}
