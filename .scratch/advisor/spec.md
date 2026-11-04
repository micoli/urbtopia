# Advisor

Status: needs-triage

## Problem

The Diagnosis gives at most three Causes in plain rules, but a player cannot ask "why?" or "what first?". A small language model running in the browser can explain the city's figures in plain words, without a game server.

Decisions are in [ADR 0056](../../docs/adr/0056-advisor-is-an-optional-local-llm-that-only-writes-text.md); the term **Advisor** is in `CONTEXT.md`.

## Decisions

- The Advisor only writes text: no Command, no vote, no change to the simulation. The core never imports WebLLM (`coreIsolation.test.ts`).
- It rephrases the Causes of the Diagnosis and explains Codex rules. It never invents a Cause. The Diagnosis stays computed by plain rules.
- Optional: off by default, hidden when WebGPU is missing, nothing downloaded without an explicit confirmation showing the model size. The game is identical without it.
- English and French only, in the language of `prefsStore`. Figures and item names come from the i18n catalogs, not from the model.
- One fixed compact model (about 1 to 3 billion parameters, 4-bit), picked after a manual test on real game questions (issue 05).
- Guided first: buttons tied to the Diagnosis, an "Explain" button on each displayed Cause; a free field second, limited to game topics.
- Context sent to the model: a compact summary built by a pure function from city figures (Citizens, Approval, Needs, top three Causes, Service coverage, Home Tiers), about 1,000 tokens. No text typed by the Player (city name, Handle).
- Output is ephemeral: never saved, exported, synced or shown to other Players.
- Engine behind an `AdvisorEngine` interface in `src/advisor/`, loaded by dynamic import in a Web Worker. Tests and E2E use a fake engine; the real model never loads in CI.
- Model cached by WebLLM in the browser cache (not precached by the PWA). Deletable from the settings. Works offline once downloaded.
- No fallback: if WebGPU or GPU memory fails, show the error and switch the option off. No CPU/WASM engine, no remote service.
- UI: a dedicated `Dialog` opened from the Town hall, plus "Explain" on each Cause. One React component per file; tokens and `Icon` per ADR 0051.

## Out of scope

Flavour text for Petitions, Supports or a city journal; names for cities or Challenges; any action taken by the model; a choice of models; a CPU fallback; a remote model; saving conversations.

## Issues

1. [Engine interface and fake engine](issues/01-engine-interface-and-fake.md)
2. [City summary for the Advisor](issues/02-city-summary.md)
3. [Prompts and guided questions](issues/03-prompts-and-guided-questions.md) (after 01, 02)
4. [Settings: opt-in, download, delete](issues/04-settings-opt-in-download-delete.md) (after 01)
5. [WebLLM engine in a Worker](issues/05-webllm-engine-worker.md) (after 01, 04)
6. [Advisor dialog and Explain button](issues/06-advisor-dialog-and-explain.md) (after 03, 04)
7. [E2E, Guide article and docs](issues/07-e2e-guide-docs.md) (after 05, 06)
