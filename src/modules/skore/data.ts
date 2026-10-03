import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../../lib/db";
import { KINDS, play, type GameKind, type Settings, type Turn } from "./rules";

export interface ScoreGame {
  id: string;
  kind: GameKind;
  settings: Settings;
  players: string[];
  turns: Turn[];
  winner: number | null;
  started_at: string;
  finished_at: string;
}

/** Barvy hráčů podle pořadí. */
export const PLAYER_COLORS = ["#E43B44", "#0099DB", "#FEE761", "#63C74D", "#B55088", "#F77622", "#C0CBDC", "#2CE8F5"];
export const playerColor = (i: number) => PLAYER_COLORS[i % PLAYER_COLORS.length];
export const MAX_PLAYERS = 8;

const EPOCH = "1970-01-01T00:00:00.000Z";
const store = createStore<ScoreGame>("score_games", "started_at");
const KEY = ["score_games"];
const byNewest = (a: ScoreGame, b: ScoreGame) => b.started_at.localeCompare(a.started_at);

export const useScoreGames = () => useQuery({ queryKey: KEY, queryFn: async () => (await store.list(EPOCH)).sort(byNewest) });

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

export const useAddScoreGame = () => useListMutation<ScoreGame>((g) => store.insert(g), (l, g) => [...l, g]);
export const useDeleteScoreGame = () => useListMutation<string>((id) => store.remove(id), (l, id) => l.filter((g) => g.id !== id));

const key = (name: string) => name.trim().toLocaleLowerCase("cs");

export interface PlayerStat {
  name: string;
  wins: number;
  games: number;
}

export interface ScoreRecord {
  value: string;
  text: string;
  date: string;
}

export interface ScoreStats {
  games: number;
  kinds: GameKind[];
  players: PlayerStat[];
  records: ScoreRecord[];
}

/** Žebříček hráčů (případně jen pro jednu hru) a rekordy. */
export function computeScoreStats(games: ScoreGame[], only: GameKind | null = null): ScoreStats {
  const list = only ? games.filter((g) => g.kind === only) : games;
  const players = new Map<string, PlayerStat>();
  for (const g of list) {
    g.players.forEach((name, i) => {
      const k = key(name);
      const s = players.get(k) ?? { name: name.trim(), wins: 0, games: 0 };
      s.games++;
      if (g.winner === i) s.wins++;
      players.set(k, s);
    });
  }

  const records: ScoreRecord[] = [];
  let visit: { v: number; who: string; date: string } | null = null;
  let tons = 0;
  let molkky: { throws: number; who: string; date: string } | null = null;
  let end: { v: number; who: string; date: string } | null = null;
  for (const g of list) {
    if (g.kind === "sipky") {
      const state = play(g.kind, g.settings, g.players.length, g.turns);
      for (const t of state.log) {
        if (!t.bust && (!visit || t.v > visit.v)) visit = { v: t.v, who: g.players[t.p], date: g.started_at };
        if (t.v === 180) tons++;
      }
    }
    if (g.kind === "molkky" && g.winner !== null) {
      const throws = g.turns.filter((t) => t.p === g.winner).length;
      if (!molkky || throws < molkky.throws) molkky = { throws, who: g.players[g.winner], date: g.started_at };
    }
    if (g.kind === "petanque") {
      for (const t of g.turns) if (!end || t.v > end.v) end = { v: t.v, who: g.players[t.p], date: g.started_at };
    }
  }
  if (visit) records.push({ value: String(visit.v), text: `nejvyšší nához v šipkách: ${visit.who}`, date: visit.date });
  if (tons) records.push({ value: String(tons), text: tons === 1 ? "nához za 180" : "náhozů za 180", date: "" });
  if (molkky) records.push({ value: String(molkky.throws), text: `hodů na nejrychlejší výhru v mölkky: ${molkky.who}`, date: molkky.date });
  if (end) records.push({ value: String(end.v), text: `nejvíc bodů v jednom kole pétanque: ${end.who}`, date: end.date });

  return {
    games: list.length,
    kinds: [...new Set(games.map((g) => g.kind))].filter((k) => k in KINDS),
    players: [...players.values()].sort((a, b) => b.wins - a.wins || a.games - b.games || a.name.localeCompare(b.name, "cs")),
    records,
  };
}
