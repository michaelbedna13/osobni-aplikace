import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../../lib/db";
import { rawPoints, type Mode, type Round } from "./scoring";

export interface Team {
  id: string;
  name: string;
  color: string;
  players: string[];
  created_at: string;
}

/** Snímek týmu v době hry (tým se později může přejmenovat nebo smazat). */
export interface GameTeam {
  team_id: string;
  name: string;
  color: string;
  players: string[];
}

export interface Game {
  id: string;
  started_at: string;
  finished_at: string;
  mode: Mode;
  target: number;
  teams: GameTeam[];
  rounds: Round[];
  winner: number | null;
}

/** Barvy pytlíků pro týmy. */
export const TEAM_COLORS = ["#E43B44", "#0099DB", "#FEE761", "#63C74D", "#B55088", "#F77622", "#C0CBDC", "#2CE8F5"];

const EPOCH = "1970-01-01T00:00:00.000Z";
const teamStore = createStore<Team>("cornhole_teams", "created_at");
const gameStore = createStore<Game>("cornhole_games", "started_at");
const TEAMS_KEY = ["cornhole_teams"];
const GAMES_KEY = ["cornhole_games"];

const byName = (a: Team, b: Team) => a.name.localeCompare(b.name, "cs");
const byNewest = (a: Game, b: Game) => b.started_at.localeCompare(a.started_at);

export const useTeams = () => useQuery({ queryKey: TEAMS_KEY, queryFn: async () => (await teamStore.list(EPOCH)).sort(byName) });
export const useGames = () => useQuery({ queryKey: GAMES_KEY, queryFn: async () => (await gameStore.list(EPOCH)).sort(byNewest) });

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

export const useAddTeam = () => useListMutation<Team, Team>(TEAMS_KEY, byName, (t) => teamStore.insert(t), (l, t) => [...l, t]);
export const useUpdateTeam = () =>
  useListMutation<Team, Team>(TEAMS_KEY, byName, ({ id, name, color, players }) => teamStore.update(id, { name, color, players }), (l, t) => l.map((x) => (x.id === t.id ? t : x)));
export const useDeleteTeam = () => useListMutation<Team, string>(TEAMS_KEY, byName, (id) => teamStore.remove(id), (l, id) => l.filter((t) => t.id !== id));
export const useAddGame = () => useListMutation<Game, Game>(GAMES_KEY, byNewest, (g) => gameStore.insert(g), (l, g) => [...l, g]);
export const useDeleteGame = () => useListMutation<Game, string>(GAMES_KEY, byNewest, (id) => gameStore.remove(id), (l, id) => l.filter((g) => g.id !== id));

export interface CornholeStats {
  games: number;
  teams: { team_id: string; name: string; color: string; wins: number; games: number }[];
  players: { name: string; wins: number; games: number }[];
  bestRound: { points: number; team: string; date: string } | null;
  mostHoles: { holes: number; team: string; date: string } | null;
  fastestWin: { rounds: number; team: string; date: string } | null;
  longestGame: { rounds: number; date: string } | null;
}

export function computeCornholeStats(games: Game[]): CornholeStats {
  const teams = new Map<string, CornholeStats["teams"][number]>();
  const players = new Map<string, CornholeStats["players"][number]>();
  const stats: CornholeStats = { games: games.length, teams: [], players: [], bestRound: null, mostHoles: null, fastestWin: null, longestGame: null };

  for (const g of [...games].sort((a, b) => a.started_at.localeCompare(b.started_at))) {
    g.teams.forEach((t, i) => {
      const won = g.winner === i;
      const ts = teams.get(t.team_id) ?? { team_id: t.team_id, name: t.name, color: t.color, wins: 0, games: 0 };
      // jméno a barva z poslední hry
      teams.set(t.team_id, { ...ts, name: t.name, color: t.color, games: ts.games + 1, wins: ts.wins + (won ? 1 : 0) });
      for (const p of t.players) {
        const ps = players.get(p) ?? { name: p, wins: 0, games: 0 };
        players.set(p, { ...ps, games: ps.games + 1, wins: ps.wins + (won ? 1 : 0) });
      }
      const holes = g.rounds.reduce((n, r) => n + (r[i]?.hole ?? 0), 0);
      if (holes > (stats.mostHoles?.holes ?? 0)) stats.mostHoles = { holes, team: t.name, date: g.started_at };
      for (const r of g.rounds) {
        const p = r[i] ? rawPoints(r[i]) : 0;
        if (p > (stats.bestRound?.points ?? 0)) stats.bestRound = { points: p, team: t.name, date: g.started_at };
      }
    });
    if (g.winner !== null && g.teams[g.winner] && (!stats.fastestWin || g.rounds.length < stats.fastestWin.rounds)) {
      stats.fastestWin = { rounds: g.rounds.length, team: g.teams[g.winner].name, date: g.started_at };
    }
    if (g.rounds.length > (stats.longestGame?.rounds ?? 0)) stats.longestGame = { rounds: g.rounds.length, date: g.started_at };
  }

  const rank = <T extends { wins: number; games: number; name: string }>(list: T[]) =>
    list.sort((a, b) => b.wins - a.wins || b.wins / b.games - a.wins / a.games || a.name.localeCompare(b.name, "cs"));
  stats.teams = rank([...teams.values()]);
  stats.players = rank([...players.values()]);
  return stats;
}
