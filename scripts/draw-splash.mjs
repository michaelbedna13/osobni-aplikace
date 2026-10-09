// Nakreslí znak untrois pro úvodní obrazovku (index.html, #splash): stejná květina se 13 lístky a okem jako ikona
// (scripts/draw-icons.mjs), jen každý lístek zvlášť, aby se při spuštění mohly rozvinout jeden po druhém.
// Výsledné SVG vloží do index.html mezi značky <!-- splash:start --> a <!-- splash:end -->.
// Spuštění: node scripts/draw-splash.mjs (bez závislostí, výstup je pokaždé stejný)
import { readFileSync, writeFileSync } from "node:fs";

let seed = 13;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const n1 = (v) => Math.round(v * 10) / 10;

/** Uzavřený hladký tvar přes body (Catmull-Rom → Bézier), jako v draw-icons.mjs. */
function blob(pts, jitter = 1, tension = 0.45) {
  const p = pts.map(([x, y]) => [x + (rnd() - 0.5) * jitter, y + (rnd() - 0.5) * jitter]);
  const n = p.length;
  let d = `M${n1(p[0][0])} ${n1(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    const c1 = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3];
    const c2 = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3];
    d += `C${n1(c1[0])} ${n1(c1[1])} ${n1(c2[0])} ${n1(c2[1])} ${n1(p2[0])} ${n1(p2[1])}`;
  }
  return d + "Z";
}
const at = (a, r) => [50 + Math.cos(a) * r, 52 + Math.sin(a) * r];

const petals = [];
for (let i = 0; i < 13; i++) {
  const a = (i / 13) * Math.PI * 2 - Math.PI / 2 + (rnd() - 0.5) * 0.08, w = (Math.PI / 13) * (0.72 + rnd() * 0.12), R = 44 + rnd() * 4, h = Math.PI / 13;
  const d = blob([at(a, 12), at(a - h, 21), at(a - w, R), at(a, R + 3.5), at(a + w, R), at(a + h, 21)], 0.8);
  petals.push(`<path class="petal" style="--i:${i}" d="${d}"/>`);
}
const core = `<circle class="core" cx="50" cy="52" r="23"/>`;
const eye = `<path class="eye" d="${blob([[31, 52], [40.5, 42.7], [50, 41], [59.5, 42.7], [69, 52], [59.5, 60.8], [50, 61.9], [40.5, 60.8]], 0.4)}"/>`;
const pupil = `<circle class="pupil" cx="50" cy="52" r="6.5"/>`;

const svg = `<svg class="splash-flower" viewBox="0 0 100 104" aria-hidden="true"><g class="bloom">${core}${petals.join("")}</g>${eye}${pupil}</svg>`;

const file = new URL("../index.html", import.meta.url);
const html = readFileSync(file, "utf8");
const start = "<!-- splash:start -->", end = "<!-- splash:end -->";
const i = html.indexOf(start), j = html.indexOf(end);
if (i < 0 || j < 0) throw new Error("index.html nemá značky splash:start / splash:end");
writeFileSync(file, html.slice(0, i + start.length) + svg + html.slice(j));
console.log("✓ znak na úvodní obrazovce v index.html");
