# Prompts and guided questions

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 01, 02

## What to build

The system prompt and the guided questions, in English and French, and the function that assembles a request for the engine.

## Acceptance criteria

- [ ] System prompt in the i18n catalog (`en`, `fr`): the model is the city's Advisor, answers in the Player's language, only explains figures it is given, never invents a Cause, never claims to act, stays on game topics.
- [ ] Guided questions as data: each is tied to a Diagnosis kind (Congestion, Waste) or to a generic question ("What should I do first?"), with a label key.
- [ ] `buildAdvisorRequest(question, summary, language)` returns the messages for `AdvisorEngine.ask`; free questions are passed as a user message after the summary, never inside the system prompt.
- [ ] Tests with the fake engine: the right language and the summary appear in the request; a free question cannot alter the system prompt.
