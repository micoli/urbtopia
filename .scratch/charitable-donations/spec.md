# Charitable donations

Status: implemented

## Confirmed decisions

- Players freely choose what to donate and how much, rather than fulfilling association requests or maintaining recurring deliveries.
- Donations go to simulated associations and raise Well-being across the whole city.
- The Well-being benefit is temporary.
- Donations are made from the Market, using a Donate action alongside Sell, with quantity selection and a preview of the benefit.
- Only Goods can be donated; Materials are excluded.
- Donations fill one capped Solidarity reserve that gradually depletes; further Donations refill it without stacking bonuses.
- Donating earns a permanent Medal with multiple tiers based on cumulative Donation value, visible on the social profile.
- A full Solidarity reserve lasts 24 real hours, including time spent offline. A partial reserve lasts proportionally less time.
- Donation value uses each Good's fixed base value, independently of Market price fluctuations.
- Filling the reserve costs more as the city's Citizen count grows; cumulative Medal progress uses the same fixed value per Good regardless of population.
- Donations remain possible when the reserve is full and still count towards the Medal. The preview explicitly identifies the share that provides no additional Well-being benefit.
- Solidarity appears under Belonging in the Needs pyramid as an optional bonus. Not donating must never lower existing satisfaction or cause a Sanction.
- The Medal and cumulative Donation progress belong to the Player account and persist across cities and city resets. The Solidarity reserve belongs to each city.
- While the reserve is positive, every Home receives a fixed +5 Well-being bonus, subject to the existing Well-being cap. Reserve fullness changes duration only, never bonus strength.
- Filling an empty reserve costs a Donation value of `max(200, 2 * Citizens)`. This is an initial balance setting.
- Each Donation adds `24 hours * donationValue / max(200, 2 * Citizens)`, capped at 24 hours of remaining reserve. Citizens are counted at the time of the Donation; later population changes do not reprice time already acquired.
- A Time skip consumes the corresponding reserve duration, just as normal play and offline time do. Any simulated benefit stops when the reserve expires, including within a Time skip or offline catch-up.
- The Medal is called "Ville solidaire" in French. It evolves through Bronze at 1,000 cumulative Donation value, Silver at 10,000, and Gold at 100,000. The profile shows the current tier and progress towards the next tier.
- Create an in-game Codex page dedicated to Solidarity as part of this feature.

## Existing domain constraints

- Market sales currently accept Goods only.
- Well-being affects Tax, so the benefit requires economic balancing.
- Badge means a notification counter in the glossary. Existing Medals are earned through Challenges and displayed on the social profile; Donation milestones extend their earning criteria.
- A Donation is distinct from a Trade offer priced at zero, which is a gift to a Friend.

## Worked examples

- At 100 Citizens, a Donation worth 50 adds 6 hours to the reserve, up to the 24-hour cap.
- At 1,000 Citizens, the same Donation adds 36 minutes.
- A reserve with 10 hours remaining has 2 hours left after an 8-hour Time skip.
- Donations made with a full reserve add no duration but still count in full towards the Medal.

## Codex page: Solidarity

The in-game Codex page is a required deliverable, not a substitute for this design spec. It must explain:

- How to donate Goods from the Market, choose a quantity, and read the preview.
- That donated Goods leave the player's stock and yield no Urbs.
- How fixed Good base values determine Donation value independently of Market prices.
- The city-wide +5 Well-being bonus, its optional contribution to Belonging, and the existing Well-being cap.
- How the reserve fills, its population-based cost and 24-hour cap, and depletion during normal play, offline time, and Time skips.
- Why population changes do not shorten time already acquired.
- How excess Donations still advance the Medal even when they add no reserve duration.
- The "Ville solidaire" Medal's thresholds and the distinction between account-wide permanent progression and each city's temporary reserve.

Use a worked example to make the duration calculation understandable.

## Acceptance criteria

- The Market offers Donate alongside Sell for Goods, with quantity selection and a preview of stock consumed, duration gained, any excess, and Medal progress.
- Donations never credit Urbs, consume Materials, or stack Well-being bonus strength.
- The remaining reserve duration is visible, and the contribution to Well-being is explained in the Needs pyramid.
- A player who never donates keeps their existing Need satisfaction and suffers no Donation-related Sanction.
- Duration, population scaling, full-reserve Donations, and Medal progression follow the confirmed rules above.
- Medal progress persists across cities and resets; reserve duration stays local to its city.
- The in-game Solidarity Codex page is included.

## Design findings

- Existing Need levels average their factors. Solidarity must not enter that average as a required factor at zero, because that would lower satisfaction for players who do not donate.
- One economic hour normally lasts one real hour. Time skips advance economic simulation, so a reserve that ignores them could grant additional Tax without consuming its duration.
- Well-being contributes to the Tax multiplier at one percentage point per five Well-being points, before caps and other modifiers.

## Implementation

Implemented in the core, save validation, Market, Needs pyramid, social profile, account synchronization and in-game Codex. See [implementation and validation](implementation.md) and the individual [tickets](issues/01-solidarity-reserve.md).
