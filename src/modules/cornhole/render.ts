// Kreslení hřiště do malého plátna (pixel art): kamera stojí za hráčem a dívá se na desku.
// Všechno se kreslí po vodorovných řádcích celými pixely, takže hrany zůstanou ostré.
import { BAG_R, BAG_T, BOARD, HOLE, boardZ, type Bag } from "./sim";

const CAM_Y = -4;
const CAM_H = 4.5;

export interface View {
  W: number;
  H: number;
  f: number;
  cx: number;
  hy: number;
}

export interface Aim {
  power: number;
  aim: number;
  color: string;
}

const GRASS = ["#0E2719", "#12301F"];
const WOOD = "#E4A672";
const WOOD_DARK = "#B86F50";
const WOOD_EDGE = "#733E39";
const HOLE_COLOR = "#000502";
const SHADOW = "rgba(0, 5, 2, 0.45)";

export function makeView(W: number, H: number): View {
  const f = W * 7;
  const backY = Math.max(56, Math.round(H * 0.24));
  return { W, H, f, cx: W / 2, hy: backY - (f * (CAM_H - BOARD.highZ)) / (BOARD.back - CAM_Y) };
}

export function project(v: View, x: number, y: number, z: number) {
  const d = Math.max(0.5, y - CAM_Y);
  return { sx: v.cx + (v.f * x) / d, sy: v.hy + (v.f * (CAM_H - z)) / d, k: v.f / d };
}

/** Vzdálenost (y), kterou kamera vidí na daném řádku obrazovky ve výšce z. */
const depthAtRow = (v: View, row: number, z = 0) => CAM_Y + (v.f * (CAM_H - z)) / (row - v.hy);

function span(ctx: CanvasRenderingContext2D, color: string, x0: number, x1: number, y0: number, y1: number) {
  const l = Math.round(x0);
  const t = Math.round(y0);
  const w = Math.round(x1) - l;
  const h = Math.round(y1) - t;
  if (w <= 0 || h <= 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(l, t, w, h);
}

/** Lichoběžník mezi dvěma řádky (vodorovné horní a dolní hrany). */
function trapezoid(ctx: CanvasRenderingContext2D, color: string, top: number, tl: number, tr: number, bottom: number, bl: number, br: number) {
  ctx.fillStyle = color;
  const t = Math.round(top);
  const b = Math.round(bottom);
  for (let row = t; row < b; row++) {
    const u = b - t > 1 ? (row - t) / (b - t - 1) : 0;
    const l = Math.round(tl + (bl - tl) * u);
    const r = Math.round(tr + (br - tr) * u);
    if (r > l) ctx.fillRect(l, row, r - l, 1);
  }
}

function ellipse(ctx: CanvasRenderingContext2D, color: string, cx: number, cy: number, rx: number, ry: number) {
  ctx.fillStyle = color;
  const t = Math.round(cy - ry);
  const b = Math.round(cy + ry);
  for (let row = t; row <= b; row++) {
    const dy = (row + 0.5 - cy) / Math.max(ry, 0.5);
    if (Math.abs(dy) > 1) continue;
    const half = rx * Math.sqrt(1 - dy * dy);
    const l = Math.round(cx - half);
    const r = Math.round(cx + half);
    if (r > l) ctx.fillRect(l, row, r - l, 1);
  }
}

/** Plocha desky v dané výšce nad ní a s odsazením od okraje (rámeček). */
function boardFace(ctx: CanvasRenderingContext2D, v: View, color: string, inset: number) {
  const nearY = BOARD.front + inset;
  const farY = BOARD.back - inset;
  const near = project(v, 0, nearY, boardZ(nearY));
  const far = project(v, 0, farY, boardZ(farY));
  const half = BOARD.half - inset;
  trapezoid(ctx, color, far.sy, far.sx - half * far.k, far.sx + half * far.k, near.sy, near.sx - half * near.k, near.sx + half * near.k);
}

function drawGrass(ctx: CanvasRenderingContext2D, v: View) {
  ctx.fillStyle = GRASS[0];
  ctx.fillRect(0, 0, v.W, v.H);
  // pruhy posekané trávy po půl metru – dávají hloubku
  let row = 0;
  while (row < v.H) {
    const y = depthAtRow(v, row + 0.5);
    const band = Math.floor(y * 2);
    const nextY = band / 2;
    const end = Math.min(v.H, Math.ceil(project(v, 0, nextY, 0).sy));
    if (band % 2 === 0) span(ctx, GRASS[1], 0, v.W, row, Math.max(end, row + 1));
    row = Math.max(end, row + 1);
  }
}

function drawBoard(ctx: CanvasRenderingContext2D, v: View) {
  const nearTop = project(v, 0, BOARD.front, BOARD.lowZ);
  const nearFoot = project(v, 0, BOARD.front, 0);
  const halfNear = BOARD.half * nearTop.k;
  // stín pod deskou a čelo desky
  span(ctx, SHADOW, nearTop.sx - halfNear + 2, nearTop.sx + halfNear + 3, nearFoot.sy - 1, nearFoot.sy + 2);
  span(ctx, WOOD_EDGE, nearTop.sx - halfNear - 1, nearTop.sx + halfNear + 1, nearTop.sy, nearFoot.sy + 1);
  span(ctx, WOOD_DARK, nearTop.sx - halfNear, nearTop.sx + halfNear, nearTop.sy, nearFoot.sy);
  // obrys, deska, tmavší rámeček a světlá plocha
  const far = project(v, 0, BOARD.back, BOARD.highZ);
  trapezoid(ctx, WOOD_EDGE, far.sy - 1, far.sx - BOARD.half * far.k - 1, far.sx + BOARD.half * far.k + 1, nearTop.sy, nearTop.sx - halfNear - 1, nearTop.sx + halfNear + 1);
  boardFace(ctx, v, WOOD, 0);
  // prkna
  for (const x of [-BOARD.half / 3, BOARD.half / 3]) {
    const a = project(v, x, BOARD.front + 0.05, boardZ(BOARD.front + 0.05));
    const b = project(v, x, BOARD.back - 0.05, boardZ(BOARD.back - 0.05));
    ctx.fillStyle = "rgba(115, 62, 57, 0.35)";
    for (let row = Math.round(b.sy); row < Math.round(a.sy); row++) {
      const u = (row - b.sy) / (a.sy - b.sy);
      ctx.fillRect(Math.round(b.sx + (a.sx - b.sx) * u), row, 1, 1);
    }
  }
  // díra
  const hz = boardZ(HOLE.y);
  const c = project(v, HOLE.x, HOLE.y, hz);
  const top = project(v, HOLE.x, HOLE.y + HOLE.r, boardZ(HOLE.y + HOLE.r)).sy;
  const bottom = project(v, HOLE.x, HOLE.y - HOLE.r, boardZ(HOLE.y - HOLE.r)).sy;
  const ry = (bottom - top) / 2;
  ellipse(ctx, WOOD_EDGE, c.sx, (top + bottom) / 2, HOLE.r * c.k + 1, ry + 1);
  ellipse(ctx, HOLE_COLOR, c.sx, (top + bottom) / 2, HOLE.r * c.k, ry);
}

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * amount)));
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

