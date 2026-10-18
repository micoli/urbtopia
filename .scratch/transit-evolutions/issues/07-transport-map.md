# Transport map section

Type: task
Status: resolved
Blocked by: 01, 04, 06

## What to build

The read-only "Transport map" section of City management. See `../spec.md`.

## Seams under test

- A pure function from `transportStats` and the state to a map model (nodes, line strokes, Transfers, per-line load), tested without the DOM.
- Mode filters, grey dashed styling for non-active lines, closed loops with arrows, hub nodes, bicycle icon on bike-carrying stops.
- Tooltip data: Riders split pedestrians/cyclists, capacity, Headway, status.

## Acceptance criteria

- [ ] New section `eco-transportMap` after Transport, in `SectionNavigation`; one React component per file; stories.
- [ ] SVG with pan and zoom, fit to content by default, click highlights a line or stop and fades the others.
- [ ] `ModeMix` shown next to the map.
- [ ] Nothing saved; texts in `en` and `fr`.
- [ ] Typecheck, lint and the full test suite pass.
