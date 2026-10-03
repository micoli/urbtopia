# Kenney City Kits (Roads, Commercial, Suburban, Industrial) - research

Date: 2026-10-02. Method: kenney.nl asset pages fetched with WebFetch; the four download zips were then downloaded
(HTTP 200) and inspected locally (file listing, `License.txt`, GLB JSON chunk parsed with a Python script: accessor bounds,
index counts, materials, images). Claims tagged [page] come from the kenney.nl page, [zip] from inspecting the zip at the
URL given. Kenney's pages do not state formats, scale, grid or piece lists; those come only from the zips.

## Summary table

| Pack | Version [page] | License | Models (GLB count [zip]) | Page-stated count [page] | Zip URL |
|---|---|---|---|---|---|
| Roads | 2.1 (road signs, traffic lights) | CC0 | 95 | "90 variations" | https://kenney.nl/media/pages/assets/city-kit-roads/74288c9459-1787042796/kenney_city-kit-roads.zip |
| Commercial | 2.1 (fixed skyscraper E) | CC0 | 41 | "50 variations" | https://kenney.nl/media/pages/assets/city-kit-commercial/a742d900eb-1753115042/kenney_city-kit-commercial_2.1.zip |
| Suburban | 2.0 (completely remade) | CC0 | 40 | "40 items" | https://kenney.nl/media/pages/assets/city-kit-suburban/2c871b7af2-1745479373/kenney_city-kit-suburban_20.zip |
| Industrial | 2.0 (added solar/wind assets) | CC0 | 37 | "40 assets" | https://kenney.nl/media/pages/assets/city-kit-industrial/0ec35b139d-1788171848/kenney_city-kit-industrial_2.0.zip |

Sources: pages https://kenney.nl/assets/city-kit-roads , https://kenney.nl/assets/city-kit-commercial ,
https://kenney.nl/assets/city-kit-suburban , https://kenney.nl/assets/city-kit-industrial .
Page counts differ from the zip counts (the page figure probably counts texture variations or previews; the cause is not documented - unverified).
All-in-one bundle: https://kenney.itch.io/kenney-game-assets [page: commercial, industrial, suburban].
Zip URLs contain a hash/timestamp segment and will change on new versions; re-copy the link from the page.

## License

CC0 (Creative Commons Zero) on all four pages [page] and in each zip's `License.txt` ("personal, educational, and commercial
purposes. Support by crediting 'Kenney' ... not a requirement") [zip, e.g. roads `License.txt`; http://creativecommons.org/publicdomain/zero/1.0/].
Attribution optional. No server needed; files can be bundled in the repo.

## File formats [zip, all four packs identical structure]

- `Models/GLB format/*.glb`, `Models/FBX format/*.fbx`, `Models/OBJ format/*.obj + .mtl` (same model count in each), plus
  `Previews/*.png`, `Overview.html`, `Sample.png`, `License.txt`.
- Use GLB for three.js. GLB generator: "UnityGLTF", glTF 2.0, extension `KHR_texture_transform` (declared, texCoord 0 only;
  GLTFLoader supports it).
- Actual GLB files are 1.7 MB (roads), 3.7 MB (commercial), 3.1 MB (industrial), 2.6 MB (suburban) for the whole `GLB format` folder.

## Textures

- Shared atlas / palette: every GLB has exactly 1 material ("colormap", PBR baseColorTexture, metallic 0, doubleSided true) and
  1 image. The image is an EXTERNAL file referenced by URI `Textures/colormap.png` (not embedded) [zip: GLB JSON `images[0].uri`].
  `colormap.png` is 512x512 RGBA, ~11-12 KB, one per pack [zip]. So the `Textures/` folder must sit next to the .glb files when loading.
- Per-pack `Models/Textures/variation-a.png` (+ `variation-b`, `-c`): roads 1 (a), commercial 2 (a,b), suburban 3 (a-c), industrial 3 (a-c)
  [zip file listing]. These are alternative colormaps (same layout, different palette) used by the OBJ/FBX variants; the
  `Preview (Variation X).png` images show them. Swapping the texture on the shared material gives recolouring for free
  (inference from file naming + previews; I did not diff the UV layout).
