import { describe, expect, it } from "vitest";
import { BAG_R, BOARD, HOLE, countRound, launch, simulate, throwerAt, type Bag } from "./sim";

const steady = () => 0.5;
const resting = (owner: 0 | 1, x: number, y: number, state: Bag["state"] = "board"): Bag => ({ owner, x, y, z: 0.2, vx: 0, vy: 0, vz: 0, state, moving: false });

describe("hod", () => {
  it("slabý hod skončí před deskou, silný za ní", () => {
    const short = launch(0, 0.1, 0, steady);
    const long = launch(0, 1, 0, steady);
    simulate([short]);
    simulate([long]);
    expect(short.state).toBe("ground");
    expect(short.y).toBeLessThan(BOARD.front);
    expect(long.state).toBe("ground");
    expect(long.y).toBeGreaterThan(BOARD.back);
  });

  it("střední síla dopadne na desku a rovný hod sklouzne do díry", () => {
    const board = launch(0, 0.46, 0, steady);
    const hole = launch(0, 0.57, 0, steady);
    simulate([board]);
    simulate([hole]);
    expect(board.state).toBe("board");
    expect(hole.state).toBe("hole");
  });

  it("hod hodně do strany desku mine", () => {
    const b = launch(0, 0.5, 1, steady);
    simulate([b]);
    expect(b.state).toBe("ground");
    expect(Math.abs(b.x)).toBeGreaterThan(BOARD.half);
  });

  it("vítr pytlík odnese", () => {
    const calm = launch(0, 0.5, 0, steady);
    const windy = launch(0, 0.5, 0, steady);
    simulate([calm], 0);
    simulate([windy], 0.8);
    expect(windy.x - calm.x).toBeGreaterThan(0.3);
  });
});

describe("srážky", () => {
  it("pytlík narazí do ležícího a postrčí ho", () => {
    const lying = resting(1, 0, HOLE.y - 0.25);
    const moving: Bag = { ...resting(0, 0, HOLE.y - 0.5), vy: 2, moving: true };
    simulate([lying, moving]);
    expect(lying.y).toBeGreaterThan(HOLE.y - 0.25);
    expect(Math.hypot(moving.x - lying.x, moving.y - lying.y)).toBeGreaterThanOrEqual(BAG_R * 2 - 1e-6);
  });

  it("postrčený pytlík může spadnout do díry", () => {
    const lying = resting(1, 0, HOLE.y - 0.12);
    const moving: Bag = { ...resting(0, 0, HOLE.y - 0.4), vy: 2.2, moving: true };
    simulate([lying, moving]);
    expect(lying.state).toBe("hole");
  });
});

describe("kolo", () => {
  it("spočítá desku a díru pro oba hráče", () => {
    const bags = [resting(0, 0, 8.6), resting(0, 0, 9, "hole"), resting(1, 0.1, 8.7), resting(1, 0.5, 7, "ground")];
    expect(countRound(bags)).toEqual([{ board: 1, hole: 1 }, { board: 1, hole: 0 }]);
  });

  it("hráči se střídají od toho, kdo začíná", () => {
    expect([0, 1, 2, 3].map((n) => throwerAt(n, 1))).toEqual([1, 0, 1, 0]);
  });
});
