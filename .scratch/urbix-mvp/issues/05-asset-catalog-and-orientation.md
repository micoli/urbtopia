# Asset catalog and orientation

Type: prototype
Status: resolved
Blocked by: 02

## Question

Turn the Kenney packs into a game piece catalog: footprint per building (from bounding boxes), front-facing direction, road piece exits and rotations, which pieces serve which game role, texture folder layout, and baked node scales. Prototype a viewer to verify orientations visually, the items the research left unverified.

## Answer

- Catalog written to [`docs/asset-catalog.md`](../../../docs/asset-catalog.md) and [`docs/asset-catalog.json`](../../../docs/asset-catalog.json), decided with the owner in a viewer.
- **Front = -Z at rotation 0** for every building. Footprint = `ceil(bbox - 0.15)`, native size, no scaling except commercial i, l, m (x1.5 to fill 2x2). Towers (commercial skyscrapers) are a separate building, not a Home tier; Home tiers come from suburban (6 tiers, 21 models).
- Roads: 8 base pieces (straight, bend, T, crossroad, end, square, crossing, roundabout 3x3) with exits per rotation; they cover the 16 neighbour masks. All variants and props are out of the MVP.
- Texture layout: `models/<pack>/*.glb` + `Textures/colormap.png` beside them (suburban colormap taken from the FBX folder). Node scales to bake: water-tower, detail-tank, shipping containers.
- Open: which Factory is the large power plant; verify roundabout exits.
- Prototype: `prototypes/asset-viewer/` (uncommitted, repo has no commit yet; move to a throwaway branch once the first commit exists).
