import { describe, expect, it } from "vitest";
import { applyMove, captures, checkFlag, finish, formatClock, headToHead, newGame, pause, replay, resume, timeLeft, undoMove, type ChessRecord } from "./game";

const T0 = 1_000_000;

describe("tahy a výsledky", () => {
  it("neplatný tah neprojde, platný se zapíše v SAN", () => {
    const g = newGame("A", "B", "none", "stul");
    expect(applyMove(g, "e5", T0)).toBeNull();
    const g2 = applyMove(g, { from: "e2", to: "e4" }, T0);
    expect(g2?.moves).toEqual(["e4"]);
  });

  it("ševcovský mat", () => {
    let g = newGame("A", "B", "none", "stul");
    for (const m of ["e4", "e5", "Qh5", "Nc6", "Bc4", "Nf6", "Qxf7#"]) g = applyMove(g, m, T0)!;
    expect(g.result).toEqual({ winner: "w", reason: "mat" });
    expect(applyMove(g, "a6", T0)).toBeNull();
  });

  it("pat", () => {
    // nejrychlejší známý pat (Loyd)
    let g = newGame("A", "B", "none", "stul");
    for (const m of ["e3", "a5", "Qh5", "Ra6", "Qxa5", "h5", "h4", "Rah6", "Qxc7", "f6", "Qxd7+", "Kf7", "Qxb7", "Qd3", "Qxb8", "Qh7", "Qxc8", "Kg6", "Qe6"]) g = applyMove(g, m, T0)!;
    expect(g.result).toEqual({ winner: null, reason: "pat" });
  });

  it("vrácení tahu", () => {
    let g = applyMove(newGame("A", "B", "none", "stul"), "e4", T0)!;
    g = undoMove(g, T0);
    expect(g.moves).toEqual([]);
  });

  it("sebrané figury a materiál", () => {
    const chess = replay(["e4", "d5", "exd5", "Qxd5", "Nc3", "Qxa2", "Rxa2"]);
    const c = captures(chess);
    expect(c.byWhite).toEqual(["q", "p"]);
    expect(c.byBlack).toEqual(["p", "p"]);
    expect(c.balance).toBe(8);
  });
});

describe("hodiny", () => {
  it("rozběhnou se po prvním tahu bílého, odečítají a přidávají přídavek", () => {
    let g = newGame("A", "B", "3+2", "stul");
    g = applyMove(g, "e4", T0)!;
    expect(g.clock).toEqual([180_000, 180_000]);
    expect(timeLeft(g, T0 + 5000)).toEqual([180_000, 175_000]);
    g = applyMove(g, "e5", T0 + 5000)!;
    expect(g.clock).toEqual([180_000, 177_000]);
    g = applyMove(g, "Nf3", T0 + 15_000)!;
    expect(g.clock).toEqual([172_000, 177_000]);
  });

  it("pauza zastaví čas", () => {
    let g = applyMove(newGame("A", "B", "5+0", "stul"), "e4", T0)!;
    g = pause(g, T0 + 1000);
    expect(timeLeft(g, T0 + 60_000)[1]).toBe(299_000);
    g = resume(g, T0 + 60_000);
    expect(timeLeft(g, T0 + 61_000)[1]).toBe(298_000);
  });

  it("propadnutí času: prohra, proti samotnému králi remíza", () => {
    const g = applyMove(newGame("A", "B", "1+0", "stul"), "e4", T0)!;
    expect(checkFlag(g, T0 + 59_000)).toBeNull();
    expect(checkFlag(g, T0 + 61_000)?.result).toEqual({ winner: "w", reason: "cas" });
  });

  it("formát času", () => {
    expect(formatClock(185_000)).toBe("3:05");
    expect(formatClock(7_340)).toBe("7,3");
    expect(formatClock(-5)).toBe("0,0");
  });

  it("konec partie zastaví hodiny", () => {
    const g = finish(applyMove(newGame("A", "B", "5+0", "stul"), "e4", T0)!, { winner: "b", reason: "vzdal" }, T0 + 2000);
    expect(g.runningSince).toBeNull();
    expect(g.clock[1]).toBe(298_000);
  });
});

describe("bilance", () => {
  it("nezáleží na barvě", () => {
    const r = (white: string, black: string, winner: "w" | "b" | null): ChessRecord => ({ date: "", white, black, control: "none", winner, reason: "mat", moves: 20, pgn: "" });
    expect(headToHead([r("Jana", "Petr", "w"), r("Petr", "Jana", "w"), r("Petr", "Jana", null), r("Jana", "Eva", "w")], "Jana", "Petr")).toEqual([1, 1, 1]);
  });
});
