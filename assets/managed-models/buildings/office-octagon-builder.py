import math
import os
import sys

REPO = os.path.abspath(os.path.dirname(__file__))
while not os.path.isdir(os.path.join(REPO, ".claude")):
    parent = os.path.dirname(REPO)
    if parent == REPO:
        raise RuntimeError("Could not find the repository root")
    REPO = parent
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

lpm = building_lib.lpm

SPEC = {"id": "office-octagon", "style": "urbtopia"}

# Role cells repainted by the tones: vtone1 metal frame, vtone2 glass, vtone3 slab edges.
TONES = {
    "a": {"vtone1": "#464b63", "vtone2": "#9fcdea", "vtone3": "#b4b8c8"},
    "b": {"vtone1": "greygreen", "vtone2": "#86cdb5", "vtone3": "#b9c6bd"},
    "c": {"vtone1": "#8a6a4a", "vtone2": "#dcb978", "vtone3": "#cdbfac"},
    "d": {"vtone1": "#2a2d38", "vtone2": "#8b95a8", "vtone3": "#9ea2b4"},
}

FLOOR = 0.32
SLAB = 0.05
GLASS_INSET = 0.035
ROOF_SLAB = 0.06
RAIL_INSET = 0.06
RAIL_HEIGHT = 0.12
LAWN_INSET = 0.1
COURT_FLOOR = 0.03


def octagon(shape, inset=0.0):
    """Octagon with cardinal sides of 2 * straight and 45 degree corners, moved inwards by `inset` (negative = outwards)."""
    half = shape[0] - inset
    straight = shape[1] - inset * (math.sqrt(2) - 1)
    return [(straight, -half), (half, -straight), (half, straight), (straight, half),
            (-straight, half), (-half, straight), (-half, -straight), (-straight, -half)]


def edges(points):
    for index, start in enumerate(points):
        end = points[(index + 1) % len(points)]
        dx, dy = end[0] - start[0], end[1] - start[1]
        yield start, end, math.hypot(dx, dy), math.degrees(math.atan2(dy, dx))


def ring_prism(name, outer, inner, z0, z1, color):
    """Octagonal ring between two octagons of the same vertex order."""
    count = len(outer)
    vertices = [(x, y, z) for z in (z0, z1) for x, y in outer + inner]
    top, bottom = 2 * count, 0
    faces = []
    for i in range(count):
        j = (i + 1) % count
        faces.append((top + i, top + j, top + count + j, top + count + i))
        faces.append((bottom + count + i, bottom + count + j, bottom + j, bottom + i))
        faces.append((i, j, top + j, top + i))
        faces.append((count + j, count + i, top + count + i, top + count + j))
    return lpm._object(name, lpm._bm_from(vertices, faces), color)


def octagon_prism(name, outline, z0, z1, color):
    vertices = [(x, y, z) for z in (z0, z1) for x, y in outline]
    faces = [tuple(reversed(range(8))), tuple(range(8, 16))]
    faces.extend((i, (i + 1) % 8, (i + 1) % 8 + 8, i + 8) for i in range(8))
    return lpm._object(name, lpm._bm_from(vertices, faces), color)


def edge_box(name, edge, along, outward, size, z, color):
    """A box on an edge: `along` from its middle, `outward` to the right of the travel direction, size = (along, depth, height)."""
    start, end, length, angle = edge
    box = lpm.box(name, size, at=(0, 0, z), color=color)
    lpm.rotate(box, angle)
    radians = math.radians(angle)
    middle = ((start[0] + end[0]) / 2, (start[1] + end[1]) / 2)
    return lpm.move(box,
                    middle[0] + math.cos(radians) * along + math.sin(radians) * outward,
                    middle[1] + math.sin(radians) * along - math.cos(radians) * outward)


def facade_edges(outer, court, inward=False):
    """Edges of the outer facade (outward normal) or of the courtyard facade (normal towards the courtyard centre)."""
    if inward:
        return list(edges(list(reversed(octagon(court)))))
    return list(edges(octagon(outer)))


def railing(parts, name, outline, color, deck):
    for edge_index, edge in enumerate(outline):
        posts = max(2, round(edge[2] / 0.26))
        for post in range(posts):
            along = -edge[2] / 2 + post * edge[2] / posts
            parts.append(edge_box(f"{name}_post_{edge_index}_{post}", edge, along, 0, (0.022, 0.022, RAIL_HEIGHT), deck, color))
        parts.append(edge_box(f"{name}_top_{edge_index}", edge, 0, 0, (edge[2], 0.024, 0.02), deck + RAIL_HEIGHT, color))
        parts.append(edge_box(f"{name}_mid_{edge_index}", edge, 0, 0, (edge[2], 0.016, 0.014), deck + RAIL_HEIGHT * 0.5, color))
        parts.append(edge_box(f"{name}_kick_{edge_index}", edge, 0, 0, (edge[2], 0.02, 0.025), deck, color))
        parts.append(lpm.box(f"{name}_corner_{edge_index}", (0.03, 0.03, RAIL_HEIGHT + 0.02), at=(*edge[0], deck), color=color))


