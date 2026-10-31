import { parseImdbInfo } from "./lib/imdb.js";
import { addTitleToWatchlist } from "./lib/plex.js";

// Content scripts send raw IMDb page data here. The background script does the Plex
// requests, since it isn't subject to the page's cross-origin restrictions.
browser.runtime.onMessage.addListener(async (message) => {
  if (message?.type !== "addFromPage") return undefined;

  try {
    const { plexToken } = await browser.storage.local.get("plexToken");
    if (!plexToken) {
      return { ok: false, error: "No Plex token set. Open the extension's Settings." };
    }
    const info = parseImdbInfo(message.page);
    if (!info) {
      return { ok: false, error: "Couldn't read the title from this page." };
    }
    const match = await addTitleToWatchlist(plexToken, info);
    return { ok: true, title: match.title };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
