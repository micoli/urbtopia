# Sanctions

Status: ready-for-agent

A city that neglects the basic Needs of its Citizens now earns less Tax, by an amount that depends on the city's **Difficulty**. Vocabulary: see `CONTEXT.md` (**Difficulty**, **Sanction**, **Need level**, **Needs pyramid**). Decision record: `docs/adr/0029-sanctions-per-home-by-difficulty.md`.

## Rules

- Difficulty is a per-city setting stored in the save: Cozy (default, no Sanction), Easy, Medium, Hard. An absent field means Cozy. It can be changed at any time.
- Sanctionable factors per Difficulty:
  - Cozy: none.
  - Easy: `safety`, `health` (service coverage), `electricity`, `water`.
  - Medium: Easy + `pollution`, `congestion`.
  - Hard: Medium + `climate`, which sanctions only Homes with no Green space in reach.
- A Home's Sanction comes from its weakest sanctionable factor, per Home. It is continuous in the lack of satisfaction (0-100) and floored so the Tax never drops below 50 %. No Citizens are removed.
- The Well-being bonus on the Tax stays (at least 1, at most +20 %); Well-being malus no longer lowers the Tax.
- Under Cozy, a power shortage keeps its existing effect on the Tax (scaled by the power received, down to 0). From Easy, electricity is covered by the Sanction instead.
- `food` stays without effect. The higher Need levels (Belonging, Esteem, Fulfilment) never sanction.
- Easy and above: an alert icon on sanctioned Homes and a badge on the city management button. Cozy: none.
- The Tutorial is unchanged and plays in Cozy.

## One source for the numbers

Every value that depends on the Difficulty (sanctionable factors, floor, and the future severity for Citizen loss) lives in one Balance file, read by the core computation AND by the codex page. Nothing about a Difficulty is hard-coded in the UI.

## Codex page

A "Sanctions" rules page in the codex, in the style of `StorageRulesPage`, fully derived from the Balance file and the live game state:

- the current Difficulty highlighted, and the rule that applies to it;
- a table of Need factors by Difficulty, marking which sanction at each (a new Difficulty or factor appears automatically);
- every constant that depends on the Difficulty (floor, thresholds, future severity), shown per Difficulty, not as one prose number;
- for the player's current city: which Homes are sanctioned, the weakest factor, and the Tax lost;
- French and English text.

## Out of scope

Citizen loss and Home occupation (later, through the same Balance table), a Sanction delay, a `food` model, a Tutorial step.

## Issues

See `issues/`.
