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

// Finds IMDb's own watchlist control. Prefers an element whose aria-label or text mentions
// "watchlist" and is not our button. Returns the element to insert before, or null.
function findImdbWatchlistControl() {
  const candidates = document.querySelectorAll("button, a, [role='button']");
  for (const el of candidates) {
    if (el.id === BUTTON_ID || el.closest(`#${BUTTON_ID}`)) continue;
    const label = `${el.getAttribute("aria-label") ?? ""} ${el.textContent ?? ""}`.trim();
    if (/watchlist/i.test(label) && label.length < 80) {
      // Walk up to the wrapper that sits directly in the button row, so we insert above the whole control.
      return el.closest("[data-testid]") ?? el;
    }
  }
  return null;
}

function styleButton(button, inline) {
  const base = {
    padding: "10px 16px",
    border: "none",
    borderRadius: "999px",
    background: "#e5a00d",
    color: "#1f1f1f",
    font: "600 14px system-ui, sans-serif",
    cursor: "pointer",
    marginBottom: "8px",
  };
  const floating = {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    zIndex: "2147483647",
    boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
  };
  Object.assign(button.style, base, inline ? { display: "block" } : floating);
}

function createButton(inline) {
  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.type = "button";
  button.textContent = "+ Plex watchlist";
  styleButton(button, inline);

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

  if (!isTitlePage()) {
    existing?.remove();
    return;
  }

  const anchor = findImdbWatchlistControl();

  // Already placed in the right spot: nothing to do.
  if (existing) {
    const isInline = existing.dataset.placement === "inline";
    if (anchor && isInline && existing.nextElementSibling === anchor) return;
    if (!anchor && !isInline) return;
    existing.remove();
  }

  if (anchor?.parentElement) {
    const button = createButton(true);
    button.dataset.placement = "inline";
    anchor.parentElement.insertBefore(button, anchor);
  } else {
    const button = createButton(false);
    button.dataset.placement = "floating";
    document.body.appendChild(button);
  }
}

// IMDb is a single-page app and re-renders its buttons, so keep checking.
ensureButton();
setInterval(ensureButton, 1000);
