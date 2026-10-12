// Vygeneruje drobné textury do src/assets/tex: film přes obrazovku, zrno do tmavých ploch a tlačítek, bílé jiskření.
// Spuštění: node scripts/generate-textures.mjs (bez závislostí, výstup je pokaždé stejný)
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const out = new URL("../src/assets/tex/", import.meta.url);
mkdirSync(out, { recursive: true });
const files = [];
const svg = (name, w, h, body, defs = "") => {
  writeFileSync(new URL(`${name}.svg`, out), `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>\n`);
  files.push(`${name}.svg`);
};

// --- zrno (tmavé, přes celou obrazovku) a jemnější zrno pro karty ---
const noise = (name, alpha, freq = 0.85) => svg(name, 200, 200,
  `<rect width="100%" height="100%" filter="url(#n)"/>`,
  `<filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${alpha} 0"/></filter>`);
noise("grain", 0.5);
noise("grain-soft", 0.16);
// film: jemný šedý šum přes celou obrazovku, kreslí se v režimu soft-light (zesvětlí i ztmaví, ale barvu nešpiní)
svg("film", 200, 200, `<rect width="100%" height="100%" filter="url(#n)"/>`,
  `<filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" stitchTiles="stitch" seed="7"/><feColorMatrix values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1"/></filter>`);
// bílé jiskření do barevných karet
svg("sparkle", 200, 200, `<rect width="100%" height="100%" filter="url(#n)"/>`,
  `<filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -.75"/></filter>`);

// filmové zrno jako PNG: náhodný šum po jednom pixelu (ne mraky z feTurbulence, které na Retině vypadají jako levný
// papír). 384 px, kreslí se jako 128 px – na iPhonu (3×) je jedno zrnko jeden pixel displeje. Šedá kolem středu,
// Gaussovsky rozložená, 16 odstínů (líp se zkomprimuje, rozdíl není vidět). Pevné semínko: výstup je pokaždé stejný.
{
  const W = 384;
  let seed = 1337;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
  const raw = Buffer.alloc((W + 1) * W);
  for (let y = 0; y < W; y++) {
    raw[y * (W + 1)] = 0; // filtr řádku: žádný
    for (let x = 0; x < W; x++) {
      const v = Math.max(0, Math.min(255, 128 + gauss() * 46));
      raw[y * (W + 1) + 1 + x] = Math.round(v / 17) * 17;
    }
  }
  const crc = (buf) => { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(W, 4); ihdr[8] = 8; ihdr[9] = 0; // 8 bit, šedá
  writeFileSync(new URL("noise.png", out), Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]));
  files.push("noise.png");
}

console.log(`✓ ${files.length} textur v src/assets/tex: ${files.join(", ")}`);
