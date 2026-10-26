# Congestion And Cars Layers

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 02

## What to build

Two road Layers from `congestionStats().sections`: Cars (Movement layer, volume of Commuters per Road section, scale relative to the city maximum) and Congestion (Data layer, load over Lane capacity, disconnected sections marked with the existing red cross).

## Acceptance criteria

- [ ] Pure projection functions tested on small road networks.
- [ ] Cars and Congestion differ: volume vs saturation.
- [ ] Bridges and BRT/rail are handled as the congestion model handles them (BRT and rail have no road load).
- [ ] Legend for each.
