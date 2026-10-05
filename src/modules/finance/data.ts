import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../../lib/db";

export type Period = "tyden" | "mesic" | "rok";

export interface Subscription {
  id: string;
  name: string;
  price: number;
  period: Period;
  next_date: string;
  note: string | null;
  active: boolean;
  created_at: string;
}

export interface Debt {
  id: string;
  person: string;
  amount: number;
  direction: "mi" | "ja";
  note: string | null;
  settled_at: string | null;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string | null;
  created_at: string;
}

/** Pravidelný výdaj: nájem, internet, energie… */
export type ExpensePeriod = "mesic" | "ctvrtleti" | "rok";

export interface Expense {
  id: string;
  name: string;
  amount: number;
  period: ExpensePeriod;
  /** Den v měsíci, kdy se platí (jen u měsíčních), nebo null. */
  due_day: number | null;
  note: string | null;
  active: boolean;
  created_at: string;
}

export const EXPENSE_PERIODS: Record<ExpensePeriod, { adj: string; per: string }> = {
  mesic: { adj: "Měsíčně", per: "měsíc" },
  ctvrtleti: { adj: "Čtvrtletně", per: "čtvrtletí" },
  rok: { adj: "Ročně", per: "rok" },
};

export const EXPENSE_PRESETS = ["Nájem", "Internet", "Elektřina", "Plyn", "Voda", "Telefon", "Pojištění", "Fond oprav", "Hypotéka", "Doprava"];

export const PERIOD_NAMES: Record<Period, { adj: string; per: string }> = {
  tyden: { adj: "Týdně", per: "týden" },
  mesic: { adj: "Měsíčně", per: "měsíc" },
  rok: { adj: "Ročně", per: "rok" },
};

const EPOCH = "1970-01-01T00:00:00.000Z";
const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

function makeList<T extends { id: string; created_at: string }>(table: string, fix: (row: T) => T) {
  const store = createStore<T>(table, "created_at");
  const key = [table];
  const sort = (a: T, b: T) => b.created_at.localeCompare(a.created_at);
  const useList = () => useQuery({ queryKey: key, queryFn: async () => (await store.list(EPOCH)).map(fix).sort(sort) });
  function useMut<V>(fn: (vars: V) => Promise<void>, apply: (list: T[], vars: V) => T[]) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: fn,
      onMutate: async (vars: V) => {
        await queryClient.cancelQueries({ queryKey: key });
        const previous = queryClient.getQueryData<T[]>(key);
        queryClient.setQueryData<T[]>(key, (list = []) => apply(list, vars).sort(sort));
        return { previous };
      },
      onError: (_e, _v, context) => queryClient.setQueryData(key, context?.previous),
      onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
    });
  }
  return {
    useList,
    useAdd: () => useMut<T>((row) => store.insert(row), (l, row) => [...l, row]),
    useUpdate: () => useMut<T>(({ id, created_at: _c, ...patch }) => store.update(id, patch as Partial<T>), (l, row) => l.map((x) => (x.id === row.id ? row : x))),
    useRemove: () => useMut<string>((id) => store.remove(id), (l, id) => l.filter((x) => x.id !== id)),
  };
}

// Supabase vrací numeric jako text – převádíme na čísla
export const subscriptions = makeList<Subscription>("subscriptions", (r) => ({ ...r, price: num(r.price) }));
export const debts = makeList<Debt>("debts", (r) => ({ ...r, amount: num(r.amount) }));
export const savings = makeList<SavingsGoal>("savings_goals", (r) => ({ ...r, target: num(r.target), saved: num(r.saved) }));
export const expenses = makeList<Expense>("expenses", (r) => ({ ...r, amount: num(r.amount), due_day: r.due_day === null || r.due_day === undefined ? null : Number(r.due_day) }));

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDay = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Další obnova od dneška (včetně): posouvá datum o periodu, dokud není v budoucnu. Konec měsíce drží (31. → 30. → 28.). */
export function nextRenewal(next_date: string, period: Period, now = new Date()): Date {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = parseDay(next_date);
  const day = start.getDate();
  let d = start;
  for (let i = 1; d < today && i < 5000; i++) {
    if (period === "tyden") d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7 * i);
    else {
      const months = period === "mesic" ? i : 12 * i;
      const y = start.getFullYear() + Math.floor((start.getMonth() + months) / 12);
      const m = (start.getMonth() + months) % 12;
      d = new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
    }
  }
  return d;
}

