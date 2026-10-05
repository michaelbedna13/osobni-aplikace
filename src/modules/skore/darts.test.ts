import { describe, expect, it } from "vitest";
import { average, checkout, checkoutText, dartValue, play, possibleVisit, type DartSettings, type Visit } from "./darts";

const S501: DartSettings = { start: 501, out: "double", legs: 1 };
const v = (p: number, value: number, extra: Partial<Visit> = {}): Visit => ({ p, v: value, ...extra });

describe("počítání", () => {
  it("odečítá a střídá hráče", () => {
    const s = play(S501, 2, [v(0, 60), v(1, 100)]);
    expect(s.scores).toEqual([441, 401]);
    expect(s.current).toBe(0);
  });

  it("double out: zavření na double vyhrává, jinak přehoz", () => {
    const base = [v(0, 180), v(1, 0), v(0, 180), v(1, 0)]; // zbývá 141
    expect(play(S501, 2, [...base, v(0, 141, { darts: ["T20", "T19", "D12"] })]).winner).toBe(0);
    const wrong = play(S501, 2, [...base, v(0, 141, { darts: ["T20", "T19", "T8"] })]);
    expect(wrong.winner).toBeNull();
    expect(wrong.log.at(-1)?.bust).toBe(true);
    expect(wrong.scores[0]).toBe(141);
  });

  it("double out: zbyde 1 je přehoz, součet zavře jen s potvrzením", () => {
    const s = play({ start: 101, out: "double", legs: 1 }, 1, [v(0, 100)]);
    expect(s.log[0].bust).toBe(true);
    expect(play({ start: 101, out: "double", legs: 1 }, 1, [v(0, 101)]).winner).toBeNull();
    expect(play({ start: 101, out: "double", legs: 1 }, 1, [v(0, 101, { ok: true })]).winner).toBe(0);
  });

  it("master out bere i triple, libovolně cokoli", () => {
    expect(play({ start: 60, out: "master", legs: 1 }, 1, [v(0, 60, { darts: ["T20"] })]).winner).toBe(0);
    expect(play({ start: 60, out: "double", legs: 1 }, 1, [v(0, 60, { darts: ["T20"] })]).winner).toBeNull();
    expect(play({ start: 61, out: "straight", legs: 1 }, 1, [v(0, 61)]).winner).toBe(0);
  });

  it("legy: vítěz legu se počítá, další leg začíná další hráč", () => {
    const set: DartSettings = { start: 40, out: "double", legs: 2 };
    const s = play(set, 2, [v(0, 40, { darts: ["D20"] })]);
    expect(s.legsWon).toEqual([1, 0]);
    expect(s.leg).toBe(1);
    expect(s.scores).toEqual([40, 40]);
    expect(s.current).toBe(1);
    const done = play(set, 2, [v(0, 40, { darts: ["D20"] }), v(1, 0), v(0, 40, { darts: ["D20"] })]);
    expect(done.winner).toBe(0);
  });

  it("průměr a nemožné náhozy", () => {
    const s = play(S501, 1, [v(0, 100), v(0, 60)]);
    expect(average(s, 0)).toBe(80);
    expect(possibleVisit(180)).toBe(true);
    expect(possibleVisit(179)).toBe(false);
    expect(dartValue("DB")).toBe(50);
  });
});

describe("návrh zavření", () => {
  it("klasická zavření na double", () => {
    expect(checkoutText(checkout(170, 3, "double"))).toBe("T20 · T20 · Bull");
    expect(checkoutText(checkout(40, 3, "double"))).toBe("D20");
    expect(checkoutText(checkout(100, 3, "double"))).toBe("T20 · D20");
    expect(checkout(32, 1, "double")).toEqual(["D16"]);
  });

  it("nezavíratelná čísla a málo šipek", () => {
    for (const n of [169, 168, 166, 165, 163, 162, 159]) expect(checkout(n, 3, "double")).toBeNull();
    expect(checkout(101, 1, "double")).toBeNull();
    expect(checkout(1, 3, "double")).toBeNull();
  });

  it("master a libovolné zavření", () => {
    expect(checkout(60, 1, "master")).toEqual(["T20"]);
    expect(checkout(7, 1, "straight")).toEqual(["S7"]);
  });
});
