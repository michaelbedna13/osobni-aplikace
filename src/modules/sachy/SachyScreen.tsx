import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sheet } from "../../components/Sheet";
import { Icon } from "../../components/Icon";
import { Topbar } from "../../components/Topbar";
import { relativeTime } from "../../lib/dates";
import { plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { usePeople } from "../lide/data";
import { useActiveChess } from "./active";
import { CONTROLS, LAYOUT_HINTS, LAYOUT_NAMES, REASON_TEXT, controlById, headToHead, loadHistory, newGame, type ChessRecord, type Layout } from "./game";

const MODULE = MODULE_BY_KEY.sachy;
const SETUP_KEY = "sachy:nastaveni";
const PARTIE: [string, string, string] = ["partie odehrána", "partie odehrány", "partií odehráno"];

interface Setup {
  white: string;
  black: string;
  control: string;
  layout: Layout;
}

function loadSetup(): Setup {
  try {
    const s = JSON.parse(localStorage.getItem(SETUP_KEY) ?? "null") as Setup | null;
    if (s) return s;
  } catch {
    // výchozí nastavení
  }
  return { white: "Bílý", black: "Černý", control: "5+0", layout: "stul" };
}

const score = (r: ChessRecord) => (r.winner === "w" ? "1–0" : r.winner === "b" ? "0–1" : "½–½");

export function SachyScreen() {
  const { game, set } = useActiveChess();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [sheet, setSheet] = useState(false);
  const [detail, setDetail] = useState<ChessRecord | null>(null);
  const history = useMemo(loadHistory, []);
  const last = history[0];

  useEffect(() => {
    if (!params.has("nova")) return;
    setParams({}, { replace: true });
    if (game) navigate("/m/sachy/hra");
    else setSheet(true);
  }, [params, setParams, game, navigate]);

  const start = (s: Setup) => {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(s));
    } catch {
      // příště se jen nepředvyplní
    }
    set(newGame(s.white.trim() || "Bílý", s.black.trim() || "Černý", s.control, s.layout));
    navigate("/m/sachy/hra");
  };

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar title="Šachy" />
        <div className="hero">
          <span className="icon-slot"><Icon name="sachy" size={96} /></span>
          <span className="hero-num">{history.length}</span>
          <span className="hero-cap">{plural(history.length, PARTIE)}</span>
          <p className="hero-line">{last ? `Naposledy ${last.white} – ${last.black} ${score(last)}` : "Dva hráči, jeden telefon, šachové hodiny."}</p>
        </div>
        {game ? (
          <button className="btn-hero" onClick={() => navigate("/m/sachy/hra")}><Icon name="i-play" size={24} /> Pokračovat v partii</button>
        ) : (
          <button className="btn-hero" onClick={() => setSheet(true)}><Icon name="i-play" size={24} /> Nová partie</button>
        )}
      </div>

      <h2 className="sec-title">Odehrané partie</h2>
      {history.length === 0 ? <p className="empty">Zatím žádná partie.</p> : (
        <ul className="list">
          {history.slice(0, 60).map((r, i) => (
            <li key={`${r.date}-${i}`}>
              <button className="list-btn" onClick={() => setDetail(r)}>
                <span className="sh-result-tag">{score(r)}</span>
                <span className="grow">
                  <b>{r.white} – {r.black}</b>
                  <span className="occasion-kind">{REASON_TEXT[r.reason]} · {r.moves} {plural(r.moves, ["tah", "tahy", "tahů"])} · {controlById(r.control).name}</span>
                </span>
                <span className="small muted">{relativeTime(new Date(r.date))}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {sheet && <NewGameSheet history={history} onClose={() => setSheet(false)} onStart={start} />}
      {detail && (
        <Sheet title={`${detail.white} – ${detail.black}`} onClose={() => setDetail(null)}>
          <p className="small muted">{score(detail)} · {REASON_TEXT[detail.reason]} · {controlById(detail.control).name} · {relativeTime(new Date(detail.date))}</p>
          <pre className="sh-pgn">{detail.pgn.split("\n\n").slice(-1)[0]}</pre>
          <button className="btn tap wide" onClick={() => { void navigator.clipboard?.writeText(detail.pgn); setDetail(null); }}>Kopírovat zápis (PGN)</button>
        </Sheet>
      )}
    </div>
  );
}

function NewGameSheet({ history, onClose, onStart }: { history: ChessRecord[]; onClose: () => void; onStart: (s: Setup) => void }) {
  const [s, setS] = useState<Setup>(loadSetup);
  const { data: people = [] } = usePeople();
  const set = (patch: Partial<Setup>) => setS((x) => ({ ...x, ...patch }));
  const known = useMemo(() => {
    const names = new Set([...history.flatMap((r) => [r.white, r.black]), ...people.map((p) => p.name)]);
    return [...names].filter((n) => n !== "Bílý" && n !== "Černý" && n !== s.white && n !== s.black).sort((a, b) => a.localeCompare(b, "cs")).slice(0, 16);
  }, [history, people, s.white, s.black]);
  const [w, b, d] = headToHead(history, s.white, s.black);

  return (
    <Sheet title="Nová partie" onClose={onClose}>
      <div className="sh-names">
        <label className="sh-name">
          <span className="sh-swatch w" aria-hidden="true" />
          <input className="input" aria-label="Bílý" maxLength={30} value={s.white} onChange={(e) => set({ white: e.target.value })} />
        </label>
        <button type="button" className="icon-btn sh-swap" aria-label="Prohodit barvy" onClick={() => setS((x) => ({ ...x, white: x.black, black: x.white }))}>⇅</button>
        <label className="sh-name">
          <span className="sh-swatch b" aria-hidden="true" />
          <input className="input" aria-label="Černý" maxLength={30} value={s.black} onChange={(e) => set({ black: e.target.value })} />
        </label>
      </div>
      {known.length > 0 && (
        <div className="chips">
          {known.map((n) => (
            <button key={n} type="button" className="chip" onClick={() => set(s.white === "Bílý" || !s.white.trim() ? { white: n } : { black: n })}>{n}</button>
          ))}
        </div>
      )}
      {w + b + d > 0 && <p className="small muted">Vzájemně {s.white} {w} : {b} {s.black}{d ? `, remízy ${d}` : ""}</p>}

      <span className="field-label">Hodiny</span>
      <div className="sh-controls" role="group" aria-label="Hodiny">
        {CONTROLS.map((c) => (
          <button key={c.id} type="button" className={`seg-btn${s.control === c.id ? " on" : ""}`} aria-pressed={s.control === c.id} onClick={() => set({ control: c.id })}>{c.name}</button>
        ))}
      </div>

      <span className="field-label">Jak hrajete</span>
      <div className="seg seg-wide" role="group" aria-label="Rozložení">
        {(Object.keys(LAYOUT_NAMES) as Layout[]).map((l) => (
          <button key={l} type="button" className={`seg-btn${s.layout === l ? " on" : ""}`} aria-pressed={s.layout === l} onClick={() => set({ layout: l })}>{LAYOUT_NAMES[l]}</button>
        ))}
      </div>
      <p className="small muted mode-hint">{LAYOUT_HINTS[s.layout]}</p>

      <button className="btn-hero" onClick={() => onStart(s)}>Hrát</button>
    </Sheet>
  );
}
