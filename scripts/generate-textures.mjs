// Vygeneruje textury pozadí do src/assets/tex: zrno, jiskření a jednu texturu na modul.
// Textura na téma jen naráží (pivo = světlo lomené sklenicí, ne bublinky). Barvy čte ze src/lib/modules.ts.
// Spuštění: node scripts/generate-textures.mjs (bez závislostí; náhodnost je pevná, výstup je pokaždé stejný)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const out = new URL("../src/assets/tex/", import.meta.url);
mkdirSync(out, { recursive: true });
const src = readFileSync(new URL("../src/lib/modules.ts", import.meta.url), "utf8");
const deep = {};
const color = {};
for (const m of src.matchAll(/key: "(\w+)".*?color: "(#\w+)", deep: "(#\w+)"/g)) { color[m[1]] = m[2]; deep[m[1]] = m[3]; }

let seed = 3;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const files = [];
const svg = (name, w, h, body, defs = "") => {
  writeFileSync(new URL(`${name}.svg`, out), `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>\n`);
  files.push(`${name}.svg`);
};
const blur = (id, s) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${s}"/></filter>`;
const f = (n) => n.toFixed(1);

// --- zrno (tmavé, přes celou obrazovku) a jemnější zrno pro karty ---
const noise = (name, alpha, freq = 0.85) => svg(name, 200, 200,
  `<rect width="100%" height="100%" filter="url(#n)"/>`,
  `<filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${alpha} 0"/></filter>`);
noise("grain", 0.5);
noise("grain-soft", 0.16);
// bílé jiskření do barevných karet
svg("sparkle", 200, 200, `<rect width="100%" height="100%" filter="url(#n)"/>`,
  `<filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -.75"/></filter>`);

// --- Dnes a ostatní obrazovky: měkké paprsky světla ---
svg("dnes", 600, 900, `<g filter="url(#b)" fill="#fff">${[[120, 0.55], [230, 0.35], [330, 0.45], [450, 0.3]].map(([x, o]) => `<polygon points="${x},-40 ${x + 50},-40 ${x - 260},960 ${x - 360},960" opacity="${o}"/>`).join("")}</g>`, blur("b", 16));

// --- Piva: kaustiky, světelná síť jako pod sklenicí na slunci (PNG, počítá se po pixelech) ---
{
  const N = 360, cells = 7; seed = 13;
  const pts = [];
  for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) pts.push([(i + 0.15 + rnd() * 0.7) / cells * N, (j + 0.15 + rnd() * 0.7) / cells * N]);
  const raw = Buffer.alloc(N * (1 + N * 2));
  for (let y = 0; y < N; y++) {
    raw[y * (1 + N * 2)] = 0;
    for (let x = 0; x < N; x++) {
      // zvlnění sítě (periodické, dlaždice navazuje)
      const wx = x + 16 * Math.sin((y / N) * Math.PI * 4) + 9 * Math.sin((x / N) * Math.PI * 6 + (y / N) * Math.PI * 2);
      const wy = y + 16 * Math.sin((x / N) * Math.PI * 4 + 1) + 9 * Math.cos((y / N) * Math.PI * 6 + (x / N) * Math.PI * 2);
      let f1 = 1e9, f2 = 1e9;
      for (const [px, py] of pts) {
        let dx = Math.abs(wx - px); dx = Math.min(dx, N - dx);
        let dy = Math.abs(wy - py); dy = Math.min(dy, N - dy);
        const d = Math.hypot(dx, dy);
        if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
      }
      const e = f2 - f1;
      // část hran mizí, aby síť nepůsobila jako dlaždice
      const m = 0.5 + 0.5 * Math.sin((x / N) * Math.PI * 4 + 0.7) * Math.cos((y / N) * Math.PI * 6 - 0.4);
      const a = (Math.exp(-e / 2.2) * 0.8 + Math.exp(-e / 10) * 0.22) * (0.2 + 0.8 * m * m);
      const o = y * (1 + N * 2) + 1 + x * 2;
      raw[o] = 255; raw[o + 1] = Math.min(255, Math.round(a * 255));
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 4; // šedá + alfa
  writeFileSync(new URL("piva.png", out), Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0)),
  ]));
  files.push("piva.png");
}

// --- Meditace: rozmazaná aura od ikony ---
svg("meditace", 600, 600, `<g filter="url(#b)" fill="none" stroke="#fff">${[70, 115, 165, 220, 280, 345].map((r, i) => `<circle cx="300" cy="230" r="${r}" stroke-width="${22 - i * 2}" stroke-opacity="${(0.95 - i * 0.1).toFixed(2)}"/>`).join("")}</g>`, blur("b", 14));

// --- Trénink: prach z magnézia (obláčky a zrnka) ---
svg("trenink", 520, 520, `<rect width="100%" height="100%" filter="url(#k)"/><rect width="100%" height="100%" filter="url(#s)"/>`,
  `<filter id="k" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.011" numOctaves="5" seed="21" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.2 0 0 0 -1.1"/></filter>` +
  `<filter id="s" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="1" seed="9" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  6 0 0 0 -4.4"/></filter>`);

