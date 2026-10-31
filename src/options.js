import { createPin, buildAuthUrl, pollForToken } from "./lib/auth.js";

const $ = (id) => document.getElementById(id);
const setStatus = (text, isError = false) => {
  $("status").textContent = text;
  $("status").className = isError ? "status error" : "status";
};

async function render() {
  const { plexToken } = await browser.storage.local.get("plexToken");
  $("badge").textContent = plexToken ? "Connected" : "Not connected";
  $("badge").style.background = plexToken ? "#d7f5df" : "";
  $("badge").style.color = plexToken ? "#0a6b2b" : "";
  $("account").textContent = plexToken
    ? "Your watchlist is ready. Visit an IMDb title and use the Plex button."
    : "Sign in once. You won't need to do this again unless you sign out.";
  $("signin").hidden = !!plexToken;
  $("signout").hidden = !plexToken;
}

$("signin").addEventListener("click", async () => {
  $("signin").disabled = true;
  setStatus("Waiting for you to approve on Plex…");
  try {
    const { id, code } = await createPin();
    await browser.tabs.create({ url: buildAuthUrl(code) });
    const token = await pollForToken(id);
    await browser.storage.local.set({ plexToken: token });
    setStatus("Connected to Plex.");
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    $("signin").disabled = false;
    render();
  }
});

$("signout").addEventListener("click", async () => {
  await browser.storage.local.remove("plexToken");
  setStatus("Signed out.");
  render();
});

render();
