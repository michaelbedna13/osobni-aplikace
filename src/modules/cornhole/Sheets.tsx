import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Icon } from "../../components/Icon";
import { Sheet } from "../../components/Sheet";
import { usePeople } from "../lide/data";
import { TEAM_COLORS, useAddTeam, useDeleteTeam, useUpdateTeam, type Team } from "./data";
import { MODE_HINTS, MODE_NAMES, type Mode } from "./scoring";

/** Nový nebo upravovaný tým: název, barva pytlíků, hráči. onSaved / onDeleted dají vědět oknu nové hry. */
export function TeamSheet({ team, teams, onClose, onSaved, onDeleted }: {
  team: Team | null;
  teams: Team[];
  onClose: () => void;
  onSaved?: (team: Team) => void;
  onDeleted?: (id: string) => void;
}) {
  const [name, setName] = useState(team?.name ?? "");
  const [color, setColor] = useState(team?.color ?? TEAM_COLORS.find((c) => !teams.some((t) => t.color === c)) ?? TEAM_COLORS[0]);
  const [players, setPlayers] = useState<string[]>(team?.players ?? []);
  const [player, setPlayer] = useState("");
  const add = useAddTeam();
  const update = useUpdateTeam();
  const remove = useDeleteTeam();
  const { data: people = [] } = usePeople();

  // návrhy hráčů: lidé z modulu Lidé a hráči z ostatních týmů
  const suggestions = useMemo(() => {
    const names = new Set([...teams.flatMap((t) => t.players), ...people.map((p) => p.name)]);
    return [...names].filter((n) => !players.includes(n)).sort((a, b) => a.localeCompare(b, "cs")).slice(0, 16);
  }, [teams, people, players]);

  const addPlayer = (n: string) => {
    const clean = n.trim();
    if (clean && !players.includes(clean)) setPlayers((list) => [...list, clean]);
    setPlayer("");
  };

  const save = () => {
    const finalPlayers = player.trim() && !players.includes(player.trim()) ? [...players, player.trim()] : players;
    const saved: Team = team
      ? { ...team, name: name.trim(), color, players: finalPlayers }
      : { id: crypto.randomUUID(), name: name.trim(), color, players: finalPlayers, created_at: new Date().toISOString() };
    if (team) update.mutate(saved);
    else add.mutate(saved);
    onSaved?.(saved);
    onClose();
  };

  return (
    <Sheet title={team ? "Upravit tým" : "Nový tým"} onClose={onClose}>
      <label htmlFor="team-name" className="field-label">Název</label>
      <input id="team-name" className="input" maxLength={60} placeholder="Třeba Rodiče" value={name} onChange={(e) => setName(e.target.value)} />

      <span className="field-label">Barva pytlíků</span>
      <div className="swatches" role="radiogroup" aria-label="Barva">
        {TEAM_COLORS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c} className={`swatch${color === c ? " on" : ""}`} style={{ background: c }} onClick={() => setColor(c)} />
        ))}
      </div>

      <span className="field-label">Hráči</span>
      {players.length > 0 && (
        <div className="chips player-chips">
          {players.map((p) => (
            <button key={p} type="button" className="chip on" aria-label={`Odebrat ${p}`} onClick={() => setPlayers((list) => list.filter((x) => x !== p))}>{p} ×</button>
          ))}
        </div>
      )}
      <form className="inline-form" onSubmit={(e) => { e.preventDefault(); addPlayer(player); }}>
        <input className="input" aria-label="Jméno hráče" placeholder="Jméno hráče" maxLength={40} value={player} onChange={(e) => setPlayer(e.target.value)} />
        <button className="btn tap" type="submit" disabled={!player.trim()}>Přidat</button>
      </form>
      {suggestions.length > 0 && (
        <div className="chips">
          {suggestions.map((s) => <button key={s} type="button" className="chip" onClick={() => addPlayer(s)}>+ {s}</button>)}
        </div>
      )}

      <button className="btn dark tap wide" disabled={!name.trim()} onClick={save}>{team ? "Uložit" : "Přidat tým"}</button>
      {team && (
        <button className="btn tap wide" onClick={() => {
          if (!window.confirm(`Smazat tým ${team.name}? Odehrané hry zůstanou.`)) return;
          remove.mutate(team.id);
          onDeleted?.(team.id);
          onClose();
        }}>Smazat tým</button>
      )}
    </Sheet>
  );
}

/** Nastavení nové hry: kdo hraje a v jakém pořadí (přetažením za úchyt), způsob počítání a cíl.
 *  Týmy jde rovnou upravit nebo založit – okno týmu se otevře nad tímhle a po uložení se sem vrátí. */
