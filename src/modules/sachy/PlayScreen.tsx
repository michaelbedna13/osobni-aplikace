import type { Chess, Color, PieceSymbol, Square } from "chess.js";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Burst } from "../../components/Burst";
import { Sheet } from "../../components/Sheet";
import { Topbar } from "../../components/Topbar";
import { plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { playTone, unlockAudio } from "../../lib/sound";
import { useActiveChess } from "./active";
import {
  REASON_TEXT, applyMove, captures, checkFlag, controlById, finish, formatClock, newGame, other, pause, replay, resume, saveRecord, timeLeft, turnOf, undoMove,
  type ChessGame,
} from "./game";
import { Piece } from "./Pieces";

const MODULE = MODULE_BY_KEY.sachy;
const FILES = "abcdefgh";
const PROMOTIONS: PieceSymbol[] = ["q", "r", "b", "n"];

function moveSound(san: string) {
  if (san.includes("#")) {
    playTone(392, 0.2, 0.12);
    window.setTimeout(() => playTone(523, 0.4, 0.12), 150);
  } else if (san.includes("+")) playTone(660, 0.15, 0.1);
  else if (san.includes("x")) playTone(220, 0.1, 0.14);
  else playTone(440, 0.06, 0.08);
}

export function PlayScreen() {
  const { game, set, update } = useActiveChess();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => Date.now());
  const [selected, setSelected] = useState<Square | null>(null);
  const [promo, setPromo] = useState<{ from: Square; to: Square } | null>(null);
  const [menu, setMenu] = useState(false);

  // při partii bez spodní lišty
  useEffect(() => {
    document.documentElement.classList.add("focus-mode");
    return () => document.documentElement.classList.remove("focus-mode");
  }, []);

  const running = !!game && game.runningSince !== null && !game.result;

  // hodiny: překreslení a hlídání propadnutí
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      update((g) => checkFlag(g, t));
    }, 100);
    return () => window.clearInterval(id);
  }, [running, update]);

  // když appka zmizí z obrazovky, hodiny se zastaví
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") update((g) => (g.runningSince !== null && !g.result ? pause(g, Date.now()) : null));
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [update]);

  // dohraná partie do historie (jednou)
  useEffect(() => {
    if (game?.result && !game.saved) {
      saveRecord(game);
      update((g) => ({ ...g, saved: true }));
    }
  }, [game, update]);

  const chess = useMemo(() => replay(game?.moves ?? []), [game?.moves]);

  if (!game) return <Navigate to="/m/sachy" replace />;

  const turn = turnOf(game.moves);
  const control = controlById(game.control);
  const left = timeLeft(game, now);
  const caps = captures(chess);
  const orientation: Color = game.layout === "otacet" ? (game.result ? "w" : turn) : "w";
  const lastMove = chess.history({ verbose: true }).at(-1);
  const targets = selected ? chess.moves({ square: selected, verbose: true }) : [];

  const play = (from: Square, to: Square, promotion?: PieceSymbol) => {
    const t = Date.now();
    const next = applyMove(game, { from, to, promotion }, t);
    if (!next) return;
    unlockAudio();
    moveSound(next.moves[next.moves.length - 1]);
    setNow(t);
    set(next);
    setSelected(null);
    setPromo(null);
  };

  const onSquare = (sq: Square) => {
    if (game.result || game.paused) return;
    unlockAudio();
    const piece = chess.get(sq);
    if (selected) {
      const move = targets.find((m) => m.to === sq);
      if (move) {
        if (move.promotion) setPromo({ from: selected, to: sq });
        else play(selected, sq);
        return;
      }
    }
    setSelected(piece && piece.color === turn ? (sq === selected ? null : sq) : null);
  };

  const rematch = () => set(newGame(game.black, game.white, game.control, game.layout));
  const done = () => {
    set(null);
    navigate("/m/sachy");
  };
  const end = (winner: Color | null, reason: "vzdal" | "dohoda") => {
    update((g) => finish(g, { winner, reason }, Date.now()));
    setMenu(false);
  };

  const names: Record<Color, string> = { w: game.white, b: game.black };
  const panel = (c: Color, flipped: boolean) => (
    <PlayerPanel
      color={c}
      name={names[c]}
      clock={control.base ? left[c === "w" ? 0 : 1] : null}
      active={!game.result && turn === c}
      running={running && turn === c}
      inCheck={!game.result && turn === c && chess.inCheck()}
      captured={c === "w" ? caps.byWhite : caps.byBlack}
      balance={c === "w" ? caps.balance : -caps.balance}
      flipped={flipped}
    />
  );
  const bottom = orientation;
  const top = other(bottom);

  return (
    <div className="screen module sh-play" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <Topbar title="Šachy" back="/m/sachy" right={<span className="game-mode">{control.name}</span>} />

      {panel(top, game.layout === "stul")}

      <div className="sh-board-wrap">
        <Board
          chess={chess}
          orientation={orientation}
          selected={selected}
          targets={targets.map((m) => ({ to: m.to, capture: !!m.captured }))}
          last={lastMove ? [lastMove.from, lastMove.to] : null}
          onSquare={onSquare}
        />
        {promo && (
          <div className="sh-promo" role="dialog" aria-label="Proměna pěšce">
            <span>Proměnit na</span>
            <div>
              {PROMOTIONS.map((p) => (
                <button key={p} className="sh-promo-btn" onClick={() => play(promo.from, promo.to, p)} aria-label={p}>
                  <Piece type={p} color={turn} size={44} />
                </button>
              ))}
            </div>
            <button className="link" onClick={() => setPromo(null)}>Zpět</button>
          </div>
        )}
        {game.paused && !game.result && (
          <button className="sh-paused" onClick={() => update((g) => resume(g, Date.now()))}>Pauza · ťukni a hraje se dál</button>
        )}
        {game.result && <ResultPanel game={game} onRematch={rematch} onDone={done} />}
      </div>

      {panel(bottom, false)}

      {!game.result && (
        <div className="sh-actions">
          {control.base > 0 && (
            <button className="btn tap" disabled={!game.moves.length} onClick={() => update((g) => (g.paused ? resume(g, Date.now()) : pause(g, Date.now())))}>
              {game.paused ? "Pokračovat" : "Pauza"}
            </button>
          )}
          <button className="btn tap" disabled={!game.moves.length} onClick={() => { setSelected(null); update((g) => undoMove(g, Date.now())); }}>Vrátit tah</button>
          <button className="btn tap" onClick={() => setMenu(true)}>Konec…</button>
        </div>
      )}

      <MoveList moves={game.moves} />

      {menu && (
        <Sheet title="Konec partie" onClose={() => setMenu(false)}>
          <button className="btn tap wide" onClick={() => end(null, "dohoda")}>Remíza dohodou</button>
          <button className="btn tap wide" onClick={() => end("b", "vzdal")}>Vzdává {game.white} (bílý)</button>
          <button className="btn tap wide" onClick={() => end("w", "vzdal")}>Vzdává {game.black} (černý)</button>
          <button className="link" onClick={() => { if (window.confirm("Zrušit partii? Nic se neuloží.")) { set(null); navigate("/m/sachy"); } }}>Zrušit partii bez uložení</button>
        </Sheet>
      )}
    </div>
  );
}

