# Difficulty in the save

Status: resolved

Add `difficulty: 'cozy' | 'easy' | 'medium' | 'hard'` to the game state, saved per city. An absent field loads as Cozy, with no save migration beyond that (ADR 0003). Included in the offline replay (ADR 0002). Cloud save and conflict comparison must carry it.

Acceptance: an old save loads as Cozy and plays identically; changing Difficulty persists; replay is deterministic across Difficulties; tests for load, save and replay.

Spec: `../spec.md`
