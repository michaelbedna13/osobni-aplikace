import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import { DEFAULT_PINNED, isModuleKey, type ModuleKey } from "./modules";

export interface Settings {
  pinned_modules: ModuleKey[];
  /** Cíl meditací za týden (počet). */
  meditation_weekly_goal: number;
}

const DEFAULTS: Settings = { pinned_modules: DEFAULT_PINNED, meditation_weekly_goal: 5 };
const LOCAL_KEY = "settings";

function normalize(raw: Partial<Record<keyof Settings, unknown>> | null | undefined): Settings {
  return {
    pinned_modules: Array.isArray(raw?.pinned_modules)
      ? [...new Set(raw.pinned_modules.map((k) => (k === "denik" ? "vdecnost" : k)).filter(isModuleKey))] // Deník se přejmenoval na Vděčnost
      : DEFAULTS.pinned_modules,
    meditation_weekly_goal:
      typeof raw?.meditation_weekly_goal === "number" && raw.meditation_weekly_goal > 0 ? raw.meditation_weekly_goal : DEFAULTS.meditation_weekly_goal,
  };
}

function readLocal(): Settings {
  try {
    return normalize(JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "null"));
  } catch {
    return DEFAULTS;
  }
}

function writeLocal(settings: Settings) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
  } catch {
    // bez úložiště se nastavení jen nezapamatuje
  }
}

/** Uživatelská nastavení. S přihlášením v Supabase (tabulka user_settings), jinak v prohlížeči. */
export function useSettings() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const queryKey = ["settings", userId ?? "local"];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<Settings> => {
      if (!supabase || !userId) return readLocal();
      const { data, error } = await supabase
        .from("user_settings")
        .select("pinned_modules, meditation_weekly_goal")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return normalize(data);
    },
  });

  const settings = query.data ?? DEFAULTS;

  const mutation = useMutation({
    mutationFn: async (next: Settings) => {
      if (!supabase || !userId) return writeLocal(next);
      const { error } = await supabase.from("user_settings").upsert({ user_id: userId, ...next });
      if (error) throw error;
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Settings>(queryKey);
      queryClient.setQueryData(queryKey, next);
      return { previous };
    },
    onError: (_error, _next, context) => queryClient.setQueryData(queryKey, context?.previous),
  });

  return {
    settings,
    update: (patch: Partial<Settings>) => mutation.mutate({ ...settings, ...patch }),
    error: query.error ?? mutation.error,
  };
}

/** Moduly připnuté na obrazovce Dnes. */
export function usePinnedModules() {
  const { settings, update, error } = useSettings();
  return {
    pinned: settings.pinned_modules,
    setPinned: (keys: ModuleKey[]) => update({ pinned_modules: keys }),
    error,
  };
}
