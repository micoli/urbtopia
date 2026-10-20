# Balance table and Game object schemas

Status: needs-triage
Blocked by: 01
One Balance table holding every Difficulty-dependent value of the politics, read by the core and the Codex. Ordinance and Objective as Game objects, one file each, validated by generated JSON schemas (ADR 0021, ADR 0023). Launch catalogue: about seven Ordinances, five families of Objectives.

Acceptance: invalid data fails validation; nothing about a Difficulty is hard-coded in the UI; tests on the table and the catalogue.

Spec: `../spec.md`
