// Nákupní seznam: položky se samy řadí podle oddělení v obchodě, koupené se dají vyčistit
// a z historie nákupů se nabízí, co kupuješ často.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../../lib/db";
import { normalize } from "../hlaskomat/data";

export interface ShoppingItem {
  id: string;
  name: string;
  /** Množství jako text: „2“, „500 g“, „2 ks“. */
  qty: string | null;
  category: string;
  /** V košíku (odškrtnuto). */
  done: boolean;
  done_at: string | null;
  /** Vyčištěno ze seznamu; zůstává jen jako historie pro návrhy. */
  archived: boolean;
  created_at: string;
}

/** Oddělení v pořadí, jak se obvykle chodí obchodem. */
export const CATEGORIES = [
  "Ovoce a zelenina", "Pečivo", "Mléčné a vejce", "Maso a ryby", "Trvanlivé", "Mražené", "Sladké a slané", "Nápoje", "Drogerie", "Ostatní",
] as const;
export type Category = (typeof CATEGORIES)[number];

// začátky slov bez diakritiky („$“ na konci = celé slovo, mezera = víc slov);
// první shoda vyhrává, proto Mražené jde před ostatními
const KEYWORDS: [Category, string[]][] = [
  ["Mražené", ["mrazen", "zmrzlin", "nanuk", "pizza"]],
  ["Drogerie", ["sampon", "mydl", "zubni", "pasta na zuby", "toaletni", "papir", "praci", "prasek na", "avivaz", "jar$", "saponat", "houbick", "ubrous", "kapesnik", "deodorant", "sprchov", "ziletk", "vlozk", "pytl", "alobal", "folie", "baterie", "krem", "odlicov", "tablety do mycky", "sul do mycky"]],
  ["Ovoce a zelenina", ["jablk", "jablek", "banan", "citron", "limet", "pomeranc", "mandarin", "hrozn", "jahod", "boruvk", "malin", "hrusk", "kiwi", "avokad", "mango", "ananas", "meloun", "rajc", "okurk", "paprik", "cibul", "cesnek", "brambor", "mrkev", "mrkv", "salat", "spenat", "brokolic", "kvetak", "cuket", "lilek", "houb", "zampion", "petrzel", "celer", "porek", "redkvick", "bylink", "bazalk", "zazvor", "ovoce", "zelenin", "dyne", "dyni"]],
  ["Pečivo", ["chleb", "chleba", "rohlik", "housk", "bageta", "bagety", "pecivo", "toust", "croissant", "vanock", "kolac", "buchta", "buchty", "kaiserk", "tortil", "wrap"]],
  ["Mléčné a vejce", ["mlek", "mleko", "maslo", "masla", "syr", "eidam", "gouda", "mozzarel", "parmaz", "cottage", "jogurt", "tvaroh", "smetan", "slehack", "kefir", "zakys", "podmasl", "vejce", "vajic", "skyr", "lucin", "ricott", "mascarpon"]],
  ["Maso a ryby", ["maso", "masa", "kure", "kurec", "kuraci", "vepr", "hovez", "mlete", "sunk", "salam", "slanin", "klobas", "park", "parek", "ryb", "losos", "tunak", "krut", "steak", "kotlet", "plecko", "krkovic", "prsa", "stehna", "slanina"]],
  ["Trvanlivé", ["testovin", "spaget", "penne", "ryz", "rize", "mouk", "cukr", "sul$", "olej", "ocet", "konzerv", "fazol", "cock", "cizrn", "oves", "vlock", "musli", "kecup", "horcic", "majonez", "koreni", "pepr", "med$", "dzem", "nutell", "kakao", "caj", "kava", "kafe", "omack", "polevk", "bujon", "kuskus", "bulgur", "kvasnic", "drozd", "praskov"]],
  ["Sladké a slané", ["cokolad", "susenk", "bonbon", "chips", "chipsy", "brambur", "oris", "orech", "arasid", "tycink", "zele", "gumov", "popcorn", "krekr", "piskot", "oplatk"]],
  ["Nápoje", ["voda", "vody", "mineralk", "dzus", "pivo", "piva", "vino", "limonad", "cola$", "kola$", "kofol", "sirup", "tonic", "rum$", "gin$", "vodk", "whisk", "prosecc", "energetak", "dzusy"]],
];

/** Odhad oddělení podle názvu („Kuřecí prsa“ → Maso a ryby). */
export function guessCategory(name: string): Category {
  const words = normalize(name).split(/[^a-z0-9]+/).filter(Boolean);
  const text = words.join(" ");
  for (const [category, stems] of KEYWORDS) {
    for (const stem of stems) {
      const hit = stem.includes(" ") ? text.includes(stem)
        : stem.endsWith("$") ? words.includes(stem.slice(0, -1))
          : words.some((w) => w.startsWith(stem));
      if (hit) return category;
    }
  }
  return "Ostatní";
}

const UNIT = "(?:ks|x|×|kg|g|dkg|l|ml|bal|balení|plechovk[ay]|lahv[ei]|kus[ůy]?)";

