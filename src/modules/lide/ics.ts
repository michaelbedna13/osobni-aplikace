import type { Person } from "./data";

const pad = (n: number) => String(n).padStart(2, "0");
const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/** Kalendář (.ics) s každoročními narozeninami a jmeninami; upozornění den předem v 9:00. */
export function buildIcs(people: Person[], now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Osobni appka//Lide a darky//CS", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Narozeniny a svátky"];
  const event = (uid: string, month: number, day: number, year: number, summary: string, description?: string) => {
    // 29. 2. se v nepřestupných letech neopakuje, slavíme proto 28. 2.
    const d = month === 2 && day === 29 ? 28 : day;
    lines.push(
      "BEGIN:VEVENT", `UID:${uid}@osobni-aplikace`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${year}${pad(month)}${pad(d)}`, "RRULE:FREQ=YEARLY", `SUMMARY:${escape(summary)}`,
      ...(description ? [`DESCRIPTION:${escape(description)}`] : []), "TRANSP:TRANSPARENT",
      "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-PT15H", `DESCRIPTION:${escape(summary)}`, "END:VALARM",
      "END:VEVENT",
    );
  };
  for (const p of people) {
    if (p.birth_month && p.birth_day) {
      event(`${p.id}-narozeniny`, p.birth_month, p.birth_day, p.birth_year ?? 2000, `Narozeniny: ${p.name}`, p.birth_year ? `Ročník ${p.birth_year}` : undefined);
    }
    if (p.nameday) {
      const [m, d] = p.nameday.split("-").map(Number);
      event(`${p.id}-jmeniny`, m, d, 2000, `Svátek: ${p.name}`);
    }
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/** Předá soubor iPhonu: přes sdílení (Kalendář, Soubory…), jinak jako stažení. */
export async function shareIcs(text: string) {
  const file = new File([text], "narozeniny.ics", { type: "text/calendar" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Narozeniny a svátky" });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
