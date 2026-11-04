---
status: accepted
---

# The Advisor is an optional local LLM that only writes text

The Mayor can question an Advisor about the city. It runs a small language model (WebLLM, WebGPU) entirely in the player's browser, in a Web Worker loaded on demand. It rephrases the Causes of the Diagnosis and explains Codex rules in the Player's language (English or French). It never issues a Command, never votes and never changes the simulation. It is off by default, hidden when WebGPU is missing, and the game is identical without it.

## Why

- The Diagnosis stays computed by plain rules: the Causes are the source of truth, the model only gives them a voice. No existing decision is contradicted, only the glossary gains the Advisor as a separate term.
- The core stays pure and deterministic (ADR 0002): a non-deterministic model that only produces text cannot break replay, Catch-up or the Seed.
- Text is ephemeral and local: never saved, exported or shown to other Players, so there is no moderation to do and no change to saves or Cloud sync.
- A remote model was rejected: it breaks "no game server", costs money per player and sends city data out. Rules alone were rejected for questions the Diagnosis does not cover ("why", "what first").
- One fixed compact model (about 1 to 3 billion parameters, 4-bit), chosen after a manual test on real game questions. A choice of models would multiply support for little gain.
- No fallback engine (CPU/WASM) when WebGPU or memory fails: too slow to be useful. The failure is shown and the option is switched off.

## Consequences

- The Advisor ships behind the `advisor` feature flag: off in production, switched on from the devtools in a development build, like `clubs`. With the flag off nothing of it shows (setting, Town hall button, Explain buttons, Guide article), whatever the stored preference.
- The core never imports WebLLM (`coreIsolation.test.ts`). The engine sits behind an `AdvisorEngine` interface; tests and E2E use a fake engine, the real model is never loaded in CI.
- The context sent to the model is a compact summary built by a pure function from city figures (about 1,000 tokens). It holds no text typed by the Player (city name, Handle), against prompt injection and personal data.
- The model (0.7 to 2 GB) is downloaded only after an explicit confirmation showing its size, cached by WebLLM in the browser cache (not precached by the PWA), usable offline afterwards, and deletable from the settings.
- The last 10 questions (never the answers) are kept in this browser's localStorage so the Player can ask them again; they are not part of saves, exports or Cloud sync, and can be cleared.
- The interaction is guided first (buttons tied to the Diagnosis, an "Explain" button on each displayed Cause), with a free field second, limited to game topics.
