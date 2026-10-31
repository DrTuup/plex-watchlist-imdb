import { describe, expect, test } from "bun:test";
import { buildAuthUrl, checkPin, pollForToken } from "../src/lib/auth.js";

const jsonRes = (body, status = 200) => new Response(JSON.stringify(body), { status });

describe("buildAuthUrl", () => {
  test("puts the code and client id in the fragment", () => {
    const url = buildAuthUrl("ABCD");
    expect(url.startsWith("https://app.plex.tv/auth#?")).toBe(true);
    expect(url).toContain("code=ABCD");
    expect(url).toContain("clientID=plex-watchlist-imdb-firefox");
  });
});

describe("checkPin", () => {
  test("returns null while pending and the token once approved", async () => {
    expect(await checkPin(1, async () => jsonRes({ authToken: null }))).toBeNull();
    expect(await checkPin(1, async () => jsonRes({ authToken: "tok" }))).toBe("tok");
  });
});

describe("pollForToken", () => {
  test("keeps polling until a token arrives", async () => {
    const responses = [{ authToken: null }, { authToken: null }, { authToken: "done" }];
    const fetchImpl = async () => jsonRes(responses.shift());
    const token = await pollForToken(7, { intervalMs: 0, fetchImpl, sleep: async () => {} });
    expect(token).toBe("done");
  });

  test("times out when never approved", async () => {
    const fetchImpl = async () => jsonRes({ authToken: null });
    await expect(pollForToken(7, { timeoutMs: 0, intervalMs: 0, fetchImpl, sleep: async () => {} })).rejects.toThrow("timed out");
  });
});
