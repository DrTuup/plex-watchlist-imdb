import { describe, expect, test } from "bun:test";
import { extractCandidates, pickMatch } from "../src/lib/plex.js";

const movie = (over) => ({ ratingKey: "1", type: "movie", title: "Dune", year: 2021, ...over });

describe("extractCandidates", () => {
  test("finds movie and show metadata at any depth", () => {
    const json = {
      MediaContainer: {
        SearchResults: [{ SearchResult: [{ Metadata: movie({ ratingKey: "a" }) }, { Metadata: { ratingKey: "b", type: "show", title: "X" } }] }],
      },
    };
    expect(extractCandidates(json).map((c) => c.ratingKey)).toEqual(["a", "b"]);
  });

  test("ignores entries without a ratingKey or with other types", () => {
    expect(extractCandidates({ a: { type: "episode", title: "E", ratingKey: "z" }, b: { title: "no key" } })).toEqual([]);
  });
});

describe("pickMatch", () => {
  test("matches on normalized title and exact year", () => {
    const cands = [movie({ ratingKey: "old", year: 1984, title: "Dune" }), movie({ ratingKey: "new" })];
    expect(pickMatch(cands, { title: "DUNE!", year: 2021, type: "movie" })?.ratingKey).toBe("new");
  });

  test("accepts a year off by one", () => {
    expect(pickMatch([movie({ year: 2020 })], { title: "Dune", year: 2021, type: "movie" })).not.toBeNull();
  });

  test("never matches the wrong type", () => {
    expect(pickMatch([movie({ type: "show" })], { title: "Dune", year: 2021, type: "movie" })).toBeNull();
  });

  test("returns null when no title matches", () => {
    expect(pickMatch([movie({ title: "Arrival" })], { title: "Dune", year: 2021, type: "movie" })).toBeNull();
  });
});
