import { describe, expect, test } from "bun:test";
import { parseImdbInfo } from "../src/lib/imdb.js";

describe("parseImdbInfo", () => {
  test("reads a movie from JSON-LD", () => {
    const ld = JSON.stringify({ "@type": "Movie", name: "Inception", datePublished: "2010-07-16" });
    expect(parseImdbInfo({ url: "https://www.imdb.com/title/tt1375666/", docTitle: "", ld: [ld] })).toEqual({
      title: "Inception",
      year: 2010,
      type: "movie",
      imdbId: "tt1375666",
    });
  });

  test("reads a series from JSON-LD inside @graph", () => {
    const ld = JSON.stringify({ "@graph": [{ "@type": "TVSeries", name: "Severance", datePublished: "2022-02-18" }] });
    const info = parseImdbInfo({ url: "https://www.imdb.com/title/tt11280740/", docTitle: "", ld: [ld] });
    expect(info).toMatchObject({ title: "Severance", year: 2022, type: "show" });
  });

  test("falls back to document title for movies", () => {
    const info = parseImdbInfo({ url: "https://www.imdb.com/title/tt0133093/", docTitle: "The Matrix (1999) - IMDb", ld: [] });
    expect(info).toMatchObject({ title: "The Matrix", year: 1999, type: "movie" });
  });

  test("falls back to document title for series with year range", () => {
    const info = parseImdbInfo({
      url: "https://www.imdb.com/title/tt0903747/",
      docTitle: "Breaking Bad (TV Series 2008–2013) - IMDb",
      ld: ["not json"],
    });
    expect(info).toMatchObject({ title: "Breaking Bad", year: 2008, type: "show" });
  });

  test("returns null when nothing can be read", () => {
    expect(parseImdbInfo({ url: "https://www.imdb.com/", docTitle: "IMDb", ld: [] })).toBeNull();
  });
});
