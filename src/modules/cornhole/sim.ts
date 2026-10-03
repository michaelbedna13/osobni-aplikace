// Fyzika hry Cornhole v mobilu. Jednotky jsou metry a sekundy: hráč stojí v y = 0,
// deska leží před ním po ose y, x jde doprava, z nahoru.
import type { Throw } from "./scoring";

export const BOARD = { front: 8.2, back: 9.42, half: 0.305, lowZ: 0.1, highZ: 0.3 };
export const HOLE = { x: 0, y: BOARD.back - 0.23, r: 0.076 };
export const BAG_R = 0.075;
export const BAG_T = 0.04;
export const BAGS_EACH = 4;
export const THROWS = BAGS_EACH * 2;

const G = 9.81;
const ELEVATION = (32 * Math.PI) / 180;
const HAND_Z = 0.8;
const MAX_AIM = (9 * Math.PI) / 180;
const BOARD_KEEP = 0.27; // kolik vodorovné rychlosti pytlíku zbude po dopadu na desku
const BOARD_FRICTION = 5;
const BOARD_SLOPE = 1.2;
const GROUND_KEEP = 0.12;
const GROUND_FRICTION = 14;
const RESTITUTION = 0.5;

/** Síla větru v m/s² pro stupně 0–3. */
export const WIND_LEVELS = [0, 0.25, 0.5, 0.8];

export type BagState = "flight" | "board" | "hole" | "ground";
export type Player = 0 | 1;

export interface Bag {
  owner: Player;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  state: BagState;
  moving: boolean;
}

export type SimEvent = "board" | "hole" | "ground" | "hit";

export const onBoard = (x: number, y: number) => y >= BOARD.front && y <= BOARD.back && Math.abs(x) <= BOARD.half;
export const boardZ = (y: number) => BOARD.lowZ + ((y - BOARD.front) / (BOARD.back - BOARD.front)) * (BOARD.highZ - BOARD.lowZ);
const inHole = (x: number, y: number) => Math.hypot(x - HOLE.x, y - HOLE.y) < HOLE.r;

/** Rychlost hodu podle síly 0–1. */
export const speedFor = (power: number) => 7.3 + 3.7 * power;

/**
 * Nový pytlík v letu. power 0–1 (síla), aim -1…1 (doleva/doprava).
 * Ruka se trochu chvěje, takže dva stejné hody nedopadnou úplně stejně.
 */
export function launch(owner: Player, power: number, aim: number, rnd: () => number = Math.random): Bag {
  const p = Math.min(1, Math.max(0, power + (rnd() - 0.5) * 0.03));
  const angle = Math.min(1, Math.max(-1, aim)) * MAX_AIM + (rnd() - 0.5) * 0.012;
  const v = speedFor(p);
  const flat = v * Math.cos(ELEVATION);
  return {
    owner, x: 0, y: 0, z: HAND_Z,
    vx: flat * Math.sin(angle), vy: flat * Math.cos(angle), vz: v * Math.sin(ELEVATION),
    state: "flight", moving: true,
  };
}

function slow(b: Bag, decel: number, dt: number) {
  const speed = Math.hypot(b.vx, b.vy);
  if (speed <= decel * dt) {
    b.vx = 0;
    b.vy = 0;
    b.moving = false;
  } else {
    const k = (speed - decel * dt) / speed;
    b.vx *= k;
    b.vy *= k;
  }
}

/** Jeden krok simulace (mění pytlíky na místě). Vrací, co se stalo – kvůli zvukům. */
export function step(bags: Bag[], dt: number, wind: number): SimEvent[] {
  const events: SimEvent[] = [];
  for (const b of bags) {
    if (b.state === "flight") {
      const prevY = b.y;
      b.vx += wind * dt;
      b.vz -= G * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      // náraz do čela desky
      if (prevY < BOARD.front && b.y >= BOARD.front && Math.abs(b.x) <= BOARD.half && b.z < BOARD.lowZ) {
        b.y = BOARD.front - BAG_R;
        b.vy *= -0.15;
        b.vx *= 0.5;
        events.push("hit");
      }
      const over = onBoard(b.x, b.y);
      const surface = over ? boardZ(b.y) : 0;
      if (b.z <= surface) {
        b.z = surface;
        b.vz = 0;
        if (over && inHole(b.x, b.y)) {
          b.state = "hole";
          b.moving = false;
          events.push("hole");
        } else if (over) {
          b.state = "board";
          b.vx *= BOARD_KEEP;
          b.vy *= BOARD_KEEP;
          events.push("board");
        } else {
          b.state = "ground";
          b.vx *= GROUND_KEEP;
          b.vy *= GROUND_KEEP;
          events.push("ground");
        }
      }
    } else if (b.moving) {
      if (b.state === "board") b.vy -= BOARD_SLOPE * dt;
      slow(b, b.state === "board" ? BOARD_FRICTION : GROUND_FRICTION, dt);
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.state === "board") {
        if (inHole(b.x, b.y)) {
          b.state = "hole";
          b.moving = false;
          b.vx = 0;
          b.vy = 0;
          events.push("hole");
        } else if (!onBoard(b.x, b.y)) {
          b.state = "ground";
          b.z = 0;
          b.vx *= 0.5;
          b.vy *= 0.5;
          b.moving = true;
          events.push("ground");
        } else {
          b.z = boardZ(b.y);
        }
      }
    }
  }
  collide(bags, events);
  return events;
}

/** Srážky pytlíků na desce: stejná hmotnost, částečně pružný náraz. */
function collide(bags: Bag[], events: SimEvent[]) {
  const onTop = bags.filter((b) => b.state === "board");
  for (let i = 0; i < onTop.length; i++) {
    for (let j = i + 1; j < onTop.length; j++) {
      const a = onTop[i];
      const b = onTop[j];
      if (!a.moving && !b.moving) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      if (d >= BAG_R * 2) continue;
      const nx = d > 0 ? dx / d : 0;
      const ny = d > 0 ? dy / d : 1;
      const push = (BAG_R * 2 - d) / 2;
      a.x -= nx * push;
      a.y -= ny * push;
      b.x += nx * push;
      b.y += ny * push;
      const vn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (vn <= 0) continue;
      const imp = ((1 + RESTITUTION) / 2) * vn;
      a.vx -= imp * nx;
      a.vy -= imp * ny;
      b.vx += imp * nx;
      b.vy += imp * ny;
      a.moving = true;
      b.moving = true;
      if (vn > 0.3) events.push("hit");
    }
  }
}

export const settled = (bags: Bag[]) => bags.every((b) => b.state !== "flight" && !b.moving);

/** Přehraje simulaci až do zastavení všech pytlíků (testy, náhled). */
export function simulate(bags: Bag[], wind = 0, dt = 1 / 120): SimEvent[] {
  const all: SimEvent[] = [];
  for (let t = 0; t < 12 && !settled(bags); t += dt) all.push(...step(bags, dt, wind));
  return all;
}

/** Výsledek kola pro oba hráče: kolik pytlíků zůstalo na desce a kolik spadlo do díry. */
export function countRound(bags: Bag[]): Throw[] {
  const out: Throw[] = [{ board: 0, hole: 0 }, { board: 0, hole: 0 }];
  for (const b of bags) {
    if (b.state === "board") out[b.owner].board++;
    if (b.state === "hole") out[b.owner].hole++;
  }
  return out;
}

/** Kdo hází n-tý pytlík kola (střídají se, začíná starter). */
export const throwerAt = (n: number, starter: Player): Player => (n % 2 === 0 ? starter : ((1 - starter) as Player));
