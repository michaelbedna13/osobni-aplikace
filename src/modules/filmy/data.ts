import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../../lib/db";
import type { Kind } from "./search";

export type Status = "chci" | "ted" | "hotovo" | "vzdano";

export interface MediaItem {
  id: string;
  kind: Kind;
  title: string;
  year: number | null;
  creator: string | null;
  image_url: string | null;
  external_url: string | null;
  source: string;
  source_id: string | null;
  status: Status;
  rating: number | null;
  recommended_by: string | null;
  note: string | null;
  /** Den dokončení „2026-10-02“. */
  finished_at: string | null;
  created_at: string;
}

export const KIND_NAMES: Record<Kind, { one: string; many: string; verb: string; done: string; now: string }> = {
  film: { one: "Film", many: "Filmy", verb: "vidět", done: "Viděno", now: "Rozkoukáno" },
  serial: { one: "Seriál", many: "Seriály", verb: "vidět", done: "Dokoukáno", now: "Koukám" },
  kniha: { one: "Kniha", many: "Knihy", verb: "přečíst", done: "Přečteno", now: "Čtu" },
};
export const STATUS_NAMES: Record<Status, string> = { chci: "Chci", ted: "Teď", hotovo: "Hotovo", vzdano: "Vzdáno" };

const store = createStore<MediaItem>("media_items", "created_at");
const KEY = ["media_items"];
const byNewest = (a: MediaItem, b: MediaItem) => b.created_at.localeCompare(a.created_at);

export const useMedia = () =>
  useQuery({ queryKey: KEY, queryFn: async () => (await store.list("1970-01-01T00:00:00.000Z")).sort(byNewest) });

function useMediaMutation<V>(fn: (vars: V) => Promise<void>, apply: (list: MediaItem[], vars: V) => MediaItem[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onMutate: async (vars: V) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<MediaItem[]>(KEY);
      queryClient.setQueryData<MediaItem[]>(KEY, (list = []) => apply(list, vars).sort(byNewest));
      return { previous };
    },
    onError: (_e, _v, context) => queryClient.setQueryData(KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export const useAddMedia = () => useMediaMutation<MediaItem>((m) => store.insert(m), (list, m) => [...list, m]);
export const useUpdateMedia = () =>
  useMediaMutation<MediaItem>(({ id, created_at: _c, ...patch }) => store.update(id, patch), (list, m) => list.map((x) => (x.id === m.id ? m : x)));
export const useDeleteMedia = () => useMediaMutation<string>((id) => store.remove(id), (list, id) => list.filter((m) => m.id !== id));

const pad = (n: number) => String(n).padStart(2, "0");
export const today = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function newMedia(fields: Partial<MediaItem> & Pick<MediaItem, "kind" | "title">): MediaItem {
  return {
    id: crypto.randomUUID(), year: null, creator: null, image_url: null, external_url: null, source: "rucne", source_id: null,
    status: "chci", rating: null, recommended_by: null, note: null, finished_at: null, created_at: new Date().toISOString(), ...fields,
  };
}

/** Změna stavu: při „hotovo“ se doplní datum dokončení, jinak se smaže. */
export function withStatus(item: MediaItem, status: Status, now = new Date()): MediaItem {
  return { ...item, status, finished_at: status === "hotovo" ? item.finished_at ?? today(now) : null };
}

export interface MediaStats {
  wanted: number;
  inProgress: number;
  doneThisYear: Record<Kind, number>;
  booksThisYear: number;
  /** Průměrné hodnocení dokončených (1–5), nebo null. */
  averageRating: number | null;
}

export function computeMediaStats(list: MediaItem[], now = new Date()): MediaStats {
  const year = String(now.getFullYear());
  const done = list.filter((m) => m.status === "hotovo");
  const thisYear = done.filter((m) => m.finished_at?.startsWith(year));
  const rated = done.filter((m) => m.rating);
  return {
    wanted: list.filter((m) => m.status === "chci").length,
    inProgress: list.filter((m) => m.status === "ted").length,
    doneThisYear: {
      film: thisYear.filter((m) => m.kind === "film").length,
      serial: thisYear.filter((m) => m.kind === "serial").length,
      kniha: thisYear.filter((m) => m.kind === "kniha").length,
    },
    booksThisYear: thisYear.filter((m) => m.kind === "kniha").length,
    averageRating: rated.length ? rated.reduce((s, m) => s + (m.rating ?? 0), 0) / rated.length : null,
  };
}

/** Už je v seznamu? (stejný zdroj a id, nebo stejný název a druh) */
export const alreadyHave = (list: MediaItem[], f: { kind: Kind; title: string; source: string; source_id: string | null }) =>
  list.some((m) => (f.source_id && m.source === f.source && m.source_id === f.source_id) || (m.kind === f.kind && m.title.toLowerCase() === f.title.toLowerCase()));