// --- Hláškomat: polotónový tisk, tečky šikmo řídnou ---
{
  let b = "";
  for (let y = 0; y < 60; y++) for (let x = 0; x < 40; x++) {
    const cx = x * 14 + (y % 2) * 7, cy = y * 14;
    const r = 3.4 * Math.max(0, 1 - (cx * 0.45 + cy) / 700);
    if (r > 0.35) b += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(2)}"/>`;
  }
  svg("hlaskomat", 560, 840, `<g fill="${deep.hlaskomat}" opacity=".22">${b}</g>`);
}

// --- 13 – Untrois: světelný únik jako na kinofilmu ---
svg("untrois", 600, 900, `<g filter="url(#b)"><ellipse cx="560" cy="60" rx="260" ry="200" fill="#FEAE34" opacity=".45"/><ellipse cx="600" cy="250" rx="120" ry="260" fill="#F77622" opacity=".25"/><ellipse cx="40" cy="760" rx="200" ry="160" fill="#fff" opacity=".6"/></g>`, blur("b", 60));

// --- Nákup: nepravidelné proužky termopapíru ---
{
  seed = 5; let b = "", y = 0;
  while (y < 400) { const h = 1 + rnd() * 2.2; b += `<rect y="${f(y)}" width="10" height="${f(h)}" opacity="${(0.05 + rnd() * 0.12).toFixed(2)}"/>`; y += h + 2 + rnd() * 5; }
  svg("nakup", 10, 400, `<g fill="${deep.nakup}">${b}</g>`);
}

// --- Lidé: rozostřená světýlka jako na oslavě ---
{
  seed = 9; let b = "";
  for (let i = 0; i < 34; i++) { const r = 8 + rnd() * 34; b += `<circle cx="${(rnd() * 600).toFixed()}" cy="${(rnd() * 900).toFixed()}" r="${r.toFixed()}" fill="${rnd() > 0.45 ? "#fff" : color.lide}" opacity="${(0.12 + rnd() * 0.22).toFixed(2)}"/>`; }
  svg("lide", 600, 900, `<g filter="url(#b)">${b}</g>`, blur("b", 14));
}

// --- Vděčnost: vlákna ručního papíru ---
{
  seed = 4; let b = "";
  for (let i = 0; i < 320; i++) {
    const x = rnd() * 300, y = rnd() * 300, a = rnd() * Math.PI, l = 6 + rnd() * 22;
    b += `<path d="M${f(x)} ${f(y)} q${f(Math.cos(a) * l / 2 + (rnd() - 0.5) * 6)} ${f(Math.sin(a) * l / 2 + (rnd() - 0.5) * 6)} ${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}" stroke="${rnd() > 0.5 ? "#fff" : deep.vdecnost}" stroke-opacity="${(0.15 + rnd() * 0.3).toFixed(2)}" stroke-width="${(0.6 + rnd()).toFixed(1)}" fill="none"/>`;
  }
  svg("vdecnost", 300, 300, b);
}

// --- Cornhole: drobná vazba látky ---
svg("cornhole", 12, 12, `<g fill="${deep.cornhole}"><rect x="0" y="1" width="6" height="4" opacity=".12"/><rect x="6" y="7" width="6" height="4" opacity=".12"/><rect x="7" y="0" width="4" height="6" opacity=".06"/><rect x="1" y="6" width="4" height="6" opacity=".06"/></g>`);

// --- Šipky: slabé paprsky z jednoho bodu (výseče terče jen naznačené) ---
{
  let b = "";
  for (let i = 0; i < 20; i++) {
    const a1 = (i / 20) * Math.PI * 2, a2 = ((i + 1) / 20) * Math.PI * 2;
    b += `<path d="M300 140 L${(300 + Math.cos(a1) * 1200).toFixed()} ${(140 + Math.sin(a1) * 1200).toFixed()} L${(300 + Math.cos(a2) * 1200).toFixed()} ${(140 + Math.sin(a2) * 1200).toFixed()}Z" fill="${i % 2 ? "#fff" : deep.skore}" opacity="${i % 2 ? 0.12 : 0.035}"/>`;
  }
  svg("skore", 600, 900, `<g filter="url(#b)">${b}</g>`, blur("b", 10));
}

// --- Šachy: žilkování mramoru ---
svg("sachy", 520, 520, `<rect width="100%" height="100%" filter="url(#m)"/>`,
  `<filter id="m" x="0" y="0" width="100%" height="100%"><feTurbulence type="turbulence" baseFrequency="0.004 0.012" numOctaves="4" seed="17" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .41  0 0 0 0 .53  -6 0 0 0 .62"/></filter>`);

