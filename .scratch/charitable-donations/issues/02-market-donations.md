# Market donation interface

Status: resolved

Depends on: 01

## Acceptance criteria

- Add Donate beside Sell for each stocked Good.
- Select quantity and preview consumed stock, duration gained, excess value, and Medal progression.
- Show remaining Solidarity duration and clearly explain donations made with a full reserve.
- Provide access to the Solidarity Codex page.

## Comments

Implemented with separate `MarketGoodRow`, `DonationForm`, and `SolidarityStatus` components. Desktop and mobile browser checks pass, including previews, overflow, confirmation, and access to the Codex page.
