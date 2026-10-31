// Pure parsing helpers for IMDb title pages. No DOM access here, so these are easy to test.

const SERIES_TYPES = new Set(["TVSeries", "TVMiniSeries"]);
const MOVIE_TYPES = new Set(["Movie"]);

/**
 * @param {{ url: string, docTitle: string, ld: string[] }} raw
 *   url: page URL, docTitle: document.title, ld: textContent of each application/ld+json script
 * @returns {{ title: string, year: number|null, type: "movie"|"show", imdbId: string|null } | null}
 */
export function parseImdbInfo(raw) {
  const imdbId = raw.url?.match(/\/title\/(tt\d+)/)?.[1] ?? null;
  let title = null;
  let year = null;
  let type = null;

  for (const text of raw.ld ?? []) {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      continue;
    }
    const nodes = Array.isArray(data) ? data : [data, ...(data?.["@graph"] ?? [])];
    for (const node of nodes) {
      const nodeType = Array.isArray(node?.["@type"]) ? node["@type"][0] : node?.["@type"];
      if (MOVIE_TYPES.has(nodeType) || SERIES_TYPES.has(nodeType)) {
        title = node.name ?? title;
        const y = parseInt(String(node.datePublished ?? ""), 10);
        year = Number.isNaN(y) ? year : y;
        type = MOVIE_TYPES.has(nodeType) ? "movie" : "show";
        break;
      }
    }
    if (title) break;
  }

  // Fallback: "Inception (2010) - IMDb" or "Breaking Bad (TV Series 2008–2013) - IMDb"
  if (!title && raw.docTitle) {
    const m = raw.docTitle.match(/^(.*?)\s*\(([^)]*?)\)\s*-\s*IMDb/);
    if (m) {
      title = m[1].trim();
      const y = m[2].match(/(\d{4})/);
      year = y ? parseInt(y[1], 10) : null;
      type = /TV/i.test(m[2]) ? "show" : "movie";
    }
  }

  if (!title) return null;
  return { title, year, type: type ?? "movie", imdbId };
}
