import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDateByName } from "namedays-cs";
import { createStore } from "../../lib/db";
import { addDays, startOfDay } from "../../lib/dates";

export interface Person {
  id: string;
  name: string;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
  /** Jmeniny „MM-DD“. */
  nameday: string | null;
  note: string | null;
  created_at: string;
}

export interface GiftIdea {
  id: string;
  person_id: string;
  text: string;
  url: string | null;
  given_at: string | null;
  created_at: string;
}

const EPOCH = "1970-01-01T00:00:00.000Z";
const peopleStore = createStore<Person>("people", "created_at");
const ideaStore = createStore<GiftIdea>("gift_ideas", "created_at");
const PEOPLE_KEY = ["people"];
const IDEAS_KEY = ["gift_ideas"];

const byName = (a: Person, b: Person) => a.name.localeCompare(b.name, "cs");
const byNewest = (a: GiftIdea, b: GiftIdea) => b.created_at.localeCompare(a.created_at);

export const usePeople = () =>
  useQuery({ queryKey: PEOPLE_KEY, queryFn: async () => (await peopleStore.list(EPOCH)).sort(byName) });
export const useGiftIdeas = () =>
  useQuery({ queryKey: IDEAS_KEY, queryFn: async () => (await ideaStore.list(EPOCH)).sort(byNewest) });

function useListMutation<T, V>(key: string[], sort: (a: T, b: T) => number, fn: (vars: V) => Promise<void>, apply: (list: T[], vars: V) => T[]) {
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

export const useAddPerson = () => useListMutation<Person, Person>(PEOPLE_KEY, byName, (p) => peopleStore.insert(p), (l, p) => [...l, p]);
export const useUpdatePerson = () =>
  useListMutation<Person, Person>(PEOPLE_KEY, byName, ({ id, created_at: _c, ...patch }) => peopleStore.update(id, patch), (l, p) => l.map((x) => (x.id === p.id ? p : x)));
export function useDeletePerson() {
  const queryClient = useQueryClient();
  return useListMutation<Person, string>(PEOPLE_KEY, byName, async (id) => {
    await peopleStore.remove(id);
    // nápady se v databázi smažou samy (on delete cascade); v ukázkovém režimu je smažeme ručně
    const ideas = queryClient.getQueryData<GiftIdea[]>(IDEAS_KEY) ?? [];
    await Promise.all(ideas.filter((i) => i.person_id === id).map((i) => ideaStore.remove(i.id).catch(() => undefined)));
    queryClient.setQueryData<GiftIdea[]>(IDEAS_KEY, ideas.filter((i) => i.person_id !== id));
  }, (l, id) => l.filter((p) => p.id !== id));
}

export const useAddIdea = () => useListMutation<GiftIdea, GiftIdea>(IDEAS_KEY, byNewest, (i) => ideaStore.insert(i), (l, i) => [...l, i]);
export const useUpdateIdea = () =>
  useListMutation<GiftIdea, GiftIdea>(IDEAS_KEY, byNewest, ({ id, text, url, given_at }) => ideaStore.update(id, { text, url, given_at }), (l, i) => l.map((x) => (x.id === i.id ? i : x)));
export const useDeleteIdea = () => useListMutation<GiftIdea, string>(IDEAS_KEY, byNewest, (id) => ideaStore.remove(id), (l, id) => l.filter((i) => i.id !== id));

export function newPerson(fields: Omit<Person, "id" | "created_at">): Person {
  return { ...fields, id: crypto.randomUUID(), created_at: new Date().toISOString() };
}

export function newIdea(person_id: string, text: string, url: string | null = null): GiftIdea {
  return { id: crypto.randomUUID(), person_id, text: text.trim(), url, given_at: null, created_at: new Date().toISOString() };
}

/** Jmeniny podle křestního jména (první slovo), „MM-DD“, nebo null. */
export function namedayFor(name: string): string | null {
  const first = name.trim().split(/\s+/)[0] ?? "";
  return first ? getDateByName(first)[0] ?? null : null;
}

export interface Occasion {
  person: Person;
  kind: "narozeniny" | "jmeniny";
  date: Date;
  /** Za kolik dní (0 = dnes). */
  days: number;
  /** Kolik bude slavit (jen narozeniny se známým rokem). */
  age: number | null;
}

/** Nejbližší výskyt dne v roce (29. 2. v nepřestupném roce slaví 28. 2.). */
function nextDate(month: number, day: number, today: Date) {
  for (const year of [today.getFullYear(), today.getFullYear() + 1]) {
    const leap = new Date(year, 1, 29).getMonth() === 1;
    const d = new Date(year, month - 1, month === 2 && day === 29 && !leap ? 28 : day);
    if (d >= today) return d;
  }
  return today;
}

/** Nadcházející narozeniny a jmeniny všech lidí, seřazené podle data (rok dopředu). */
export function upcomingOccasions(people: Person[], now = new Date()): Occasion[] {
  const today = startOfDay(now);
  const list: Occasion[] = [];
  for (const person of people) {
    if (person.birth_month && person.birth_day) {
      const date = nextDate(person.birth_month, person.birth_day, today);
      list.push({ person, kind: "narozeniny", date, days: Math.round((date.getTime() - today.getTime()) / 86_400_000), age: person.birth_year ? date.getFullYear() - person.birth_year : null });
    }
    if (person.nameday) {
      const [m, d] = person.nameday.split("-").map(Number);
      const date = nextDate(m, d, today);
      list.push({ person, kind: "jmeniny", date, days: Math.round((date.getTime() - today.getTime()) / 86_400_000), age: null });
    }
  }
  return list.sort((a, b) => a.days - b.days || (a.kind === "narozeniny" ? -1 : 1) || byName(a.person, b.person));
}

/** Oslavy v nejbližších `days` dnech (včetně dneška). */
export const soonOccasions = (people: Person[], days = 7, now = new Date()) =>
  upcomingOccasions(people, now).filter((o) => o.date < addDays(startOfDay(now), days));