def build_office(size, floors, model_id, out_dir):
    lpm.reset()
    model_spec = {"id": model_id, "style": SPEC["style"], "tones": TONES}
    scale = size / 2
    OUTER = (size / 2, size / 3)
    COURT = (size / 4, size / 4 * (math.sqrt(2) - 1))
    entries = building_lib.palette_for(model_spec, SPEC["style"])
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    color = {name: palette[name] for name, _ in entries}
    metal, slab, glass, frame = color["vtone1"], color["vtone3"], color["vtone2"], color["udark"]
    parts = []

    outer, court = octagon(OUTER), octagon(COURT)
    outer_edges, court_edges = facade_edges(OUTER, COURT), facade_edges(OUTER, COURT, inward=True)

    for floor in range(floors):
        base = floor * FLOOR
        parts.append(ring_prism(f"slab_{floor}", outer, court, base, base + SLAB, slab))
        parts.append(ring_prism(f"glass_{floor}", octagon(OUTER, GLASS_INSET), octagon(COURT, -GLASS_INSET), base + SLAB, base + FLOOR, glass))
        for ring, shape, inset in (("outer", OUTER, 0.025), ("court", COURT, -0.025)):
            for index, (x, y) in enumerate(octagon(shape, inset)):
                parts.append(lpm.box(f"post_{ring}_{floor}_{index}", (0.04, 0.04, FLOOR - SLAB), at=(x, y, base + SLAB), color=metal))
        for ring, ring_edges in (("outer", outer_edges), ("court", court_edges)):
            for edge_index, edge in enumerate(ring_edges):
                bays = max(2, round(edge[2] / 0.29))
                for bay in range(1, bays):
                    along = -edge[2] / 2 + bay * edge[2] / bays
                    front_door = floor == 0 and ring == "outer" and edge_index == 7 and abs(along) < 0.2
                    if front_door:
                        continue
                    parts.append(edge_box(f"mullion_{ring}_{floor}_{edge_index}_{bay}", edge, along, -0.03, (0.03, 0.03, FLOOR - SLAB), base + SLAB, metal))

    front = outer_edges[7]
    parts.append(edge_box("door", front, 0, -0.03, (0.4, 0.02, 0.22), SLAB, frame))
    parts.append(edge_box("door_jamb_left", front, -0.23, -0.03, (0.05, 0.04, 0.26), SLAB, metal))
    parts.append(edge_box("door_jamb_right", front, 0.23, -0.03, (0.05, 0.04, 0.26), SLAB, metal))
    parts.append(edge_box("door_header", front, 0, -0.03, (0.51, 0.04, 0.05), SLAB + 0.22, metal))
    parts.append(edge_box("door_mullion", front, 0, -0.025, (0.025, 0.03, 0.22), SLAB, metal))

    parts.append(octagon_prism("court_lawn", octagon(COURT, 0.0), 0, COURT_FLOOR, color["softgreen"]))
    parts.append(lpm.prism("court_paving", 8, 0.2 * scale, COURT_FLOOR + 0.01, at=(0, 0, 0), color=slab, rotate=22.5))
    parts.append(lpm.prism("court_trunk", 5, 0.02, 0.1, at=(0, 0, COURT_FLOOR), color=color["uwood"]))
    parts.append(lpm.prism("court_crown", 7, 0.13 * scale, 0.2, at=(0, 0, COURT_FLOOR + 0.08), color=color["bush"], radius_top=0.04))
    for index, angle in enumerate(range(45, 360, 90)):
        x, y = 0.36 * scale * math.cos(math.radians(angle)), 0.36 * scale * math.sin(math.radians(angle))
        parts.append(lpm.prism(f"court_shrub_{index}", 6, 0.06, 0.05, at=(x, y, COURT_FLOOR), color=color["bush"], radius_top=0.04))

    top = floors * FLOOR
    deck = top + ROOF_SLAB
    parts.append(ring_prism("roof_slab", outer, court, top, deck, slab))
    railing(parts, "rail_outer", list(edges(octagon(OUTER, RAIL_INSET))), metal, deck)
    railing(parts, "rail_court", list(edges(list(reversed(octagon(COURT, -RAIL_INSET))))), metal, deck)

    parts.append(ring_prism("roof_lawn", octagon(OUTER, LAWN_INSET), octagon(COURT, -LAWN_INSET), deck, deck + 0.035, color["softgreen"]))
    for index, (x, y) in enumerate(((0.0, -0.75 * scale), (0.75 * scale, 0.0), (-0.75 * scale, 0.0))):
        parts.append(lpm.prism(f"roof_hedge_{index}", 6, 0.1, 0.07, at=(x, y, deck + 0.035), color=color["bush"], radius_top=0.07))
    for index, (x, y) in enumerate(((-0.6 * scale, -0.6 * scale), (0.6 * scale, -0.6 * scale), (0.6 * scale, 0.6 * scale), (-0.6 * scale, 0.6 * scale))):
        parts.append(lpm.prism(f"roof_trunk_{index}", 5, 0.016, 0.07, at=(x, y, deck + 0.035), color=color["uwood"]))
        parts.append(lpm.prism(f"roof_crown_{index}", 7, 0.1, 0.14, at=(x, y, deck + 0.09), color=color["bush"], radius_top=0.035))
    parts.append(lpm.box("stair_head", (0.26, 0.2, 0.15), at=(0.0, 0.76 * scale, deck + 0.035), color=color["uwall"]))
    parts.append(lpm.box("stair_head_roof", (0.3, 0.24, 0.02), at=(0.0, 0.76 * scale, deck + 0.185), color=metal))
    parts.append(lpm.box("stair_head_door", (0.1, 0.012, 0.1), at=(0.0, 0.76 * scale - 0.104, deck + 0.035), color=frame))

    budget = int(2500 + floors * 1500 * scale)
    ob = lpm.finish(model_id, parts, palette, budget=budget, center=False)
    return building_lib.export_model(ob, model_spec, out_dir)
