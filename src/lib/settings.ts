import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import { DEFAULT_PINNED, isModuleKey, type ModuleKey } from "./modules";

const LOCAL_KEY = "pinned-modules";

function readLocal(): ModuleKey[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) return parsed.filter(isModuleKey);
  } catch {
    // localStorage nemusí být dostupný (soukromé okno) – použijeme výchozí výběr
  }
  return DEFAULT_PINNED;
}

function writeLocal(keys: ModuleKey[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(keys));
  } catch {
    // bez úložiště se výběr jen nezapamatuje
  }
}

/** Moduly připnuté na obrazovce Dnes. S přihlášením se ukládají do Supabase, jinak do prohlížeče. */
export function usePinnedModules() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const queryKey = ["pinned-modules", userId ?? "local"];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<ModuleKey[]> => {
      if (!supabase || !userId) return readLocal();
      const { data, error } = await supabase
        .from("user_settings")
        .select("pinned_modules")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data ? (data.pinned_modules as string[]).filter(isModuleKey) : DEFAULT_PINNED;
    },
  });

  const mutation = useMutation({
    mutationFn: async (keys: ModuleKey[]) => {
      if (!supabase || !userId) return writeLocal(keys);
      const { error } = await supabase
        .from("user_settings")
        .upsert({ user_id: userId, pinned_modules: keys, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onMutate: async (keys) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ModuleKey[]>(queryKey);
      queryClient.setQueryData(queryKey, keys);
      return { previous };
    },
    onError: (_error, _keys, context) => queryClient.setQueryData(queryKey, context?.previous),
  });

  return {
    pinned: query.data ?? DEFAULT_PINNED,
    setPinned: mutation.mutate,
    error: query.error ?? mutation.error,
  };
}
