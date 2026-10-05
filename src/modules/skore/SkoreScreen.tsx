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
import { useActiveDarts } from "./active";
import { DEFAULT_SETTINGS, LEG_OPTIONS, OUT_HINTS, OUT_NAMES, STARTS, play, ranking, settingsLabel, type DartSettings, type OutMode } from "./darts";
import { MAX_PLAYERS, computeDartStats, normalize, playerColor, useDartGames, useDeleteDartGame, type ScoreGame } from "./data";

const MODULE = MODULE_BY_KEY.skore;
const ODEHRANO: [string, string, string] = ["hra odehrána", "hry odehrány", "her odehráno"];
const VYHER: [string, string, string] = ["výhra", "výhry", "výher"];
const LAST_KEY = "sipky:posledni";

const pct = (wins: number, games: number) => (games ? `${Math.round((wins / games) * 100)} %` : "–");

interface Setup {
  settings: DartSettings;
  players: string[];
}

function loadLast(): Setup | null {
  try {
    const s = JSON.parse(localStorage.getItem(LAST_KEY) ?? "null") as Setup | null;
    return s && Array.isArray(s.players) ? { players: s.players, settings: normalize(s.settings) } : null;
  } catch {
    return null;
  }
}

export function SkoreScreen() {
  const { data: games = [], error } = useDartGames();
  const { active, start } = useActiveDarts();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<"zebricek" | "hry" | "rekordy">("zebricek");
  const [sheet, setSheet] = useState(false);
  const [detail, setDetail] = useState<ScoreGame | null>(null);
  const stats = useMemo(() => computeDartStats(games), [games]);
  const leader = stats.players[0];

  // ?nova=1 z karty na obrazovce Dnes
  useEffect(() => {
    if (!params.has("nova")) return;
    setParams({}, { replace: true });
    if (active) navigate("/m/skore/hra");
    else setSheet(true);
  }, [params, setParams, active, navigate]);

  const begin = (setup: Setup) => {
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
        <Topbar title="Šipky" />
        <div className="hero">
          <span className="sprite-tile"><Sprite name="skore" size={96} /></span>
          <span className="hero-num">{stats.games}</span>
          <span className="hero-cap">{plural(stats.games, ODEHRANO)}</span>
          <p className="hero-line">{leader && leader.wins > 0 ? `Nejvíc výher: ${leader.name} (${leader.wins})` : "301, 501, double out a návrh, co hodit na zavření."}</p>
        </div>
        {active ? (
          <button className="btn-hero" onClick={() => navigate("/m/skore/hra")}><Sprite name="i-play" size={24} /> Pokračovat ve hře</button>
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
          {stats.players.length === 0 ? <p className="empty">Žebříček se ukáže po první hře.</p> : (
            <div className="panel">
              <ol className="ranking">
                {stats.players.map((p, i) => (
                  <li key={p.name}>
                    <span className="rank">{i + 1}.</span>
                    <span className="grow">{p.name}<span className="occasion-kind">{p.average !== null ? `průměr ${String(p.average).replace(".", ",")}` : ""}{p.legs ? ` · ${p.legs} ${plural(p.legs, ["leg", "legy", "legů"])}` : ""}</span></span>
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
                const settings = normalize(g.settings);
                const state = play(settings, g.players.length, g.turns);
                const order = ranking(state);
                return (
                  <li key={g.id}>
                    <button className="list-btn" onClick={() => setDetail(g)}>
                      {g.winner !== null ? <span className="bag" style={{ background: playerColor(g.winner) }} aria-hidden="true" /> : <span className="bag empty-bag" aria-hidden="true" />}
                      <span className="grow">
                        <b>{g.winner !== null ? `${g.players[g.winner]} vyhrává` : "Nedohráno"}</b>
                        <span className="occasion-kind">
                          {settingsLabel(settings)} · {order.map((i) => (settings.legs > 1 ? `${g.players[i]} ${state.legsWon[i]}` : g.players[i])).join(settings.legs > 1 ? " : " : ", ")}
                        </span>
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
          {stats.records.length === 0 ? <p className="empty">Rekordy se ukážou po první hře.</p> : (
            <div className="trophies">
              {stats.records.map((r, i) => (
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

/** Nastavení nové hry: odkud se odečítá, jak se zavírá, kolik legů, kdo hraje. */
function NewGameSheet({ onClose, onStart, known }: { onClose: () => void; onStart: (s: Setup) => void; known: string[] }) {
  const last = useMemo(loadLast, []);
  const [settings, setSettings] = useState<DartSettings>(last?.settings ?? DEFAULT_SETTINGS);
  const [players, setPlayers] = useState<string[]>(last?.players ?? []);
  const [name, setName] = useState("");
  const { data: teams = [] } = useTeams();
  const { data: people = [] } = usePeople();

  const suggestions = useMemo(() => {
    const names = new Set([...known, ...teams.flatMap((t) => t.players), ...people.map((p) => p.name)]);
    return [...names].filter((n) => !players.includes(n)).sort((a, b) => a.localeCompare(b, "cs")).slice(0, 20);
  }, [known, teams, people, players]);

  const add = (n: string) => {
    const clean = n.trim();
    if (clean && !players.includes(clean) && players.length < MAX_PLAYERS) setPlayers((l) => [...l, clean]);
    setName("");
  };
  const set = (patch: Partial<DartSettings>) => setSettings((s) => ({ ...s, ...patch }));

  return (
    <Sheet title="Nová hra" onClose={onClose}>
      <span className="field-label">Odkud se odečítá</span>
      <div className="seg seg-wide" role="group" aria-label="Start">
        {STARTS.map((v) => (
          <button key={v} className={`seg-btn${settings.start === v ? " on" : ""}`} aria-pressed={settings.start === v} onClick={() => set({ start: v })}>{v}</button>
        ))}
      </div>

      <span className="field-label">Zavírání</span>
      <div className="seg seg-wide" role="group" aria-label="Zavírání">
        {(Object.keys(OUT_NAMES) as OutMode[]).map((o) => (
          <button key={o} className={`seg-btn${settings.out === o ? " on" : ""}`} aria-pressed={settings.out === o} onClick={() => set({ out: o })}>{OUT_NAMES[o]}</button>
        ))}
      </div>
      <p className="small muted mode-hint">{OUT_HINTS[settings.out]}</p>

      <span className="field-label">Hraje se na</span>
      <div className="seg seg-wide" role="group" aria-label="Legy">
        {LEG_OPTIONS.map((l) => (
          <button key={l} className={`seg-btn${settings.legs === l ? " on" : ""}`} aria-pressed={settings.legs === l} onClick={() => set({ legs: l })}>{l === 1 ? "1 leg" : `${l} legy`}</button>
        ))}
      </div>
      {settings.legs > 1 && <p className="small muted mode-hint">Vyhrává, kdo první vyhraje {settings.legs} legy. Každý další leg začíná další hráč.</p>}

      <span className="field-label">Hráči (v pořadí, jak se hází)</span>
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
          <input className="input" aria-label="Jméno" placeholder="Jméno hráče" maxLength={30} value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn tap" type="submit" disabled={!name.trim()}>Přidat</button>
        </form>
      )}
      {suggestions.length > 0 && players.length < MAX_PLAYERS && (
        <div className="chips">
          {suggestions.map((s) => <button key={s} type="button" className="chip" onClick={() => add(s)}>+ {s}</button>)}
        </div>
      )}

      <button className="btn-hero" disabled={!players.length} onClick={() => onStart({ settings, players })}>
        {players.length ? "Hrát" : "Přidej hráče"}
      </button>
    </Sheet>
  );
}

function GameDetail({ game, onClose }: { game: ScoreGame; onClose: () => void }) {
  const remove = useDeleteDartGame();
  const settings = normalize(game.settings);
  const state = play(settings, game.players.length, game.turns);
  const order = ranking(state);
  return (
    <Sheet title={game.winner !== null ? `Vyhrává ${game.players[game.winner]}` : "Nedohraná hra"} onClose={onClose}>
      <p className="small muted">{settingsLabel(settings)} · {relativeTime(new Date(game.started_at))} · {plural(game.turns.length, ["nához", "náhozy", "náhozů"])}</p>
      <ol className="ranking">
        {order.map((p, i) => {
          const mine = state.log.filter((t) => t.p === p);
          const avg = mine.length ? mine.reduce((s, t) => s + (t.bust ? 0 : t.v), 0) / mine.length : 0;
          return (
            <li key={p}>
              <span className="rank">{i + 1}.</span>
              <span className="bag small" style={{ background: playerColor(p) }} aria-hidden="true" />
              <span className="grow">{game.players[p]}<span className="occasion-kind">průměr {avg.toFixed(1).replace(".", ",")}</span></span>
              {settings.legs > 1 && <b>{state.legsWon[p]}</b>}
            </li>
          );
        })}
      </ol>
      <button className="btn tap wide" onClick={() => {
        if (!window.confirm("Smazat tuhle hru?")) return;
        remove.mutate(game.id);
        onClose();
      }}>Smazat hru</button>
    </Sheet>
  );
}
