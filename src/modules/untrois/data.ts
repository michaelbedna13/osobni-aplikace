import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../../lib/db";

export interface UntroisNote {
  id: string;
  kind: "napad" | "vyznam";
  category: string;
  title: string;
  body: string | null;
  starred: boolean;
  created_at: string;
}

export const IDEA_CATEGORIES = ["Logo", "Produkt", "Slogan", "Barvy a styl", "Obsah", "Ostatní"];

const store = createStore<UntroisNote>("untrois_notes", "created_at");
const KEY = ["untrois_notes"];
const byNewest = (a: UntroisNote, b: UntroisNote) => b.created_at.localeCompare(a.created_at);

export const useUntroisNotes = () =>
  useQuery({ queryKey: KEY, queryFn: async () => (await store.list("1970-01-01T00:00:00.000Z")).sort(byNewest) });

function useNoteMutation<V>(fn: (vars: V) => Promise<void>, apply: (list: UntroisNote[], vars: V) => UntroisNote[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onMutate: async (vars: V) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<UntroisNote[]>(KEY);
      queryClient.setQueryData<UntroisNote[]>(KEY, (l = []) => apply(l, vars).sort(byNewest));
      return { previous };
    },
    onError: (_e, _v, context) => queryClient.setQueryData(KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export const useAddNote = () => useNoteMutation<UntroisNote>((n) => store.insert(n), (l, n) => [...l, n]);
export const useUpdateNote = () =>
  useNoteMutation<UntroisNote>(({ id, created_at: _c, ...patch }) => store.update(id, patch), (l, n) => l.map((x) => (x.id === n.id ? n : x)));
export const useDeleteNote = () => useNoteMutation<string>((id) => store.remove(id), (l, id) => l.filter((n) => n.id !== id));

/** Nejbližší pátek 13. (dnešek včetně). */
export function nextFriday13(now = new Date()): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), 13);
  if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) d.setMonth(d.getMonth() + 1);
  while (d.getDay() !== 5) d.setMonth(d.getMonth() + 1);
  return d;
}

/** Dní do data (0 = dnes). */
export const daysUntil = (d: Date, now = new Date()) =>
  Math.round((d.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000);
