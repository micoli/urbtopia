# Analytics View

Status: ready-for-agent

## Problem

The player cannot see how the city works as a whole: where Commuters and Pedestrians load the networks, where Pollution and Odor reach, where Well-being or Service coverage is weak, where land is desirable. The figures exist in the core but only as lists in City management or as the single-facility Service coverage tint.

## Decisions

- The **Analytics view** (see `CONTEXT.md`) is a read-only view reached from the **Land** dock entry. Land becomes a flyout with two entries: *Parcels* (today's tool) and *Analytics*. Analytics holds two submenus: **Movement layers** (Pedestrians, Cars, All) and **Data layers** (Service coverage per Service category, Well-being, Pollution, Congestion, Odor radius, Land value).
- It never changes the city, is never saved and adds no simulation, except Land value, a new derived indicator. Land value has no effect on Parcel prices, Tax or Well-being.
- Every Layer is a pure projection computed in `src/core` from existing figures, rendered by a scene layer, with no feedback into the core (ADR 0011, ADR 0046).
- Tile fields (Pollution, Odor, Congestion, Land value) are read at every tile. Per-Home layers (Well-being, Service coverage) tint the Homes. Pollution and Odor use the reach functions and the "worst source, never the sum" rule of the existing maluses, evaluated for a Home that would stand on the tile.
- Movement layers show the aggregate load, never individual Vehicles or Pedestrians. Cars: volume of Commuters per Road section. Congestion (Data layer): saturation, load over Lane capacity, with disconnected sections marked. Pedestrians: volume per Sidewalk and Pedestrian way section on a scale relative to the city maximum; Crossings show load over their threshold. All: both at once with two colour ramps (orange to red for Roads, blue to violet for Sidewalks), each normalised on its own maximum, and two legends.
- While the view is on: isometric camera unchanged, the ground is tinted by the Layer, every floating badge, Vehicle and animated Pedestrian is hidden, build tools are disabled. Escape or picking another menu entry leaves it.
- Each Layer has a legend with its bounds. Tapping or hovering a tile or Home shows a tooltip with the figure and its two or three main causes, from plain rules over existing figures (like the Congestion Diagnosis), never free text.
- Available from the start with no Citizens threshold. A Layer whose subject does not exist yet is shown empty with its legend. The last Layer is remembered in local storage like the build section.
- Vocabulary: Analytics view, Layer, Movement layer, Data layer, Land value. Never "heatmap" or "overlay" in code, docs or texts. UI strings translated FR/EN.
- No ADR: nothing here is hard to reverse.

## Out of scope

Plugging Land value into the economy, per-tile Well-being, time-lapse or history of Layers, exporting images, individual Citizen journeys.

## Issues

01-menu-and-view-shell.md
02-tile-field-layer-and-pollution.md
03-odor-layer.md
04-congestion-and-cars-layers.md
05-pedestrian-load-layers.md
06-home-layers-coverage-and-wellbeing.md
07-land-value-layer.md
08-tooltip-causes.md
09-guide-and-e2e.md
10-flow-sources-and-destinations.md
