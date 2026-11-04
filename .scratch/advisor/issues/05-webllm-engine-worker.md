# WebLLM engine in a Worker

Status: needs-triage
Spec: ../spec.md
Blocked by: 01, 04

## What to build

The real `AdvisorEngine`, running WebLLM in a Web Worker loaded by dynamic import, and the choice of the model.

## Acceptance criteria

- [ ] `@mlc-ai/web-llm` added; the main bundle does not grow (check the build size before and after). Players with the option off download nothing.
- [ ] Engine in a Web Worker; the three.js render loop is not blocked while the model answers.
- [ ] Maps WebLLM failures to the typed errors of issue 01; WebGPU absence is detected without loading the library.
- [ ] Model choice documented in the issue: try two or three candidates (1 to 3B, 4-bit) on a fixed list of real game questions in `en` and `fr`, by hand, in a browser with WebGPU; record size, speed and answer quality, then fix one. Human in the loop for the quality judgment.
- [ ] Cache handled by WebLLM only (not by the service worker); `deleteModel()` clears it.
- [ ] Works offline once downloaded (checked by hand).
