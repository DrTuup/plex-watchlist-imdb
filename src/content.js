// Injects an "Add to Plex" button into IMDb title pages.
// Runs as a classic content script, so it must not use ES module imports.

const BUTTON_ID = "plex-watchlist-button";

function isTitlePage() {
  return /^\/title\/tt\d+/.test(location.pathname);
}

function collectPage() {
  return {
    url: location.href,
    docTitle: document.title,
    ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
  };
}

function createButton() {
  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.type = "button";
  button.textContent = "+ Plex watchlist";
  Object.assign(button.style, {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    zIndex: "2147483647",
    padding: "10px 16px",
    border: "none",
    borderRadius: "999px",
    background: "#e5a00d",
    color: "#1f1f1f",
    font: "600 14px system-ui, sans-serif",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
  });

  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "Adding…";
    try {
      const result = await browser.runtime.sendMessage({ type: "addFromPage", page: collectPage() });
      if (result?.ok) {
        button.textContent = "✓ Added to Plex";
      } else {
        button.textContent = "⚠ " + (result?.error ?? "Failed");
        button.title = result?.error ?? "";
      }
    } catch (err) {
      button.textContent = "⚠ " + err.message;
    }
    button.disabled = false;
  });

  return button;
}

function ensureButton() {
  const existing = document.getElementById(BUTTON_ID);
  if (isTitlePage()) {
    if (!existing) document.body.appendChild(createButton());
  } else if (existing) {
    existing.remove();
  }
}

// IMDb is a single-page app, so check for the button after navigation too.
ensureButton();
setInterval(ensureButton, 1000);
