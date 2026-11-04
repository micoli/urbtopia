# City summary for the Advisor

Status: ready-for-agent
Spec: ../spec.md

## What to build

A pure function that turns the live game state into the compact context sent to the model.

## Acceptance criteria

- [ ] `buildAdvisorSummary(state, diagnoses): AdvisorSummary` in `src/advisor/`, no I/O, no clock, no randomness.
- [ ] Holds: Citizens, Approval, the five Needs levels, the top three Causes (key, params, weight) across the existing Diagnoses, Service coverage, the count of Homes by Tier. Nothing else.
- [ ] Never includes city name, Handle or any text typed by the Player; a test builds a state with hostile names and checks they are absent.
- [ ] A `summaryToText(summary, language)` renders it in `en` or `fr` using the i18n catalog for labels and numbers; capped at about 1,000 tokens (test with a worst-case city).
- [ ] Unit tests for an empty city, a healthy city (no Causes) and a city with three Causes.
