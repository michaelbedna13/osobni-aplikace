import { useState } from "react";
import { plural } from "../../lib/format";
import { roundKc } from "./data";

// Grafy Financí. Jedna řada = jeden odstín (tmavé zlato `--fin-mark`, kontrast se světlou kartou nad 3 : 1, ověřeno
// validátorem palety); popisky a částky jsou v barvě textu, ne v barvě značky.

export interface SpendItem {
  key: string;
  name: string;
  /** Měsíčně v Kč (u ročních a čtvrtletních plateb přepočteno). */
  value: number;
  onOpen?: () => void;
}

const TOP = 6;
const DNI: [string, string, string] = ["den", "dny", "dní"];

/** Kam jdou peníze: vodorovné pruhy seřazené od největší položky, částka u každé; zbytek nad 6 položek jako „Ostatní“. */
export function SpendBars({ items }: { items: SpendItem[] }) {
  const sorted = [...items].filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  const rows = sorted.length > TOP
    ? [...sorted.slice(0, TOP - 1), { key: "ostatni", name: `Ostatní (${sorted.length - TOP + 1})`, value: sorted.slice(TOP - 1).reduce((s, i) => s + i.value, 0) }]
    : sorted;
  const max = rows[0]?.value ?? 1;
  return (
    <ul className="fin-bars" aria-label="Kam jdou peníze měsíčně">
      {rows.map((r) => {
        const body = (
          <>
            <span className="fin-bar-head"><span className="fin-bar-name">{r.name}</span><span className="fin-bar-val">{roundKc(r.value)}</span></span>
            <span className="fin-bar-track" aria-hidden="true"><i style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} /></span>
          </>
        );
        return (
          <li key={r.key}>
            {"onOpen" in r && r.onOpen ? <button className="fin-bar" onClick={r.onOpen}>{body}</button> : <div className="fin-bar">{body}</div>}
          </li>
        );
      })}
    </ul>
  );
}

export interface Payment {
  key: string;
  name: string;
  /** Den v aktuálním měsíci. */
  day: number;
  amount: number;
}

/** Platby tento měsíc: osa dnů 1–konec měsíce, dnešek čárkou, zaplacené prázdným kroužkem, nadcházející plnou tečkou.
 *  Ťuknutí na tečku ukáže platbu pod osou; výchozí je nejbližší nadcházející. */
export function PaymentTimeline({ payments, now = new Date() }: { payments: Payment[]; now?: Date }) {
  const today = now.getDate();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const sorted = [...payments].sort((a, b) => a.day - b.day || b.amount - a.amount);
  const upcoming = sorted.filter((p) => p.day >= today);
  const [picked, setPicked] = useState<string | null>(null);
  const shown = sorted.find((p) => p.key === picked) ?? upcoming[0] ?? sorted[sorted.length - 1];
  const left = upcoming.reduce((s, p) => s + p.amount, 0);
  const x = (day: number) => `${((day - 1) / (last - 1)) * 100}%`;
  // víc plateb ve stejný den se skládá nad sebe
  const stack = new Map<number, number>();
  const ticks = [1, 10, 20, last];

  return (
    <div className="fin-time">
      <p className="fin-time-left">
        {left > 0 ? <>Do konce měsíce ještě <b>{roundKc(left)}</b></> : "Tento měsíc už je všechno zaplacené"}
      </p>
      <div className="fin-axis" role="list" aria-label="Platby tento měsíc">
        <span className="fin-axis-line" aria-hidden="true" />
        <span className="fin-today" style={{ left: x(today) }} aria-hidden="true"><small>dnes</small></span>
        {sorted.map((p) => {
          const level = stack.get(p.day) ?? 0;
          stack.set(p.day, level + 1);
          const paid = p.day < today;
          return (
            <button key={p.key} role="listitem" className={`fin-dot${paid ? " paid" : ""}${shown?.key === p.key ? " on" : ""}`}
              style={{ left: x(p.day), bottom: `${14 + level * 16}px` }} onClick={() => setPicked(p.key)}
              aria-label={`${p.name}, ${p.day}., ${roundKc(p.amount)}${paid ? ", zaplaceno" : ""}`}>
              <i />
            </button>
          );
        })}
        {ticks.map((d) => <span key={d} className="fin-tick" style={{ left: x(d) }} aria-hidden="true">{d}.</span>)}
      </div>
      {shown && (
        <p className="fin-time-pick">
          <b>{shown.name}</b> · {shown.day}. · {roundKc(shown.amount)}
          <span className="muted"> · {shown.day < today ? "zaplaceno" : shown.day === today ? "dnes" : `za ${shown.day - today} ${plural(shown.day - today, DNI)}`}</span>
        </p>
      )}
    </div>
  );
}
