import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sheet } from "../../components/Sheet";
import { Sprite } from "../../components/Sprite";
import { Tabs } from "../../components/Tabs";
import { Topbar } from "../../components/Topbar";
import { relativeTime } from "../../lib/dates";
import { formatDate, plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { useTeams } from "../cornhole/data";
import { usePeople } from "../lide/data";
import { useActiveScoreGame } from "./active";
import { MAX_PLAYERS, computeScoreStats, playerColor, useDeleteScoreGame, useScoreGames, type ScoreGame } from "./data";
import { KINDS, KIND_ORDER, play, ranking, settingsLabel, type GameKind, type Settings } from "./rules";

const MODULE = MODULE_BY_KEY.skore;
const ODEHRANO: [string, string, string] = ["hra odehrána", "hry odehrány", "her odehráno"];
const VYHER: [string, string, string] = ["výhra", "výhry", "výher"];
const LAST_KEY = "skore:posledni";

const pct = (wins: number, games: number) => (games ? `${Math.round((wins / games) * 100)} %` : "–");

interface LastSetup {
  kind: GameKind;
  settings: Settings;
  players: string[];
}

function loadLast(): LastSetup | null {
  try {
    return JSON.parse(localStorage.getItem(LAST_KEY) ?? "null") as LastSetup | null;
  } catch {
    return null;
  }
}

export function SkoreScreen() {
  const { data: games = [], error } = useScoreGames();
  const { active, start } = useActiveScoreGame();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<"zebricek" | "hry" | "rekordy">("zebricek");
  const [filter, setFilter] = useState<GameKind | null>(null);
  const [sheet, setSheet] = useState(false);
  const [detail, setDetail] = useState<ScoreGame | null>(null);
  const all = useMemo(() => computeScoreStats(games), [games]);
  const stats = useMemo(() => computeScoreStats(games, filter), [games, filter]);
  const leader = all.players[0];

  // ?nova=1 z karty na obrazovce Dnes
  useEffect(() => {
    if (!params.has("nova")) return;
    setParams({}, { replace: true });
    if (active) navigate("/m/skore/hra");
    else setSheet(true);
  }, [params, setParams, active, navigate]);

  const begin = (setup: LastSetup) => {
    try {
      localStorage.setItem(LAST_KEY, JSON.stringify(setup));
    } catch {
      // nevadí, příště se jen nepředvyplní
    }
    start({ started_at: new Date().toISOString(), ...setup, turns: [] });
    navigate("/m/skore/hra");
  };

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar title="Skóre" />
        <div className="hero">
          <span className="sprite-tile"><Sprite name="skore" size={96} /></span>
          <span className="hero-num">{all.games}</span>
          <span className="hero-cap">{plural(all.games, ODEHRANO)}</span>
          <p className="hero-line">{leader && leader.wins > 0 ? `Nejvíc výher: ${leader.name} (${leader.wins})` : "Šipky, mölkky, pétanque i cokoli dalšího."}</p>
        </div>
        {active ? (
          <button className="btn-hero" onClick={() => navigate("/m/skore/hra")}><Sprite name="i-play" size={24} /> Pokračovat: {KINDS[active.kind].name}</button>
        ) : (
          <button className="btn-hero" onClick={() => setSheet(true)}><Sprite name="i-play" size={24} /> Nová hra</button>
        )}
      </div>

      {error && <p className="error">Nepodařilo se načíst data. Zkontroluj připojení.</p>}

      <Tabs
        label="Zobrazení"
        value={tab}
        onChange={setTab}
        items={[{ id: "zebricek", label: "Žebříček" }, { id: "hry", label: "Hry" }, { id: "rekordy", label: "Rekordy" }]}
      />

      {tab === "zebricek" && (
        <div className="tab-panel">
          {all.kinds.length > 1 && (
            <div className="chips" role="group" aria-label="Hra">
              <button className={`chip${filter === null ? " on" : ""}`} aria-pressed={filter === null} onClick={() => setFilter(null)}>Vše</button>
              {KIND_ORDER.filter((k) => all.kinds.includes(k)).map((k) => (
                <button key={k} className={`chip${filter === k ? " on" : ""}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>{KINDS[k].name}</button>
              ))}
            </div>
          )}
          {stats.players.length === 0 ? <p className="empty">Žebříček se ukáže po první hře.</p> : (
            <div className="panel">
              <h3>{filter ? KINDS[filter].name : "Všechny hry"}</h3>
              <ol className="ranking">
                {stats.players.map((p, i) => (
                  <li key={p.name}>
                    <span className="rank">{i + 1}.</span>
                    <span className="grow">{p.name}</span>
                    {i === 0 && p.wins > 0 && <Sprite name="crown" size={20} />}
                    <b>{p.wins}</b>
                    <span className="small muted">{plural(p.wins, VYHER)} z {p.games} · {pct(p.wins, p.games)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {tab === "hry" && (
        <div className="tab-panel">
          {games.length === 0 ? <p className="empty">Zatím žádná hra.</p> : (
            <ul className="list">
              {games.slice(0, 100).map((g) => {
                const state = play(g.kind, g.settings, g.players.length, g.turns, true);
                const order = ranking(g.kind, g.settings, state);
                return (
                  <li key={g.id}>
                    <button className="list-btn" onClick={() => setDetail(g)}>
                      {g.winner !== null ? <span className="bag" style={{ background: playerColor(g.winner) }} aria-hidden="true" /> : <span className="bag empty-bag" aria-hidden="true" />}
                      <span className="grow">
                        <b>{g.winner !== null ? `${g.players[g.winner]} vyhrává` : "Remíza"}</b>
                        <span className="occasion-kind">{KINDS[g.kind].name} · {order.map((i) => `${g.players[i]} ${state.scores[i]}`).join(" · ")}</span>
                      </span>
                      <span className="small muted">{relativeTime(new Date(g.started_at))}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {tab === "rekordy" && (
        <div className="tab-panel">
          {all.records.length === 0 ? <p className="empty">Rekordy se ukážou po prvních hrách šipek, mölkky nebo pétanque.</p> : (
            <div className="trophies">
              {all.records.map((r, i) => (
                <div key={r.text} className={`trophy${i === 0 ? " gold" : ""}`}>
                  <Sprite name={i === 0 ? "trophy" : "star"} size={40} />
                  <b>{r.value}</b>
                  <span>{r.text}{r.date ? ` (${formatDate(new Date(r.date), true)})` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {sheet && <NewGameSheet onClose={() => setSheet(false)} onStart={begin} known={[...new Set(games.flatMap((g) => g.players))]} />}
      {detail && <GameDetail game={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

/** Nastavení nové hry: jaká hra, kdo hraje (v pořadí), cíl. */
function NewGameSheet({ onClose, onStart, known }: { onClose: () => void; onStart: (s: LastSetup) => void; known: string[] }) {
  const last = useMemo(loadLast, []);
  const [kind, setKind] = useState<GameKind>(last?.kind ?? "sipky");
  const [settings, setSettings] = useState<Settings>(last?.settings ?? KINDS.sipky.defaults);
  const [players, setPlayers] = useState<string[]>(last?.players ?? []);
  const [name, setName] = useState("");
  const { data: teams = [] } = useTeams();
  const { data: people = [] } = usePeople();

  const suggestions = useMemo(() => {
    const names = new Set([...known, ...teams.flatMap((t) => t.players), ...people.map((p) => p.name)]);
    return [...names].filter((n) => !players.includes(n)).sort((a, b) => a.localeCompare(b, "cs")).slice(0, 20);
  }, [known, teams, people, players]);

  const pick = (k: GameKind) => {
    setKind(k);
    setSettings(k === last?.kind ? last.settings : KINDS[k].defaults);
  };
  const add = (n: string) => {
    const clean = n.trim();
    if (clean && !players.includes(clean) && players.length < MAX_PLAYERS) setPlayers((l) => [...l, clean]);
    setName("");
  };
  const set = (patch: Settings) => setSettings((s) => ({ ...s, ...patch }));
  const minPlayers = kind === "petanque" ? 2 : 1;

  return (
    <Sheet title="Nová hra" onClose={onClose}>
      <span className="field-label">Hra</span>
      <ul className="list sc-kinds">
        {KIND_ORDER.map((k) => (
          <li key={k}>
            <button className={`list-btn team-pick${kind === k ? " on" : ""}`} aria-pressed={kind === k} onClick={() => pick(k)}>
              <span className="grow"><b>{KINDS[k].name}</b><span className="occasion-kind">{KINDS[k].hint}</span></span>
            </button>
          </li>
        ))}
      </ul>

      {kind === "sipky" && (
        <>
          <span className="field-label">Odkud se odečítá</span>
          <div className="seg seg-wide" role="group" aria-label="Start">
            {[301, 501].map((v) => (
              <button key={v} className={`seg-btn${(settings.start ?? 501) === v ? " on" : ""}`} aria-pressed={(settings.start ?? 501) === v} onClick={() => set({ start: v })}>{v}</button>
            ))}
          </div>
        </>
      )}
      {kind === "petanque" && (
        <>
          <span className="field-label">Hraje se do</span>
          <div className="seg seg-wide" role="group" aria-label="Cíl">
            {[11, 13].map((v) => (
              <button key={v} className={`seg-btn${(settings.target ?? 13) === v ? " on" : ""}`} aria-pressed={(settings.target ?? 13) === v} onClick={() => set({ target: v })}>{v}</button>
            ))}
          </div>
        </>
      )}
      {kind === "vlastni" && (
        <>
          <span className="field-label">Vyhrává</span>
          <div className="seg seg-wide" role="group" aria-label="Vyhrává">
            {[false, true].map((low) => (
              <button key={String(low)} className={`seg-btn${!!settings.lowWins === low ? " on" : ""}`} aria-pressed={!!settings.lowWins === low} onClick={() => set({ lowWins: low })}>{low ? "Nejméně bodů" : "Nejvíc bodů"}</button>
            ))}
          </div>
          <span className="field-label">{settings.lowWins ? "Hra končí, když někdo dosáhne" : "Hraje se do"}</span>
          <div className="stepper">
            <button className="icon-btn big tap" aria-label="Méně" disabled={!settings.target} onClick={() => set({ target: settings.target && settings.target > 10 ? settings.target - 10 : null })}>−</button>
            <span className={`stepper-value${settings.target ? "" : " sc-none"}`} aria-live="polite">{settings.target ?? "bez cíle"}</span>
            <button className="icon-btn big tap" aria-label="Více" disabled={(settings.target ?? 0) >= 1000} onClick={() => set({ target: (settings.target ?? 0) + 10 })}>+</button>
          </div>
          <p className="small muted mode-hint">{settings.target ? "Vyhodnotí se vždy po celém kole." : "Hru ukončíš sám tlačítkem, vyhraje nejlepší skóre."}</p>
        </>
      )}

      <span className="field-label">{kind === "petanque" ? "Týmy" : "Hráči"} (v pořadí, jak se hází)</span>
      {players.length > 0 && (
        <div className="chips player-chips">
          {players.map((p, i) => (
            <button key={p} type="button" className="chip on sc-chip" style={{ "--team": playerColor(i) } as CSSProperties} aria-label={`Odebrat ${p}`} onClick={() => setPlayers((l) => l.filter((x) => x !== p))}>
              {i + 1}. {p} ×
            </button>
          ))}
        </div>
      )}
      {players.length < MAX_PLAYERS && (
        <form className="inline-form" onSubmit={(e) => { e.preventDefault(); add(name); }}>
          <input className="input" aria-label="Jméno" placeholder={kind === "petanque" ? "Název týmu" : "Jméno hráče"} maxLength={30} value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn tap" type="submit" disabled={!name.trim()}>Přidat</button>
        </form>
      )}
      {suggestions.length > 0 && players.length < MAX_PLAYERS && (
        <div className="chips">
          {suggestions.map((s) => <button key={s} type="button" className="chip" onClick={() => add(s)}>+ {s}</button>)}
        </div>
      )}

      <button className="btn-hero" disabled={players.length < minPlayers} onClick={() => onStart({ kind, settings, players })}>
        {players.length < minPlayers ? (kind === "petanque" ? "Přidej aspoň 2 týmy" : "Přidej hráče") : "Hrát"}
      </button>
    </Sheet>
  );
}

function GameDetail({ game, onClose }: { game: ScoreGame; onClose: () => void }) {
  const remove = useDeleteScoreGame();
  const state = play(game.kind, game.settings, game.players.length, game.turns, true);
  const order = ranking(game.kind, game.settings, state);
  return (
    <Sheet title={game.winner !== null ? `Vyhrává ${game.players[game.winner]}` : "Remíza"} onClose={onClose}>
      <p className="small muted">{KINDS[game.kind].name} {settingsLabel(game.kind, game.settings)} · {relativeTime(new Date(game.started_at))} · {plural(game.turns.length, ["zápis", "zápisy", "zápisů"])}</p>
      <ol className="ranking">
        {order.map((p, i) => (
          <li key={p}>
            <span className="rank">{i + 1}.</span>
            <span className="bag small" style={{ background: playerColor(p) }} aria-hidden="true" />
            <span className="grow">{game.players[p]}</span>
            <b>{state.scores[p]}</b>
          </li>
        ))}
      </ol>
      <button className="btn tap wide" onClick={() => {
        if (!window.confirm("Smazat tuhle hru?")) return;
        remove.mutate(game.id);
        onClose();
      }}>Smazat hru</button>
    </Sheet>
  );
}