function PlayerPanel({ color, name, clock, active, running, inCheck, captured, balance, flipped }: {
  color: Color;
  name: string;
  clock: number | null;
  active: boolean;
  running: boolean;
  inCheck: boolean;
  captured: PieceSymbol[];
  balance: number;
  flipped: boolean;
}) {
  const low = clock !== null && clock < 20_000;
  return (
    <div className={`sh-player${active ? " on" : ""}${flipped ? " flipped" : ""}`}>
      <span className={`sh-swatch ${color}`} aria-hidden="true" />
      <span className="grow">
        <b>{name}</b>
        <span className="sh-captured" aria-label={`sebráno: ${captured.length}`}>
          {captured.map((p, i) => <Piece key={i} type={p} color={color === "w" ? "b" : "w"} size={16} />)}
          {balance > 0 && <small>+{balance}</small>}
        </span>
      </span>
      {inCheck && <span className="sh-check">šach!</span>}
      {clock !== null && <span className={`sh-clock${running ? " run" : ""}${low ? " low" : ""}`}>{formatClock(clock)}</span>}
    </div>
  );
}

function Board({ chess, orientation, selected, targets, last, onSquare }: {
  chess: Chess;
  orientation: Color;
  selected: Square | null;
  targets: { to: Square; capture: boolean }[];
  last: [Square, Square] | null;
  onSquare: (sq: Square) => void;
}) {
  const files = orientation === "w" ? FILES : [...FILES].reverse().join("");
  const ranks = orientation === "w" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const checkSq = chess.inCheck()
    ? (chess.board().flat().find((p) => p && p.type === "k" && p.color === chess.turn())?.square ?? null)
    : null;
  return (
    <div className="sh-board" role="grid" aria-label="Šachovnice">
      {ranks.map((r, ri) =>
        [...files].map((f, fi) => {
          const sq = `${f}${r}` as Square;
          const piece = chess.get(sq);
          const dark = (FILES.indexOf(f) + r) % 2 === 1;
          const target = targets.find((t) => t.to === sq);
          const cls = [
            "sq", dark ? "dark" : "light",
            sq === selected ? "sel" : "",
            last && (sq === last[0] || sq === last[1]) ? "last" : "",
            sq === checkSq ? "check" : "",
            target ? (target.capture ? "hit" : "dot") : "",
          ].filter(Boolean).join(" ");
          return (
            <button key={sq} className={cls} onClick={() => onSquare(sq)} aria-label={`${sq}${piece ? ` ${piece.color === "w" ? "bílý" : "černý"} ${piece.type}` : ""}`}>
              {piece && <Piece type={piece.type} color={piece.color} />}
              {fi === 0 && <span className="coord rank">{r}</span>}
              {ri === 7 && <span className="coord file">{f}</span>}
            </button>
          );
        }),
      )}
    </div>
  );
}

