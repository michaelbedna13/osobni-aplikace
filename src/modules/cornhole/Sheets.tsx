import { useMemo, useState } from "react";
import { Sheet } from "../../components/Sheet";
import { usePeople } from "../lide/data";
import { TEAM_COLORS, useAddTeam, useDeleteTeam, useUpdateTeam, type Team } from "./data";
import { MODE_HINTS, MODE_NAMES, type Mode } from "./scoring";

/** Nový nebo upravovaný tým: název, barva pytlíků, hráči. */
export function TeamSheet({ team, teams, onClose }: { team: Team | null; teams: Team[]; onClose: () => void }) {
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
    if (team) update.mutate({ ...team, name: name.trim(), color, players: finalPlayers });
    else add.mutate({ id: crypto.randomUUID(), name: name.trim(), color, players: finalPlayers, created_at: new Date().toISOString() });
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
          onClose();
        }}>Smazat tým</button>
      )}
    </Sheet>
  );
}

/** Nastavení nové hry: týmy, způsob počítání a cíl. */
export function NewGameSheet({ teams, onClose, onStart, onNewTeam }: {
  teams: Team[];
  onClose: () => void;
  onStart: (teams: Team[], mode: Mode, target: number) => void;
  onNewTeam: () => void;
}) {
  const [picked, setPicked] = useState<string[]>(teams.length === 2 ? teams.map((t) => t.id) : []);
  const [mode, setMode] = useState<Mode>("soucet");
  const [target, setTarget] = useState(21);
  const chosen = picked.map((id) => teams.find((t) => t.id === id)).filter((t): t is Team => !!t);
  const toggle = (id: string) => setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  return (
    <Sheet title="Nová hra" onClose={onClose}>
      <span className="field-label">Kdo hraje (v pořadí házení)</span>
      {teams.length === 0 ? <p className="empty">Nejdřív si založ týmy.</p> : (
        <ul className="list">
          {teams.map((t) => {
            const order = picked.indexOf(t.id);
            return (
              <li key={t.id}>
                <button className={`list-btn team-pick${order >= 0 ? " on" : ""}`} aria-pressed={order >= 0} onClick={() => toggle(t.id)}>
                  <span className="bag" style={{ background: t.color }} aria-hidden="true" />
                  <span className="grow"><b>{t.name}</b>{t.players.length > 0 && <span className="occasion-kind">{t.players.join(", ")}</span>}</span>
                  <span className="pick-order">{order >= 0 ? order + 1 : ""}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <button className="link" onClick={onNewTeam}>+ Nový tým</button>

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
    </Sheet>
  );
}