export function NewGameSheet({ teams, initial, onClose, onStart }: {
  teams: Team[];
  /** Týmy minulé hry v jejich pořadí (výchozí výběr), jinak oba týmy, když jsou jen dva. */
  initial: string[];
  onClose: () => void;
  onStart: (teams: Team[], mode: Mode, target: number) => void;
}) {
  const [picked, setPicked] = useState<string[]>(() => {
    const prev = initial.filter((id) => teams.some((t) => t.id === id));
    return prev.length >= 2 ? prev : teams.length === 2 ? teams.map((t) => t.id) : [];
  });
  const [mode, setMode] = useState<Mode>("soucet");
  const [target, setTarget] = useState(21);
  const [editing, setEditing] = useState<{ team: Team | null } | null>(null);
  // nově založený tým, který ještě není v načteném seznamu (ukládá se na pozadí)
  const [fresh, setFresh] = useState<Team[]>([]);
  const all = [...teams, ...fresh.filter((f) => !teams.some((t) => t.id === f.id))];
  const chosen = picked.map((id) => all.find((t) => t.id === id)).filter((t): t is Team => !!t);
  const others = all.filter((t) => !picked.includes(t.id));

  // přetahování za úchyt: řádek jede s prstem, po přejetí půlky sousedního řádku se s ním prohodí
  const drag = useRef<{ id: string; y: number; h: number } | null>(null);
  const [dragging, setDragging] = useState<{ id: string; dy: number } | null>(null);
  const move = (id: string, by: number) => setPicked((list) => {
    const i = list.indexOf(id), j = Math.max(0, Math.min(list.length - 1, i + by));
    if (i < 0 || i === j) return list;
    const next = [...list];
    next.splice(i, 1);
    next.splice(j, 0, id);
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
    const i = picked.indexOf(d.id);
    if (dy > d.h / 2 && i < picked.length - 1) { move(d.id, 1); d.y += d.h; dy -= d.h; }
    else if (dy < -d.h / 2 && i > 0) { move(d.id, -1); d.y -= d.h; dy += d.h; }
    setDragging({ id: d.id, dy });
  };
  const onUp = () => { drag.current = null; setDragging(null); };
  const onKey = (id: string) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowUp") { e.preventDefault(); move(id, -1); }
    if (e.key === "ArrowDown") { e.preventDefault(); move(id, 1); }
  };

  const row = (t: Team) => (
    <>
      <span className="bag" style={{ background: t.color }} aria-hidden="true" />
      <span className="grow"><b>{t.name}</b>{t.players.length > 0 && <span className="occasion-kind">{t.players.join(", ")}</span>}</span>
    </>
  );

  return (
    <Sheet title="Nová hra" onClose={onClose}>
      <span className="field-label">Hrají (v pořadí házení)</span>
      {chosen.length === 0 ? <p className="small muted gt-empty">Přidej týmy ze seznamu níž nebo založ nový.</p> : (
        <ul className="list gt-list">
          {chosen.map((t, i) => (
            <li key={t.id} className={dragging?.id === t.id ? "dragging" : undefined} style={dragging?.id === t.id ? { transform: `translateY(${dragging.dy}px)` } : undefined}>
              <div className="gt-row">
                <button type="button" className="gt-handle" aria-label={`Přesunout ${t.name} (${i + 1}. v pořadí), šipkami nahoru a dolů`}
                  onPointerDown={onDown(t.id)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey(t.id)}>
                  <i /><i /><i />
                </button>
                {row(t)}
                <button type="button" className="gt-btn" aria-label={`Upravit ${t.name}`} onClick={() => setEditing({ team: t })}><Icon name="i-edit" size={18} /></button>
                <button type="button" className="gt-btn" aria-label={`Vyřadit ${t.name} z téhle hry`} onClick={() => setPicked((l) => l.filter((x) => x !== t.id))}>×</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {others.length > 0 && (
        <>
          <span className="field-label">Další týmy</span>
          <ul className="list gt-list">
            {others.map((t) => (
              <li key={t.id}>
                <div className="gt-row">
                  <button type="button" className="gt-add" onClick={() => setPicked((l) => [...l, t.id])} aria-label={`Přidat ${t.name} do hry`}>
                    {row(t)}
                    <span className="gt-btn plus" aria-hidden="true"><Icon name="i-plus" size={18} /></span>
                  </button>
                  <button type="button" className="gt-btn" aria-label={`Upravit ${t.name}`} onClick={() => setEditing({ team: t })}><Icon name="i-edit" size={18} /></button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <button type="button" className="btn tap wide" onClick={() => setEditing({ team: null })}><Icon name="i-plus" size={20} /> Nový tým</button>

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

      <button className="btn-hero" disabled={chosen.length < 2} onClick={() => onStart(chosen, mode, target)}>
        {chosen.length < 2 ? "Vyber aspoň 2 týmy" : "Hrát"}
      </button>

      {editing && (
        <TeamSheet team={editing.team} teams={all} onClose={() => setEditing(null)}
          onSaved={(t) => {
            if (editing.team) setFresh((l) => l.map((f) => (f.id === t.id ? t : f)));
            else { setFresh((l) => [...l, t]); setPicked((l) => [...l, t.id]); }
          }}
          onDeleted={(id) => { setPicked((l) => l.filter((x) => x !== id)); setFresh((l) => l.filter((f) => f.id !== id)); }} />
      )}
    </Sheet>
  );
}
