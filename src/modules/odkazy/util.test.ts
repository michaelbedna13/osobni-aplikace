import { describe, expect, it } from "vitest";
import { domainOf, extractUrl, youtubeId } from "./util";

describe("odkazy – pomocné funkce", () => {
  it("vytáhne odkaz ze sdíleného textu", () => {
    expect(extractUrl("Koukni na tohle https://www.instagram.com/reel/abc123/?igsh=xyz.")).toBe("https://www.instagram.com/reel/abc123/?igsh=xyz");
    expect(extractUrl("www.idnes.cz")).toBe("https://www.idnes.cz");
    expect(extractUrl("seznam.cz/zpravy")).toBe("https://seznam.cz/zpravy");
    expect(extractUrl("jen text bez odkazu")).toBeNull();
  });

  it("doména a YouTube", () => {
    expect(domainOf("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("youtube.com");
    expect(domainOf("https://m.facebook.com/x")).toBe("facebook.com");
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtube.com/shorts/abcdefGHIJ1")).toBe("abcdefGHIJ1");
    expect(youtubeId("https://vimeo.com/123")).toBeNull();
  });
});
