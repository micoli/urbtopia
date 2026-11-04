# Engine interface and fake engine

Status: ready-for-agent
Spec: ../spec.md

## What to build

The seam between the game and any language model. No WebLLM yet.

## Acceptance criteria

- [ ] `src/advisor/AdvisorEngine.ts` exports the interface: availability check (WebGPU present), `load(onProgress)`, `ask(messages)` returning a stream of text chunks, `unload()`, `deleteModel()`, and a typed error for "unsupported", "out of memory" and "network".
- [ ] `src/advisor/FakeAdvisorEngine.ts`: deterministic, scriptable answers and failures, used by tests and E2E.
- [ ] A module exposing the active engine (dynamic import of the real one is wired in issue 05; the fake is selectable by a test hook / `?e2e`).
- [ ] Unit tests on the fake: progress, streaming order, each error.
- [ ] `src/core` imports nothing from `src/advisor`; `coreIsolation.test.ts` still passes.
