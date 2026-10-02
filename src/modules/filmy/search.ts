// Hledání filmů, seriálů a knih bez klíčů a registrace:
// filmy – iTunes Search API (český obchod, české názvy; přes JSONP, protože nemá CORS),
// seriály – TVmaze, knihy – Open Library.

export type Kind = "film" | "serial" | "kniha";

export interface Found {
  kind: Kind;
  title: string;
  year: number | null;
  creator: string | null;
  image_url: string | null;
  external_url: string | null;
  source: "itunes" | "tvmaze" | "openlibrary";
  source_id: string;
}

const yearOf = (s: unknown) => {
  const m = typeof s === "string" ? s.match(/^(\d{4})/) : typeof s === "number" ? [String(s), String(s)] : null;
  return m ? Number(m[1]) : null;
};

// ---------- převody odpovědí (testované) ----------

interface ItunesItem { trackId?: number; trackName?: string; artistName?: string; releaseDate?: string; artworkUrl100?: string; trackViewUrl?: string }
export const fromItunes = (results: ItunesItem[]): Found[] =>
  results.filter((r) => r.trackId && r.trackName).map((r) => ({
    kind: "film",
    title: r.trackName!,
    year: yearOf(r.releaseDate),
    creator: r.artistName ?? null,
    image_url: r.artworkUrl100 ? r.artworkUrl100.replace(/\/\d+x\d+bb\./, "/600x900bb.") : null,
    external_url: r.trackViewUrl ?? null,
    source: "itunes",
    source_id: String(r.trackId),
  }));

interface TvmazeHit { show?: { id?: number; name?: string; premiered?: string | null; image?: { medium?: string; original?: string } | null; url?: string; network?: { name?: string } | null; webChannel?: { name?: string } | null } }
export const fromTvmaze = (hits: TvmazeHit[]): Found[] =>
  hits.filter((h) => h.show?.id && h.show.name).map(({ show }) => ({
    kind: "serial",
    title: show!.name!,
    year: yearOf(show!.premiered),
    creator: show!.network?.name ?? show!.webChannel?.name ?? null,
    image_url: show!.image?.medium ?? show!.image?.original ?? null,
    external_url: show!.url ?? null,
    source: "tvmaze",
    source_id: String(show!.id),
  }));

interface OpenLibraryDoc { key?: string; title?: string; author_name?: string[]; first_publish_year?: number; cover_i?: number }
export const fromOpenLibrary = (docs: OpenLibraryDoc[]): Found[] =>
  docs.filter((d) => d.key && d.title).map((d) => ({
    kind: "kniha",
    title: d.title!,
    year: d.first_publish_year ?? null,
    creator: d.author_name?.slice(0, 2).join(", ") ?? null,
    image_url: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
    external_url: `https://openlibrary.org${d.key}`,
    source: "openlibrary",
    source_id: d.key!,
  }));

// ---------- dotazy ----------

let jsonpCounter = 0;
/** JSONP: iTunes Search API nevrací hlavičky CORS, ale umí callback. */
function jsonp<T>(url: string, timeoutMs = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const name = `__itunes_cb_${Date.now()}_${jsonpCounter++}`;
    const script = document.createElement("script");
    const cleanup = () => {
      delete (window as unknown as Record<string, unknown>)[name];
      script.remove();
      window.clearTimeout(timer);
    };
    const timer = window.setTimeout(() => { cleanup(); reject(new Error("Vypršel čas")); }, timeoutMs);
    (window as unknown as Record<string, unknown>)[name] = (data: T) => { cleanup(); resolve(data); };
    script.src = `${url}&callback=${name}`;
    script.onerror = () => { cleanup(); reject(new Error("Hledání selhalo")); };
    document.head.append(script);
  });
}

export async function search(kind: Kind, query: string): Promise<Found[]> {
  const q = encodeURIComponent(query.trim());
  if (!q) return [];
  if (kind === "film") {
    const data = await jsonp<{ results: ItunesItem[] }>(`https://itunes.apple.com/search?term=${q}&country=cz&media=movie&entity=movie&limit=15`);
    return fromItunes(data.results ?? []);
  }
  if (kind === "serial") {
    const r = await fetch(`https://api.tvmaze.com/search/shows?q=${q}`);
    if (!r.ok) throw new Error("Hledání selhalo");
    return fromTvmaze(await r.json());
  }
  const r = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=15&fields=key,title,author_name,first_publish_year,cover_i`);
  if (!r.ok) throw new Error("Hledání selhalo");
  return fromOpenLibrary((await r.json()).docs ?? []);
}
