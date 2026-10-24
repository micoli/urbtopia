---
status: accepted
---

# Guide as a separate prerendered entry fed only by game definitions

The Guide (the public website at `/docs`) is a second Vite entry in the same build, not a route of the game. Each page is rendered to static HTML at build time and hydrated on the client. Running it inside the game would load Three.js and the game store for a page that reads text. A hash-routed single-page app would have neither readable deep links nor indexable pages. GitHub Pages has no fallback for unknown paths, so prerendering is also what makes `/docs/<lang>/...` URLs work there.

Its figures come from the game's definitions only, never from a player's save. A reader picks a Difficulty and a number of Citizens, kept in the query string, instead. The Guide therefore stays the same for every visitor and can be shared, and it never touches the game's storage. The game's service worker ignores everything under `docs/`, because its network-first navigation handler would otherwise cache a Guide page as the game's index.

The developer confirmed the complete specification in [.scratch/guide/spec.md](../../.scratch/guide/spec.md).
