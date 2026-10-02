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
    const fall = smoothstep(H, 40, y) ** 1.4 * smoothstep(24, 130, y);
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
console.log(`✓ halftone.svg (${circles.length} teček), grain.png`);