function ResultPanel({ game, onRematch, onDone }: { game: ChessGame; onRematch: () => void; onDone: () => void }) {
  const r = game.result!;
  const winner = r.winner ? (r.winner === "w" ? game.white : game.black) : null;
  return (
    <div className="panel sh-result">
      {winner && <Burst trigger={1} text={r.reason === "mat" ? "Mat!" : "Výhra!"} />}
      <h2>{winner ? `Vyhrává ${winner}` : "Remíza"}</h2>
      <p className="small muted">{REASON_TEXT[r.reason]} · {Math.ceil(game.moves.length / 2)} {plural(Math.ceil(game.moves.length / 2), ["tah", "tahy", "tahů"])} · v odvetě se barvy prohodí</p>
      <button className="btn-hero" onClick={onRematch}>Odveta</button>
      <button className="btn tap wide" onClick={onDone}>Hotovo</button>
    </div>
  );
}

function MoveList({ moves }: { moves: string[] }) {
  if (!moves.length) return <p className="small muted sh-hint">Bílý začíná. Ťukni na figurku a pak na pole, kam s ní táhneš.</p>;
  const pairs: string[] = [];
  for (let i = 0; i < moves.length; i += 2) pairs.push(`${i / 2 + 1}. ${moves[i]}${moves[i + 1] ? ` ${moves[i + 1]}` : ""}`);
  return (
    <div className="sh-moves" aria-label="Zápis partie">
      {pairs.slice(-12).map((p, i) => <span key={i}>{p}</span>)}
    </div>
  );
}
