# Release polish: coherent UI, coherent Buildings, living Wild land

Status: needs-triage

## Problem

The game is playable and covers most aspects. Before a wider public release, three things hold it back: the interfaces look uneven and hide features, the Buildings look assembled from unrelated packs, and the Wild land is a flat, plain texture.

## Decisions

Settled in the grilling. Vocabulary in `CONTEXT.md`: Wild land, Parcel. ADRs: [0032](../../docs/adr/0032-unified-building-art-direction-with-a-shared-module-kit.md), [0033](../../docs/adr/0033-wild-land-scenery-derived-and-never-saved.md), [0034](../../docs/adr/0034-zero-cost-lighting-on-mobile.md).

- Target: PWA, mobile first, no hard date. Work is ordered by visible value.
- Order: Buildings by priority lot, nature decoration, Wild land, then discoverability in parallel with tokens and cleanup, then the lighting pass.
- Buildings and decoration: house `urbtopia` style, shared module kit, a game-specific rework of `create-building-model` whose control render uses the target lighting. No Building or decoration depends on Kenney afterwards; poly.pizza models are removed as their Building is replaced. Kept: Kenney for the Venues and for vehicles, boats, roads and rails; Quaternius for Goods, Materials and Crops.
- Wild land: 3D scenery derived from the seed, never saved, not interactive.
- UI: a design system of tokens, migrated component by component with Storybook as reference. Two menu layouts are kept (radial and left bar), the default picked by device and changeable in preferences; `LayoutBottomMenu` goes. Tailwind is removed; `radix-ui` only if it replaces `Dropdown`, `Dialog` and `AccordionSection`.
- Discoverability: a build menu with search, clear categories and a preview of the next Unlock; explanatory empty states; first-use hints that can be dismissed; consistent action placement and labels across Building panels.
- Lighting: blob shadows, baked AO, light fog only; at most +5 % median frame time on the reference phone, else off on slow devices.
- Guard rails: Playwright screenshot baselines on a few reference scenes (dense city, map edge, one Venue, the build menu), with `?bypass-tutorial`, plus the existing Storybook stories.

## Out of scope

Interactive scenery or resources on the Wild land, the Venue tutorial (stays in `TODO.md`), replacing vehicles, boats, roads, rails, Venue interiors, Goods, Materials or Crops, new gameplay.

## Issues

See `issues/`. 01 and 02 are prerequisites of the Building lots 03 to 06 and of the nature decoration 11; 07 (Wild land) waits for 11.
