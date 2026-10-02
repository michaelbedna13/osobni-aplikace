// Vygeneruje PNG ikony z public/favicon.svg (potřebuje Playwright: npx playwright …).
// Použití: node scripts/generate-icons.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? "playwright");

const svg = readFileSync(new URL("../public/favicon.svg", import.meta.url), "utf8");
// Ikona na plochu: bez zaoblení (iOS si rohy zaoblí sám), tvary uprostřed.
const square = svg;
const targets = [
  ["apple-touch-icon.png", 180, 1],
  ["icon-192.png", 192, 1],
  ["icon-512.png", 512, 1],
  ["icon-maskable-512.png", 512, 0.78],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, scale] of targets) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * scale);
  await page.setContent(`<body style="margin:0;background:#26286B;display:grid;place-items:center;height:${size}px">
    <div style="width:${inner}px;height:${inner}px">${square.replace("<svg ", `<svg width="${inner}" height="${inner}" `)}</div></body>`);
  await page.screenshot({ path: new URL(`../public/${name}`, import.meta.url).pathname });
  console.log("✓", name);
}
await browser.close();
