import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../../lib/db";
import { startOfDay, startOfMonth } from "../../lib/dates";

export interface Quote {
  id: string;
  text: string;
  author: string | null;
  context: string | null;
  said_at: string;
  starred: boolean;
}

export const store = createStore<Quote>("quotes", "said_at");
export const QUOTES_KEY = ["quotes"];

export function useQuotes() {
  return useQuery({ queryKey: QUOTES_KEY, queryFn: () => store.list("1970-01-01T00:00:00.000Z") });
}

function useQuoteMutation<V>(fn: (vars: V) => Promise<void>, apply: (quotes: Quote[], vars: V) => Quote[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onMutate: async (vars: V) => {
      await queryClient.cancelQueries({ queryKey: QUOTES_KEY });
      const previous = queryClient.getQueryData<Quote[]>(QUOTES_KEY);
      queryClient.setQueryData<Quote[]>(QUOTES_KEY, (quotes = []) =>
        apply(quotes, vars).sort((a, b) => b.said_at.localeCompare(a.said_at)));
      return { previous };
    },
    onError: (_e, _v, context) => queryClient.setQueryData(QUOTES_KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUOTES_KEY }),
  });
}

export const useAddQuote = () => useQuoteMutation<Quote>((q) => store.insert(q), (quotes, q) => [...quotes, q]);
export const useUpdateQuote = () =>
  useQuoteMutation<Quote>(({ id, ...patch }) => store.update(id, patch), (quotes, q) => quotes.map((x) => (x.id === q.id ? q : x)));
export const useDeleteQuote = () => useQuoteMutation<string>((id) => store.remove(id), (quotes, id) => quotes.filter((q) => q.id !== id));

/** Hláška dne: každý den jiná, ale během dne stejná. */
export function quoteOfDay(quotes: Quote[], now = new Date()): Quote | null {
  if (quotes.length === 0) return null;
  const sorted = [...quotes].sort((a, b) => a.id.localeCompare(b.id));
  const day = Math.floor(startOfDay(now).getTime() / 86_400_000);
  // jednoduché promíchání, aby za sebou nešly hlášky podle id
  const index = Math.abs((day * 2654435761) % 2 ** 32) % sorted.length;
  return sorted[index];
}

/** Autoři seřazení podle počtu hlášek. */
export function authorRanking(quotes: Quote[]) {
  const counts = new Map<string, number>();
  for (const q of quotes) {
    const name = q.author?.trim();
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()].map(([author, count]) => ({ author, count })).sort((a, b) => b.count - a.count || a.author.localeCompare(b.author, "cs"));
}

/** Hodnoty pro našeptávání (autoři, kontexty) od nejčastějších. */
export function suggestions(quotes: Quote[], field: "author" | "context") {
  const counts = new Map<string, number>();
  for (const q of quotes) {
    const v = q[field]?.trim();
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
}

export const countThisMonth = (quotes: Quote[], now = new Date()) =>
  quotes.filter((q) => new Date(q.said_at) >= startOfMonth(now)).length;

/** Hledání bez ohledu na velikost písmen a diakritiku. */
export const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function matches(q: Quote, search: string) {
  const needle = normalize(search.trim());
  if (!needle) return true;
  return normalize(`${q.text} ${q.author ?? ""} ${q.context ?? ""}`).includes(needle);
}
