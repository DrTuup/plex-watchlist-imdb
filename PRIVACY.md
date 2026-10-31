# Privacy Policy: Plex Watchlist for IMDb

Last updated: 31-10-2026

Plex Watchlist for IMDb ("the extension") adds IMDb movies and series to your Plex watchlist. This policy explains what data the extension handles and where it goes.

## Summary

- The extension has no server of its own. It does not collect, store, or sell your data.
- It has no analytics, tracking, or advertising.
- Your Plex sign-in token stays in Firefox on your device. It is only sent to Plex.

## Data the extension handles

**1. Plex sign-in token.** When you click "Sign in with Plex", the extension creates a sign-in request with Plex and receives an auth token once you approve it on Plex's own sign-in page. The extension never sees your Plex password. The token is stored in Firefox's local extension storage (`browser.storage.local`). It is not synced to other devices and is removed when you click "Sign out" or uninstall the extension.

**2. IMDb page information.** When you click the add button on an IMDb title page, the extension reads the title's name, release year, and whether it is a movie or series. It reads this from the page the browser has already loaded. The extension does not read or send your IMDb account, ratings, or browsing history.

## Where data is sent

The extension talks only to these Plex services, and only when you use it:

- `plex.tv` and `app.plex.tv`: to sign you in.
- `discover.provider.plex.tv`: to search for the title and add it to your watchlist.

Requests to these services are governed by Plex's own privacy policy: <https://www.plex.tv/about/privacy-legal/>

No other servers receive data from the extension.

## Data retention

The only data kept is the Plex token in local storage. Removing it (Sign out) or uninstalling the extension deletes it.

## Children

The extension is not directed at children under 13 and does not knowingly collect data from them.

## Changes

If this policy changes, the new version will be published in this file and the "Last updated" date will change.

## Contact

Questions about this policy: open an issue at <https://github.com/drtuup/plex-watchlist-imdb/issues>
