import { describe, expect, it } from "vitest";
import { balancesByPerson, computeFinanceStats, daysUntil, expenseMonthly, monthly, nextDue, nextRenewal, parseAmount, type Debt, type Expense, type Subscription } from "./data";

const sub = (f: Partial<Subscription>): Subscription => ({ id: "s", name: "X", price: 100, period: "mesic", next_date: "2026-10-05", note: null, active: true, created_at: "", ...f });
const debt = (f: Partial<Debt>): Debt => ({ id: "d", person: "Míša", amount: 100, direction: "mi", note: null, settled_at: null, created_at: "", ...f });

describe("finance", () => {
  const now = new Date(2026, 9, 2, 12); // 2. 10. 2026

  it("další obnova předplatného", () => {
    expect(nextRenewal("2026-10-05", "mesic", now)).toEqual(new Date(2026, 9, 5));
    expect(nextRenewal("2026-01-31", "mesic", now)).toEqual(new Date(2026, 9, 31));
    expect(nextRenewal("2026-08-31", "mesic", new Date(2026, 8, 5))).toEqual(new Date(2026, 8, 30));
    expect(nextRenewal("2025-03-15", "rok", now)).toEqual(new Date(2027, 2, 15));
    expect(nextRenewal("2026-09-28", "tyden", now)).toEqual(new Date(2026, 9, 5));
    expect(daysUntil(new Date(2026, 9, 5), now)).toBe(3);
  });

  it("měsíční součty a dluhy", () => {
    expect(monthly(sub({ price: 1200, period: "rok" }))).toBe(100);
    const s = computeFinanceStats(
      [sub({ price: 199 }), sub({ price: 1200, period: "rok" }), sub({ price: 500, active: false })],
      [debt({ amount: 300 }), debt({ amount: 120, direction: "ja", person: "Jana" }), debt({ amount: 50, settled_at: "x" })],
      [],
    );
    expect(s.monthlySubs).toBe(299);
    expect(s.owedToMe).toBe(300);
    expect(s.iOwe).toBe(120);
    expect(balancesByPerson([debt({ amount: 300 }), debt({ amount: 100, direction: "ja" }), debt({ person: "Jana", amount: 50, direction: "ja" })]))
      .toEqual([{ person: "Míša", balance: 200 }, { person: "Jana", balance: -50 }]);
  });

  it("částka z textu", () => {
    expect(parseAmount("1 299,90 Kč")).toBe(1299.9);
    expect(parseAmount("x")).toBeNull();
  });
});

describe("výdaje", () => {
  const now = new Date(2026, 9, 20, 12); // 20. 10. 2026
  const exp = (f: Partial<Expense>): Expense => ({ id: "e", name: "Nájem", amount: 15000, period: "mesic", due_day: null, note: null, active: true, created_at: "", ...f });

  it("měsíční ekvivalent", () => {
    expect(expenseMonthly(exp({}))).toBe(15000);
    expect(expenseMonthly(exp({ amount: 3000, period: "ctvrtleti" }))).toBe(1000);
    expect(expenseMonthly(exp({ amount: 12000, period: "rok" }))).toBe(1000);
  });

  it("nejbližší splatnost", () => {
    expect(nextDue(25, now)).toEqual(new Date(2026, 9, 25));
    expect(nextDue(20, now)).toEqual(new Date(2026, 9, 20));
    expect(nextDue(15, now)).toEqual(new Date(2026, 10, 15));
    expect(nextDue(31, new Date(2026, 10, 3))).toEqual(new Date(2026, 10, 30));
  });

  it("součty výdajů a předplatného, zrušené se nepočítají", () => {
    const s = computeFinanceStats([sub({ price: 300 })], [], [], [exp({}), exp({ amount: 900, period: "ctvrtleti" }), exp({ amount: 500, active: false })]);
    expect(s.monthlyExpenses).toBe(15300);
    expect(s.monthlyTotal).toBe(15600);
    expect(s.yearlyTotal).toBe(187200);
  });
});
