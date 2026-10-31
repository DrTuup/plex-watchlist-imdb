import { createPin, buildAuthUrl, pollForToken } from "./lib/auth.js";

const $ = (id) => document.getElementById(id);
const setStatus = (text, isError = false) => {
  $("status").textContent = text;
  $("status").className = isError ? "error" : "";
};

async function render() {
  const { plexToken } = await browser.storage.local.get("plexToken");
  $("account").textContent = plexToken ? "Signed in to Plex." : "Not signed in.";
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
    setStatus("Signed in.");
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
