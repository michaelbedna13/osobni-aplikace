import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Icon } from "../../components/Icon";
import { Sheet } from "../../components/Sheet";
import { TEAM_COLORS, useCornholePlayers, type GameTeam } from "./data";
import { MODE_HINTS, MODE_NAMES, type Mode } from "./scoring";

const MAX_TEAMS = TEAM_COLORS.length;

const blank = (taken: string[], n: number): GameTeam => ({
  team_id: crypto.randomUUID(),
  name: "",
  color: TEAM_COLORS.find((c) => !taken.includes(c)) ?? TEAM_COLORS[n % TEAM_COLORS.length],
  players: [],
});
const twoBlank = () => { const a = blank([], 0); return [a, blank([a.color], 1)]; };
const parsePlayers = (text: string) => [...new Set(text.split(",").map((p) => p.trim()).filter(Boolean))];

/** Nastavení nové hry: týmy jen pro tuhle hru (název, barva pytlíků, nepovinně hráči), pořadí házení přetažením
 *  za úchyt, způsob počítání a cíl. Týmy se neukládají – každá hra si je nese s sebou. */
export function NewGameSheet({ last, onClose, onStart }: {
  /** Týmy minulé hry pro tlačítko „Jako minule“. */
  last: GameTeam[] | null;
  onClose: () => void;
  onStart: (teams: GameTeam[], mode: Mode, target: number) => void;
}) {
  const [teams, setTeams] = useState<GameTeam[]>(twoBlank);
  // hráči jako text (oddělení čárkou), převede se až při startu
  const [playersText, setPlayersText] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<Mode>("soucet");
  const [target, setTarget] = useState(21);
  const known = useCornholePlayers();

  const patch = (id: string, p: Partial<GameTeam>) => setTeams((l) => l.map((t) => (t.team_id === id ? { ...t, ...p } : t)));
  const nextColor = (t: GameTeam) => {
    const taken = teams.filter((x) => x.team_id !== t.team_id).map((x) => x.color);
    const free = TEAM_COLORS.filter((c) => !taken.includes(c));
    const pool = free.length ? free : TEAM_COLORS;
    patch(t.team_id, { color: pool[(pool.indexOf(t.color) + 1) % pool.length] });
  };
  const sameAsLast = () => {
    if (!last) return;
    const copy = last.map((t) => ({ ...t, team_id: crypto.randomUUID() }));
    setTeams(copy);
    setPlayersText(Object.fromEntries(copy.map((t) => [t.team_id, t.players.join(", ")])));
  };

  // přetahování za úchyt: řádek jede s prstem, po přejetí půlky sousedního týmu se s ním prohodí
  const drag = useRef<{ id: string; y: number; h: number } | null>(null);
  const [dragging, setDragging] = useState<{ id: string; dy: number } | null>(null);
  const move = (id: string, by: number) => setTeams((list) => {
    const i = list.findIndex((t) => t.team_id === id), j = Math.max(0, Math.min(list.length - 1, i + by));
    if (i < 0 || i === j) return list;
    const next = [...list];
    const [item] = next.splice(i, 1);
    next.splice(j, 0, item);
    return next;
  });
  const onDown = (id: string) => (e: PointerEvent<HTMLButtonElement>) => {
    const row = e.currentTarget.closest("li");
    if (!row) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id, y: e.clientY, h: row.getBoundingClientRect().height };
    setDragging({ id, dy: 0 });
  };
  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    let dy = e.clientY - d.y;
    const i = teams.findIndex((t) => t.team_id === d.id);
    if (dy > d.h / 2 && i < teams.length - 1) { move(d.id, 1); d.y += d.h; dy -= d.h; }
    else if (dy < -d.h / 2 && i > 0) { move(d.id, -1); d.y -= d.h; dy += d.h; }
    setDragging({ id: d.id, dy });
  };
  const onUp = () => { drag.current = null; setDragging(null); };
  const onKey = (id: string) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowUp") { e.preventDefault(); move(id, -1); }
    if (e.key === "ArrowDown") { e.preventDefault(); move(id, 1); }
  };

  const start = () => onStart(
    teams.map((t, i) => ({ ...t, name: t.name.trim() || `Tým ${i + 1}`, players: parsePlayers(playersText[t.team_id] ?? "") })),
    mode, target,
  );

  return (
    <Sheet title="Nová hra" onClose={onClose}>
      <div className="row-between gt-head">
        <span className="field-label">Týmy (v pořadí házení)</span>
        {last && <button type="button" className="link" onClick={sameAsLast}>Jako minule</button>}
      </div>
      <ul className="list gt-list">
        {teams.map((t, i) => (
          <li key={t.team_id} className={dragging?.id === t.team_id ? "dragging" : undefined} style={dragging?.id === t.team_id ? { transform: `translateY(${dragging.dy}px)` } : undefined}>
            <div className="gt-row">
              <button type="button" className="gt-handle" aria-label={`Přesunout tým ${i + 1}, šipkami nahoru a dolů`}
                onPointerDown={onDown(t.team_id)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey(t.team_id)}>
                <i /><i /><i />
              </button>
              <button type="button" className="bag gt-color" style={{ background: t.color }} aria-label={`Barva týmu ${i + 1}, ťuknutím změnit`} onClick={() => nextColor(t)} />
              <span className="grow gt-fields">
                <input className="gt-name" aria-label={`Název týmu ${i + 1}`} placeholder={`Tým ${i + 1}`} maxLength={40} value={t.name} onChange={(e) => patch(t.team_id, { name: e.target.value })} />
                <input className="gt-players" aria-label={`Hráči týmu ${i + 1}`} placeholder="Hráči (nepovinné)" maxLength={120} list="ch-players"
                  value={playersText[t.team_id] ?? ""} onChange={(e) => setPlayersText((m) => ({ ...m, [t.team_id]: e.target.value }))} />
              </span>
              {teams.length > 2 && (
                <button type="button" className="gt-btn" aria-label={`Odebrat tým ${i + 1}`} onClick={() => setTeams((l) => l.filter((x) => x.team_id !== t.team_id))}>×</button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <datalist id="ch-players">{known.map((p) => <option key={p} value={p} />)}</datalist>
      {teams.length < MAX_TEAMS && (
        <button type="button" className="btn tap wide" onClick={() => setTeams((l) => [...l, blank(l.map((x) => x.color), l.length)])}>
          <Icon name="i-plus" size={20} /> Přidat tým
        </button>
      )}

      <span className="field-label">Počítání bodů</span>
      <div className="seg seg-wide" role="group" aria-label="Počítání bodů">
        {(["soucet", "rozdil"] as Mode[]).map((m) => (
          <button key={m} className={`seg-btn${mode === m ? " on" : ""}`} aria-pressed={mode === m} onClick={() => setMode(m)}>{MODE_NAMES[m]}</button>
        ))}
      </div>
      <p className="small muted mode-hint">{MODE_HINTS[mode]}</p>

      <span className="field-label">Hraje se do</span>
      <div className="stepper">
        <button className="icon-btn big tap" aria-label="Méně" disabled={target <= 5} onClick={() => setTarget((v) => v - 1)}>−</button>
        <span className="stepper-value" aria-live="polite">{target}</span>
        <button className="icon-btn big tap" aria-label="Více" disabled={target >= 99} onClick={() => setTarget((v) => v + 1)}>+</button>
      </div>

      <button className="btn-hero" onClick={start}>Hrát</button>
    </Sheet>
  );
}
