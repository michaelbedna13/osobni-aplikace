// Vygeneruje pozadí obrazovek do src/assets/tex/<modul>.webp: měkké rozostřené tvary jako přes mléčné nebo
// vroubkované sklo, inkoustové koule, světlo ve vodě. Na téma modulu jen narážejí. Zrno se přidává zvlášť v CSS.
// Potřebuje Playwright (kreslí canvas v prohlížeči). Použití: npm run backgrounds
// Náhodnost je pevná, výstup je pokaždé stejný. Obrázky jsou malé (480 × 1040), rozmazané se zvětší bez ztráty.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? "playwright");

const src = readFileSync(new URL("../src/lib/modules.ts", import.meta.url), "utf8");
const M = {};
for (const m of src.matchAll(/key: "(\w+)".*?color: "(#\w+)", deep: "(#\w+)", light: "(#\w+)"/g)) M[m[1]] = { c: m[2], d: m[3], l: m[4] };

// Jedna technika na obrazovku; barvy z modulu. Plátno je 480 × 1040 (poměr telefonu), obsah stojí nahoře,
// takže výrazné tvary jsou spíš uprostřed a dole a horní třetina zůstává světlejší kvůli čitelnosti.
const tint = (key, t) => mix(M[key].c, "#FFFFFF", t);
const SPECS = {
  dnes: { kind: "window", base: ["#F4EFE3", "#F2EEE5"], shade: "#8E9E7E", light: "#FFF3D6" },
  zaklad: { kind: "frost", base: ["#EDF0E8", "#F1F1EC"], ink: ["#A9C29A", "#8FAE7C"], amount: 0.5 },
  piva: { kind: "caustic", base: [tint("piva", 0.42), tint("piva", 0.62)], glow: M.piva.l },
  wishlist: { kind: "caustic", base: [tint("wishlist", 0.45), tint("wishlist", 0.68)], glow: "#FFFFFF", sparkle: true },
  meditace: { kind: "ink", base: [tint("meditace", 0.88), "#F2F3EC"], ink: M.meditace.d, orbs: [[240, 930, 330, "up"]] },
  dech: { kind: "ink", base: [tint("dech", 0.86), "#F1F3F2"], ink: M.dech.d, orbs: [[240, 740, 230, "up"], [240, 740, 230, "down"]] },
  skore: { kind: "ink", base: [tint("skore", 0.86), "#F2F1F4"], ink: M.skore.d, orbs: [[240, 700, 320, "flat"]] },
  hlaskomat: { kind: "orbs", base: [tint("hlaskomat", 0.8), tint("hlaskomat", 0.88)], orbs: [[150, 470, 280, M.hlaskomat.c], [360, 680, 260, "#73BED3"]] },
  lide: { kind: "orbs", base: [tint("lide", 0.82), tint("lide", 0.9)], orbs: [[160, 470, 270, M.lide.c], [350, 690, 270, M.wishlist.c]] },
  vdecnost: { kind: "orbs", base: [tint("vdecnost", 0.72), tint("vdecnost", 0.82)], orbs: [[320, 430, 270, M.piva.c], [170, 650, 270, "#F77622"]] },
  finance: { kind: "orbs", base: [tint("finance", 0.72), tint("finance", 0.84)], orbs: [[230, 540, 300, M.finance.c], [340, 440, 190, M.piva.c]] },
  odkazy: { kind: "orbs", base: [tint("odkazy", 0.8), tint("odkazy", 0.9)], orbs: [[140, 560, 240, M.odkazy.c], [350, 560, 240, M.skore.c]] },
  untrois: { kind: "reeded", base: [tint("untrois", 0.6), tint("untrois", 0.78)], blobs: [[330, 330, 250, "#9CCB4A"], [120, 680, 270, M.untrois.d], [400, 820, 160, M.piva.c]] },
  trenink: { kind: "reeded", base: [tint("trenink", 0.8), tint("trenink", 0.88)], blobs: [[330, 340, 250, M.trenink.c], [130, 680, 270, "#F6757A"], [410, 860, 170, M.trenink.d]] },
  sachy: { kind: "reeded", base: [tint("sachy", 0.5), tint("sachy", 0.7)], blobs: [[130, 380, 250, M.sachy.d], [360, 660, 270, "#FFFFFF"], [200, 900, 180, M.sachy.d]] },
  filmy: { kind: "reeded", base: [tint("filmy", 0.7), tint("filmy", 0.82)], blobs: [[320, 320, 270, "#FEE761"], [140, 680, 270, M.filmy.d], [380, 880, 180, "#FEAE34"]] },
  nakup: { kind: "frost", base: [tint("nakup", 0.8), tint("nakup", 0.88)], ink: [M.nakup.c, M.nakup.d, "#63C74D"], amount: 0.7, shapes: "round" },
  cornhole: { kind: "frost", base: [tint("cornhole", 0.8), tint("cornhole", 0.88)], ink: [M.cornhole.c, M.cornhole.d, "#E4A672"], amount: 0.7, shapes: "bag" },
  mista: { kind: "watercolor", base: [tint("mista", 0.84), tint("mista", 0.9)], ink: M.mista.c, deep: M.mista.d },
};

