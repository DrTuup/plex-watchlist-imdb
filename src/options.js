const $ = (id) => document.getElementById(id);
const setStatus = (text) => ($("status").textContent = text);

async function load() {
  const { plexToken } = await browser.storage.local.get("plexToken");
  if (plexToken) {
    $("token").value = plexToken;
    setStatus("A token is saved.");
  }
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = $("token").value.trim();
  await browser.storage.local.set({ plexToken: token });
  setStatus("Saved.");
});

$("clear").addEventListener("click", async () => {
  await browser.storage.local.remove("plexToken");
  $("token").value = "";
  setStatus("Token cleared.");
});

load();
