import { parseImdbInfo } from "./lib/imdb.js";
import { addTitleToWatchlist } from "./lib/plex.js";

const $ = (id) => document.getElementById(id);
const setStatus = (text, isError = false) => {
  $("status").textContent = text;
  $("status").className = isError ? "error" : "";
};

// Runs inside the IMDb page. Must be self-contained: it is serialized and injected.
function collectImdbData() {
  return {
    url: location.href,
    docTitle: document.title,
    ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
  };
}

let info = null;

async function init() {
  $("openOptions").addEventListener("click", (e) => {
    e.preventDefault();
    browser.runtime.openOptionsPage();
  });

  const { plexToken } = await browser.storage.local.get("plexToken");
  if (!plexToken) {
    setStatus("No Plex token set yet. Open Settings to add it.", true);
    return;
  }

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url?.startsWith("https://www.imdb.com/title/")) {
    setStatus("Open an IMDb movie or series page first.", true);
    return;
  }

  const [injection] = await browser.scripting.executeScript({
    target: { tabId: tab.id },
    func: collectImdbData,
  });
  info = parseImdbInfo(injection.result);
  if (!info) {
    setStatus("Couldn't read the title from this page.", true);
    return;
  }

  $("title").textContent = info.title;
  $("meta").textContent = [info.year, info.type === "show" ? "Series" : "Movie"].filter(Boolean).join(" · ");
  $("add").hidden = false;
  $("add").addEventListener("click", () => add(plexToken));
}

async function add(token) {
  const button = $("add");
  button.disabled = true;
  setStatus("Adding…");
  try {
    const match = await addTitleToWatchlist(token, info);
    setStatus(`Added "${match.title}" to your watchlist.`);
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    button.disabled = false;
  }
}

init();
