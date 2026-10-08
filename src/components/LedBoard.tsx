import { useEffect, useRef, useState } from "react";

// Bodová LED tabule: text se vykreslí bitmapovým písmem Tiny5 (1 bod písma = 1 dioda)
// a pomalu jede zprava doleva; na začátku chvilku postojí.

const PITCH = 5; // vzdálenost diod v CSS px
const ROWS = 10; // řádky diod: diakritika nahoře, ocásky dole
const BASE = 8; // účaří v řádcích
const FONT = '8px "Tiny5"';
const TICK = 45; // ms na posun o jednu diodu
const HOLD = 40; // ticků stání na začátku

/** Rozsvícené body textu: šířka v diodách a maska řádek po řádku. */
function textBits(text: string): { w: number; on: Uint8Array } {
  const c = document.createElement("canvas");
  const x = c.getContext("2d")!;
  x.font = FONT;
  const w = Math.ceil(x.measureText(text).width) + 2;
  c.width = w;
  c.height = ROWS;
  x.font = FONT;
  x.fillStyle = "#fff";
  x.fillText(text, 1, BASE);
  const d = x.getImageData(0, 0, w, ROWS).data;
  const on = new Uint8Array(w * ROWS);
  for (let i = 0; i < on.length; i++) on[i] = d[i * 4 + 3] > 128 ? 1 : 0;
  return { w, on };
}

export function LedBoard({ text, color, label }: { text: string; color: string; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [still] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const el = canvas.current;
    if (!el || still) return;
    let cancelled = false;
    let timer: number | undefined;
    let visible = true;
    const observer = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    observer.observe(el);

    void document.fonts.load(FONT, text).then(() => {
      if (cancelled) return;
      const bits = textBits(text);
      const dpr = window.devicePixelRatio || 1;
      const cols = Math.max(1, Math.floor(el.getBoundingClientRect().width / PITCH));
      el.width = cols * PITCH * dpr;
      el.height = ROWS * PITCH * dpr;
      const x = el.getContext("2d")!;
      x.scale(dpr, dpr);
      // vejde se celý? pak stojí uprostřed
      const fits = bits.w <= cols;
      let offset = fits ? -Math.floor((cols - bits.w) / 2) : 0;
      let hold = 0;

      const draw = () => {
        x.clearRect(0, 0, cols * PITCH, ROWS * PITCH);
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < cols; c++) {
            const tx = c + offset;
            const lit = tx >= 0 && tx < bits.w && bits.on[r * bits.w + tx] === 1;
            const cx = c * PITCH + PITCH / 2;
            const cy = r * PITCH + PITCH / 2;
            x.globalAlpha = lit ? 1 : 0.09;
            x.fillStyle = color;
            x.beginPath();
            x.arc(cx, cy, PITCH * 0.38, 0, Math.PI * 2);
            x.fill();
            if (lit) {
              // odlesk diody
              x.globalAlpha = 0.5;
              x.fillStyle = "#FFF6D8";
              x.beginPath();
              x.arc(cx - 0.4, cy - 0.4, PITCH * 0.14, 0, Math.PI * 2);
              x.fill();
            }
          }
        }
        x.globalAlpha = 1;
      };

      draw();
      if (fits) return;
      timer = window.setInterval(() => {
        if (!visible || document.hidden) return;
        if (offset === 0 && hold < HOLD) { hold++; return; }
        offset++;
        // text celý odjel → vjede znovu zprava a zastaví se na začátku
        if (offset > bits.w) { offset = -cols; hold = 0; }
        if (offset === 0) hold = 0;
        draw();
      }, TICK);
    });

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      observer.disconnect();
    };
  }, [text, color, still]);

  return (
    <div className="led-case">
      <div className="led-screen">
        {still ? <p className="led-still" style={{ color }}>{text}</p> : <canvas ref={canvas} className="led-canvas" style={{ height: ROWS * PITCH }} aria-hidden="true" />}
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
