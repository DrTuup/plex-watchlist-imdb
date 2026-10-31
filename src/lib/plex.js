// Plex discover API helpers. These endpoints are undocumented and may change.

const DISCOVER = "https://discover.provider.plex.tv";
const CLIENT_ID = "plex-watchlist-imdb-firefox";

function headers(token) {
  return {
    "X-Plex-Token": token,
    "X-Plex-Client-Identifier": CLIENT_ID,
    Accept: "application/json",
  };
}

export async function searchPlex(token, query) {
  const url = new URL("/library/search", DISCOVER);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", "30");
  url.searchParams.set("searchTypes", "movies,tv");
  url.searchParams.set("searchProviders", "discover,plexAvailable");
  url.searchParams.set("includeMetadata", "1");

  const res = await fetch(url, { headers: headers(token) });
  if (res.status === 401 || res.status === 403) throw new Error("Plex token rejected. Update it in options.");
  if (!res.ok) throw new Error(`Plex search failed (${res.status})`);
  return res.json();
}

/** Walks any JSON shape and collects objects that look like movie/show metadata. */
export function extractCandidates(node, out = []) {
  if (Array.isArray(node)) {
    for (const item of node) extractCandidates(item, out);
  } else if (node && typeof node === "object") {
    if (node.ratingKey && (node.type === "movie" || node.type === "show") && node.title) {
      out.push(node);
    }
    for (const value of Object.values(node)) extractCandidates(value, out);
  }
  return out;
}

const normalize = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Picks the best Plex candidate for an IMDb title. Type and normalized title must match.
 * Exact year wins, then year +/- 1, then any year.
 */
export function pickMatch(candidates, { title, year, type }) {
  const wanted = normalize(title);
  const sameTitle = candidates.filter(
    (c) => c.type === type && normalize(c.title) === wanted
  );
  if (sameTitle.length === 0) return null;
  if (year) {
    const exact = sameTitle.find((c) => Number(c.year) === year);
    if (exact) return exact;
    const near = sameTitle.find((c) => Math.abs(Number(c.year) - year) <= 1);
    if (near) return near;
  }
  return sameTitle[0];
}

export async function addToWatchlist(token, ratingKey) {
  const url = new URL("/actions/addToWatchlist", DISCOVER);
  url.searchParams.set("ratingKey", String(ratingKey));
  const res = await fetch(url, { method: "PUT", headers: headers(token) });
  if (res.status === 401 || res.status === 403) throw new Error("Plex token rejected. Update it in options.");
  if (!res.ok) throw new Error(`Add to watchlist failed (${res.status})`);
}

/** Full flow: search by title, pick the match, add it. Returns the matched Plex item. */
export async function addTitleToWatchlist(token, info) {
  const json = await searchPlex(token, info.title);
  const match = pickMatch(extractCandidates(json), info);
  if (!match) throw new Error(`No Plex match for "${info.title}"${info.year ? ` (${info.year})` : ""}`);
  await addToWatchlist(token, match.ratingKey);
  return match;
}
