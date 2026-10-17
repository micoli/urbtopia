# Solidarity in the Needs pyramid and Codex

Status: resolved

Depends on: 01

## Acceptance criteria

- Explain Solidarity under Belonging as an optional Well-being bonus.
- Never lower existing Need satisfaction or add Sanctions when no donation is made.
- Create the dedicated in-game Solidarity Codex page with all content required by the spec and a worked example.
- Provide French and English text and access from the donation feature.

## Comments

Implemented the optional Solidarity factor under Belonging, excluded from the required-factor average and bottleneck. Created `src/ui/codex/SolidarityPage.tsx`, with English and French rules, numerical examples, and links from the Market and Needs pyramid. Browser checks verify the dedicated page on desktop and mobile.