function drawBag(ctx: CanvasRenderingContext2D, v: View, b: Bag, color: string, spin = 0) {
  const r = BAG_R * (1 - 0.25 * Math.abs(Math.sin(spin)));
  const top = project(v, b.x, b.y + BAG_R, b.z + BAG_T);
  const bottom = project(v, b.x, b.y - BAG_R, b.z + BAG_T);
  const foot = project(v, b.x, b.y - BAG_R, b.z);
  const half = Math.max(1.5, r * bottom.k);
  const l = bottom.sx - half;
  const rr = bottom.sx + half;
  const t = Math.min(top.sy, bottom.sy - 2);
  span(ctx, "#000502", l - 1, rr + 1, t - 1, foot.sy + 1);
  span(ctx, shade(color, 0.62), l, rr, t, foot.sy);
  span(ctx, color, l, rr, t, bottom.sy);
  span(ctx, shade(color, 1.25), l, rr, t, t + 1);
}

function drawShadow(ctx: CanvasRenderingContext2D, v: View, b: Bag) {
  const z = Math.abs(b.x) <= BOARD.half && b.y >= BOARD.front && b.y <= BOARD.back ? boardZ(b.y) : 0;
  const p = project(v, b.x, b.y, z);
  const top = project(v, b.x, b.y + BAG_R, z).sy;
  const bottom = project(v, b.x, b.y - BAG_R, z).sy;
  ellipse(ctx, SHADOW, p.sx, (top + bottom) / 2, BAG_R * p.k, Math.max(1, (bottom - top) / 2));
}

function drawAim(ctx: CanvasRenderingContext2D, v: View, a: Aim) {
  const x0 = v.cx;
  const y0 = v.H - 6;
  const len = 18 + a.power * Math.min(v.H * 0.45, 130);
  const ang = a.aim * 0.5;
  ctx.fillStyle = a.color;
  for (let d = 4; d < len; d += 5) {
    const px = Math.round(x0 + Math.sin(ang) * d);
    const py = Math.round(y0 - Math.cos(ang) * d);
    ctx.fillRect(px - 1, py - 1, 2, 2);
  }
  const hx = Math.round(x0 + Math.sin(ang) * len);
  const hy = Math.round(y0 - Math.cos(ang) * len);
  ctx.fillStyle = "#FEFAE0";
  ctx.fillRect(hx - 2, hy - 2, 4, 4);
}

export function drawScene(ctx: CanvasRenderingContext2D, v: View, bags: Bag[], colors: string[], time: number, aim: Aim | null) {
  drawGrass(ctx, v);
  const behind = bags.filter((b) => b.state === "ground" && b.y > BOARD.back);
  const front = bags.filter((b) => b.state === "ground" && b.y <= BOARD.back);
  const onTop = bags.filter((b) => b.state === "board").sort((a, b) => b.y - a.y);
  const flying = bags.filter((b) => b.state === "flight");
  for (const b of behind.sort((a, c) => c.y - a.y)) drawBag(ctx, v, b, colors[b.owner]);
  drawBoard(ctx, v);
  for (const b of onTop) drawBag(ctx, v, b, colors[b.owner]);
  for (const b of front.sort((a, c) => c.y - a.y)) drawBag(ctx, v, b, colors[b.owner]);
  for (const b of flying) {
    drawShadow(ctx, v, b);
    drawBag(ctx, v, b, colors[b.owner], time * 9);
  }
  if (aim) drawAim(ctx, v, aim);
}
