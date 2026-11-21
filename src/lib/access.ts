import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./auth";
import { MODULES, MODULE_BY_KEY, type ModuleDef, type ModuleKey } from "./modules";
import { isDemo, supabase } from "./supabase";

// Soukromé moduly (untrois) vidí jen účet, který má v Supabase příznak app_metadata.<modul> = true.
// app_metadata nastavuje jen správce projektu (Authentication → Users nebo SQL), uživatel si ho z appky nezmění.
// Data modulu chrání i tak Row Level Security; tohle jen schová modul z appky lidem, pro které není.

type Meta = Record<string, unknown> | null | undefined;

/** Smí účet s těmito app_metadata vidět modul? V ukázkovém režimu (bez Supabase) vše. */
export const canSee = (m: ModuleDef, meta: Meta, demo = isDemo) => !m.private || demo || meta?.[m.key] === true;

/** Přístup k modulům. Dokud se neověří účet, soukromé moduly nejsou vidět (načítá se pod úvodní obrazovkou). */
export function useModuleAccess() {
  const { session } = useAuth();
  const userId = session?.user.id;
  // čerstvě ze serveru: v uloženém přihlášení (JWT) by se změna příznaku projevila až po obnovení tokenu
  const fresh = useQuery({
    queryKey: ["account-meta", userId ?? "demo"],
    enabled: Boolean(supabase && userId),
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase!.auth.getUser();
      if (error) throw error;
      return (data.user?.app_metadata ?? null) as Meta;
    },
  });
  // bez spojení se použije příznak z uloženého přihlášení
  const meta: Meta = fresh.data !== undefined ? fresh.data : fresh.isError ? session?.user.app_metadata : null;
  const can = (key: ModuleKey) => canSee(MODULE_BY_KEY[key], meta);
  return { can, modules: MODULES.filter((m) => canSee(m, meta)), ready: isDemo || !fresh.isPending || !userId };
}