// --- Odkazy: souhvězdí, body spojené tenkými čarami ---
{
  seed = 12;
  const P = [...Array(34)].map(() => [rnd() * 600, rnd() * 900]);
  let b = "";
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
    const d = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]);
    if (d < 150) b += `<line x1="${P[i][0].toFixed()}" y1="${P[i][1].toFixed()}" x2="${P[j][0].toFixed()}" y2="${P[j][1].toFixed()}" stroke="${deep.odkazy}" stroke-opacity="${(0.22 * (1 - d / 150)).toFixed(2)}" stroke-width="1.2"/>`;
  }
  for (const [x, y] of P) b += `<circle cx="${x.toFixed()}" cy="${y.toFixed()}" r="${(1.5 + rnd() * 2).toFixed(1)}" fill="#fff" opacity=".85"/><circle cx="${x.toFixed()}" cy="${y.toFixed()}" r="1.2" fill="${deep.odkazy}" opacity=".5"/>`;
  svg("odkazy", 600, 900, b);
}

// --- Místa: rozpité vrstevnice jako akvarel ---
{
  let b = "";
  for (const [cx, cy, n, ph] of [[150, 170, 14, 0.4], [470, 480, 12, 2.1], [60, 780, 9, 4.0]]) for (let i = 1; i <= n; i++) {
    const R = i * 22; let d = "";
    for (let t = 0; t <= 96; t++) {
      const a = (t / 96) * Math.PI * 2;
      const r = R * (1 + 0.16 * Math.sin(3 * a + ph + i * 0.13) + 0.08 * Math.sin(5 * a - ph * 1.7));
      d += (t ? "L" : "M") + f(cx + Math.cos(a) * r) + " " + f(cy + Math.sin(a) * r * 0.82);
    }
    b += `<path d="${d}Z" fill="none" stroke="${deep.mista}" stroke-opacity="${i % 4 === 0 ? 0.3 : 0.14}" stroke-width="${i % 4 === 0 ? 2.4 : 1.4}"/>`;
  }
  svg("mista", 600, 900, `<g filter="url(#b)">${b}</g>`, blur("b", 0.9));
}

// --- Filmy: kužel světla z projektoru a škrábance ---
{
  seed = 21; let sc = "";
  for (let i = 0; i < 14; i++) {
    const x = rnd() * 600;
    sc += `<line x1="${x.toFixed()}" y1="${(rnd() * 300).toFixed()}" x2="${(x + (rnd() - 0.5) * 8).toFixed()}" y2="${(400 + rnd() * 500).toFixed()}" stroke="${rnd() > 0.5 ? "#fff" : deep.filmy}" stroke-opacity="${(0.15 + rnd() * 0.25).toFixed(2)}" stroke-width="${(0.6 + rnd() * 0.8).toFixed(1)}"/>`;
  }
  svg("filmy", 600, 900, `<polygon points="270,-20 330,-20 620,900 -20,900" fill="#fff" opacity=".35" filter="url(#b)"/>${sc}`, blur("b", 40));
}

// --- Wishlist: třpyt ---
{
  seed = 31; let b = "";
  const star = (x, y, s) => `M${f(x)} ${f(y - s)} Q${f(x)} ${f(y)} ${f(x + s)} ${f(y)} Q${f(x)} ${f(y)} ${f(x)} ${f(y + s)} Q${f(x)} ${f(y)} ${f(x - s)} ${f(y)} Q${f(x)} ${f(y)} ${f(x)} ${f(y - s)}Z`;
  for (let i = 0; i < 60; i++) {
    const x = rnd() * 400, y = rnd() * 400, s = rnd() < 0.15 ? 7 + rnd() * 6 : 1.5 + rnd() * 3;
    b += `<path d="${star(x, y, s)}" fill="${rnd() > 0.35 ? "#fff" : deep.wishlist}" opacity="${(0.35 + rnd() * 0.5).toFixed(2)}"/>`;
  }
  svg("wishlist", 400, 400, b);
}

// --- Finance: gilošování jako na bankovce ---
{
  let b = "";
  for (let k = 0; k < 26; k++) {
    let d = "";
    for (let x = 0; x <= 600; x += 4) d += (x ? "L" : "M") + x + " " + f(30 + k * 14 + 26 * Math.sin(x / 40 + k * 0.5) * Math.cos(x / 97 - k * 0.2));
    b += `<path d="${d}" fill="none" stroke="${deep.finance}" stroke-opacity=".22" stroke-width="1.1"/>`;
  }
  svg("finance", 600, 420, b);
}

// --- Dech: proudy vzduchu ---
{
  let b = "";
  for (let k = 0; k < 9; k++) {
    let d = "";
    const y0 = 60 + k * 95, A = 18 + (k % 3) * 10, fr = 120 + k * 9;
    for (let x = -20; x <= 620; x += 6) d += (x > -20 ? "L" : "M") + x + " " + f(y0 + A * Math.sin(x / fr + k));
    b += `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="${10 + (k % 2) * 8}" filter="url(#b)"/><path d="${d}" fill="none" stroke="${deep.dech}" stroke-opacity=".18" stroke-width="1.2"/>`;
  }
  svg("dech", 600, 900, b, blur("b", 7));
}

console.log(`✓ ${files.length} textur v src/assets/tex: ${files.join(", ")}`);
