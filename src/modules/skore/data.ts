import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../../lib/db";
import { DEFAULT_SETTINGS, average, play, type DartSettings, type OutMode, type Visit } from "./darts";

/** Uložená hra. Tabulka score_games umí i jiné hry (dřívější verze modulu), používají se jen šipky. */
export interface ScoreGame {
  id: string;
  kind: string;
  settings: Partial<DartSettings>;
  players: string[];
  turns: Visit[];
  winner: number | null;
  started_at: string;
  finished_at: string;
}

/** Barvy hráčů podle pořadí. */
export const PLAYER_COLORS = ["#E43B44", "#0099DB", "#FEE761", "#63C74D", "#B55088", "#F77622", "#C0CBDC", "#2CE8F5"];
export const playerColor = (i: number) => PLAYER_COLORS[i % PLAYER_COLORS.length];
export const MAX_PLAYERS = 8;

/** Starší hry neměly způsob zavírání ani legy. */
export const normalize = (s: Partial<DartSettings> | undefined): DartSettings => ({
  start: s?.start ?? DEFAULT_SETTINGS.start,
  out: (s?.out ?? "straight") as OutMode,
  legs: s?.legs ?? 1,
});

const EPOCH = "1970-01-01T00:00:00.000Z";
const store = createStore<ScoreGame>("score_games", "started_at");
const KEY = ["score_games"];
const byNewest = (a: ScoreGame, b: ScoreGame) => b.started_at.localeCompare(a.started_at);

export const useDartGames = () =>
  useQuery({ queryKey: KEY, queryFn: async () => (await store.list(EPOCH)).filter((g) => g.kind === "sipky").sort(byNewest) });

function useListMutation<V>(fn: (vars: V) => Promise<void>, apply: (list: ScoreGame[], vars: V) => ScoreGame[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onMutate: async (vars: V) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<ScoreGame[]>(KEY);
      queryClient.setQueryData<ScoreGame[]>(KEY, (list = []) => apply(list, vars).sort(byNewest));
      return { previous };
    },
    onError: (_e, _v, context) => queryClient.setQueryData(KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export const useAddDartGame = () => useListMutation<ScoreGame>((g) => store.insert(g), (l, g) => [...l, g]);
export const useDeleteDartGame = () => useListMutation<string>((id) => store.remove(id), (l, id) => l.filter((g) => g.id !== id));

const key = (name: string) => name.trim().toLocaleLowerCase("cs");

export interface PlayerStat {
  name: string;
  wins: number;
  games: number;
  legs: number;
  /** Průměr na nához přes všechny hry. */
  average: number | null;
}

export interface DartRecord {
  value: string;
  text: string;
  date: string;
}

export interface DartStats {
  games: number;
  players: PlayerStat[];
  records: DartRecord[];
}

export function computeDartStats(games: ScoreGame[]): DartStats {
  const players = new Map<string, PlayerStat & { points: number; visits: number }>();
  let bestVisit: DartRecord & { n: number } = { n: -1, value: "", text: "", date: "" };
  let bestCheckout: DartRecord & { n: number } = { n: -1, value: "", text: "", date: "" };
  let bestAvg: DartRecord & { n: number } = { n: -1, value: "", text: "", date: "" };
  let shortest: DartRecord & { n: number } = { n: Infinity, value: "", text: "", date: "" };
  let tons = 0;

  for (const g of games) {
    const state = play(normalize(g.settings), g.players.length, g.turns);
    g.players.forEach((name, i) => {
      const k = key(name);
      const s = players.get(k) ?? { name: name.trim(), wins: 0, games: 0, legs: 0, average: null, points: 0, visits: 0 };
      s.games++;
      if (g.winner === i) s.wins++;
      s.legs += state.legsWon[i];
      const mine = state.log.filter((t) => t.p === i);
      s.visits += mine.length;
      s.points += mine.reduce((sum, t) => sum + (t.bust ? 0 : t.v), 0);
      players.set(k, s);
      const avg = average(state, i);
      if (avg !== null && mine.length >= 3 && avg > bestAvg.n) bestAvg = { n: avg, value: String(avg).replace(".", ","), text: `nejlepší průměr na nához: ${name}`, date: g.started_at };
    });
    const visitsInLeg = new Map<string, number>();
    for (const t of state.log) {
      if (t.v === 180) tons++;
      if (!t.bust && t.v > bestVisit.n) bestVisit = { n: t.v, value: String(t.v), text: `nejvyšší nához: ${g.players[t.p]}`, date: g.started_at };
      const legKey = `${t.leg}|${t.p}`;
      visitsInLeg.set(legKey, (visitsInLeg.get(legKey) ?? 0) + 1);
      if (t.checkout) {
        if (t.v > bestCheckout.n) bestCheckout = { n: t.v, value: String(t.v), text: `nejvyšší zavření: ${g.players[t.p]}`, date: g.started_at };
        const used = visitsInLeg.get(legKey) ?? 0;
        if (used < shortest.n) shortest = { n: used, value: String(used), text: `${used === 1 ? "náhozu" : "náhozů"} na nejrychlejší leg: ${g.players[t.p]}`, date: g.started_at };
      }
    }
  }

  const records: DartRecord[] = [];
  if (bestVisit.n > 0) records.push(bestVisit);
  if (bestCheckout.n > 0) records.push(bestCheckout);
  if (bestAvg.n > 0) records.push(bestAvg);
  if (Number.isFinite(shortest.n)) records.push(shortest);
  if (tons) records.push({ value: String(tons), text: tons === 1 ? "nához za 180" : "náhozů za 180", date: "" });

  return {
    games: games.length,
    players: [...players.values()]
      .map(({ points, visits, ...p }) => ({ ...p, average: visits ? Math.round((points / visits) * 10) / 10 : null }))
      .sort((a, b) => b.wins - a.wins || b.legs - a.legs || a.name.localeCompare(b.name, "cs")),
    records,
  };
}
