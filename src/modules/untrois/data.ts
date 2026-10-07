import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../../lib/db";
import { supabase } from "../../lib/supabase";

export interface UntroisNote {
  id: string;
  kind: "napad" | "vyznam";
  category: string;
  /** Popisek; u fotky nebo odkazu nepovinný. */
  title: string | null;
  body: string | null;
  starred: boolean;
  /** Odkaz na inspiraci (Pinterest, Instagram, web). */
  url?: string | null;
  /** Náhled odkazu, v ukázkovém režimu i nahraná fotka (data URL). */
  image_url?: string | null;
  site?: string | null;
  /** Fotka v soukromém úložišti (bucket untrois). */
  storage_path?: string | null;
  created_at: string;
}

export const IDEA_CATEGORIES = ["Foto", "Grafika", "Motiv", "Text", "Produkt", "Ostatní"];
/** Bucket s fotkami nástěnky. */
export const BUCKET = "untrois";

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
export const useDeleteNote = () =>
  useNoteMutation<UntroisNote>(async (n) => {
    await store.remove(n.id);
    if (n.storage_path) await removePhoto(n.storage_path);
  }, (l, n) => l.filter((x) => x.id !== n.id));

/** Smaže fotku z úložiště (chyba nevadí – zůstane jen nepoužitý soubor). */
export async function removePhoto(path: string) {
  if (supabase) await supabase.storage.from(BUCKET).remove([path]).catch(() => undefined);
}

/** Krátký název nápadu do seznamů: popisek, jinak web odkazu, jinak druh. */
export const noteLabel = (n: UntroisNote) => n.title ?? n.site ?? (n.storage_path || n.image_url ? "Fotka" : "Nápad");

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
