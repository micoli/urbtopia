# Guide article

Status: done - implemented
Spec: ../spec.md
Blocked by: 05, 06, 07, 08

## What to build

A Guide and Codex page that lists the categories and Achievements from the game definitions, never from a player's City.

## Acceptance criteria

- [ ] FR and EN pages generated from the data.
- [ ] Each Achievement links to the Codex page of its feature, and each of those pages links back.

## Notes

The Mechanics article `achievements` (EN and FR) embeds `AchievementCatalogue`, generated from the definitions. An Achievement whose counter names buildings links to their Codex entries, and those Codex entries (in the game and in the Guide) show the Achievements about them. The Achievements about a feature with no Codex entry (a Signal, a Command) link nowhere.
