# Guide And End-to-end Test

Status: resolved
Spec: ../spec.md
Blocked by: 08

## What to build

Guide article for the Analytics view (EN and FR) and a Playwright test (`/?bypass-tutorial`) that enters each Layer and leaves with Escape.

## Acceptance criteria

- [x] Guide EN/FR entry; Land value described as display only.
- [x] Playwright test green (`scripts/analytics.e2e.ts`, in the gameplay config); no visual baseline needed.
- [ ] Codex rule page: not done here. A Codex page also needs a generated image per page (`scripts/codexImages.test.ts`) and a dialog entry, so it is left as a follow-up.
