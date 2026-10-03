import { describe, expect, it } from "vitest";
import { headToHead, rollWind, windForce, type MobileResult } from "./mobile";

const result = (names: [string, string], winner: 0 | 1): MobileResult => ({ date: "2026-10-03", names, scores: [21, 10], winner });

describe("hra v mobilu", () => {
  it("bilance nezávisí na pořadí jmen ani velikosti písmen", () => {
    const list = [result(["Jana", "Petr"], 0), result(["Petr", "Jana"], 0), result(["jana", "PETR"], 0), result(["Jana", "Eva"], 0)];
    expect(headToHead(list, ["Jana", "Petr"])).toEqual([2, 1]);
  });

  it("bez větru je vítr nulový, jinak stupeň 0–3 na jednu ze stran", () => {
    expect(rollWind(false)).toBe(0);
    expect(rollWind(true, () => 0.99)).toBe(3);
    expect(rollWind(true, () => 0.3)).toBe(-1);
    expect(windForce(-2)).toBeLessThan(0);
    expect(windForce(0)).toBe(0);
  });
});
