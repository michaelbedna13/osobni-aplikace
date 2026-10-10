import { describe, expect, it } from "vitest";
import { computeCornholeStats, type Game } from "./data";
import { roundScores, runningTotals, totals, winnerOf, type Round } from "./scoring";

const t = (board: number, hole: number) => ({ board, hole });

describe("cornhole – body", () => {
  it("sčítání: každý si přičte svoje", () => {
    expect(roundScores([t(2, 1), t(1, 0), t(0, 2)], "soucet")).toEqual([5, 1, 6]);
  });

  it("rozdílem: boduje jen nejlepší tým, při shodě nikdo", () => {
    expect(roundScores([t(2, 1), t(1, 0)], "rozdil")).toEqual([4, 0]);
    expect(roundScores([t(2, 1), t(1, 0), t(0, 2)], "rozdil")).toEqual([0, 0, 1]);
    expect(roundScores([t(0, 1), t(3, 0)], "rozdil")).toEqual([0, 0]);
  });

  it("průběžné součty a vítěz", () => {
    const rounds: Round[] = [[t(0, 4), t(1, 0)], [t(0, 3), t(4, 0)], [t(1, 0), t(0, 4)]];
    expect(runningTotals(rounds, "soucet", 2)).toEqual([[12, 1], [21, 5], [22, 17]]);
    expect(winnerOf(rounds, "soucet", 2, 21)).toBe(0);
    expect(totals([], "soucet", 3)).toEqual([0, 0, 0]);
  });

  it("víc týmů přes cíl v jednom kole: vyhraje víc bodů, shoda = hraje se dál", () => {
    expect(winnerOf([[t(0, 4), t(0, 4), t(0, 3)], [t(0, 3), t(1, 3), t(0, 0)]], "soucet", 3, 21)).toBe(1);
    expect(winnerOf([[t(0, 4), t(0, 4)], [t(0, 3), t(0, 3)]], "soucet", 2, 21)).toBeNull();
  });
});

describe("cornhole – statistiky", () => {
  const team = (id: string, players: string[]) => ({ team_id: id, name: id, color: "#E43B44", players });
  const game = (winner: number | null, rounds: Round[]): Game => ({
    id: String(Math.random()), started_at: "2026-10-01T15:00:00.000Z", finished_at: "2026-10-01T15:30:00.000Z",
    mode: "soucet", target: 21, teams: [team("A", ["Míša", "Jana"]), team("B", ["Petr"])], rounds, winner,
  });

  it("výhry hráčů a zajímavosti", () => {
    const s = computeCornholeStats([
      game(0, [[t(0, 4), t(1, 0)], [t(0, 3), t(4, 0)]]),
      game(1, [[t(1, 0), t(0, 3)], [t(0, 1), t(0, 3)], [t(0, 0), t(1, 2)]]),
      game(0, [[t(4, 0), t(0, 0)]]),
    ]);
    expect(s.players.map((x) => `${x.name} ${x.wins}`)).toEqual(["Jana 2", "Míša 2", "Petr 1"]);
    expect(s.bestRound).toMatchObject({ points: 12, team: "A" });
    expect(s.fastestWin).toMatchObject({ rounds: 1, team: "A" });
    expect(s.mostHoles).toMatchObject({ holes: 8, team: "B" });
    expect(s.closest).toMatchObject({ margin: 4, team: "A" });
    expect(s.tugOfWar).toBeNull();
  });

  it("přetahovaná a obrat", () => {
    // A vede 3:0, B otočí na 3:6, A znovu vede 9:6 a vyhraje
    const s = computeCornholeStats([game(0, [[t(3, 0), t(0, 0)], [t(0, 0), t(0, 2)], [t(0, 2), t(0, 0)]])]);
    expect(s.tugOfWar).toMatchObject({ changes: 2, teams: ["A", "B"] });
    expect(s.comeback).toMatchObject({ deficit: 3, team: "A" });
    expect(s.closest).toMatchObject({ margin: 3, team: "A" });
  });
});
