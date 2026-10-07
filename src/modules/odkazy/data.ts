import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../../lib/db";
import { supabase } from "../../lib/supabase";
import { OEMBED_HOSTS, domainOf, youtubeId } from "./util";

export interface Link {
  id: string;
  kind: "link" | "image";
  url: string | null;
  title: string | null;
  description: string | null;
  image_url: string | null;
  site: string | null;
  storage_path: string | null;
  collection: string | null;
  note: string | null;
  preview_done: boolean;
  read_at: string | null;
  created_at: string;
}

const store = createStore<Link>("links", "created_at");
const KEY = ["links"];
const byNewest = (a: Link, b: Link) => b.created_at.localeCompare(a.created_at);

export const useLinks = () =>
  useQuery({ queryKey: KEY, queryFn: async () => (await store.list("1970-01-01T00:00:00.000Z")).sort(byNewest) });

function useLinkMutation<V>(fn: (vars: V) => Promise<void>, apply: (list: Link[], vars: V) => Link[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onMutate: async (vars: V) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<Link[]>(KEY);
      queryClient.setQueryData<Link[]>(KEY, (list = []) => apply(list, vars).sort(byNewest));
      return { previous };
    },
    onError: (_e, _v, context) => queryClient.setQueryData(KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export const useAddLink = () => useLinkMutation<Link>((l) => store.insert(l), (list, l) => [...list, l]);
export const useUpdateLink = () =>
  useLinkMutation<Link>(({ id, created_at: _c, ...patch }) => store.update(id, patch), (list, l) => list.map((x) => (x.id === l.id ? l : x)));
export const useDeleteLink = () =>
  useLinkMutation<Link>(async (l) => {
    await store.remove(l.id);
    if (l.storage_path && supabase) await supabase.storage.from("links").remove([l.storage_path]);
  }, (list, l) => list.filter((x) => x.id !== l.id));

export function newLink(fields: Partial<Link> & Pick<Link, "kind">): Link {
  return {
    id: crypto.randomUUID(), url: null, title: null, description: null, image_url: null, site: null, storage_path: null,
    collection: null, note: null, preview_done: false, read_at: null, created_at: new Date().toISOString(), ...fields,
  };
}

// ---------- náhledy ----------

export interface Preview { title: string | null; description: string | null; image_url: string | null; site: string | null }

const clip = (s: unknown, n: number) => (typeof s === "string" && s.trim() ? s.trim().slice(0, n) : null);

/**
 * Náhled odkazu: YouTube a spol. přes oEmbed (noembed.com), ostatní weby přes microlink.io.
 * Oba jsou zdarma a bez klíče; adresa odkazu se jim kvůli tomu pošle.
 */
export async function fetchPreview(url: string): Promise<Preview> {
  const host = domainOf(url);
  const yt = youtubeId(url);
  const base: Preview = { title: null, description: null, image_url: yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : null, site: host };
  try {
    if (OEMBED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
      const r = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      const j = await r.json();
      if (!j.error) {
        return { title: clip(j.title, 300), description: clip(j.author_name, 1000), image_url: base.image_url ?? clip(j.thumbnail_url, 2000), site: clip(j.provider_name, 200) ?? host };
      }
    }
    const r = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    const j = await r.json();
    if (j.status === "success") {
      const d = j.data ?? {};
      return { title: clip(d.title, 300), description: clip(d.description, 1000), image_url: base.image_url ?? clip(d.image?.url, 2000) ?? clip(d.logo?.url, 2000), site: clip(d.publisher, 200) ?? host };
    }
  } catch {
    // bez náhledu – odkaz zůstane s adresou
  }
  return base;
}

// ---------- obrázky ----------

/** Zmenší obrázek (delší strana max. `max` px) a převede na JPEG. */
export async function shrinkImage(file: File, max = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Obrázek nejde převést"))), "image/jpeg", quality));
}

const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.readAsDataURL(blob);
});

/** Nahraje obrázek: do Supabase Storage (výchozí bucket links), v ukázkovém režimu jako data URL. */
export async function uploadImage(file: File, bucket = "links"): Promise<Pick<Link, "storage_path" | "image_url">> {
  if (!supabase) return { storage_path: null, image_url: await blobToDataUrl(await shrinkImage(file, 900, 0.7)) };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nejsi přihlášený");
  const path = `${user.id}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, await shrinkImage(file), { contentType: "image/jpeg" });
  if (error) throw error;
  return { storage_path: path, image_url: null };
}

/** Dočasné adresy pro obrázky v soukromém úložišti (platí hodinu). */
export function useSignedUrls(paths: string[], bucket = "links") {
  const key = [...paths].sort().join("|");
  return useQuery({
    queryKey: [`${bucket}-signed`, key],
    enabled: !!supabase && paths.length > 0,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase!.storage.from(bucket).createSignedUrls(paths, 3600);
      if (error) throw error;
      return Object.fromEntries((data ?? []).filter((d) => d.path && d.signedUrl).map((d) => [d.path!, d.signedUrl]));
    },
  });
}

// ---------- klíč pro Zkratku ----------

/** Tajný klíč pro ukládání ze Zkratky (sloupec share_token v user_settings). */
export function useShareToken() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["share_token"],
    enabled: !!supabase,
    queryFn: async () => {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return null;
      const read = () => supabase!.from("user_settings").select("share_token").eq("user_id", user.id).maybeSingle();
      let { data, error } = await read();
      if (error) throw error;
      if (!data) {
        // řádek s nastavením ještě neexistuje – vytvoří se s novým klíčem
        const ins = await supabase!.from("user_settings").upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });
        if (ins.error) throw ins.error;
        ({ data, error } = await read());
        if (error) throw error;
      }
      return (data?.share_token as string | undefined) ?? null;
    },
  });
  const regenerate = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) throw new Error("Nejsi přihlášený");
      const { error } = await supabase!.from("user_settings").update({ share_token: crypto.randomUUID() }).eq("user_id", user.id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["share_token"] }),
  });
  return { token: query.data ?? null, error: query.error ?? regenerate.error, regenerate: () => regenerate.mutate() };
}
