// Plex PIN sign-in. Plex's own page handles the password and 2FA; we only get an auth token back.
// Endpoints are undocumented and may change.

const PLEX_TV = "https://plex.tv";
const APP_AUTH = "https://app.plex.tv/auth";
export const CLIENT_ID = "plex-watchlist-imdb-firefox";
export const PRODUCT = "Plex Watchlist for IMDb";

const headers = () => ({
  "X-Plex-Client-Identifier": CLIENT_ID,
  "X-Plex-Product": PRODUCT,
  "X-Plex-Version": "0.1.0",
  "X-Plex-Device": "Firefox",
  "X-Plex-Platform": "Firefox",
  Accept: "application/json",
});

export async function createPin(fetchImpl = fetch) {
  const res = await fetchImpl(`${PLEX_TV}/api/v2/pins?strong=true`, { method: "POST", headers: headers() });
  if (!res.ok) throw new Error(`Could not start Plex sign-in (${res.status})`);
  const { id, code } = await res.json();
  return { id, code };
}

/** URL the user opens to approve the PIN code on Plex's own sign-in page. */
export function buildAuthUrl(code) {
  const params = new URLSearchParams({ clientID: CLIENT_ID, code });
  params.set("context[device][product]", PRODUCT);
  return `${APP_AUTH}#?${params.toString()}`;
}

/** Returns the authToken once approved, or null if still pending. */
export async function checkPin(id, fetchImpl = fetch) {
  const res = await fetchImpl(`${PLEX_TV}/api/v2/pins/${id}`, { headers: headers() });
  if (!res.ok) throw new Error(`Plex sign-in check failed (${res.status})`);
  const data = await res.json();
  return data.authToken || null;
}

/**
 * Polls until the user approves the PIN, the timeout passes, or the signal aborts.
 * Returns the auth token, or throws on timeout.
 */
export async function pollForToken(id, { intervalMs = 1500, timeoutMs = 120000, fetchImpl = fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const token = await checkPin(id, fetchImpl);
    if (token) return token;
    await sleep(intervalMs);
  }
  throw new Error("Plex sign-in timed out. Try again.");
}
