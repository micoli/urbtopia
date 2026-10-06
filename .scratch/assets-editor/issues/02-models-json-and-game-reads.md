# models.json and game reads

Status: ready-for-agent
Spec: [assets-editor](../spec.md)
Blocked by: 01

Create `assets/models.json` and its shared TS type, migrate `docs/asset-catalog.json` and the hard-coded fit limits, make the game read it with computed-default fallback, add the vitest consistency check, delete `asset-catalog.json`, update `asset-catalog.md`, `CONTEXT.md` and `CreditsDialog`.
