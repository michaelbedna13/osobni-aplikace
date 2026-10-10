import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../../lib/db";
import { rawPoints, runningTotals, type Mode, type Round } from "./scoring";

// Týmy se neukládají zvlášť: v rodině se pokaždé míchají jinak, takže každá hra si nese svoje týmy (název, barva,
// nepovinně hráči). Statistiky jsou zajímavosti napříč hrami a výhry hráčů (ti se opakují, týmy ne).

/** Tým v jedné hře. */
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
const gameStore = createStore<Game>("cornhole_games", "started_at");
const GAMES_KEY = ["cornhole_games"];

const byNewest = (a: Game, b: Game) => b.started_at.localeCompare(a.started_at);

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

export const useAddGame = () => useListMutation<Game, Game>(GAMES_KEY, byNewest, (g) => gameStore.insert(g), (l, g) => [...l, g]);
export const useDeleteGame = () => useListMutation<Game, string>(GAMES_KEY, byNewest, (id) => gameStore.remove(id), (l, id) => l.filter((g) => g.id !== id));

/** Jména hráčů z odehraných her (návrhy při zakládání týmů a v dalších hrách). */
export function useCornholePlayers(): string[] {
  const { data: games = [] } = useGames();
  return [...new Set(games.flatMap((g) => g.teams.flatMap((t) => t.players)))].sort((a, b) => a.localeCompare(b, "cs"));
}

type Fact = { team: string; color: string; date: string };

export interface CornholeStats {
  games: number;
  players: { name: string; wins: number; games: number }[];
  /** Nejvíc bodů jednoho týmu v jednom kole. */
  bestRound: (Fact & { points: number }) | null;
  /** Nejvíc děr jednoho týmu v jedné hře. */
  mostHoles: (Fact & { holes: number }) | null;
  /** Největší přetahovaná: hra s nejvíc změnami vedení. */
  tugOfWar: { changes: number; date: string; teams: string[] } | null;
  /** Největší obrat: vítěz dohnal největší ztrátu. */
  comeback: (Fact & { deficit: number }) | null;
  /** Nejtěsnější konec: nejmenší rozdíl vítěze a druhého. */
  closest: (Fact & { margin: number }) | null;
  fastestWin: (Fact & { rounds: number }) | null;
  longestGame: { rounds: number; date: string } | null;
}

export function computeCornholeStats(games: Game[]): CornholeStats {
  const players = new Map<string, CornholeStats["players"][number]>();
  const stats: CornholeStats = { games: games.length, players: [], bestRound: null, mostHoles: null, tugOfWar: null, comeback: null, closest: null, fastestWin: null, longestGame: null };

  for (const g of [...games].sort((a, b) => a.started_at.localeCompare(b.started_at))) {
    const date = g.started_at;
    g.teams.forEach((t, i) => {
      const won = g.winner === i;
      for (const p of t.players) {
        const ps = players.get(p) ?? { name: p, wins: 0, games: 0 };
        players.set(p, { ...ps, games: ps.games + 1, wins: ps.wins + (won ? 1 : 0) });
      }
      const holes = g.rounds.reduce((n, r) => n + (r[i]?.hole ?? 0), 0);
      if (holes > (stats.mostHoles?.holes ?? 0)) stats.mostHoles = { holes, team: t.name, color: t.color, date };
      for (const r of g.rounds) {
        const p = r[i] ? rawPoints(r[i]) : 0;
        if (p > (stats.bestRound?.points ?? 0)) stats.bestRound = { points: p, team: t.name, color: t.color, date };
      }
    });

    // průběh hry: kdo vedl po každém kole (při shodě se vedení nemění)
    const running = runningTotals(g.rounds, g.mode, g.teams.length);
    let leader: number | null = null, changes = 0;
    for (const t of running) {
      const max = Math.max(...t);
      const top = t.map((v, i) => (v === max ? i : -1)).filter((i) => i >= 0);
      if (top.length === 1 && top[0] !== leader) { if (leader !== null) changes++; leader = top[0]; }
    }
    if (changes > (stats.tugOfWar?.changes ?? 0)) stats.tugOfWar = { changes, date, teams: g.teams.map((t) => t.name) };

    const w = g.winner;
    if (w !== null && g.teams[w]) {
      const team = g.teams[w];
      const deficit = Math.max(0, ...running.map((t) => Math.max(...t) - t[w]));
      if (deficit > (stats.comeback?.deficit ?? 0)) stats.comeback = { deficit, team: team.name, color: team.color, date };
      const final = running.at(-1);
      if (final && final.length > 1) {
        const margin = final[w] - Math.max(...final.filter((_, i) => i !== w));
        if (margin >= 0 && (!stats.closest || margin < stats.closest.margin)) stats.closest = { margin, team: team.name, color: team.color, date };
      }
      if (!stats.fastestWin || g.rounds.length < stats.fastestWin.rounds) stats.fastestWin = { rounds: g.rounds.length, team: team.name, color: team.color, date };
    }
    if (g.rounds.length > (stats.longestGame?.rounds ?? 0)) stats.longestGame = { rounds: g.rounds.length, date };
  }

  stats.players = [...players.values()].sort((a, b) => b.wins - a.wins || b.wins / b.games - a.wins / a.games || a.name.localeCompare(b.name, "cs"));
  return stats;
}
