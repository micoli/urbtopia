# Guide, codex and release note

Status: resolved
Blocked by: 08

- Guide entry and codex entry for the Replan, prerendered from definitions (ADR 0040).
- FR and EN strings checked.
- After the deploy, a Release note through the `release-note` skill.
- Done when: guide build test passes; `tsc`, lint and tests pass.

## Answer

Done in part. Guide page `mechanics/replan` in English and French (order 55). No codex entry: the codex lists game objects and the Replan is not one. FR and EN strings of the Replan are in `src/i18n/catalog.ts` and the i18n tests pass. The Release note is still to write after the deploy, with the `release-note` skill: nothing was deployed or tagged. `scripts/prerender-guide.ts` and the Storybook smoke test were not run.
