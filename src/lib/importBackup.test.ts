import { describe, expect, it } from "vitest";
import { backupToBeers, backupToQuotes, parseBackup } from "./importBackup";

describe("parseBackup", () => {
  it("pozná zálohu piv a sečte je", () => {
    const b = parseBackup({ v: 1, log: { "2026-08-19": 8, "2026-08-18": 4, nesmysl: 3 } });
    expect(b).toEqual({ kind: "piva", total: 12, days: [{ day: "2026-08-18", count: 4 }, { day: "2026-08-19", count: 8 }] });
  });

  it("pozná zálohu hlášek", () => {
    const b = parseBackup([{ id: 1, text: "Blbooost", author: "Všichni", context: "Vždycky", date: "2026-08-18T19:26:52.814Z", starred: false }]);
    expect(b.kind).toBe("hlasky");
  });

  it("neznámý soubor odmítne", () => {
    expect(parseBackup({ foo: 1 }).kind).toBe("unknown");
    expect(parseBackup([]).kind).toBe("unknown");
  });
});

describe("převod", () => {
  it("vytvoří správný počet piv se stálými id", async () => {
    const a = await backupToBeers([{ day: "2026-08-18", count: 3 }]);
    const b = await backupToBeers([{ day: "2026-08-18", count: 3 }]);
    expect(a).toHaveLength(3);
    expect(new Set(a.map((x) => x.id)).size).toBe(3);
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
    expect(new Date(a[0].drunk_at).getDate()).toBe(18);
    expect(a[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("převede hlášku včetně hvězdičky a data", async () => {
    const [q] = await backupToQuotes([{ id: 1786653961199, text: " Mít 0,5 na kapse je základ. ", author: "Dannowski", context: "", date: "2026-08-13T20:46:01.199Z", starred: true }]);
    expect(q).toMatchObject({ text: "Mít 0,5 na kapse je základ.", author: "Dannowski", context: null, said_at: "2026-08-13T20:46:01.199Z", starred: true });
  });
});