function mix(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

const browser = await chromium.launch();
const page = await browser.newPage();
const out = await page.evaluate((SPECS) => {
  const W = 480, H = 1040;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const canvas = (w = W, h = H) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; };
  const base = (g, [top, bottom]) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  const orb = (g, x, y, r, color, a = 0.9) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(color, a)); gr.addColorStop(0.55, rgba(color, a * 0.6)); gr.addColorStop(1, rgba(color, 0)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };

  // měkké koule se zrnitým přechodem (reference: dvě oranžové koule)
  function orbs(g, s) {
    base(g, s.base);
    g.filter = "blur(26px)";
    for (const [x, y, r, color] of s.orbs) orb(g, x, y, r, color, 0.85);
    g.filter = "none";
  }

  // inkoustová koule: hustý střed a jemné soustředné kroužky, které se sbíhají k jednomu bodu (reference: modré koule)
  function ink(g, s) {
    base(g, s.base);
    for (const [cx, cy, R, dir] of s.orbs) {
      const N = 110;
      for (let i = N; i >= 1; i--) {
        const t = i / N, r = R * t;
        // střed kroužku se posouvá od špičky ke středu koule
        const oy = dir === "up" ? cy - r : dir === "down" ? cy + r : cy;
        const a = Math.pow(1 - t, 1.4) * 0.2 + 0.012;
        g.strokeStyle = rgba(s.ink, a);
        g.lineWidth = 1.4;
        g.beginPath(); g.ellipse(cx, oy, r, r * (dir === "flat" ? 1 : 0.98), 0, 0, Math.PI * 2); g.stroke();
        g.fillStyle = rgba(s.ink, a * 0.22);
        g.fill();
      }
    }
    // jemné rozpití
    const [c2, g2] = canvas(); g2.filter = "blur(1.2px)"; g2.drawImage(g.canvas, 0, 0); g.clearRect(0, 0, W, H); g.drawImage(c2, 0, 0);
  }

  // mléčné sklo: rozmazané siluety listů nebo tvarů za sklem (reference: stín rostliny)
  function frost(g, s) {
    base(g, s.base);
    g.filter = "blur(24px)";
    if (s.shapes === "round") {
      for (const [x, y, r, i] of [[110, 690, 170, 0], [360, 620, 140, 1], [250, 900, 200, 2], [460, 920, 120, 0]]) { g.globalAlpha = s.amount; g.fillStyle = s.ink[i]; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
      leaf(g, 300, 600, 300, -0.6, s.ink[2], s.amount * 0.9);
    } else if (s.shapes === "bag") {
      g.globalAlpha = s.amount; g.fillStyle = s.ink[0];
      g.save(); g.translate(140, 720); g.rotate(-0.25); g.fillRect(-130, -130, 260, 260); g.restore();
      g.fillStyle = s.ink[2]; g.save(); g.translate(330, 520); g.rotate(0.2); g.fillRect(-150, -60, 300, 520); g.restore();
      g.globalAlpha = s.amount * 0.8; g.fillStyle = s.ink[1]; g.beginPath(); g.arc(330, 470, 60, 0, Math.PI * 2); g.fill();
    } else {
      // listy rostou zleva zdola doprava, různě daleko od skla (víc či míň rozmazané)
      const leaves = [[-20, 980, 420, -1.0, 0], [90, 960, 520, -0.8, 1], [210, 980, 480, -0.58, 0], [330, 900, 520, -0.4, 2], [460, 820, 420, -0.22, 1], [520, 700, 300, -0.05, 0]];
      for (const [x, y, len, ang, i] of leaves) leaf(g, x, y, len, ang, s.ink[i % s.ink.length], s.amount);
    }
    g.globalAlpha = 1; g.filter = "none";
    // mléčný závoj nahoře, aby text v hlavičce měl klid
    const v = g.createLinearGradient(0, 0, 0, H * 0.55); v.addColorStop(0, "rgba(255,255,255,0.55)"); v.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
  }
  function leaf(g, x, y, len, ang, color, a) {
    g.save(); g.translate(x, y); g.rotate(ang); g.globalAlpha = a; g.fillStyle = color;
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -len * 0.3, len, -len * 0.06); g.quadraticCurveTo(len * 0.55, len * 0.1, 0, 0); g.fill();
    g.restore();
  }

  // světlo ve vodě: měkká světelná síť (Worleyho šum), rozmazaná (reference: tyrkysová voda)
  function caustic(g, s) {
    base(g, s.base);
    const w = 160, h = 347, [c, cg] = canvas(w, h), img = cg.createImageData(w, h);
    const pts = []; for (let i = 0; i < 16; i++) pts.push([rnd() * w, rnd() * h]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const wx = x + 14 * Math.sin(y / 23), wy = y + 14 * Math.sin(x / 19);
      let f1 = 1e9, f2 = 1e9;
      for (const [px, py] of pts) { const d = Math.hypot(wx - px, wy - py); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d; }
      const e = f2 - f1, m = 0.35 + 0.65 * Math.pow(Math.sin(x / 40 + y / 60) * 0.5 + 0.5, 2);
      const a = Math.min(1, (Math.exp(-e / 2.4) * 0.95 + Math.exp(-e / 9) * 0.3) * m);
      const k = (y * w + x) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = 255; img.data[k + 3] = a * 255;
    }
    cg.putImageData(img, 0, 0);
    g.filter = "blur(9px)"; g.globalAlpha = 0.9; g.drawImage(c, 0, 0, W, H);
    g.filter = "blur(26px)"; g.globalAlpha = 0.7; g.drawImage(c, 0, 0, W, H);
    g.globalAlpha = 1; g.filter = "blur(40px)"; orb(g, 380, 260, 220, s.glow, 0.5);
    if (s.sparkle) { g.filter = "blur(2px)"; for (let i = 0; i < 40; i++) orb(g, rnd() * W, rnd() * H, 3 + rnd() * 6, "#FFFFFF", 0.9); }
    g.filter = "none";
  }

  // vroubkované sklo: rozmazané tvary rozlámané do svislých pruhů (reference: zelené sklo)
  function reeded(g, s) {
    base(g, s.base);
    const [c, cg] = canvas(); cg.fillStyle = "rgba(0,0,0,0)"; cg.filter = "blur(36px)";
    for (const [x, y, r, color] of s.blobs) orb(cg, x, y, r, color, 0.95);
    const strip = 26;
    for (let sx = 0; sx < W; sx += strip) {
      const k = sx / strip;
      for (let y = 0; y < H; y += 4) {
        // každý pruh ukazuje zúžený a posunutý kus obrazu, posun se s výškou vlní
        const dx = 26 * Math.sin(y / 80 + k * 0.6) + 12 * Math.sin(k * 1.7);
        g.drawImage(c, Math.max(0, Math.min(W - strip * 1.6, sx + dx - strip * 0.3)), y, strip * 1.6, 4, sx, y, strip, 4);
      }
      // světlo a stín na hraně vroubku
      const gr = g.createLinearGradient(sx, 0, sx + strip, 0);
      gr.addColorStop(0, "rgba(255,255,255,0.28)"); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(0.92, "rgba(35,33,31,0.06)"); gr.addColorStop(1, "rgba(35,33,31,0.12)");
      g.fillStyle = gr; g.fillRect(sx, 0, strip, H);
    }
    const v = g.createLinearGradient(0, 0, 0, H * 0.4); v.addColorStop(0, "rgba(255,255,255,0.45)"); v.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
  }

  // akvarel: rozpité skvrny s tmavším okrajem, jak barva zasychá na papíře
  function watercolor(g, s) {
    base(g, s.base);
    const blobs = [[120, 400, 210], [360, 600, 230], [170, 860, 200], [430, 960, 130]];
    for (const [x, y, r] of blobs) {
      g.filter = "blur(18px)"; g.globalAlpha = 0.42; g.fillStyle = s.ink; blob(g, x, y, r);
      g.filter = "blur(6px)"; g.globalAlpha = 0.22; g.strokeStyle = s.deep; g.lineWidth = 5; blob(g, x, y, r * 0.96, true);
      g.filter = "blur(24px)"; g.globalAlpha = 0.35; g.fillStyle = "#FFFFFF"; blob(g, x - r * 0.15, y - r * 0.1, r * 0.55);
    }
    g.globalAlpha = 1; g.filter = "none";
  }
  function blob(g, x, y, r, stroke) {
    g.beginPath();
    for (let t = 0; t <= 64; t++) { const a = (t / 64) * Math.PI * 2; const rr = r * (1 + 0.12 * Math.sin(3 * a + x) + 0.07 * Math.sin(5 * a + y)); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.85; t ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.closePath(); stroke ? g.stroke() : g.fill();
  }

  // stín kapradiny za mléčným sklem: stonek s lístky po obou stranách (reference: stín rostliny)
  function fern(g, s) {
    base(g, s.base);
    const frond = (x, y, len, ang, bend, a, bl) => {
      g.save(); g.filter = `blur(${bl}px)`; g.globalAlpha = a; g.fillStyle = s.ink; g.strokeStyle = s.ink;
      g.translate(x, y); g.rotate(ang);
      g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, bend, len, bend * 1.6); g.stroke();
      for (let t = 0.06; t < 0.97; t += 0.055) {
        const px = len * t, py = bend * (2 * t * (1 - t)) + bend * 1.6 * t * t, w = (1 - t) * 34 + 8;
        for (const side of [-1, 1]) { g.save(); g.translate(px, py); g.rotate(side * 1.05 - 0.25); g.beginPath(); g.ellipse(w / 2, 0, w / 2, 4.5, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
      }
      g.restore();
    };
    frond(-40, 900, 700, -0.9, -70, 0.7, 4);
    frond(40, 1080, 720, -0.7, 60, 0.45, 10);
    frond(540, 640, 560, -2.55, 50, 0.5, 7);
    frond(520, 1080, 640, -2.15, -40, 0.65, 5);
    frond(300, 1120, 420, -1.7, 30, 0.35, 14);
    g.filter = "none";
    const v = g.createLinearGradient(0, 0, 0, H * 0.5); v.addColorStop(0, "rgba(255,255,255,0.6)"); v.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
  }

  // světlo prosvítající listím (komorebi): měkký stín koruny a teplé skvrny slunce
  function dapple(g, s) {
    base(g, s.base);
    g.filter = "blur(18px)"; g.globalAlpha = 0.7; g.fillStyle = s.shade;
    for (let i = 0; i < 90; i++) { const x = 60 + rnd() * 480, y = 300 + rnd() * 780; g.beginPath(); g.ellipse(x, y, 30 + rnd() * 60, 18 + rnd() * 30, rnd() * 3, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1;
    for (let i = 0; i < 70; i++) {
      const x = rnd() * W, y = 320 + rnd() * 760, r = 6 + Math.pow(rnd(), 2) * 34;
      g.filter = `blur(${2 + r / 5}px)`; orb(g, x, y, r, s.light, 0.75 + rnd() * 0.25);
    }
    g.filter = "blur(60px)"; orb(g, 80, 120, 260, s.light, 0.7);
    g.filter = "none";
    const v = g.createLinearGradient(0, 0, 0, H * 0.45); v.addColorStop(0, "rgba(255,255,255,0.5)"); v.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
  }

  // světlo z okna: teplý pruh slunce s rozmazaným stínem rámu a listu (oblíbená „ranní“ fotka)
  function windowLight(g, s) {
    base(g, s.base);
    g.save(); g.translate(W * 0.5, H * 0.55); g.rotate(-0.42);
    g.filter = "blur(28px)"; g.fillStyle = s.light; g.globalAlpha = 0.95; g.fillRect(-260, -420, 520, 760);
    g.filter = "blur(10px)"; g.fillStyle = s.shade; g.globalAlpha = 0.35;
    g.fillRect(-12, -440, 22, 800); g.fillRect(-280, -40, 560, 20);
    g.restore();
    g.filter = "blur(14px)"; g.globalAlpha = 0.3; g.fillStyle = s.shade;
    g.save(); g.translate(380, 760); g.rotate(-0.8);
    for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(i * 34, (i % 2 ? -1 : 1) * 26, 46, 12, (i % 2 ? -0.6 : 0.6), 0, Math.PI * 2); g.fill(); }
    g.lineWidth = 6; g.strokeStyle = s.shade; g.beginPath(); g.moveTo(-40, 0); g.lineTo(260, 0); g.stroke();
    g.restore(); g.globalAlpha = 1; g.filter = "none";
  }

  // hedvábí: měkké lesklé záhyby látky
  function silk(g, s) {
    base(g, s.base);
    const band = (y0, amp, f, ph, color, width, a, bl) => {
      g.filter = `blur(${bl}px)`; g.globalAlpha = a; g.strokeStyle = color; g.lineWidth = width; g.lineCap = "round";
      g.beginPath(); for (let x = -60; x <= W + 60; x += 8) { const y = y0 + amp * Math.sin(x / f + ph) + x * 0.55; x === -60 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
    };
    for (let k = 0; k < 7; k++) {
      const y0 = 160 + k * 150;
      band(y0 + 30, 60, 120, k, s.shade, 70, 0.32, 26);
      band(y0, 60, 120, k, s.light, 34, 0.85, 14);
    }
    g.globalAlpha = 1; g.filter = "none";
    const v = g.createLinearGradient(0, 0, 0, H * 0.4); v.addColorStop(0, "rgba(255,255,255,0.45)"); v.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
  }

  // polární záře: velké rozmazané pásy pastelových barev šikmo přes obrazovku
  function aurora(g, s) {
    base(g, s.base);
    g.filter = "blur(70px)";
    const spots = [[90, 380, 260, 120, 0], [380, 520, 250, 110, 1], [140, 780, 280, 120, 2], [420, 940, 240, 110, 3], [300, 660, 180, 90, 0]];
    for (const [x, y, rx, ry, c] of spots) { g.globalAlpha = 0.9; g.fillStyle = s.colors[c]; g.beginPath(); g.ellipse(x, y, rx, ry, -0.5, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1; g.filter = "none";
    const v = g.createLinearGradient(0, 0, 0, H * 0.35); v.addColorStop(0, "rgba(255,255,255,0.5)"); v.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
  }

  const KINDS = { orbs, ink, frost, caustic, reeded, watercolor, fern, dapple, window: windowLight, silk, aurora };
  const res = {};
  for (const [key, s] of Object.entries(SPECS)) {
    seed = 7 + key.length;
    const [c, g] = canvas();
    KINDS[s.kind](g, s);
    res[key] = c.toDataURL("image/webp", 0.86);
  }
  return res;
}, SPECS);
await browser.close();

let total = 0;
for (const [key, url] of Object.entries(out)) {
  const buf = Buffer.from(url.split(",")[1], "base64");
  total += buf.length;
  writeFileSync(new URL(`../src/assets/tex/${key}.webp`, import.meta.url), buf);
}
console.log(`✓ ${Object.keys(out).length} pozadí, celkem ${Math.round(total / 1024)} kB`);
