import { describe, expect, it } from "vitest";
import { dartAverage, play, ranking, settingsLabel, type Turn } from "./rules";

const turns = (...pairs: [number, number][]): Turn[] => pairs.map(([p, v]) => ({ p, v }));

describe("šipky", () => {
  it("odečítá od startu a střídá hráče", () => {
    const s = play("sipky", { start: 301 }, 2, turns([0, 60], [1, 45]));
    expect(s.scores).toEqual([241, 256]);
    expect(s.current).toBe(0);
  });

  it("přehoz se nepočítá, přesná nula vyhrává", () => {
    const s = play("sipky", { start: 301 }, 2, turns([0, 180], [1, 100], [0, 140], [1, 100], [0, 121]));
    expect(s.log[2].bust).toBe(true);
    expect(s.scores[0]).toBe(0);
    expect(s.winner).toBe(0);
    expect(s.current).toBeNull();
  });

  it("průměr na nához počítá přehoz jako nulu", () => {
    const s = play("sipky", { start: 301 }, 1, turns([0, 100], [0, 300]));
    expect(dartAverage(s, 0)).toBe(50);
  });
});

describe("mölkky", () => {
  it("přes 50 spadne na 25, přesně 50 vyhrává", () => {
    const s = play("molkky", {}, 2, turns([0, 12], [1, 3], [0, 12], [1, 3], [0, 12], [1, 3], [0, 12], [1, 3], [0, 6]));
    expect(s.scores[0]).toBe(25);
    expect(s.log.at(-1)?.reset).toBe(true);
    const w = play("molkky", {}, 2, turns([0, 12], [1, 3], [0, 12], [1, 3], [0, 12], [1, 3], [0, 12], [1, 3], [0, 2]));
    expect(w.winner).toBe(0);
  });

  it("tři nuly v řadě vyřadí a vynechá ho v pořadí", () => {
    const s = play("molkky", {}, 3, turns([0, 0], [1, 5], [2, 5], [0, 0], [1, 5], [2, 5], [0, 0]));
    expect(s.out[0]).toBe(true);
    expect(s.current).toBe(1);
    const next = play("molkky", {}, 3, turns([0, 0], [1, 5], [2, 5], [0, 0], [1, 5], [2, 5], [0, 0], [1, 5], [2, 5]));
    expect(next.current).toBe(1);
  });

  it("když zbude jediný hráč, vyhrává", () => {
    const s = play("molkky", {}, 2, turns([0, 0], [1, 5], [0, 0], [1, 5], [0, 0]));
    expect(s.winner).toBe(1);
  });

  it("trefa nuly v řadě nuluje", () => {
    const s = play("molkky", {}, 1, turns([0, 0], [0, 0], [0, 4], [0, 0]));
    expect(s.misses[0]).toBe(1);
    expect(s.out[0]).toBe(false);
  });
});

describe("pétanque", () => {
  it("boduje jen zapsaný tým a vyhrává na 13", () => {
    const s = play("petanque", { target: 13 }, 2, turns([1, 4], [0, 6], [1, 5], [1, 4]));
    expect(s.scores).toEqual([6, 13]);
    expect(s.winner).toBe(1);
    expect(s.current).toBeNull();
  });
});

describe("vlastní hra", () => {
  it("po kolech, vítěz až po dohraném kole", () => {
    const half = play("vlastni", { target: 20 }, 2, turns([0, 12], [1, 5], [0, 10]));
    expect(half.winner).toBeNull();
    expect(half.current).toBe(1);
    const done = play("vlastni", { target: 20 }, 2, turns([0, 12], [1, 5], [0, 10], [1, 30]));
    expect(done.winner).toBe(1);
    expect(done.rounds).toBe(2);
  });

  it("při shodě na cíli se hraje dál", () => {
    const s = play("vlastni", { target: 10 }, 2, turns([0, 10], [1, 10]));
    expect(s.winner).toBeNull();
  });

  it("nejméně bodů: kdo přetáhne cíl, ukončí hru a vyhraje nejnižší", () => {
    const s = play("vlastni", { target: 100, lowWins: true }, 3, turns([0, 40], [1, 20], [2, 30], [0, 70], [1, 10], [2, 30]));
    expect(s.winner).toBe(1);
    expect(ranking("vlastni", { lowWins: true }, s)).toEqual([1, 2, 0]);
  });

  it("bez cíle se ukončuje ručně, záporné body jdou taky", () => {
    const t = turns([0, 5], [1, -3]);
    expect(play("vlastni", { target: null }, 2, t).winner).toBeNull();
    expect(play("vlastni", { target: null }, 2, t, true).winner).toBe(0);
  });
});

describe("popisky", () => {
  it("nastavení krátce", () => {
    expect(settingsLabel("sipky", { start: 301 })).toBe("301");
    expect(settingsLabel("petanque", { target: 13 })).toBe("do 13");
    expect(settingsLabel("vlastni", { target: null })).toBe("bez cíle");
    expect(settingsLabel("vlastni", { target: 100, lowWins: true })).toBe("konec na 100, vyhrává nejméně");
  });
});
