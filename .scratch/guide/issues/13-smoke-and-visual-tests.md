# 13: Smoke and visual tests

**What to build:** A Playwright smoke test that visits every prerendered route without console error, and visual baselines for 3 pages in light and dark.

**Blocked by:** 06, 07, 08

**Status:** done

## Comments

- `playwright.guide.config.ts` + `scripts/guide.e2e.ts`, scripts `test:guide` and `test:guide:update`; needs a prior `npm run build`.
- Smoke: every `dist/docs/**/index.html` (the redirecting root aside), in 8 parallel batches, about 1.5 minutes locally.
- macOS baselines committed; Linux ones are not generated and the test is not wired into CI yet.
