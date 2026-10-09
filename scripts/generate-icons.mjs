// Vygeneruje PNG ikony z public/favicon.svg (potřebuje Playwright: npx playwright …).
// Použití: node scripts/generate-icons.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? "playwright");

const svg = readFileSync(new URL("../public/favicon.svg", import.meta.url), "utf8");
// Ikona na plochu: bez zaoblení (iOS si rohy zaoblí sám), kresba zmenšená o okraj zvětšením viewBoxu
// (pozadí v SVG přesahuje plátno, takže okraj vyplní stejné zrnité světlo).
const withMargin = (scale) => {
  const pad = +(50 * (1 / scale - 1)).toFixed(3);
  return svg.replace('viewBox="0 0 100 100"', `viewBox="${-pad} ${-pad} ${100 + 2 * pad} ${100 + 2 * pad}"`);
};
const targets = [
  ["apple-touch-icon.png", 180, 0.88],
  ["icon-192.png", 192, 0.88],
  ["icon-512.png", 512, 0.88],
  ["icon-maskable-512.png", 512, 0.72],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, scale] of targets) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0;background:#F4F3EE">${withMargin(scale).replace("<svg ", `<svg width="${size}" height="${size}" style="display:block" `)}</body>`);
  await page.screenshot({ path: new URL(`../public/${name}`, import.meta.url).pathname });
  console.log("✓", name);
}
await browser.close();
