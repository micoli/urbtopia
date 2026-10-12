# Sanction balance table

Status: ready-for-agent

Singleton Balance file (ADR 0023) holding, per Difficulty: the sanctionable factors, the Tax floor (0.5) and a reserved severity entry for the future Citizen loss (inert for now). Validated by a generated JSON schema like the other Balance files. Exposed from `src/core`.

Acceptance: Cozy sanctions nothing; Easy, Medium, Hard match the spec; the schema rejects an unknown factor or Difficulty; a test asserts each factor is a known `NeedFactorId`.

Spec: `../spec.md`
