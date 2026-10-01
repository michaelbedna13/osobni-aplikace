import { describe, expect, it } from "vitest";
import { authorRanking, matches, quoteOfDay, type Quote } from "./data";

const q = (id: string, author: string | null, text = "x"): Quote => ({ id, text, author, context: null, said_at: "2026-08-01T10:00:00Z", starred: false });

describe("Hláškomat", () => {
  it("hláška dne je během dne stejná", () => {
    const quotes = [q("a", "A"), q("b", "B"), q("c", "C")];
    const morning = quoteOfDay(quotes, new Date(2026, 9, 1, 8));
    const evening = quoteOfDay(quotes, new Date(2026, 9, 1, 22));
    expect(morning).toBe(evening);
    expect(quoteOfDay([], new Date())).toBeNull();
  });

  it("řadí autory podle počtu hlášek", () => {
    expect(authorRanking([q("1", "Mišák"), q("2", "Juza"), q("3", "Mišák"), q("4", null)])).toEqual([
      { author: "Mišák", count: 2 },
      { author: "Juza", count: 1 },
    ]);
  });

  it("hledá bez diakritiky", () => {
    expect(matches(q("1", "Mišák", "Je to zbytečně dobrý"), "zbytecne")).toBe(true);
    expect(matches(q("1", "Mišák", "Je to"), "misak")).toBe(true);
    expect(matches(q("1", "Mišák", "Je to"), "pivo")).toBe(false);
  });
});
