// Pomocné funkce pro odkazy (bez závislostí, testované).

/** První odkaz v textu („Koukni https://…“) – nebo null. */
export function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s<>"]+/i);
  if (m) return m[0].replace(/[),.;!?]+$/, "");
  const t = text.trim();
  // „www.neco.cz“ nebo „neco.cz/cesta“ bez protokolu
  if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(t)) return `https://${t}`;
  return null;
}

/** „youtube.com“ z „https://www.youtube.com/watch?v=…“ */
export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\.|^m\./, "");
  } catch {
    return url;
  }
}

/** Id videa z YouTube (watch, youtu.be, shorts, embed). */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host === "youtube.com" || host === "music.youtube.com") {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(shorts|embed|live)\/([\w-]{6,})/);
      return m ? m[2] : null;
    }
  } catch {
    // neplatná adresa
  }
  return null;
}

/** Weby, které umí oEmbed přes noembed.com (bez klíče). */
export const OEMBED_HOSTS = ["youtube.com", "youtu.be", "vimeo.com", "tiktok.com", "x.com", "twitter.com", "soundcloud.com", "spotify.com", "open.spotify.com", "flickr.com"];
