import { describe, expect, it } from "vitest";
import { alreadyHave, computeMediaStats, newMedia, withStatus } from "./data";
import { fromItunes, fromOpenLibrary, fromTvmaze } from "./search";

describe("filmy a knihy – hledání", () => {
  it("převede odpovědi služeb", () => {
    expect(fromItunes([{ trackId: 1, trackName: "Pelíšky", artistName: "Jan Hřebejk", releaseDate: "1999-04-01T07:00:00Z", artworkUrl100: "https://is1.mzstatic.com/a/100x100bb.jpg", trackViewUrl: "https://itunes.apple.com/x" }]))
      .toEqual([{ kind: "film", title: "Pelíšky", year: 1999, creator: "Jan Hřebejk", image_url: "https://is1.mzstatic.com/a/600x900bb.jpg", external_url: "https://itunes.apple.com/x", source: "itunes", source_id: "1" }]);
    expect(fromTvmaze([{ show: { id: 526, name: "The Office", premiered: "2005-03-24", image: { medium: "m.jpg" }, url: "u", network: { name: "NBC" } } }])[0])
      .toMatchObject({ kind: "serial", title: "The Office", year: 2005, creator: "NBC", image_url: "m.jpg" });
    expect(fromOpenLibrary([{ key: "/works/OL1W", title: "Saturnin", author_name: ["Zdeněk Jirotka"], first_publish_year: 1942, cover_i: 42 }])[0])
      .toMatchObject({ kind: "kniha", year: 1942, creator: "Zdeněk Jirotka", image_url: "https://covers.openlibrary.org/b/id/42-M.jpg", external_url: "https://openlibrary.org/works/OL1W" });
    expect(fromOpenLibrary([{ title: "bez klíče" }])).toEqual([]);
  });
});

describe("filmy a knihy – stav a statistiky", () => {
  const now = new Date(2026, 9, 2);
  it("hotovo doplní datum, jiný stav ho smaže", () => {
    const m = newMedia({ kind: "kniha", title: "Saturnin" });
    const done = withStatus(m, "hotovo", now);
    expect(done.finished_at).toBe("2026-10-02");
    expect(withStatus(done, "chci").finished_at).toBeNull();
  });

  it("statistiky a duplicity", () => {
    const list = [
      newMedia({ kind: "kniha", title: "A", status: "hotovo", finished_at: "2026-03-01", rating: 4 }),
      newMedia({ kind: "kniha", title: "B", status: "hotovo", finished_at: "2025-12-01", rating: 2 }),
      newMedia({ kind: "film", title: "C", status: "hotovo", finished_at: "2026-09-01" }),
      newMedia({ kind: "film", title: "D" }),
      newMedia({ kind: "serial", title: "E", status: "ted" }),
    ];
    const s = computeMediaStats(list, now);
    expect(s).toMatchObject({ wanted: 1, inProgress: 1, booksThisYear: 1, averageRating: 3 });
    expect(s.doneThisYear).toEqual({ film: 1, serial: 0, kniha: 1 });
    expect(alreadyHave(list, { kind: "film", title: "d", source: "rucne", source_id: null })).toBe(true);
    expect(alreadyHave(list, { kind: "kniha", title: "D", source: "rucne", source_id: null })).toBe(false);
  });
});
