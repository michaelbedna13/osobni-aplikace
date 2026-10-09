// Vygeneruje drobné textury do src/assets/tex: zrno přes obrazovku, jemnější zrno do karet a bílé jiskření.
// Pozadí obrazovek kreslí scripts/generate-backgrounds.mjs.
// Spuštění: node scripts/generate-textures.mjs (bez závislostí, výstup je pokaždé stejný)
import { mkdirSync, writeFileSync } from "node:fs";

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
// bílé jiskření do barevných karet
svg("sparkle", 200, 200, `<rect width="100%" height="100%" filter="url(#n)"/>`,
  `<filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -.75"/></filter>`);

console.log(`✓ ${files.length} textur v src/assets/tex: ${files.join(", ")}`);
