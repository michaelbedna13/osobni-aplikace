// Vygeneruje textury pozadí do src/assets: rastr (halftone) a zrno.
// Spuštění: node scripts/generate-textures.mjs (bez závislostí; náhodnost je pevná, výstup je pokaždé stejný)
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const out = new URL("../src/assets/", import.meta.url);

// --- deterministická náhoda a hodnotový šum ---
let seed = 20261002;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const hash = (x, y) => {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const smooth = (t) => t * t * (3 - 2 * t);
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const u = smooth(x - xi), v = smooth(y - yi);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y) => (noise(x, y) * 4 + noise(x * 2.1, y * 2.1) * 2 + noise(x * 4.3, y * 4.3)) / 7;
const smoothstep = (a, b, x) => smooth(Math.min(1, Math.max(0, (x - a) / (b - a))));

// --- rastr: tečky rostou v „mraku“ nahoře a směrem dolů mizí ---
const W = 520, H = 480, S = 8;
const circles = [];
for (let j = 0; j * S * 0.866 < H + S; j++) {
  const y = j * S * 0.866;
  for (let i = -1; i * S < W + S; i++) {
    const x = i * S + (j % 2 ? S / 2 : 0);
    const fall = smoothstep(H, 40, y) ** 1.4 * smoothstep(0, 56, y);
    const cloud = fbm(x / 150 + 3, y / 110 + 7);
    const v = fall * smoothstep(0.32, 0.78, cloud);
    const r = (S / 2) * 0.98 * Math.sqrt(Math.min(1, v));
    if (r >= 0.45) circles.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}"/>`);
  }
}
writeFileSync(new URL("halftone.svg", out),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><g fill="#fff">${circles.join("")}</g></svg>\n`);

// --- zrno: šedé PNG s průhledností (světlá i tmavá zrnka) ---
const N = 128;
const raw = Buffer.alloc(N * (1 + N * 2));
for (let y = 0; y < N; y++) {
  raw[y * (1 + N * 2)] = 0;
  for (let x = 0; x < N; x++) {
    const v = rand();
    const o = y * (1 + N * 2) + 1 + x * 2;
    raw[o] = v < 0.5 ? 0 : 255;
    raw[o + 1] = Math.round(v < 0.5 ? (0.5 - v) * 2 * 34 : (v - 0.5) * 2 * 26);
  }
}
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4);
ihdr[8] = 8; ihdr[9] = 4; // 8 bitů, šedá + alfa
writeFileSync(new URL("grain.png", out), Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0)),
]));
// --- hustší zrno pro pozadí „světlo“ a „vzor“ (jako film) ---
let seed2 = 13;
const rand2 = () => ((seed2 = (seed2 * 1664525 + 1013904223) >>> 0) / 4294967296);
const raw2 = Buffer.alloc(N * (1 + N * 2));
for (let y = 0; y < N; y++) {
  raw2[y * (1 + N * 2)] = 0;
  for (let x = 0; x < N; x++) {
    const v = rand2();
    const o = y * (1 + N * 2) + 1 + x * 2;
    raw2[o] = v < 0.5 ? 0 : 255;
    raw2[o + 1] = Math.round(v < 0.5 ? (0.5 - v) * 2 * 70 : (v - 0.5) * 2 * 46);
  }
}
writeFileSync(new URL("grain-strong.png", out), Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw2, { level: 9 })), chunk("IEND", Buffer.alloc(0)),
]));

// --- vzor: oblé „čmáranice“ (U, S, C, L, kroužky, tečky) v mřížce, dlaždice na sebe navazuje ---
let seed3 = 1313;
const rand3 = () => ((seed3 = (seed3 * 1664525 + 1013904223) >>> 0) / 4294967296);
// tvary v poli 100 × 100 (malé) a 200 × 100 (dlouhé přes dvě buňky)
const GLYPHS = [
  "M22 14 V56 Q22 86 50 86 Q78 86 78 56 V14",
  "M78 18 Q24 10 24 36 Q24 50 50 50 Q76 50 76 66 Q76 90 20 82",
  "M80 22 Q16 8 14 50 Q16 92 80 78",
  "M22 12 V80 H82",
  "M50 50 h0.1",
  "M50 50 m-24 0 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0",
  "M70 12 V58 Q70 88 42 88 Q20 88 20 66",
  "M12 34 Q34 10 50 46 Q66 82 88 60",
  "M28 50 h0.1 M72 50 h0.1",
  "M26 16 V84 M72 50 h0.1",
  "M14 22 H64 Q86 22 86 46 Q86 70 62 70 H36",
  "M20 80 Q20 20 50 20 Q80 20 80 50 Q80 66 64 66",
];
const LONG = [
  "M14 26 H150 Q186 26 186 50 Q186 74 150 74 H40",
  "M16 50 H184",
  "M20 24 V56 Q20 80 50 80 H150 Q180 80 180 56 V24",
  "M16 70 Q50 14 100 50 Q150 86 184 30",
  "M18 30 H120 Q150 30 150 56 Q150 80 176 80 M178 22 h0.1",
];
const CELL = 100, CELLS = 6;
const used = Array.from({ length: CELLS }, () => Array(CELLS).fill(false));
const parts = [];
const pick = (list) => list[Math.floor(rand3() * list.length)];
for (let cy = 0; cy < CELLS; cy++) {
  for (let cx = 0; cx < CELLS; cx++) {
    if (used[cy][cx]) continue;
    used[cy][cx] = true;
    const tilt = ((rand3() - 0.5) * 16).toFixed(1);
    const scale = (0.95 + rand3() * 0.15).toFixed(2);
    const flip = rand3() < 0.5 ? -1 : 1;
    const right = cx + 1 < CELLS && !used[cy][cx + 1];
    const down = cy + 1 < CELLS && !used[cy + 1][cx];
    if ((right || down) && rand3() < 0.42) {
      // dlouhý tvar přes dvě buňky, vodorovně nebo svisle
      const horiz = right && (!down || rand3() < 0.5);
      if (horiz) used[cy][cx + 1] = true; else used[cy + 1][cx] = true;
      const x = cx * CELL + (horiz ? CELL : CELL / 2), y = cy * CELL + (horiz ? CELL / 2 : CELL);
      const rot = (horiz ? 0 : 90) + (rand3() < 0.5 ? 180 : 0);
      parts.push(`<path transform="translate(${x} ${y}) rotate(${rot + Number(tilt) / 2}) scale(${flip * Number(scale)} ${scale}) translate(-100 -50)" d="${pick(LONG)}"/>`);
    } else {
      const rot = Math.floor(rand3() * 4) * 90 + Number(tilt);
      const x = cx * CELL + CELL / 2, y = cy * CELL + CELL / 2;
      parts.push(`<path transform="translate(${x} ${y}) rotate(${rot}) scale(${flip * Number(scale)} ${scale}) translate(-50 -50)" d="${pick(GLYPHS)}"/>`);
    }
  }
}
const T = CELL * CELLS;
writeFileSync(new URL("squiggle.svg", out),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${T} ${T}"><g fill="none" stroke="#fff" stroke-width="30" stroke-linecap="round" stroke-linejoin="round">${parts.join("")}</g></svg>\n`);

console.log(`✓ halftone.svg (${circles.length} teček), grain.png, grain-strong.png, squiggle.svg`);