export const daysUntil = (d: Date, now = new Date()) =>
  Math.round((d.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000);

/** Měsíční ekvivalent ceny. */
export const monthly = (s: Pick<Subscription, "price" | "period">) =>
  s.period === "mesic" ? s.price : s.period === "rok" ? s.price / 12 : (s.price * 52) / 12;

/** Měsíční ekvivalent výdaje. */
export const expenseMonthly = (e: Pick<Expense, "amount" | "period">) =>
  e.period === "mesic" ? e.amount : e.period === "ctvrtleti" ? e.amount / 3 : e.amount / 12;

/** Nejbližší splatnost měsíčního výdaje (dnes nebo později); den 31 v kratším měsíci = poslední den. */
export function nextDue(day: number, now = new Date()): Date {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const at = (y: number, m: number) => new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
  const thisMonth = at(now.getFullYear(), now.getMonth());
  return thisMonth >= today ? thisMonth : at(now.getFullYear(), now.getMonth() + 1);
}

export interface FinanceStats {
  monthlySubs: number;
  yearlySubs: number;
  monthlyExpenses: number;
  /** Výdaje + předplatné za měsíc. */
  monthlyTotal: number;
  yearlyTotal: number;
  owedToMe: number;
  iOwe: number;
  savedTotal: number;
  targetTotal: number;
}

export function computeFinanceStats(subs: Subscription[], ds: Debt[], goals: SavingsGoal[], exps: Expense[] = []): FinanceStats {
  const active = subs.filter((s) => s.active);
  const monthlySubs = active.reduce((sum, s) => sum + monthly(s), 0);
  const monthlyExpenses = exps.filter((e) => e.active).reduce((sum, e) => sum + expenseMonthly(e), 0);
  const open = ds.filter((d) => !d.settled_at);
  return {
    monthlySubs,
    yearlySubs: monthlySubs * 12,
    monthlyExpenses,
    monthlyTotal: monthlySubs + monthlyExpenses,
    yearlyTotal: (monthlySubs + monthlyExpenses) * 12,
    owedToMe: open.filter((d) => d.direction === "mi").reduce((s, d) => s + d.amount, 0),
    iOwe: open.filter((d) => d.direction === "ja").reduce((s, d) => s + d.amount, 0),
    savedTotal: goals.reduce((s, g) => s + g.saved, 0),
    targetTotal: goals.reduce((s, g) => s + g.target, 0),
  };
}

/** Zůstatky po lidech (+ = dluží mi, − = dlužím já), jen otevřené dluhy. */
export function balancesByPerson(ds: Debt[]): { person: string; balance: number }[] {
  const map = new Map<string, number>();
  for (const d of ds) if (!d.settled_at) map.set(d.person, (map.get(d.person) ?? 0) + (d.direction === "mi" ? d.amount : -d.amount));
  return [...map.entries()].filter(([, b]) => Math.abs(b) > 0.004).map(([person, balance]) => ({ person, balance })).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
}

export const formatKc = (n: number) => `${n.toLocaleString("cs-CZ", { maximumFractionDigits: Number.isInteger(n) ? 0 : 2, minimumFractionDigits: 0 })} Kč`;
export const roundKc = (n: number) => `${Math.round(n).toLocaleString("cs-CZ")} Kč`;

/** „1 299,90 Kč“ → 1299.9 */
export function parseAmount(text: string): number | null {
  const clean = text.replace(/kč|czk|,-/gi, "").replace(/\s/g, "").replace(",", ".");
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}