- Each pack has its own colormap, so a combined city = 4 textures (or 4 materials) minimum.
- Minimal materials: 1 material per GLB (industrial: a few models have 2 materials) [zip].

## Scale, origin, grid conventions (measured from GLB accessor min/max) [zip]

Not documented on the pages. Measured:
- Units: 1.0 = one road tile. Road tiles are exactly 1.0 x 1.0 (X,Z), thickness 0.02, origin at tile centre, bounds -0.5..+0.5, Y from 0 (flat on ground). 
  Verified for road-straight, road-bend, road-intersection, road-crossroad, road-end, road-square, road-crossing, tile-low.
- Larger road tiles: road-curve 2.0x2.0 (bounds -1..1), road-roundabout 3.0x3.0, road-split 1.0x2.0, road-straight-half 0.5x1.0.
- Elevation pieces: tile-high 0.25 high, road-slant 0.27 high, road-bridge 0.52 high.
- Y-up, ground at Y=0, no root node scale (except a few industrial models: node scale 0.27/0.94/[-1,1,1] on some nodes - check when loading).
- Roads and buildings share the same unit, so building footprints relate to road tiles (street-side facade/door orientation is not documented; verify visually - the models' front face direction was not checked).
- Buildings are centred on X/Z at origin (bounds roughly symmetric), base at Y=0.

## Road pieces (95 GLB, Roads 2.1) [zip file list]

- Straight: road-straight, road-straight-half, road-straight-barrier, -barrier-half, -barrier-end, road-side (with sidewalk edge), road-side-barrier, road-side-entry/-exit (+barrier), road-square (+barrier), road-end, road-end-barrier, road-end-round (+barrier).
- Corners: road-bend, road-bend-barrier, road-bend-sidewalk, road-bend-square, road-bend-square-barrier; wide curves road-curve (2x2), road-curve-barrier, road-curve-pavement, road-curve-intersection (+barrier).
- T junctions: road-intersection, road-intersection-line, road-intersection-path, road-intersection-barrier.
- 4-way: road-crossroad, road-crossroad-line, road-crossroad-path, road-crossroad-barrier.
- Crossing: road-crossing (zebra).
- Other: road-roundabout (+barrier, 3x3), road-split (+barrier), road-bridge, bridge-pillar(-wide), road-slant family (slant, slant-high, slant-curve, slant-flat, slant-flat-high, slant-flat-curve, + barrier variants), road-driveway-single/double (+barrier), tile-low/high/slant/slantHigh.
- Props: light-curved/-square (+double, +cross), traffic-light (+hanging, object-hanging/horizontal/vertical), road-sign-* (empty, hanging, stop, street, warning, object-*), sign-highway (+wide, detailed), construction-barrier/cone/fence/light, dumpster, electricity-pole/side/wires variants.
- Which side the road exits are on (straight = X or Z axis, bend orientation, T stem direction) is not documented; needs checking once loaded; rotations in multiples of 90 deg are the expected usage (inference).
- "Overview.html" in the zip reports "Total objects: 95, Total animations: 0" [zip].

## Buildings and footprints (measured from GLB bounds, X x Z in tile units; height Y) [zip]

No footprint doc on the pages. Overview.html in each zip is a viewer, not a spec.

- Commercial (41): building-a..n (14), building-skyscraper-a..e (5), low-detail-building-a..n (14) + low-detail-building-wide-a/b (2), detail-awning/-wide, detail-overhang/-wide, detail-parasol-a/b.
  building-a 0.88x0.94 h1.29; building-b 0.97x0.94; building-j 2.08x1.34 h1.69; building-k 2.08x0.94; skyscrapers ~1.3x1.3 with h 2.88 / 4.48 / 4.08 / 5.47 / 4.08. low-detail-building-a 0.5x0.5 h2.0; low-detail wide 1.0x0.5 h1.1.
- Suburban (40): building-type-a..u (21), fence (+low, 1x2..3x3), driveway-short/long, path-short/long, path-stones-*, planter, tree-small/large.
  building-type-a 1.30x1.03 h0.83; -b 1.83x1.14 h1.14; -u 1.43x1.09. Trees 0.21x0.24 h0.57-0.77 (small relative to tile).
- Industrial (37): building-a..t (20), chimney-basic/small/medium/large, detail-tank(-large), shipping-container-a/b/c, solar-panel-* (5), water-tower, windmill (+low).
  building-a 2.08x1.24 h1.47; building-j 1.03x1.3; building-s 2.12x0.92; building-t 1.72x1.39; container 1.38x3.05 (long axis Z); water-tower 0.91x0.88 h2.28.
- Footprints are not snapped to an integer cell: the common sizes are about 1x1, 2x1 (up to 2.12) and 1.3-1.8 wide; a game must either define its own plot size per model (compute from bounding boxes at load time) or scale. Suggested: derive footprint = ceil(bbox) in tiles.

## Performance characteristics (triangles, from GLB index counts) [zip]

| Pack | Min | Median | Max | Total (all models) |
|---|---|---|---|---|
| Roads (95) | 12 | 112 | 1636 (roundabout) | 17,146 |
| Commercial (41) | 40 | 246 | 5246 (building-j) | 44,682 |
| Suburban (40) | 12 | 800 | 2062 | 30,035 |
| Industrial (37) | 88 | 876 | 2422 | 35,390 |

- Standard road tile ~44-116 tris; intersections ~84-116; bends 260. Cheap.
- Buildings mostly 700-2500 tris; commercial skyscrapers 1.1-1.9k; building-j is the outlier at 5.2k. Commercial `low-detail-building-*` are 160-200 tris - intended as distant filler (name-based inference).
- A 500-building city at ~1.5k tris = ~750k tris: heavy-ish for mobile; use instancing per model type and/or the low-detail variants, frustum culling, and cap pixel ratio. (Estimate, not measured on device.)
- Single 512x512 colormap per pack: negligible VRAM, draw calls = number of distinct (pack,material), which is ideal for batching/instancing.
- Total GLB footprint for all four packs ~11 MB (sum of folder sizes above) uncompressed; Draco/meshopt was not applied in the shipped GLBs (no extension other than KHR_texture_transform declared) [zip], so gltfpack/gltf-transform could shrink them.

## three.js loading notes (partly inference; from GLB structure above)

- GLTFLoader works; keep each .glb next to its `Textures/colormap.png` (external URI) or repack to embed the texture (gltf-transform / gltfpack).
- Texture sampler has `minFilter 9987` (LINEAR_MIPMAP_LINEAR) only; palette textures can look blurry/bleeding at small mip levels; consider `NearestFilter` + no mipmaps or anisotropy 1 on a palette atlas (suggestion, not tested).
- Set `texture.colorSpace = SRGBColorSpace` (GLTFLoader does this for baseColor automatically).
- Materials are `doubleSided: true`; set `side: FrontSide` to halve fragment cost if no backface is needed (check visually: thin fences/awnings may need double side).
- Instancing: one mesh (1 node, 1 mesh, 1 primitive for most models; roads have up to 3 meshes in some models; industrial some models 2 meshes/2 materials) -> take geometry+material from the loaded scene and use `InstancedMesh` per model (or `BatchedMesh`). Multi-mesh models need one InstancedMesh per sub-mesh. Because all models of a pack share one material, `BatchedMesh` can merge a whole pack into one draw call.
- Different packs have different colormaps; do not mix instance sets across packs.
- Some industrial models have node scale (0.27, 0.94, mirror -1 in X); bake with `scene.updateMatrixWorld` / apply the node matrix to geometry before instancing.
- Orthographic/isometric: models have no baked lights; use your own lights; no animations (Overview "Total animations: 0").

## Not verified

- Page text for formats/scale/grid is absent; everything about scale comes from my own measurement of GLB bounds.
- Front-facing direction of buildings and exact road-exit orientations were not checked visually.
- The reason page counts (90/50/40/40) differ from the zip counts (95/41/40/37) is unknown.
- Vertex counts/texture-bleeding/mobile fps were not benchmarked.
