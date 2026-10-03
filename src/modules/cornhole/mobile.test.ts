import { describe, expect, it } from "vitest";
import { headToHead, nextStarter, rollWind, windForce, type MobileResult } from "./mobile";

const result = (names: string[], winner: number): MobileResult => ({ date: "2026-10-03", names, scores: names.map(() => 0), winner });

describe("hra v mobilu", () => {
  it("bilance nezávisí na pořadí jmen ani velikosti písmen", () => {
    const list = [result(["Jana", "Petr"], 0), result(["Petr", "Jana"], 0), result(["jana", "PETR"], 0), result(["Jana", "Eva"], 0)];
    expect(headToHead(list, ["Jana", "Petr"])).toEqual([2, 1]);
  });

  it("bilance party tří hráčů počítá jen hry téže trojice", () => {
    const list = [result(["Jana", "Petr", "Eva"], 2), result(["Eva", "Jana", "Petr"], 1), result(["Jana", "Petr"], 0)];
    expect(headToHead(list, ["Petr", "Eva", "Jana"])).toEqual([0, 1, 1]);
  });

  it("další kolo začíná ten, kdo v kole byl nejlepší", () => {
    const round = [{ board: 1, hole: 0 }, { board: 0, hole: 1 }, { board: 2, hole: 0 }];
    expect(nextStarter(round, "soucet", 0)).toBe(1);
    expect(nextStarter(round, "rozdil", 0)).toBe(1);
    expect(nextStarter([{ board: 1, hole: 0 }, { board: 1, hole: 0 }], "rozdil", 1)).toBe(1);
  });

  it("bez větru je vítr nulový, jinak stupeň 0–3 na jednu ze stran", () => {
    expect(rollWind(false)).toBe(0);
    expect(rollWind(true, () => 0.99)).toBe(3);
    expect(rollWind(true, () => 0.3)).toBe(-1);
    expect(windForce(-2)).toBeLessThan(0);
    expect(windForce(0)).toBe(0);
  });
});
