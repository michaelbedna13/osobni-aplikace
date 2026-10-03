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