/** „2 mléka“, „mléko 2x“, „500 g sýra“ → název a množství. */
export function parseItem(text: string): { name: string; qty: string | null } {
  const t = text.trim().replace(/\s+/g, " ");
  const lead = t.match(new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*(${UNIT})?\\s+(.+)$`, "i"));
  if (lead) return { name: lead[3], qty: fmtQty(lead[1], lead[2]) };
  const trail = t.match(new RegExp(`^(.+?)\\s+(?:(\\d+(?:[.,]\\d+)?)\\s*(${UNIT})?|(?:x|×)\\s*(\\d+))$`, "i"));
  if (trail) return { name: trail[1], qty: trail[4] ? trail[4] : fmtQty(trail[2], trail[3]) };
  return { name: t, qty: null };
}

const fmtQty = (n: string, unit: string | undefined) => (!unit || /^(x|×)$/i.test(unit) ? n : `${n} ${unit}`);

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase("cs") + s.slice(1);

export function newItem(text: string, category?: Category): ShoppingItem {
  const { name, qty } = parseItem(text);
  return {
    id: crypto.randomUUID(), name: capitalize(name).slice(0, 120), qty: qty?.slice(0, 30) ?? null, category: category ?? guessCategory(name),
    done: false, done_at: null, archived: false, created_at: new Date().toISOString(),
  };
}

/** Položky na seznamu po odděleních (v pořadí obchodu), uvnitř od nejstarších. */
export function groupByCategory(items: ShoppingItem[]): { category: string; items: ShoppingItem[] }[] {
  const order = (c: string) => { const i = CATEGORIES.indexOf(c as Category); return i < 0 ? CATEGORIES.length : i; };
  const groups = new Map<string, ShoppingItem[]>();
  for (const it of [...items].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    groups.set(it.category, [...(groups.get(it.category) ?? []), it]);
  }
  return [...groups.entries()].sort((a, b) => order(a[0]) - order(b[0])).map(([category, list]) => ({ category, items: list }));
}

export interface Suggestion { name: string; category: string; count: number }

/** Co kupuješ často a teď to na seznamu není; s textem jen to, co mu odpovídá. */
export function suggestions(all: ShoppingItem[], query = "", limit = 12): Suggestion[] {
  const onList = new Set(all.filter((i) => !i.archived).map((i) => normalize(i.name)));
  const q = normalize(query.trim());
  const byName = new Map<string, Suggestion & { last: string }>();
  for (const it of all) {
    const key = normalize(it.name);
    const s = byName.get(key);
    if (s) { s.count++; if (it.created_at > s.last) { s.last = it.created_at; s.name = it.name; s.category = it.category; } }
    else byName.set(key, { name: it.name, category: it.category, count: 1, last: it.created_at });
  }
  return [...byName.entries()]
    .filter(([key]) => !onList.has(key) && (!q || key.split(" ").some((w) => w.startsWith(q)) || key.startsWith(q)))
    .map(([, s]) => s)
    .sort((a, b) => b.count - a.count || b.last.localeCompare(a.last))
    .slice(0, limit)
    .map(({ name, category, count }) => ({ name, category, count }));
}

/** Seznam jako text ke sdílení (Zprávy, WhatsApp…). */
export function listText(items: ShoppingItem[]): string {
  return groupByCategory(items.filter((i) => !i.done && !i.archived))
    .map((g) => `${g.category}:\n${g.items.map((i) => `- ${i.name}${i.qty ? ` (${i.qty})` : ""}`).join("\n")}`)
    .join("\n\n");
}

// ---------- úložiště ----------

const store = createStore<ShoppingItem>("shopping_items", "created_at");
const KEY = ["shopping_items"];

export const useShopping = () =>
  useQuery({ queryKey: KEY, queryFn: () => store.list("1970-01-01T00:00:00.000Z") });

function useItemsMutation<V>(fn: (vars: V) => Promise<void>, apply: (list: ShoppingItem[], vars: V) => ShoppingItem[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onMutate: async (vars: V) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<ShoppingItem[]>(KEY);
      queryClient.setQueryData<ShoppingItem[]>(KEY, (l = []) => apply(l, vars));
      return { previous };
    },
    onError: (_e, _v, context) => queryClient.setQueryData(KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export const useAddItem = () => useItemsMutation<ShoppingItem>((i) => store.insert(i), (l, i) => [i, ...l]);
/** Uloží změny jedné nebo víc položek (odškrtnutí, vyčištění košíku, úprava). */
export const useUpdateItems = () =>
  useItemsMutation<ShoppingItem[]>(
    async (items) => { for (const { id, created_at: _c, ...patch } of items) await store.update(id, patch); },
    (l, items) => l.map((x) => items.find((i) => i.id === x.id) ?? x),
  );
export const useDeleteItem = () => useItemsMutation<string>((id) => store.remove(id), (l, id) => l.filter((x) => x.id !== id));
