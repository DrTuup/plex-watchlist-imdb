# Plex Watchlist for IMDb

Firefox extension: on an IMDb movie or series page, click the toolbar button to add that title to your Plex watchlist.

## Setup

```sh
bun install        # no runtime dependencies
bun test           # run unit tests
bun run run:firefox  # launch Firefox with the extension loaded (temporary)
```

Manual install: `about:debugging` → This Firefox → Load Temporary Add-on → select `manifest.json`.

Then open the extension's Settings and paste your Plex token. To find it in Plex Web, open any item, choose "Get Info" → "View XML", and copy `X-Plex-Token` from the URL.

## How it works

- `src/popup.js` reads the IMDb page (JSON-LD, falling back to the document title) via `scripting.executeScript`.
- `src/lib/imdb.js` turns that into `{ title, year, type }`.
- `src/lib/plex.js` searches `discover.provider.plex.tv`, picks the matching item, and calls `PUT /actions/addToWatchlist?ratingKey=…`.

The Plex endpoints are undocumented and may change. If adding starts failing, check the request shapes in `src/lib/plex.js` first.

## License

MIT. See [LICENSE](LICENSE).

## Packaging

`bun run package` builds a zip in `dist/`.
