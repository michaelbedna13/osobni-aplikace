// Gong vytvořený ve Web Audio (žádné zvukové soubory).
// iOS pustí zvuk jen po ťuknutí uživatele, proto se kontext odemyká v obsluze kliknutí (unlockAudio).

let ctx: AudioContext | null = null;

export function unlockAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    // krátké ticho – na iOS „probudí“ zvukový výstup
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  } catch {
    // prohlížeč bez Web Audio – gong prostě nezazní
  }
}

/** Úder zvonu: několik alikvótních tónů s pozvolným dozvukem. */
export function playGong() {
  if (!ctx) return;
  const now = ctx.currentTime;
  const base = 196; // G3
  const partials: [number, number, number][] = [
    [1, 0.5, 6],
    [2.0, 0.25, 4.5],
    [2.76, 0.18, 3.5],
    [5.4, 0.08, 2.2],
    [8.93, 0.04, 1.4],
  ];
  const master = ctx.createGain();
  master.gain.value = 0.6;
  master.connect(ctx.destination);
  for (const [ratio, gain, decay] of partials) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = base * ratio;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    osc.connect(g).connect(master);
    osc.start(now);
    osc.stop(now + decay + 0.1);
  }
}

/** Krátké dvojí pípnutí (konec pauzy mezi sériemi). */
export function playBeep() {
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const [start, freq] of [[0, 880], [0.18, 1175]] as const) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, now + start);
    g.gain.exponentialRampToValueAtTime(0.12, now + start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.14);
    osc.connect(g).connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + 0.16);
  }
}

/** Jemný tón (změna fáze dechu). */
export function playTone(freq: number, seconds = 0.35, volume = 0.08) {
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(volume, now + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  osc.connect(g).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + seconds + 0.05);
}

/* ---------- knihovna zvuků na výběr (začátek / konec meditace, tréninku…) ---------- */

export type SoundId = "gong" | "miska" | "zvonek" | "tri" | "drevo" | "pipnuti" | "fanfara" | "ticho";

export const SOUND_NAMES: Record<SoundId, string> = {
  gong: "Gong",
  miska: "Tibetská mísa",
  zvonek: "Zvonek",
  tri: "Tři zvonky",
  drevo: "Dřívko",
  pipnuti: "Pípnutí",
  fanfara: "Fanfára",
  ticho: "Bez zvuku",
};

export const SOUND_IDS = Object.keys(SOUND_NAMES) as SoundId[];

/** Úder: několik alikvótních tónů [poměr, hlasitost, doznění v s] od základní frekvence. */
function strike(base: number, partials: [number, number, number][], at = 0, master = 0.5, detune = 0) {
  if (!ctx) return;
  const now = ctx.currentTime + at;
  const out = ctx.createGain();
  out.gain.value = master;
  out.connect(ctx.destination);
  for (const [ratio, gain, decay] of partials) {
    for (const d of detune ? [-detune, detune] : [0]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = base * ratio + d;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(detune ? gain / 2 : gain, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.connect(g).connect(out);
      osc.start(now);
      osc.stop(now + decay + 0.1);
    }
  }
}

function note(freq: number, at: number, length: number, volume: number, type: OscillatorType) {
  if (!ctx) return;
  const now = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + length);
  osc.connect(g).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + length + 0.05);
}

const BELL: [number, number, number][] = [[1, 0.5, 2.6], [2.0, 0.25, 1.8], [2.76, 0.18, 1.2], [5.4, 0.06, 0.6]];

export function playSound(id: SoundId) {
  if (!ctx) return;
  switch (id) {
    case "gong":
      playGong();
      break;
    case "miska":
      // pomalé „vlnění“ dvou blízkých tónů jako u zpívající mísy
      strike(262, [[1, 0.5, 9], [2.71, 0.2, 6], [5.2, 0.06, 3]], 0, 0.5, 1.6);
      break;
    case "zvonek":
      strike(880, BELL, 0, 0.35);
      break;
    case "tri":
      for (const at of [0, 1.1, 2.2]) strike(880, BELL, at, 0.3);
      break;
    case "drevo":
      for (const at of [0, 0.28]) {
        note(1050, at, 0.09, 0.3, "triangle");
        note(1600, at, 0.05, 0.12, "sine");
      }
      break;
    case "pipnuti":
      playBeep();
      break;
    case "fanfara":
      [523, 659, 784].forEach((f, i) => note(f, i * 0.13, 0.12, 0.1, "square"));
      note(1047, 0.42, 0.45, 0.1, "square");
      break;
    case "ticho":
      break;
  }
}
