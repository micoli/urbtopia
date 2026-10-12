# Codex Sanctions page

Status: ready-for-agent
Blocked by: 02, 03

New rules page in the codex, in the style of `StorageRulesPage` (`src/ui/codex/`), wired like the other rules pages. Everything is read from the Balance file of issue 02 and the live game state; no Difficulty-dependent number or factor is written in the component or the messages.

- Current Difficulty highlighted, with the rule that applies to it.
- Table of Need factors by Difficulty (one column per Difficulty read from the Balance file); a factor or Difficulty added later shows up with no UI change.
- Every Difficulty-dependent constant (Tax floor, future severity) shown per Difficulty.
- For the current city: sanctioned Homes, weakest factor, Tax lost; under Cozy, a clear "no Sanction" statement.
- Link from the Needs pyramid factors that sanction.
- French and English messages with `{placeholders}` for values.

Acceptance: a test renders the page for each Difficulty and asserts the table and highlight follow the Balance file; a test changes a value in the Balance file and sees the page change.

Spec: `../spec.md`
