// Kreslení hřiště: kamera stojí za hráčem a dívá se na desku. Hladké tvary ve stylu appky (vystřižené plochy,
// měkké stíny); kreslí se v herních souřadnicích a plátno je zvětšené na rozlišení displeje (View.s).
import { BAG_R, BAG_T, BOARD, HOLE, boardZ, type Bag } from "./sim";

const CAM_Y = -4;
const CAM_H = 4.5;

export interface View {
  /** zvětšení plátna (herní bod → pixel displeje) */
  s: number;
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

const GRASS = ["#A9C49A", "#B4CDA5"];
const HAZE = "#E6EEDD";
const WOOD = "#E9B07E";
const WOOD_DARK = "#C47F57";
const WOOD_SIDE = "#9E6145";
const INK = "#23211F";
const SHADOW = "rgba(35, 33, 31, 0.22)";

export function makeView(W: number, H: number, s = 1): View {
  const f = W * 7;
  const backY = Math.max(56, Math.round(H * 0.24));
  return { s, W, H, f, cx: W / 2, hy: backY - (f * (CAM_H - BOARD.highZ)) / (BOARD.back - CAM_Y) };
}

export function project(v: View, x: number, y: number, z: number) {
  const d = Math.max(0.5, y - CAM_Y);
  return { sx: v.cx + (v.f * x) / d, sy: v.hy + (v.f * (CAM_H - z)) / d, k: v.f / d };
}

/** Lichoběžník mezi dvěma řádky (vodorovné horní a dolní hrany). */
function trapezoid(ctx: CanvasRenderingContext2D, color: string, top: number, tl: number, tr: number, bottom: number, bl: number, br: number) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tl, top); ctx.lineTo(tr, top); ctx.lineTo(br, bottom); ctx.lineTo(bl, bottom);
  ctx.closePath();
  ctx.fill();
}

function ellipse(ctx: CanvasRenderingContext2D, color: string, cx: number, cy: number, rx: number, ry: number) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(rx, 0.5), Math.max(ry, 0.5), 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number, r: number) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(w, 0.5), Math.max(h, 0.5), Math.min(r, w / 2, h / 2));
  ctx.fill();
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
  for (let band = 0; band < 80; band++) {
    if (band % 2) continue;
    const near = project(v, 0, band / 2, 0).sy;
    const far = project(v, 0, (band + 1) / 2, 0).sy;
    if (near < 0) break;
    ctx.fillStyle = GRASS[1];
    ctx.fillRect(0, far, v.W, near - far);
  }
  // opar k obzoru, aby dálka měkce zesvětlala
  const g = ctx.createLinearGradient(0, 0, 0, v.H * 0.55);
  g.addColorStop(0, HAZE);
  g.addColorStop(1, "rgba(230, 238, 221, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, v.W, v.H * 0.55);
}

function drawBoard(ctx: CanvasRenderingContext2D, v: View) {
  const nearTop = project(v, 0, BOARD.front, BOARD.lowZ);
  const nearFoot = project(v, 0, BOARD.front, 0);
  const halfNear = BOARD.half * nearTop.k;
  const far = project(v, 0, BOARD.back, BOARD.highZ);
  // měkký stín pod deskou
  ctx.save();
  ctx.filter = "blur(3px)";
  trapezoid(ctx, SHADOW, far.sy + 6, far.sx - BOARD.half * far.k, far.sx + BOARD.half * far.k + 4, nearFoot.sy + 3, nearTop.sx - halfNear + 2, nearTop.sx + halfNear + 6);
  ctx.restore();
  // čelo desky a plocha s tmavším okrajem
  roundRect(ctx, WOOD_SIDE, nearTop.sx - halfNear, nearTop.sy - 1, halfNear * 2, nearFoot.sy - nearTop.sy + 1, 1.5);
  trapezoid(ctx, WOOD_DARK, far.sy, far.sx - BOARD.half * far.k, far.sx + BOARD.half * far.k, nearTop.sy, nearTop.sx - halfNear, nearTop.sx + halfNear);
  boardFace(ctx, v, WOOD, 0.04);
  // prkna
  ctx.strokeStyle = "rgba(158, 97, 69, 0.35)";
  ctx.lineWidth = 0.6;
  for (const x of [-BOARD.half / 3, BOARD.half / 3]) {
    const a = project(v, x, BOARD.front + 0.05, boardZ(BOARD.front + 0.05));
    const b = project(v, x, BOARD.back - 0.05, boardZ(BOARD.back - 0.05));
    ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
  }
  // díra
  const hz = boardZ(HOLE.y);
  const c = project(v, HOLE.x, HOLE.y, hz);
  const top = project(v, HOLE.x, HOLE.y + HOLE.r, boardZ(HOLE.y + HOLE.r)).sy;
  const bottom = project(v, HOLE.x, HOLE.y - HOLE.r, boardZ(HOLE.y - HOLE.r)).sy;
  const ry = (bottom - top) / 2;
  ellipse(ctx, WOOD_DARK, c.sx, (top + bottom) / 2, HOLE.r * c.k + 0.8, ry + 0.8);
  ellipse(ctx, INK, c.sx, (top + bottom) / 2, HOLE.r * c.k, ry);
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
  const t = Math.min(top.sy, bottom.sy - 2);
  const w = half * 2;
  const rad = Math.min(half * 0.45, 3);
  roundRect(ctx, shade(color, 0.7), l, t, w, foot.sy - t, rad);
  roundRect(ctx, color, l, t, w, bottom.sy - t, rad);
  roundRect(ctx, "rgba(255, 255, 255, 0.35)", l + w * 0.18, t + 0.6, w * 0.64, Math.max(0.6, (bottom.sy - t) * 0.22), rad);
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
  for (let d = 4; d < len; d += 5) {
    const px = x0 + Math.sin(ang) * d;
    const py = y0 - Math.cos(ang) * d;
    ellipse(ctx, "rgba(255, 255, 255, 0.85)", px, py, 1.6, 1.6);
    ellipse(ctx, a.color, px, py, 1.1, 1.1);
  }
  const hx = x0 + Math.sin(ang) * len;
  const hy = y0 - Math.cos(ang) * len;
  ellipse(ctx, INK, hx, hy, 3, 3);
  ellipse(ctx, "#FFFFFF", hx, hy, 2, 2);
}

export function drawScene(ctx: CanvasRenderingContext2D, v: View, bags: Bag[], colors: string[], time: number, aim: Aim | null) {
  ctx.setTransform(v.s, 0, 0, v.s, 0, 0);
  drawGrass(ctx, v);
  const behind = bags.filter((b) => b.state === "ground" && b.y > BOARD.back);
  const front = bags.filter((b) => b.state === "ground" && b.y <= BOARD.back);
  const onTop = bags.filter((b) => b.state === "board").sort((a, b) => b.y - a.y);
  const flying = bags.filter((b) => b.state === "flight");
  for (const b of behind.sort((a, c) => c.y - a.y)) { drawShadow(ctx, v, b); drawBag(ctx, v, b, colors[b.owner]); }
  drawBoard(ctx, v);
  for (const b of onTop) drawBag(ctx, v, b, colors[b.owner]);
  for (const b of front.sort((a, c) => c.y - a.y)) { drawShadow(ctx, v, b); drawBag(ctx, v, b, colors[b.owner]); }
  for (const b of flying) {
    drawShadow(ctx, v, b);
    drawBag(ctx, v, b, colors[b.owner], time * 9);
  }
  if (aim) drawAim(ctx, v, aim);
}
