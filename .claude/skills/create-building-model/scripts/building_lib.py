"""
building_lib.py - shared art direction and builders for Urbix low-poly buildings.
Run INSIDE Blender through tools/blender/bl.py (see SKILL.md). Units: 1 tile = 1 world unit, Z up, front = -Y.

A recipe is: `import building_lib; building_lib.build(SPEC, out_dir)`.
Two styles share the geometry code and differ by the STYLES table: "kenney" (default, matches the suburban Kenney
models of the game: off-white walls, thick slate trims, soft green roofs) and "vivid" (saturated colors, fine trims).
"""
import json
import math
import os
import random
import shutil
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

TOOLS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender")
sys.path.insert(0, TOOLS_DIR)
import lpm  # noqa: E402
import tone_labels  # noqa: E402

PALETTE_ENTRIES = [
    ("coral", "#ff5a4e"), ("tangerine", "#ff9a1f"), ("sun", "#ffd21f"), ("lime", "#8bdc2a"),
    ("mint", "#2fd6a2"), ("aqua", "#14c8e8"), ("sky", "#3d9bff"), ("cobalt", "#3b4bff"),
    ("violet", "#8a4dff"), ("magenta", "#f03dd0"), ("pink", "#ff8fb8"), ("cream", "#fff1d6"),
    ("white", "#f6f8ff"), ("graphite", "#2c2f4a"), ("brick", "#c2432e"), ("navy", "#1b2a6b"),
    ("offwhite", "#e8e8e6"), ("slate", "#6d7390"), ("slate_dark", "#464b63"), ("softgreen", "#7cc08f"),
    ("glass_blue", "#9fcdea"), ("bush", "#4f9a62"), ("solar", "#26304f"),
    ("bluegrey", "#8ea3bd"), ("salmon", "#ff9c80"),
    ("paleblue", "#b6d0ea"), ("grey", "#a4a9ad"), ("greygreen", "#6f8f7c"),
]
PALETTE_NAMES = [name for name, _ in PALETTE_ENTRIES]
PALETTE_HEX = dict(PALETTE_ENTRIES)

# Colors measured on the Kenney suburban and commercial kits (palette cells of the "urbtopia" style only, so the
# palette image of every other style stays byte-identical).
URBTOPIA_ENTRIES = [
    ("uwall", "#f1f1f6"), ("uroof", "#96ddbc"), ("utrim", "#9ea2b4"), ("uframe", "#a3a7b8"), ("udark", "#7a7d8c"), ("uslab", "#b4b8c8"), ("uwood", "#c58b52"), ("usand", "#e3cc92"), ("vtone1", "#c2432e"), ("vtone2", "#a63a28"), ("vtone3", "#9ea2b4"),
]

# The "vtone" cells are role cells: a family sets them to the colors of its first tone, and the build writes one palette PNG per other tone, so the game repaints a model by swapping its palette texture.

FLOOR_HEIGHT = {"house": 0.30, "apartment": 0.28, "office": 0.32}
FLOOR_RANGE = {"house": (1, 3), "apartment": (3, 12), "office": (4, 20)}
ROOF_STYLES = ("flat", "gable_half", "gable_third", "hip", "mansard", "shed", "gable_cross", "sawtooth")
FEATURES = ("sign", "chimney", "antenna", "awning", "balcony", "skylight", "monumental_door",
            "vent", "solar_panels", "bushes", "clock_tower", "flagpole", "smokestack", "roller_door", "storefront", "penthouse", "portico", "red_cross", "door_hood", "penthouse_terrace", "stair_head", "round_dormer", "round_window", "roof_lantern", "striped_awning", "stall", "material_yard", "marquee", "wall_tools", "bush_at", "industrial_door", "hazard_band", "hardware_display", "roof_reel", "curved_marquee", "pilasters", "crystals", "red_carpet", "roof_tank", "roof_pipes", "loading_dock", "crate_stacks", "side_conveyor", "bulb_row", "stone_accents", "roof_vents", "roof_coin", "poster", "roof_die", "roof_card", "door_at")
FRONT_FEATURES = ("sign", "awning", "monumental_door", "bushes", "door_hood", "round_window")
FACES = ("front", "back", "left", "right")

def use_palette(cfg):
    """Select the palette of a style: the shared cells, plus the extra cells of the style if it has some."""
    global PALETTE_NAMES, PALETTE_HEX
    entries = PALETTE_ENTRIES + cfg.get("palette_extra", [])
    PALETTE_NAMES = [name for name, _ in entries]
    PALETTE_HEX = dict(entries)
    return entries


def ink_for(spec, board):
    """Light ink on a dark board, the style's dark ink on a light one."""
    value = PALETTE_HEX[PALETTE_NAMES[board]].lstrip("#")
    red, green, blue = (int(value[i:i + 2], 16) / 255 for i in (0, 2, 4))
    if 0.2126 * red + 0.7152 * green + 0.0722 * blue < 0.5:
        return PALETTE_NAMES.index("white")
    return PALETTE_NAMES.index(spec["cfg"]["ink"])


STYLES = {
    "vivid": {
        "colors": {"wall": "coral", "roof": "brick", "trim": "cream", "door": "navy", "accent": "sun", "glass": "navy"},
        "ink": "navy", "overhang": 0.04, "verge": 0.02, "corner": 0.04, "roof_thickness": 0.012, "roof_fillet": 0.012, "gable_wall": False,
        "base_height": 0.05, "base_push": 0.01, "belt_height": 0.012, "belt_push": 0.007, "cornice": True,
        "window_mode": "layered", "window_pitch": 0.30, "window_width": 0.13, "window_pad": 0.024, "window_depth": 0.016,
        "window_height": 0.52, "window_z": 0.28, "sill": True, "margin": 0.07, "frame_radius": 0.012,
        "panes": {"house": (2, 3), "apartment": (2, 2), "office": (3, 1)}, "office_width": 0.2,
        "door_width": 0.14, "door_max_height": 0.22, "door_height": 0.78, "door_monumental": (0.22, 1.0),
        "door_post": 0.016, "door_post_mon": 0.028, "door_plate_depth": 0.016, "door_depth": 0.02, "handle_depth": 0.03,
        "door_radius": 0.016, "budget_per_floor_tile": 300,
    },
    "kenney": {
        "colors": {"wall": "offwhite", "roof": "softgreen", "trim": "slate", "door": "slate_dark", "accent": "softgreen", "glass": "glass_blue"},
        "ink": "slate_dark", "overhang": 0.06, "verge": 0.03, "corner": 0.05, "roof_thickness": 0.045, "roof_fillet": 0.02, "gable_wall": True,
        "base_height": 0.07, "base_push": 0.025, "belt_height": 0.03, "belt_push": 0.022, "cornice": False,
        "window_mode": "plate", "window_pitch": 0.5, "window_width": 0.2, "window_pad": 0.024, "window_depth": 0.016,
        "window_height": 0.52, "window_z": 0.25, "sill": False, "margin": 0.1, "frame_radius": 0.016,
        "panes": (2, 1), "office_width": 0.2,
        "door_width": 0.17, "door_max_height": 0.26, "door_height": 0.85, "door_monumental": (0.24, 1.0),
        "door_post": 0.022, "door_post_mon": 0.035, "door_plate_depth": 0.016, "door_depth": 0.02, "handle_depth": 0.03,
        "door_radius": 0.02, "budget_per_floor_tile": 350,
    },
}

STYLES["urbtopia"] = {
    **STYLES["kenney"],
    "palette_extra": URBTOPIA_ENTRIES, "text": "vector", "font": "SpaceGrotesk.ttf", "font_bold": 0.035,
    "colors": {"wall": "uwall", "roof": "uroof", "trim": "utrim", "door": "udark", "accent": "uroof", "glass": "glass_blue"},
    "ink": "udark", "overhang": 0.07, "verge": 0.03, "corner": 0.03, "roof_thickness": 0.03, "roof_fillet": 0.012,
    "base_height": 0.045, "base_push": 0.01, "belt_height": 0.0, "belt_push": 0.0,
    "window_pitch": 0.5, "window_width": 0.24, "window_height": 0.44, "window_z": 0.40, "margin": 0.08, "frame_radius": 0.018,
    "floor_height": {"house": 0.26, "apartment": 0.26, "office": 0.28},
    "parapet": 0.06, "parapet_width": 0.035,
}

PORTICO_PROJECTION = 0.18  # how far a portico stands out of the front wall: the body footprint is smaller by this much
SAWTOOTH_HEIGHT = 0.16
SAWTOOTH_TOOTH = 0.5
ROOF_PITCH_DEG = 35.0
SHED_PITCH_DEG = 18.0
MAX_ROOF_HEIGHT = 0.6
MAX_SHED_HEIGHT = 0.35
DECAL_OFFSET = 0.004
DECAL_STEP = 0.003
MULLION = 0.009
MANSARD_LOWER_DEG = 72.0
MANSARD_UPPER_DEG = 25.0
MANSARD_RUN_RATIO = 0.22
DORMER_WIDTH = 0.15
DORMER_FILLET = 0.006
FILLET_SEGMENTS = 2
WIDTH_FACTORS = (0.8, 1.0, 1.25)
HEIGHT_FACTORS = (0.9, 1.0, 1.1)
FONT = {  # 3x5 pixel letters, one string of 3 bits per row
    "A": ("010", "101", "111", "101", "101"), "B": ("110", "101", "110", "101", "110"),
    "C": ("111", "100", "100", "100", "111"), "E": ("111", "100", "110", "100", "111"),
    "H": ("101", "101", "111", "101", "101"), "I": ("111", "010", "010", "010", "111"),
    "L": ("100", "100", "100", "100", "111"), "N": ("111", "101", "101", "101", "101"),
    "O": ("111", "101", "101", "101", "111"), "P": ("111", "101", "111", "100", "100"),
    "R": ("110", "101", "110", "101", "101"), "S": ("111", "100", "111", "001", "111"),
    "T": ("111", "010", "010", "010", "010"), "U": ("101", "101", "101", "101", "111"),
    "D": ("110", "101", "101", "101", "110"), "F": ("111", "100", "110", "100", "100"),
    "G": ("111", "100", "101", "101", "111"), "J": ("001", "001", "001", "101", "111"),
    "K": ("101", "101", "110", "101", "101"), "V": ("101", "101", "101", "101", "010"),
    "X": ("101", "101", "010", "101", "101"), "Y": ("101", "101", "010", "010", "010"),
    "Z": ("111", "001", "010", "100", "111"),
}
SIGN_PIXEL = 0.012
ROOF_SIGN_PIXEL = 0.016
SIGN_CLEARANCE = 0.2
SIGN_BOARD_DEPTH = 0.03
FACE_FRAME = {  # outward normal, tangent seen from outside (to the right)
    "front": ((0, -1), (1, 0)),
    "back": ((0, 1), (-1, 0)),
    "left": ((-1, 0), (0, -1)),
    "right": ((1, 0), (0, 1)),
}


def check_spec(spec):
    kind = spec["kind"]
    if kind not in FLOOR_HEIGHT:
        raise ValueError(f"kind must be one of {list(FLOOR_HEIGHT)}")
    if spec.get("style", "kenney") not in STYLES:
        raise ValueError(f"style must be one of {list(STYLES)}")
    if spec["roof"] not in ROOF_STYLES:
        raise ValueError(f"roof must be one of {ROOF_STYLES}")
    style = STYLES[spec.get("style", "kenney")]
    for name in {**style["colors"], **spec.get("colors", {})}.values():
        if name not in PALETTE_NAMES:
            raise ValueError(f"unknown palette color {name}")
    if spec.get("window_sizes", "same") not in ("same", "varied"):
        raise ValueError("window_sizes must be same or varied")
    for feature in spec.get("features", []):
        if feature["type"] not in FEATURES:
            raise ValueError(f"feature must be one of {FEATURES}")
        if feature.get("face", "front") not in FACES:
            raise ValueError(f"face must be one of {FACES}")
    low, high = FLOOR_RANGE[kind]
    if not low <= spec["floors"] <= high:
        print(f"[building] WARNING {spec['floors']} floors is outside {low}-{high} for {kind}")


def _bm(verts, faces):
    return lpm._bm_from(verts, faces)


def color_index(spec, role):
    return PALETTE_NAMES.index(spec["colors"][role])


def has_feature(spec, kind):
    return any(f["type"] == kind for f in spec.get("features", []))


def rounded_block(name, width, depth, height, color, ratio, at=(0, 0, 0)):
    radius = ratio * min(width, depth)
    cx, cy, z = at
    outline = []
    for corner_x, corner_y, start in ((1, -1, -90), (1, 1, 0), (-1, 1, 90), (-1, -1, 180)):
        for step in (0, 45, 90):
            angle = math.radians(start + step)
            outline.append((cx + corner_x * (width / 2 - radius) + radius * math.cos(angle),
                            cy + corner_y * (depth / 2 - radius) + radius * math.sin(angle)))
    count = len(outline)
    verts = [(x, y, z) for x, y in outline] + [(x, y, z + height) for x, y in outline]
    faces = [(i, (i + 1) % count, count + (i + 1) % count, count + i) for i in range(count)]
    faces.append(tuple(reversed(range(count))))
    faces.append(tuple(range(count, 2 * count)))
    return lpm._object(name, _bm(verts, faces), color)


def rounded_wedge(name, width, depth, ratio, color, base, top_z, across):
    """A rounded block (same corners as the walls) from z=base up to a top that follows top_z(b), b being the x or y coordinate."""
    radius = ratio * min(width, depth)
    outline = []
    for corner_x, corner_y, start in ((1, -1, -90), (1, 1, 0), (-1, 1, 90), (-1, -1, 180)):
        for step in (0, 45, 90):
            angle = math.radians(start + step)
            outline.append((corner_x * (width / 2 - radius) + radius * math.cos(angle),
                            corner_y * (depth / 2 - radius) + radius * math.sin(angle)))
    count = len(outline)
    verts = [(x, y, base) for x, y in outline] + [(x, y, top_z(y if across == "y" else x)) for x, y in outline]
    faces = [(i, (i + 1) % count, count + (i + 1) % count, count + i) for i in range(count)]
    faces.append(tuple(reversed(range(count))))
    faces.append(tuple(range(count, 2 * count)))
    return lpm._object(name, _bm(verts, faces), color)


def slanted_blocks(name, width, depth, height, ratio, colors, at, slope):
    """A rounded block cut in two colors along a plane that rises toward the back (+Y): returns (lower, upper)."""
    radius = ratio * min(width, depth)
    cx, cy, z = at
    outline = []
    for corner_x, corner_y, start in ((1, -1, -90), (1, 1, 0), (-1, 1, 90), (-1, -1, 180)):
        for step in (0, 45, 90):
            angle = math.radians(start + step)
            outline.append((cx + corner_x * (width / 2 - radius) + radius * math.cos(angle),
                            cy + corner_y * (depth / 2 - radius) + radius * math.sin(angle)))
    count = len(outline)

    def cut(y):
        return z + height / 2 + slope * (y - cy)

    def prism(bottom, top):
        verts = [(px, py, bottom(py)) for px, py in outline] + [(px, py, top(py)) for px, py in outline]
        faces = [(i, (i + 1) % count, count + (i + 1) % count, count + i) for i in range(count)]
        faces.append(tuple(reversed(range(count))))
        faces.append(tuple(range(count, 2 * count)))
        return faces, verts

    lower_faces, lower_verts = prism(lambda py: z, cut)
    upper_faces, upper_verts = prism(cut, lambda py: z + height)
    return (lpm._object(f"{name}_low", _bm(lower_verts, lower_faces), colors[0]),
            lpm._object(f"{name}_high", _bm(upper_verts, upper_faces), colors[1]))


# --------------------------------------------------------------------------- roofs

def mansard_dimensions(spec):
    floor = spec["floor_height"]
    width, depth = spec["footprint"]
    lower = floor
    inset = lower / math.tan(math.radians(MANSARD_LOWER_DEG))
    run = MANSARD_RUN_RATIO * min(width, depth)
    upper = math.tan(math.radians(MANSARD_UPPER_DEG)) * run
    return lower, inset, run, upper


def roof_dimensions(spec):
    width, depth = spec["footprint"]
    long_side, short_side = max(width, depth), min(width, depth)
    if "roof_height" in spec:
        height = spec["roof_height"]
    elif spec["roof"] == "sawtooth":
        height = SAWTOOTH_HEIGHT
    elif spec["roof"] == "shed":
        height = min(MAX_SHED_HEIGHT, math.tan(math.radians(SHED_PITCH_DEG)) * short_side)
    else:
        height = min(MAX_ROOF_HEIGHT, math.tan(math.radians(ROOF_PITCH_DEG)) * short_side / 2)
    return long_side, short_side, height


def roof_height(spec):
    thickness = spec["cfg"]["roof_thickness"]
    if spec["roof"] == "flat":
        return spec["cfg"]["base_height"] if spec.get("slab_matches_plinth") else max(thickness, 0.04)
    if spec["roof"] == "mansard":
        lower, _, _, upper = mansard_dimensions(spec)
        return lower + upper
    return thickness + roof_dimensions(spec)[2]


def ridge_offset(spec):
    """Ridge position across the short axis, measured from the middle (negative = toward the front or left)."""
    short_side = roof_dimensions(spec)[1]
    if spec["roof"] == "gable_third":
        return -short_side / 6
    return 0.0


def _to_xy(spec, along, across):
    width, depth = spec["footprint"]
    return (along, across) if width >= depth else (across, along)


def mansard_mesh(spec, z, color):
    width, depth = spec["footprint"]
    lower, inset, run, upper = mansard_dimensions(spec)
    rings = []
    for level_z, margin in ((z, 0.0), (z + lower, inset), (z + lower + upper, inset + run)):
        half_w, half_d = width / 2 - margin, depth / 2 - margin
        rings.append([(-half_w, -half_d, level_z), (half_w, -half_d, level_z), (half_w, half_d, level_z), (-half_w, half_d, level_z)])
    verts = [v for ring in rings for v in ring]
    faces = [(0, 3, 2, 1), (8, 9, 10, 11)]
    for ring in (0, 1):
        for i in range(4):
            a, b = ring * 4 + i, ring * 4 + (i + 1) % 4
            faces.append((a, b, b + 4, a + 4))
    return lpm._object("roof", _bm(verts, faces), color)


def fillet(ob, width):
    """Round every edge of a closed solid with a small fillet; new faces keep the color of their neighbours."""
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=width, segments=FILLET_SEGMENTS, profile=0.5, affect="EDGES", clamp_overlap=True)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(ob.data)
    bm.free()
    for polygon in ob.data.polygons:
        polygon.use_smooth = False
    return ob


def ridge_along_x(spec):
    width, depth = spec["footprint"]
    return width >= depth


def hip_ratio_of(spec):
    """Share of the roof length each end slopes over (a hipped end instead of a gable), for a gable_half roof."""
    return spec.get("hip_ratio") if spec["roof"] == "gable_half" else None


def has_gable_ends(spec):
    return spec["roof"] in ("gable_half", "gable_third", "shed") and not hip_ratio_of(spec)


def extrude_profile(spec, name, profile, a0, a1, color):
    """Closed prism: a (b, z) profile extruded along the ridge axis from a0 to a1."""
    count = len(profile)
    verts = [(*_to_xy(spec, a0, b), z) for b, z in profile] + [(*_to_xy(spec, a1, b), z) for b, z in profile]
    faces = [(i, (i + 1) % count, count + (i + 1) % count, count + i) for i in range(count)]
    faces.append(tuple(reversed(range(count))))
    faces.append(tuple(range(count, 2 * count)))
    return lpm._object(name, _bm(verts, faces), color)


def gable_roof_parts(spec, z):
    """Thin roof slab with a small verge, plus a gable wall flush with the facades under it."""
    cfg = spec["cfg"]
    thickness = cfg["roof_thickness"]
    long_side, short_side, height = roof_dimensions(spec)
    half_s = short_side / 2
    body_short = (spec["body"][1] if ridge_along_x(spec) else spec["body"][0]) / 2
    body_long = (spec["body"][0] if ridge_along_x(spec) else spec["body"][1]) / 2
    if spec["roof"] == "shed":
        raised = 1 if ridge_along_x(spec) else -1
        low_b, high_b = -raised * half_s, raised * half_s
        slab = [(low_b, z), (low_b, z + thickness), (high_b, z + thickness + height), (high_b, z + height)]

        def under(b):
            return z + height * (b - low_b) / (high_b - low_b)

        attic = [(-body_short, z), (body_short, z), (body_short, under(body_short)), (-body_short, under(-body_short))]
    else:
        ridge = ridge_offset(spec)
        slab = [(-half_s, z), (-half_s, z + thickness), (ridge, z + thickness + height), (half_s, z + thickness), (half_s, z), (ridge, z + height)]

        def under(b):
            return z + height * ((b + half_s) / (ridge + half_s) if b <= ridge else (half_s - b) / (half_s - ridge))

        attic = [(-body_short, z), (body_short, z), (body_short, under(body_short)), (ridge, z + height), (-body_short, under(-body_short))]
    attic_color = color_index(spec, "wall") if cfg["gable_wall"] else color_index(spec, "roof")
    roof = fillet(extrude_profile(spec, "roof", slab, -long_side / 2, long_side / 2, color_index(spec, "roof")), cfg["roof_fillet"])
    if spec["roof"] == "shed":
        wall = rounded_wedge("gable_wall", spec["body"][0], spec["body"][1], cfg["corner"], attic_color, z, under, "y" if ridge_along_x(spec) else "x")
        return [roof, wall]
    return [roof, extrude_profile(spec, "gable_wall", attic, -body_long, body_long, attic_color)]


def sawtooth_parts(spec, z):
    """Factory roof: a row of slanted teeth along the short axis, each with a vertical glazed face."""
    long_side, short_side, height = roof_dimensions(spec)
    base = 0.03
    teeth = max(2, round(short_side / SAWTOOTH_TOOTH))
    half = short_side / 2
    step = short_side / teeth
    top = [(-half, z + base)]
    glass = []
    for tooth in range(teeth):
        edge = -half + (tooth + 1) * step
        top += [(edge, z + base + height), (edge, z + base)]
        glass.append(edge)
    top.pop()
    top.append((half, z + base))
    outline = [(-half, z), (half, z)] + list(reversed(top))
    roof = [extrude_profile(spec, "roof", outline, -long_side / 2, long_side / 2, color_index(spec, "roof"))]
    pane = color_index(spec, "glass")
    for index, edge in enumerate(glass):
        window = [(edge - 0.004, z + base + 0.025), (edge + 0.006, z + base + 0.025), (edge + 0.006, z + base + height - 0.02), (edge - 0.004, z + base + height - 0.02)]
        roof.append(extrude_profile(spec, f"tooth_glass_{index}", window, -long_side / 2 + 0.05, long_side / 2 - 0.05, pane))
    return roof


def roof_parts(spec, z):
    cfg = spec["cfg"]
    thickness = cfg["roof_thickness"]
    roof_color = color_index(spec, "roof")
    style = spec["roof"]
    width, depth = spec["footprint"]
    if style == "flat":
        slab = cfg["base_height"] if spec.get("slab_matches_plinth") else max(thickness, 0.04)
        roof = [fillet(lpm.box("roof", (width, depth, slab), at=(0, 0, z), color=roof_color), cfg["roof_fillet"])]
        if spec.get("roof_stripe"):
            roof.append(lpm.box("roof_stripe", (width + 0.004, depth + 0.004, slab * 0.3), at=(0, 0, z), color=PALETTE_NAMES.index(spec["roof_stripe"])))
        parapet, wall = cfg.get("parapet"), cfg.get("parapet_width", 0)
        if not parapet:
            return roof
        dark = color_index(spec, "door")
        base = z + slab - 0.005
        if spec.get("roof_deck"):
            roof.append(lpm.box("roof_deck", (width - 2 * wall, depth - 2 * wall, 0.006), at=(0, 0, z + slab - 0.003), color=PALETTE_NAMES.index(spec["roof_deck"])))
        roof.append(lpm.box("parapet_front", (width, wall, parapet), at=(0, -(depth - wall) / 2, base), color=dark))
        roof.append(lpm.box("parapet_back", (width, wall, parapet), at=(0, (depth - wall) / 2, base), color=dark))
        roof.append(lpm.box("parapet_left", (wall, depth - 2 * wall + 0.01, parapet), at=(-(width - wall) / 2, 0, base), color=dark))
        roof.append(lpm.box("parapet_right", (wall, depth - 2 * wall + 0.01, parapet), at=((width - wall) / 2, 0, base), color=dark))
        return roof
    if style == "sawtooth":
        return sawtooth_parts(spec, z)
    if style == "mansard":
        return [fillet(mansard_mesh(spec, z, roof_color), cfg["roof_fillet"])]
    if has_gable_ends(spec):
        return gable_roof_parts(spec, z)
    long_side, short_side, height = roof_dimensions(spec)
    half_l, half_s = long_side / 2, short_side / 2
    corners = [(-half_l, -half_s), (half_l, -half_s), (half_l, half_s), (-half_l, half_s)]
    top = z + thickness
    ring0 = [(*_to_xy(spec, a, b), z) for a, b in corners]
    ring1 = [(*_to_xy(spec, a, b), top) for a, b in corners]
    fascia = [(0, 3, 2, 1), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    run = (long_side - short_side) / 2
    if hip_ratio_of(spec):
        run = long_side / 2 - long_side * hip_ratio_of(spec)
    if run < 1e-3:
        ridge = [(*_to_xy(spec, 0, 0), top + height)]
        faces = fascia + [(4, 5, 8), (5, 6, 8), (6, 7, 8), (7, 4, 8)]
    else:
        ridge = [(*_to_xy(spec, -run, 0), top + height), (*_to_xy(spec, run, 0), top + height)]
        faces = fascia + [(4, 5, 9, 8), (5, 6, 9), (6, 7, 8, 9), (7, 4, 8)]
    return [fillet(lpm._object("roof", _bm(ring0 + ring1 + ridge, faces), roof_color), cfg["roof_fillet"])]


# --------------------------------------------------------------------------- wall attachments

def wall_extent(spec, face):
    width, depth = spec["body"]
    return (width, depth) if face in ("front", "back") else (depth, width)


def wall_half(spec, face):
    width, depth = spec["body"]
    return depth / 2 if face in ("front", "back") else width / 2


def plane_point(face, along, distance, z):
    (nx, ny), (tx, ty) = FACE_FRAME[face]
    return (nx * distance + tx * along, ny * distance + ty * along, z)


def wall_box(spec, name, face, along, z, size, color, embed=0.01, half=None):
    """Box attached to a wall plane. size = (length along the wall, depth out of the wall, height)."""
    length, depth, height = size
    plane = wall_half(spec, face) if half is None else half
    x, y, z0 = plane_point(face, along, plane + depth / 2 - embed, z)
    box_size = (length, depth, height) if face in ("front", "back") else (depth, length, height)
    return lpm.box(name, box_size, at=(x, y, z0), color=color)


def _decal(name, points, color):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bm.faces.new([bm.verts.new(Vector(p)) for p in points])
    bm.to_mesh(mesh)
    bm.free()
    ob = bpy.data.objects.new(name, mesh)
    lpm._col("COL_LowPoly").objects.link(ob)
    attr = mesh.attributes.new("lpm_color", "INT", "FACE")
    attr.data[0].value = int(color)
    return ob


def wall_quad(spec, name, face, along, z, width, height, color, push=DECAL_OFFSET, half=None):
    plane = wall_half(spec, face) if half is None else half
    corners = [(-width / 2, 0), (width / 2, 0), (width / 2, height), (-width / 2, height)]
    return _decal(name, [plane_point(face, along + u, plane + push, z + v) for u, v in corners], color)


def rounded_outline(width, height, radius):
    """Rounded rectangle outline (u, v) from the bottom-left, 2 segments per corner, counter-clockwise."""
    outline = []
    for corner_u, corner_v, start in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        for step in (0, 45, 90):
            angle = math.radians(start + step)
            outline.append((corner_u * (width / 2 - radius) + radius * math.cos(angle),
                            height / 2 + corner_v * (height / 2 - radius) + radius * math.sin(angle)))
    return outline


def wall_rounded_plate(spec, name, face, along, z, width, height, depth, color, radius, embed=0.01, half=None):
    """Closed slab with rounded corners, attached to a wall plane; used for window and door surrounds."""
    plane = wall_half(spec, face) if half is None else half
    outline = rounded_outline(width, height, min(radius, width / 2, height / 2))
    count = len(outline)
    verts = [plane_point(face, along + u, plane - embed, z + v) for u, v in outline]
    verts += [plane_point(face, along + u, plane - embed + depth, z + v) for u, v in outline]
    faces = [(i, (i + 1) % count, count + (i + 1) % count, count + i) for i in range(count)]
    faces.append(tuple(reversed(range(count))))
    faces.append(tuple(range(count, 2 * count)))
    return lpm._object(name, _bm(verts, faces), color)


def wall_rounded_quad(spec, name, face, along, z, width, height, color, radius, push=DECAL_OFFSET, half=None):
    plane = wall_half(spec, face) if half is None else half
    outline = rounded_outline(width, height, min(radius, width / 2, height / 2))
    return _decal(name, [plane_point(face, along + u, plane + push, z + v) for u, v in outline], color)


# --------------------------------------------------------------------------- doors and windows

def door_layout(spec):
    cfg, floor = spec["cfg"], spec["floor_height"]
    if has_feature(spec, "monumental_door"):
        width, factor = cfg["door_monumental"]
        return width, floor * factor
    return cfg["door_width"], min(cfg["door_max_height"], floor * cfg["door_height"])


def add_door(spec, parts):
    cfg = spec["cfg"]
    width, height = door_layout(spec)
    trim, door = color_index(spec, "trim"), color_index(spec, "door")
    monumental = has_feature(spec, "monumental_door")
    at = spec.get("door_along", 0.0)
    post = cfg["door_post_mon"] if monumental else cfg["door_post"]
    parts.append(wall_rounded_plate(spec, "door_surround", "front", at, 0, width + 2 * post, height + post, cfg["door_plate_depth"], trim, cfg["door_radius"]))
    if monumental:
        parts.append(wall_box(spec, "door_pediment", "front", at, height + post - 0.005, (width + 2 * post + 0.04, 0.03, 0.025), trim))
    parts.append(wall_box(spec, "door_step", "front", at, 0, (width + 2 * post + 0.02, 0.035, 0.014), trim))
    parts.append(wall_box(spec, "door", "front", at, 0, (width, cfg["door_depth"], height), door))
    if spec["kind"] == "office":
        parts.append(wall_quad(spec, "decal_door_split", "front", at, 0.014, 0.008, height - 0.014, trim, push=cfg["door_depth"] - 0.01 + DECAL_STEP))
    parts.append(wall_box(spec, "door_handle", "front", at + width / 2 - 0.03, height * 0.45, (0.014, cfg["handle_depth"], 0.03), color_index(spec, "accent")))


def add_garage_door(spec, parts):
    cfg, floor = spec["cfg"], spec["floor_height"]
    width = min(0.5, spec["body"][0] * 0.7)
    height = min(0.24, floor * 0.8)
    trim, door = color_index(spec, "trim"), color_index(spec, "door")
    parts.append(wall_rounded_plate(spec, "garage_surround", "front", 0, 0, width + 0.07, height + 0.035, cfg["door_plate_depth"], trim, cfg["door_radius"]))
    parts.append(wall_box(spec, "garage_door", "front", 0, 0, (width, cfg["door_depth"], height), door))
    for index in (1, 2):
        parts.append(wall_quad(spec, f"decal_garage_line_{index}", "front", 0, height * index / 3 - 0.004, width - 0.02, 0.008, trim, push=cfg["door_depth"] - 0.01 + DECAL_STEP))


def panes_for(spec):
    panes = spec["cfg"]["panes"]
    return panes[spec["kind"]] if isinstance(panes, dict) else panes


def add_window(spec, parts, tag, face, along, z, width, height, half=None, panes=None):
    cfg = spec["cfg"]
    trim, glass = color_index(spec, "trim"), color_index(spec, "glass")
    columns, rows = panes or panes_for(spec)
    pad, depth, radius = cfg["window_pad"], cfg["window_depth"], cfg["frame_radius"]
    if cfg["sill"]:
        parts.append(wall_box(spec, f"sill_{tag}", face, along, z - 0.014, (width + 0.05, 0.022, 0.014), trim, half=half))
    if cfg["window_mode"] == "plate":
        parts.append(wall_rounded_plate(spec, f"frame_{tag}", face, along, z - pad, width + 2 * pad, height + 2 * pad, depth, trim, radius, half=half))
        base = depth - 0.01 + DECAL_STEP
        parts.append(wall_rounded_quad(spec, f"decal_glass_{tag}", face, along, z, width, height, glass, 0.012, push=base, half=half))
        for column in range(1, columns):
            parts.append(wall_quad(spec, f"decal_mullion_v_{tag}_{column}", face, along - width / 2 + width * column / columns, z, MULLION * 1.4, height, trim, push=base + DECAL_STEP, half=half))
        for row in range(1, rows):
            parts.append(wall_quad(spec, f"decal_mullion_h_{tag}_{row}", face, along, z + height * row / rows - MULLION / 2, width, MULLION * 1.4, trim, push=base + DECAL_STEP, half=half))
        return
    if spec["kind"] == "house":
        parts.append(wall_rounded_plate(spec, f"frame_{tag}", face, along, z - pad / 2, width + pad, height + pad, depth, trim, radius, half=half))
        parts.append(wall_box(spec, f"glass_{tag}", face, along, z, (width, depth + 0.004, height), glass, half=half))
        for column in range(1, columns):
            parts.append(wall_box(spec, f"mullion_v_{tag}_{column}", face, along - width / 2 + width * column / columns, z, (MULLION, depth + 0.008, height), trim, half=half))
        for row in range(1, rows):
            parts.append(wall_box(spec, f"mullion_h_{tag}_{row}", face, along, z + height * row / rows - MULLION / 2, (width, depth + 0.008, MULLION), trim, half=half))
        return
    parts.append(wall_rounded_quad(spec, f"decal_frame_{tag}", face, along, z - pad / 2, width + pad, height + pad, trim, radius, push=DECAL_OFFSET, half=half))
    parts.append(wall_quad(spec, f"decal_glass_{tag}", face, along, z, width, height, glass, push=DECAL_OFFSET + DECAL_STEP, half=half))
    for column in range(1, columns):
        parts.append(wall_quad(spec, f"decal_mullion_v_{tag}_{column}", face, along - width / 2 + width * column / columns, z, MULLION, height, trim, push=DECAL_OFFSET + 2 * DECAL_STEP, half=half))
    for row in range(1, rows):
        parts.append(wall_quad(spec, f"decal_mullion_h_{tag}_{row}", face, along, z + height * row / rows - MULLION / 2, width, MULLION, trim, push=DECAL_OFFSET + 2 * DECAL_STEP, half=half))


def window_columns(spec, face, rng):
    """Evenly spread window centres along a face and their widths (all equal, or varied by column with `window_sizes: varied`)."""
    cfg = spec["cfg"]
    length, _ = wall_extent(spec, face)
    usable = length - 2 * cfg["margin"]
    count = max(1, int(usable / cfg["window_pitch"]))
    pitch = usable / count
    base_width = min(cfg["window_width"], pitch * 0.5) if spec["kind"] != "office" else min(cfg["office_width"], pitch * 0.7)
    columns = [-usable / 2 + pitch * (index + 0.5) for index in range(count)]
    if spec.get("window_sizes", "same") != "varied":
        return columns, [base_width] * count
    widest = max(base_width, pitch * 0.8 - 2 * cfg["window_pad"])
    return columns, [min(widest, base_width * rng.choice(WIDTH_FACTORS)) for _ in columns]


PIXEL_ART = {
    "pacman": ("..yyyyy..", ".yyyyyyy.", "yyyyyyy..", "yyyyyy...", "yyyyy....", "yyyyyy...", "yyyyyyy..", ".yyyyyyy.", "..yyyyy.."),
    "invader": ("..g.....g..", "...g...g...", "..ggggggg..", ".gg.ggg.gg.", "ggggggggggg", "g.ggggggg.g", "g.g.....g.g", "...gg.gg..."),
}


def opening_boxes(spec, face):
    """(centre along, width, bottom z, top z) of the windows, posters and doors of a face, to keep decoration off them."""
    floor, cfg = spec["floor_height"], spec["cfg"]
    boxes = []
    for extra in spec.get("extra_windows", []):
        if extra.get("face", "front") != face:
            continue
        for level in ([extra["level"]] if "level" in extra else range(spec["floors"])):
            bottom = level * floor + floor * extra.get("z_ratio", cfg["window_z"])
            boxes.append((extra["along"], extra.get("width", 0.2), bottom, bottom + floor * extra.get("height_ratio", cfg["window_height"])))
    for feature in spec.get("features", []):
        if feature["type"] == "poster" and feature.get("face", "front") == face:
            boxes.append((feature["along"], feature.get("width", 0.4), feature.get("z", 0.12), feature.get("z", 0.07) + feature.get("height", 0.3)))
    if face == "front":
        door_width, door_height = door_layout(spec)
        boxes.append((spec.get("door_along", 0.0), door_width + 0.1, 0.0, door_height + 0.1))
    if face == "back":
        for feature in spec.get("features", []):
            if feature["type"] == "industrial_door" and feature.get("face") == "back":
                boxes.append((feature.get("along", 0.0), feature.get("width", 0.7) + 0.1, 0.0, floor * 0.9))
    return boxes


def add_poster(spec, parts, feature):
    """A framed black poster with a pixel-art sprite, standing where a window would be."""
    face, along = feature.get("face", "front"), feature["along"]
    width, height, z = feature.get("width", 0.4), feature.get("height", 0.3), feature.get("z", 0.07)
    index = PALETTE_NAMES.index
    frame, black = color_index(spec, "trim"), index("graphite")
    thick = 0.012
    parts.append(wall_box(spec, f"poster_{face}_{along}", face, along, z, (width, 0.012, height), black))
    for edge, side in enumerate((-1, 1)):
        parts.append(wall_box(spec, f"poster_frame_{face}_{along}_{edge}", face, along + side * (width / 2 + thick / 2), z - thick, (thick, 0.02, height + 2 * thick), frame))
    parts.append(wall_box(spec, f"poster_frame_top_{face}_{along}", face, along, z + height, (width + 2 * thick, 0.02, thick), frame))
    parts.append(wall_box(spec, f"poster_frame_bottom_{face}_{along}", face, along, z - thick, (width + 2 * thick, 0.02, thick), frame))
    sprite = PIXEL_ART[feature["art"]]
    colors = {"y": index("sun"), "g": index("lime"), "w": index("white")}
    pixel = min(width * 0.8 / len(sprite[0]), height * 0.86 / len(sprite))
    left = along - len(sprite[0]) * pixel / 2 + (-width * 0.12 if feature["art"] == "pacman" else 0.0)
    top = z + height / 2 + len(sprite) * pixel / 2
    for row, line in enumerate(sprite):
        for column, cell in enumerate(line):
            if cell in colors:
                parts.append(wall_box(spec, f"px_{feature['art']}_{row}_{column}", face, left + (column + 0.5) * pixel, top - (row + 1) * pixel, (pixel * 0.94, 0.016, pixel * 0.94), colors[cell]))
    if feature["art"] == "pacman":
        for dot in range(3):
            parts.append(wall_box(spec, f"px_dot_{dot}", face, along + width * 0.16 + dot * pixel * 1.7, z + height / 2 - pixel * 0.4, (pixel * 0.6, 0.016, pixel * 0.6), colors["w"]))


def add_roof_die(spec, parts, x, y, size=0.22):
    """A white die standing on the roof, its three visible faces (front, right, top) set with dark pips."""
    base = roof_surface(spec) - 0.005
    white, dark = PALETTE_NAMES.index("white"), PALETTE_NAMES.index("graphite")
    parts.append(rounded_block("die", size, size, size, white, 0.12, at=(x, y, base)))
    pip = size * 0.13
    grids = {
        "front": ((-0.28, -0.28), (0.28, -0.28), (0.0, 0.0), (-0.28, 0.28), (0.28, 0.28)),
        "right": ((-0.25, -0.25), (0.25, 0.25)),
        "top": ((-0.25, -0.25), (0.25, -0.25), (-0.25, 0.25), (0.25, 0.25)),
    }
    for face, pips in grids.items():
        for index, (u, v) in enumerate(pips):
            if face == "front":
                at, dims = (x + u * size, y - size / 2 - 0.002, base + size * (0.5 + v)), (pip, 0.012, pip)
            elif face == "right":
                at, dims = (x + size / 2 + 0.002, y + u * size, base + size * (0.5 + v)), (0.012, pip, pip)
            else:
                at, dims = (x + u * size, y + v * size, base + size + 0.002), (pip, pip, 0.012)
            parts.append(lpm.box(f"die_pip_{face}_{index}", dims, at=(at[0], at[1], at[2] - (pip / 2 if face != "top" else 0.0)), color=dark))


def add_roof_card(spec, parts, x, y, size=0.34):
    """A playing card standing on the roof, facing the street, with a spade on it."""
    base = roof_surface(spec) - 0.005
    white, dark = PALETTE_NAMES.index("white"), PALETTE_NAMES.index("graphite")
    parts.append(lpm.box("card", (size * 0.7, 0.03, size), at=(x, y, base + 0.03), color=white))
    parts.append(lpm.box("card_stand_left", (0.03, 0.03, 0.04), at=(x - size * 0.25, y, base), color=dark))
    parts.append(lpm.box("card_stand_right", (0.03, 0.03, 0.04), at=(x + size * 0.25, y, base), color=dark))
    spade = ("..x..", ".xxx.", "xxxxx", "xxxxx", ".xxx.", "..x..", ".xxx.")
    pixel = size * 0.075
    for row, line in enumerate(spade):
        for column, cell in enumerate(line):
            if cell == "x":
                parts.append(lpm.box(f"spade_{row}_{column}", (pixel * 0.95, 0.012, pixel * 0.95), at=(x + (column - 2) * pixel, y - 0.021, base + 0.03 + size * 0.55 - (row - 3) * pixel), color=dark))


def add_door_at(spec, parts, along):
    """A second entrance: a dark door with a thin surround, on the front wall."""
    floor = spec["floor_height"]
    frame, dark = color_index(spec, "trim"), PALETTE_NAMES.index(spec["cfg"]["ink"])
    width, height, thick = 0.22, floor * 0.8, 0.012
    parts.append(wall_box(spec, f"door_at_{along}", "front", along, 0, (width, 0.02, height), dark))
    for edge, side in enumerate((-1, 1)):
        parts.append(wall_box(spec, f"door_at_frame_{along}_{edge}", "front", along + side * (width / 2 + thick / 2), 0, (thick, 0.026, height + thick), frame))
    parts.append(wall_box(spec, f"door_at_frame_top_{along}", "front", along, height, (width + 2 * thick, 0.026, thick), frame))


def add_service_door(spec, parts, face, along):
    """A plain dark door with a thin surround on a side wall, standing where a ground-floor window would be."""
    floor = spec["floor_height"]
    frame, dark = color_index(spec, "trim"), PALETTE_NAMES.index(spec["cfg"]["ink"])
    width, height, thick = 0.2, floor * 0.8, 0.012
    parts.append(wall_box(spec, f"service_door_{face}", face, along, 0, (width, 0.02, height), dark))
    for edge, side in enumerate((-1, 1)):
        parts.append(wall_box(spec, f"service_door_frame_{face}_{edge}", face, along + side * (width / 2 + thick / 2), 0, (thick, 0.026, height + thick), frame))
    parts.append(wall_box(spec, f"service_door_frame_{face}_top", face, along, height, (width + 2 * thick, 0.026, thick), frame))


def add_window_pilasters(spec, parts, tag, face, along, z, width, height):
    """Two slim pilasters standing off the wall on each side of a window and a small canopy over it, in the accent color."""
    cfg = spec["cfg"]
    trim, accent = color_index(spec, "trim"), color_index(spec, "accent")
    plane = wall_half(spec, face)
    pad = cfg["window_pad"]
    post, stand, reach = 0.028, 0.045, 0.085
    top = z + height + pad + 0.03
    for side, name in ((-1, "l"), (1, "r")):
        a = along + side * (width / 2 + pad + 0.04)
        parts.append(wall_box(spec, f"wp_{tag}_{name}", face, a, z - pad - 0.015, (post, reach - stand, top - z + pad + 0.015), trim, half=plane + stand))
        parts.append(wall_box(spec, f"wp_arm_{tag}_{name}", face, a, z - pad - 0.015, (post * 0.7, stand + 0.01, 0.02), trim))
    parts.append(wall_box(spec, f"wp_canopy_{tag}", face, along, top, (width + 2 * (pad + 0.06), reach + 0.02, 0.022), accent))


def windows_on_face(spec, parts, face, rng, has_door, blocked):
    cfg, floor = spec["cfg"], spec["floor_height"]
    columns, widths = window_columns(spec, face, rng)
    if "auto_windows" in spec and face not in spec["auto_windows"]:
        spec.setdefault("window_columns", {})[face] = columns
        columns, widths = [], []
    varied = spec.get("window_sizes", "same") == "varied"
    door_width, _ = door_layout(spec)
    spec.setdefault("window_columns", {})[face] = columns
    front_length, _ = wall_extent(spec, "front")
    loading = [(feature.get("along", -0.28) * front_length, min(feature.get("width", 0.34), front_length * 0.3) / 2 + 0.03)
               for feature in spec.get("features", []) if feature["type"] == "roller_door"]
    loading += [(feature["along"], 0.2) for feature in spec.get("features", []) if feature["type"] == "door_at"]
    for level in range(spec.get("auto_windows_from", 0) if "auto_windows" in spec else 0, spec["floors"]):
        height = floor * cfg["window_height"] * (rng.choice(HEIGHT_FACTORS) if varied else 1.0)
        for index, (along, width) in enumerate(zip(columns, widths)):
            reach = width / 2 + cfg["window_pad"]
            if has_door and face == "front" and level == 0 and abs(along - spec.get("door_along", 0.0)) < door_width / 2 + reach + 0.03:
                continue
            if any(a0 - reach < along < a1 + reach and level < levels for a0, a1, levels in blocked.get(face, [])):
                continue
            if face == "front" and level == 0 and any(abs(along - centre) < half + reach for centre, half in loading):
                continue
            service = spec.get("service_door")
            if service and service["face"] == face and level == 0 and index == service["index"]:
                add_service_door(spec, parts, face, along)
                continue
            zone = sign_zone(spec) if face == "front" else None
            window_bottom = level * floor + floor * cfg["window_z"] - cfg["window_pad"]
            if zone and abs(along) < zone[0] + reach and window_bottom < zone[2] and window_bottom + height + 2 * cfg["window_pad"] > zone[1]:
                continue
            add_window(spec, parts, f"{face}_{level}_{index}", face, along, level * floor + floor * cfg["window_z"], width, height)
            if spec.get("window_pilasters") and face == "front":
                add_window_pilasters(spec, parts, f"{face}_{level}_{index}", face, along, level * floor + floor * cfg["window_z"], width, height)
    for index, extra in enumerate(e for e in spec.get("extra_windows", []) if e.get("face", "front") == face):
        for level in ([extra["level"]] if "level" in extra else range(spec["floors"])):
            if level >= spec["floors"]:
                continue
            height = floor * extra.get("height_ratio", cfg["window_height"])
            width = extra["width"] if "width" in extra else (widths[0] if widths else 0.2) * extra.get("width_factor", 1.0)
            add_window(spec, parts, f"{face}_extra_{level}_{index}", face, extra["along"], level * floor + floor * extra.get("z_ratio", cfg["window_z"]), width, height, panes=tuple(extra["panes"]) if "panes" in extra else None)
            if extra.get("vasistas"):
                add_tilted_sash(spec, parts, f"{face}_{level}_{index}", face, extra["along"], level * floor + floor * extra.get("z_ratio", cfg["window_z"]), width, height)


def add_dormers(spec, parts):
    width, depth = spec["footprint"]
    floor = spec["floor_height"]
    lower, inset, _, _ = mansard_dimensions(spec)
    top = spec["floors"] * floor
    wall, roof = color_index(spec, "wall"), color_index(spec, "roof")
    for face in FACES:
        length = (width if face in ("front", "back") else depth)
        if face in ("left", "right") and length < 1.8:
            continue
        count = max(1, int((length - 0.3) / 0.55))
        pitch = (length - 0.3) / count
        plane = (depth if face in ("front", "back") else width) / 2 - 0.035
        base_z = top + lower * 0.22
        body_height, ridge, box_depth = 0.15, 0.065, 0.14
        for index in range(count):
            along = -(length - 0.3) / 2 + pitch * (index + 0.5)
            tag = f"dormer_{face}_{index}"
            x, y, _ = plane_point(face, along, plane - box_depth / 2, base_z)
            size = (DORMER_WIDTH, box_depth, body_height) if face in ("front", "back") else (box_depth, DORMER_WIDTH, body_height)
            parts.append(lpm.box(f"{tag}_cheeks", size, at=(x, y, base_z), color=wall))
            half_roof = DORMER_WIDTH / 2 + 0.025
            front, back = plane + 0.02, plane - box_depth
            apex_z, eave_z = base_z + body_height + ridge, base_z + body_height
            verts = [plane_point(face, along - half_roof, front, eave_z), plane_point(face, along + half_roof, front, eave_z),
                     plane_point(face, along, front, apex_z), plane_point(face, along - half_roof, back, eave_z),
                     plane_point(face, along + half_roof, back, eave_z), plane_point(face, along, back, apex_z)]
            faces = [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (0, 2, 5, 3), (1, 4, 5, 2)]
            parts.append(fillet(lpm._object(f"{tag}_roof", _bm(verts, faces), roof), DORMER_FILLET))
            add_window(spec, parts, tag, face, along, base_z + 0.025, 0.085, body_height - 0.05, half=plane)


# --------------------------------------------------------------------------- features

SIGN_TEXT_HEIGHT = 0.07
ROOF_SIGN_TEXT_HEIGHT = 0.09
ROOF_SIGN_LIFT = 0.07
_OUTLINES = {}


def text_outline(text, font=None, bold=0.02):
    """Flat glyph mesh of `text` in a font file of tools/blender/fonts (Blender's default typeface without one)."""
    key = (text, font, bold)
    if key in _OUTLINES:
        return _OUTLINES[key]
    curve = bpy.data.curves.new("sign_text", "FONT")
    curve.body = text
    curve.size = 1.0
    curve.align_x = "CENTER"
    curve.resolution_u = 3
    curve.offset = bold
    if font:
        curve.font = bpy.data.fonts.load(os.path.join(TOOLS_DIR, "fonts", font))
    holder = bpy.data.objects.new("sign_text", curve)
    bpy.context.scene.collection.objects.link(holder)
    mesh = bpy.data.meshes.new_from_object(holder.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    vertices = [(v.co.x, v.co.y) for v in mesh.vertices]
    polygons = [tuple(p.vertices) for p in mesh.polygons]
    bpy.data.objects.remove(holder)
    bpy.data.curves.remove(curve)
    bpy.data.meshes.remove(mesh)
    xs, ys = [v[0] for v in vertices], [v[1] for v in vertices]
    result = (vertices, polygons, max(xs) - min(xs), max(ys) - min(ys), min(xs), min(ys))
    _OUTLINES[key] = result
    return result


def sign_size(spec, text, text_height):
    """Width and height of the board that carries `text`."""
    if spec["cfg"].get("text") != "vector":
        pixel = text_height
        return (4 * len(text) - 1) * pixel + 0.04, 5 * pixel + 0.02
    _, _, width, height, _, _ = text_outline(text, spec.get("font", spec["cfg"].get("font")), spec.get("font_bold", spec["cfg"].get("font_bold", 0.02)))
    scale = text_height / height
    return width * scale + 0.07, text_height + 0.035


def glyph_decal(spec, name, face, text, along, z, text_height, color, distance):
    """The glyphs of `text` as flat polygons on a wall plane, text height `text_height`, left-aligned on `along`."""
    vertices, polygons, width, height, min_x, min_y = text_outline(text, spec.get("font", spec["cfg"].get("font")), spec.get("font_bold", spec["cfg"].get("font_bold", 0.02)))
    scale = text_height / height
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    verts = [bm.verts.new(Vector(plane_point(face, along + (x - min_x - width / 2) * scale, distance, z + (y - min_y) * scale))) for x, y in vertices]
    for polygon in polygons:
        bm.faces.new([verts[i] for i in polygon])
    bm.to_mesh(mesh)
    bm.free()
    ob = bpy.data.objects.new(name, mesh)
    lpm._col("COL_LowPoly").objects.link(ob)
    attr = mesh.attributes.new("lpm_color", "INT", "FACE")
    for item in attr.data:
        item.value = int(color)
    return ob


def sign_board_z(spec):
    if has_feature(spec, "awning"):
        _, door_height = door_layout(spec)
        return door_height + 0.06
    return spec["floor_height"] * 0.93


def sign_zone(spec):
    """Front wall sign as (half width, bottom z, top z), or None when there is no wall sign."""
    sign = next((f for f in spec.get("features", []) if f["type"] == "sign" and f.get("face", "front") == "front" and f.get("placement") != "roof"), None)
    if sign is None:
        return None
    text = sign.get("text", "")
    if not text:
        return 0.3, spec["floor_height"] * 0.84, spec["floor_height"] * 0.84 + 0.07
    z = sign_board_z(spec)
    board_width, board_height = sign_size(spec, text, SIGN_TEXT_HEIGHT if spec["cfg"].get("text") == "vector" else SIGN_PIXEL)
    return board_width / 2, z, z + board_height


def add_vector_sign_text(spec, parts, face, text, board_color, board_z, text_height, half=None):
    board_width, board_height = sign_size(spec, text, text_height)
    parts.append(wall_box(spec, f"sign_{face}", face, 0, board_z, (board_width, SIGN_BOARD_DEPTH, board_height), board_color, half=half))
    plane = wall_half(spec, face) if half is None else half
    ink = ink_for(spec, board_color)
    parts.append(glyph_decal(spec, "decal_text", face, text, 0, board_z + 0.0175, text_height, ink, plane + SIGN_BOARD_DEPTH - 0.01 + DECAL_OFFSET))


def add_sign_text(spec, parts, face, text, board_color, board_z, pixel=SIGN_PIXEL, half=None):
    if spec["cfg"].get("text") == "vector":
        add_vector_sign_text(spec, parts, face, text, board_color, board_z, SIGN_TEXT_HEIGHT if pixel == SIGN_PIXEL else ROOF_SIGN_TEXT_HEIGHT, half)
        return
    unsupported = [c for c in text if c not in FONT]
    if unsupported:
        raise ValueError(f"sign text supports {''.join(sorted(FONT))}, not {unsupported}")
    text_width = (4 * len(text) - 1) * pixel
    parts.append(wall_box(spec, f"sign_{face}", face, 0, board_z, (text_width + 0.04, SIGN_BOARD_DEPTH, 5 * pixel + 0.02), board_color, half=half))
    ink = PALETTE_NAMES.index(spec["cfg"]["ink"])
    left = -text_width / 2
    for letter_index, letter in enumerate(text):
        for row, bits in enumerate(FONT[letter]):
            for column, bit in enumerate(bits):
                if bit != "1":
                    continue
                along = left + (letter_index * 4 + column + 0.5) * pixel
                z = board_z + 0.01 + (4 - row) * pixel
                parts.append(wall_quad(spec, f"decal_text_{letter_index}_{row}_{column}", face, along, z, pixel, pixel, ink,
                                       push=SIGN_BOARD_DEPTH - 0.01 + DECAL_OFFSET, half=half))


def add_roof_sign(spec, parts, face, text, board_color, extra_lift=0.0):
    """Board standing on a flat roof, set back from the edge, text facing outward."""
    if spec["roof"] not in ("flat", "sawtooth"):
        raise ValueError("a roof sign needs a flat or sawtooth roof")
    top = spec["floors"] * spec["floor_height"]
    half = wall_half(spec, face) - 0.06
    if spec["cfg"].get("text") != "vector":
        add_sign_text(spec, parts, face, text, board_color, top + 0.035, pixel=ROOF_SIGN_PIXEL, half=half)
        return
    lift = ROOF_SIGN_LIFT + extra_lift
    board_z = top + 0.035 + lift
    board_width, board_height = sign_size(spec, text, ROOF_SIGN_TEXT_HEIGHT)
    trim = color_index(spec, "trim")
    for side in (-1, 1):
        parts.append(wall_box(spec, f"sign_leg_{side}", face, side * (board_width / 2 - 0.05), top + 0.03, (0.03, 0.03, lift + 0.02), trim, half=half))
    parts.append(wall_box(spec, "sign_frame", face, 0, board_z - 0.014, (board_width + 0.04, 0.02, board_height + 0.028), PALETTE_NAMES.index("white"), half=half - 0.012))
    add_sign_text(spec, parts, face, text, board_color, board_z, pixel=ROOF_SIGN_PIXEL, half=half)


def visible_side(spec):
    """Across-sign of the slope seen from the game camera: the front slope, or the right slope when the ridge runs front to back."""
    width, depth = spec["footprint"]
    return -1 if width >= depth else 1


def slope_frame(spec):
    """Visible roof slope: (eave across, high across, eave z, high z)."""
    _, short_side, height = roof_dimensions(spec)
    low_z = spec["floors"] * spec["floor_height"] + spec["cfg"]["roof_thickness"]
    side = visible_side(spec)
    high_across = -side * short_side / 2 if spec["roof"] == "shed" else ridge_offset(spec)
    return side * short_side / 2, high_across, low_z, low_z + height


def add_mansard_solar_panels(spec, parts):
    """Panels on the shallow upper slope facing the game camera, kept inside the trapezoid of that slope."""
    long_side, short_side = max(spec["footprint"]), min(spec["footprint"])
    lower, inset, run, upper = mansard_dimensions(spec)
    side = visible_side(spec)
    base_z = spec["floors"] * spec["floor_height"] + lower
    eave_across = side * (short_side / 2 - inset)
    count_a, count_s = 3, 2
    span_a, gap_a, gap_s = (long_side / 2 - inset - run) * 2 * 0.9, 0.015, 0.03
    panel_a = (span_a - gap_a * (count_a - 1)) / count_a
    panel_s = (0.8 - gap_s * (count_s - 1)) / count_s
    solar = PALETTE_NAMES.index("solar")
    for i in range(count_a):
        for j in range(count_s):
            a0 = -span_a / 2 + i * (panel_a + gap_a)
            s0 = 0.1 + j * (panel_s + gap_s)
            corners = [(a0, s0), (a0 + panel_a, s0), (a0 + panel_a, s0 + panel_s), (a0, s0 + panel_s)]
            points = [(*_to_xy(spec, a, eave_across - side * s * run), base_z + s * upper + DECAL_OFFSET) for a, s in corners]
            edge_a, edge_b = Vector(points[1]) - Vector(points[0]), Vector(points[3]) - Vector(points[0])
            if edge_a.cross(edge_b).z < 0:
                points.reverse()
            parts.append(_decal(f"decal_solar_{i}_{j}", points, solar))


def add_flat_solar_panels(spec, parts):
    """Two rows of dark panels lying on a flat roof, clear of the parapet."""
    width, depth = spec["body"]
    solar = PALETTE_NAMES.index("solar")
    z = roof_surface(spec) + DECAL_OFFSET
    span_x, span_y, gap = width * 0.7, depth * 0.55, 0.05
    count = 3
    panel_x = (span_x - gap * (count - 1)) / count
    panel_y = (span_y - gap) / 2
    for i in range(count):
        for j in range(2):
            x0 = -span_x / 2 + i * (panel_x + gap)
            y0 = -span_y / 2 + j * (panel_y + gap)
            parts.append(_decal(f"decal_solar_{i}_{j}", [(x0, y0, z), (x0 + panel_x, y0, z), (x0 + panel_x, y0 + panel_y, z), (x0, y0 + panel_y, z)], solar))


def add_solar_panels(spec, parts):
    if spec["roof"] == "mansard":
        add_mansard_solar_panels(spec, parts)
        return
    if spec["roof"] == "flat":
        add_flat_solar_panels(spec, parts)
        return
    if spec["roof"] not in ("gable_half", "gable_third", "shed"):
        raise ValueError("solar_panels need a flat, gable_half, gable_third, shed or mansard roof")
    long_side, _, _ = roof_dimensions(spec)
    low_b, high_b, low_z, high_z = slope_frame(spec)
    count_a, count_s = 3, 2
    span_a, gap_a, gap_s = long_side * 0.62, 0.02, 0.05
    panel_a = (span_a - gap_a * (count_a - 1)) / count_a
    panel_s = (0.62 - gap_s * (count_s - 1)) / count_s
    solar = PALETTE_NAMES.index("solar")
    for i in range(count_a):
        for j in range(count_s):
            a0 = -span_a / 2 + i * (panel_a + gap_a)
            s0 = 0.18 + j * (panel_s + gap_s)
            corners = [(a0, s0), (a0 + panel_a, s0), (a0 + panel_a, s0 + panel_s), (a0, s0 + panel_s)]
            points = [(*_to_xy(spec, a, low_b + s * (high_b - low_b)), low_z + s * (high_z - low_z) + DECAL_OFFSET) for a, s in corners]
            edge_a, edge_b = Vector(points[1]) - Vector(points[0]), Vector(points[3]) - Vector(points[0])
            if edge_a.cross(edge_b).z < 0:
                points.reverse()
            parts.append(_decal(f"decal_solar_{i}_{j}", points, solar))


def add_roof_plants(spec, parts, count, rng):
    """A few small bushes on a flat roof, clear of the parapet."""
    width, depth = spec["body"]
    bush = PALETTE_NAMES.index("bush")
    base = roof_surface(spec) - 0.01
    profile = [(0.0, 0.0), (0.04, 0.0), (0.05, 0.026), (0.036, 0.052), (0.0, 0.062)]
    for index in range(count):
        x = rng.uniform(-width * 0.3, width * 0.3)
        y = rng.uniform(-depth * 0.25, depth * 0.25)
        parts.append(lpm.lathe(f"roof_plant_{index}", profile, segments=6, at=(x, y, base), color=bush))


def add_bushes(spec, parts, sides):
    bush = PALETTE_NAMES.index("bush")
    body_width = spec["body"][0]
    profile = [(0.0, 0.0), (0.062, 0.0), (0.07, 0.038), (0.05, 0.077), (0.0, 0.092)]
    for side in sides:
        x, y, _ = plane_point("front", side * (body_width / 2 - 0.09), wall_half(spec, "front") - 0.03, 0)
        parts.append(lpm.lathe(f"bush_{side}", profile, segments=7, at=(x, y, 0), color=bush))


def roof_surface(spec):
    """Height of the top of a flat roof, where a rooftop element stands."""
    return spec["floors"] * spec["floor_height"] + roof_height(spec)


def add_clock_tower(spec, parts, clock_face=True):
    """A square tower with a clock on each face and a pyramid cap, standing on a flat roof over the entrance."""
    if spec["roof"] != "flat":
        raise ValueError("clock_tower needs a flat roof")
    cfg = spec["cfg"]
    wall, trim, accent = color_index(spec, "wall"), color_index(spec, "trim"), color_index(spec, "accent")
    dark, white = PALETTE_NAMES.index(cfg["ink"]), PALETTE_NAMES.index("white")
    half, shaft_height, clock = 0.14, 0.4, 0.11
    y = -spec["body"][1] * 0.2
    base = roof_surface(spec) - 0.01
    parts.append(lpm.box("tower_shaft", (half * 2, half * 2, shaft_height), at=(0, y, base), color=wall))
    parts.append(lpm.box("tower_band", (half * 2 + 0.04, half * 2 + 0.04, 0.03), at=(0, y, base + shaft_height - 0.02), color=trim))
    parts.append(lpm.prism("tower_cap", 4, (half + 0.03) * 2 ** 0.5, 0.2, at=(0, y, base + shaft_height + 0.01), color=accent, radius_top=0.02, rotate=45))
    centre = base + shaft_height * 0.55
    for side, (dx, dy) in {"front": (0, -1), "back": (0, 1), "left": (-1, 0), "right": (1, 0)}.items():
        if not clock_face:
            continue
        size = (clock, 0.012, clock) if dy else (0.012, clock, clock)
        x_at, y_at = dx * (half + 0.002), y + dy * (half + 0.002)
        parts.append(lpm.box(f"clock_{side}", size, at=(x_at, y_at, centre - clock / 2), color=white))
        long_hand = (0.012, 0.016, 0.05) if dy else (0.016, 0.012, 0.05)
        short_hand = (0.035, 0.016, 0.012) if dy else (0.016, 0.035, 0.012)
        out_x, out_y = dx * (half + 0.004), y + dy * (half + 0.004)
        parts.append(lpm.box(f"hand_long_{side}", long_hand, at=(out_x, out_y, centre), color=dark))
        parts.append(lpm.box(f"hand_short_{side}", short_hand, at=(out_x + (0.0175 if dy else 0), out_y + (0.0175 if dx else 0), centre - 0.006), color=dark))


def add_flagpole(spec, parts):
    """A pole with a flag on a corner of the flat roof."""
    accent = color_index(spec, "accent")
    dark = PALETTE_NAMES.index(spec["cfg"]["ink"])
    width, depth = spec["body"]
    x, y = -width * 0.38, -depth * 0.3
    base = roof_surface(spec) - 0.01
    parts.append(lpm.prism("flag_pole", 6, 0.01, 0.5, at=(x, y, base), color=dark))
    parts.append(lpm.box("flag_cloth", (0.14, 0.008, 0.08), at=(x + 0.075, y, base + 0.4), color=accent))


def add_portico(spec, parts):
    """A flat canopy on two columns over the front door, on a low step: a wide, readable entrance."""
    floor = spec["floor_height"]
    length, _ = wall_extent(spec, "front")
    trim, accent = color_index(spec, "trim"), color_index(spec, "accent")
    width, reach, canopy = min(0.8, length * 0.45), PORTICO_PROJECTION + 0.04, 0.035
    top = floor * 0.98
    front = wall_half(spec, "front")
    parts.append(wall_box(spec, "portico_step", "front", 0, 0, (width + 0.08, reach + 0.04, 0.02), trim))
    parts.append(wall_box(spec, "portico_roof", "front", 0, top, (width + 0.04, reach + 0.04, canopy), accent))
    for side in (-1, 1):
        parts.append(wall_box(spec, f"portico_column_{side}", "front", side * (width / 2 - 0.02), 0.02, (0.04, 0.04, top - 0.02), trim, half=front + PORTICO_PROJECTION - 0.04))


def add_door_hood(spec, parts):
    """A small two-slope hood over the front door: a gable pointing out of the wall, closed on all sides."""
    width, height = door_layout(spec)
    half, reach, rise, thick = width / 2 + 0.07, 0.07, 0.075, 0.012
    plane, z = wall_half(spec, "front"), height + 0.03
    roof = color_index(spec, "roof")
    outline = [(-half, 0.0), (half, 0.0), (0.0, rise)]
    at = spec.get("door_along", 0.0)
    verts = [plane_point("front", a + at, plane - 0.01, z + h) for a, h in outline] + [plane_point("front", a + at, plane + reach, z + h) for a, h in outline]
    faces = [(3, 4, 5), (0, 2, 1), (0, 1, 4, 3), (1, 2, 5, 4), (2, 0, 3, 5)]
    parts.append(lpm._object("door_hood", _bm(verts, faces), roof))


def add_red_cross(spec, parts, along):
    """A white board with a red cross standing on a flat roof near the front edge."""
    width, depth = spec["body"]
    base = roof_surface(spec) - 0.01
    x, y = along * width, -depth * 0.36
    board, bar, thick = 0.34, 0.1, 0.012
    parts.append(lpm.box("cross_board", (board, 0.03, board), at=(x, y, base), color=color_index(spec, "wall")))
    red = PALETTE_NAMES.index("brick")
    parts.append(lpm.box("cross_h", (board * 0.72, thick, bar), at=(x, y - 0.015 - thick / 2 + 0.004, base + board / 2 - bar / 2), color=red))
    parts.append(lpm.box("cross_v", (bar, thick, board * 0.72), at=(x, y - 0.015 - thick / 2 + 0.004, base + board * 0.14), color=red))


def add_penthouse(spec, parts, scale=0.58, offset=(0.0, 0.0)):
    """A setback block on top of a flat roof, with its own roof slab and one window per face."""
    cfg = spec["cfg"]
    width, depth = spec["body"]
    height = spec["floor_height"] * 0.95
    block_width, block_depth = width * scale, depth * scale
    ox, oy = offset
    base = roof_surface(spec) - 0.01
    parts.append(rounded_block("penthouse", block_width, block_depth, height, color_index(spec, "wall"), cfg["corner"], at=(ox, oy, base)))
    parts.append(lpm.box("penthouse_roof", (block_width + 0.05, block_depth + 0.05, 0.03), at=(ox, oy, base + height - 0.005), color=color_index(spec, "roof")))
    for face, half, length in (("front", block_depth / 2, block_width), ("back", block_depth / 2, block_width),
                               ("left", block_width / 2, block_depth), ("right", block_width / 2, block_depth)):
        (nx, ny), (tx, ty) = FACE_FRAME[face]
        add_window(spec, parts, f"penthouse_{face}", face, ox * tx + oy * ty, base + height * 0.28, min(0.22, length * 0.4), height * 0.45, half=half + ox * nx + oy * ny)


def add_penthouse_terrace(spec, parts):
    """The back half of the roof top is a setback penthouse under a four-slope roof with a large glass wall, the front half an open terrace with a solid parapet."""
    cfg = spec["cfg"]
    width, depth = spec["body"]
    if spec["roof"] == "mansard":
        _, inset, run, _ = mansard_dimensions(spec)
        plate_w, plate_d = width - 2 * (inset + run), depth - 2 * (inset + run)
    else:
        plate_w, plate_d = width * 0.8, depth * 0.8
    height = spec["floor_height"] * 0.95
    base = roof_surface(spec) - 0.01
    block_d = plate_d / 2
    centre_y = plate_d / 4
    trim, wall, roof = color_index(spec, "trim"), color_index(spec, "wall"), color_index(spec, "roof")
    parts.append(rounded_block("penthouse", plate_w, block_d, height, wall, cfg["corner"], at=(0, centre_y, base)))
    half_w, half_d, ridge_height, overhang = plate_w / 2 + 0.03, block_d / 2 + 0.03, 0.13, 0.0
    ridge_run = max(half_w - half_d, 0.01)
    z0 = base + height - 0.005
    verts = [(-half_w, centre_y - half_d, z0), (half_w, centre_y - half_d, z0), (half_w, centre_y + half_d, z0), (-half_w, centre_y + half_d, z0),
             (-ridge_run, centre_y, z0 + ridge_height), (ridge_run, centre_y, z0 + ridge_height)]
    faces = [(0, 3, 2, 1), (0, 1, 5, 4), (1, 2, 5), (2, 3, 4, 5), (3, 0, 4)]
    parts.append(fillet(lpm._object("penthouse_roof", _bm(verts, faces), roof), cfg["roof_fillet"]))
    add_window(spec, parts, "penthouse_glass_wall", "front", 0, base + height * 0.1, plate_w * 0.82, height * 0.78, half=0.0)
    add_window(spec, parts, "penthouse_back", "back", 0, base + height * 0.28, min(0.22, plate_w * 0.3), height * 0.45, half=plate_d / 2)
    parts.append(lpm.box("terrace_deck", (plate_w, block_d, 0.012), at=(0, -centre_y, base), color=trim))
    thick, parapet = 0.014, 0.085
    parts.append(lpm.box("terrace_parapet_front", (plate_w, thick, parapet), at=(0, -plate_d / 2 + thick / 2, base + 0.012), color=wall))
    parts.append(lpm.box("terrace_parapet_left", (thick, block_d - thick, parapet), at=(-plate_w / 2 + thick / 2, -centre_y + thick / 2, base + 0.012), color=wall))
    parts.append(lpm.box("terrace_parapet_right", (thick, block_d - thick, parapet), at=(plate_w / 2 - thick / 2, -centre_y + thick / 2, base + 0.012), color=wall))


def add_stair_head(spec, parts):
    """A small stairwell box with a door and a flat roof on the back-left corner of a flat roof."""
    wall, roof, dark = color_index(spec, "wall"), color_index(spec, "roof"), PALETTE_NAMES.index(spec["cfg"]["ink"])
    width, depth = spec["body"]
    size, height = 0.3, 0.14
    x, y = -width / 2 + size / 2 + 0.07, depth / 2 - size / 2 - 0.07
    base = roof_surface(spec) - 0.005
    parts.append(lpm.box("stair_head", (size, size, height), at=(x, y, base), color=wall))
    parts.append(lpm.box("stair_head_roof", (size + 0.03, size + 0.03, 0.02), at=(x, y, base + height - 0.005), color=roof))
    parts.append(lpm.box("stair_head_door", (0.09, 0.012, 0.1), at=(x + 0.04, y - size / 2 - 0.002, base), color=dark))


def add_round_dormer(spec, parts, along=0.0, depth_ratio=0.32):
    """A small round dormer with a round window on the front slope of a gable roof."""
    roof, trim, glass = color_index(spec, "roof"), color_index(spec, "trim"), color_index(spec, "glass")
    long_side, short_side, height = roof_dimensions(spec)
    half_s = short_side / 2
    top = spec["floors"] * spec["floor_height"] + spec["cfg"]["roof_thickness"]
    y = -half_s * depth_ratio
    z = top + height * (y + half_s) / half_s + 0.02
    radius, length = 0.065, 0.14
    cheeks = lpm.prism("round_dormer", 12, radius, length, at=(0, 0, 0), color=roof)
    lpm.rotate(cheeks, 90, "X")
    lpm.move(cheeks, along, y + length / 2, z)
    parts.append(cheeks)
    for name, rad, thick, color, shift in (("round_dormer_frame", radius * 0.8, 0.012, trim, 0.0), ("round_dormer_glass", radius * 0.62, 0.016, glass, 0.004)):
        disc = lpm.prism(name, 12, rad, thick, at=(0, 0, 0), color=color)
        lpm.rotate(disc, 90, "X")
        lpm.move(disc, along, y - length / 2 + 0.002 - shift, z)
        parts.append(disc)


def add_round_window(spec, parts, rise=0.07, radius=0.05, on_hood=False, stretch=1.0, face="front"):
    """A round window with a frame, in the front gable above the door; on_hood rests its bottom on the apex of the door hood."""
    trim, glass = color_index(spec, "trim"), color_index(spec, "glass")
    plane = wall_half(spec, "front")
    z = spec["floors"] * spec["floor_height"] + rise
    if on_hood:
        z = door_layout(spec)[1] + 0.03 + 0.075 + radius
    for name, rad, thick, color, lift in (("round_window_frame", radius, 0.014, trim, 0.0), ("round_window_glass", radius * 0.76, 0.02, glass, 0.003)):
        disc = lpm.prism(name, 14, rad, thick, at=(0, 0, 0), color=color)
        lpm.rotate(disc, 90, "X")
        if stretch != 1.0:
            lpm.scale(disc, stretch, 1.0, 1.0)
        lpm.move(disc, 0.0, (-plane - lift + 0.004) if face == "front" else (plane - 0.004 + lift + thick), z)
        parts.append(disc)


def add_roof_lantern(spec, parts, size=0.26, height=0.12):
    """A small glazed box with its own four-slope cap, standing on the ridge of a gable roof."""
    wall, roof, trim = color_index(spec, "wall"), color_index(spec, "roof"), color_index(spec, "trim")
    ridge_z = spec["floors"] * spec["floor_height"] + roof_height(spec)
    base = ridge_z - 0.03
    parts.append(lpm.box("lantern", (size, size, height), at=(0, 0, base), color=wall))
    parts.append(lpm.prism("lantern_cap", 4, (size / 2 + 0.03) * 2 ** 0.5, 0.09, at=(0, 0, base + height - 0.005), color=roof, radius_top=0.01, rotate=45))
    for face, (nx, ny) in (("front", (0, -1)), ("back", (0, 1)), ("left", (-1, 0)), ("right", (1, 0))):
        add_window(spec, parts, f"lantern_{face}", face, 0, base + height * 0.18, size * 0.5, height * 0.62, half=size / 2)


def add_striped_awning(spec, parts, along=0.17, width=0.5, rise=0.84, reach=0.1, stripes=6, level=0):
    """A canopy of alternating accent and white stripes sloping out of the wall over a shop window."""
    accent, white = color_index(spec, "accent"), PALETTE_NAMES.index("white")
    plane, z = wall_half(spec, "front"), spec["floor_height"] * (rise + level)
    step = width / stripes
    for index in range(stripes):
        a0 = along - width / 2 + index * step
        verts = [plane_point("front", a0, plane - 0.005, z + 0.03), plane_point("front", a0 + step, plane - 0.005, z + 0.03),
                 plane_point("front", a0 + step, plane + reach, z - 0.02), plane_point("front", a0, plane + reach, z - 0.02),
                 plane_point("front", a0, plane - 0.005, z + 0.045), plane_point("front", a0 + step, plane - 0.005, z + 0.045),
                 plane_point("front", a0 + step, plane + reach, z - 0.005), plane_point("front", a0, plane + reach, z - 0.005)]
        faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
        parts.append(lpm._object(f"awning_stripe_{index}", _bm(verts, faces), accent if index % 2 == 0 else white))


def add_chimney_row(spec, parts, count, top, cap_color, spacing=0.3, depth_ratio=0.3):
    """Square chimneys in a row across the back half of a shed roof, each rising 0.14 above the slope."""
    if spec["roof"] != "shed" or not ridge_along_x(spec):
        raise ValueError("a chimney row needs a shed roof along x")
    body_width, body_depth = spec["body"]
    _, short_side, slope = roof_dimensions(spec)
    y = body_depth * depth_ratio
    height = spec["cfg"]["roof_thickness"] + slope * (y + short_side / 2) / short_side + 0.14
    for index in range(count):
        x = (index - (count - 1) / 2) * spacing
        parts.append(lpm.box(f"chimney_{index}", (0.07, 0.07, height), at=(x, y, top), color=color_index(spec, "wall")))
        parts.append(lpm.box(f"chimney_cap_{index}", (0.095, 0.095, 0.02), at=(x, y, top + height), color=cap_color))


def add_bread_display(spec, parts, along, width, height, depth):
    """Round loaves alternating with a trio of baguettes on a stall table."""
    loaf, baguette = PALETTE_NAMES.index("uwood"), PALETTE_NAMES.index("sun")
    count = 4
    slot = width / count
    for index in range(count):
        a = along - width / 2 + slot * (index + 0.5)
        if index % 2 == 0:
            x, y, z = plane_point("front", a, wall_half(spec, "front") + depth / 2 - 0.025, height)
            parts.append(lpm.box(f"loaf_{index}", (slot - 0.03, depth - 0.045, 0.05), at=(x, y, z), color=loaf, taper=(0.7, 0.7)))
            continue
        for row in range(3):
            x, y, z = plane_point("front", a, wall_half(spec, "front") + 0.03 + row * 0.024, height + row * 0.016)
            parts.append(lpm.box(f"baguette_{index}_{row}", (slot - 0.02, 0.02, 0.022), at=(x, y, z), color=baguette))


def add_stall(spec, parts, along=0.17, width=0.44, produce="fruit"):
    """A low display table with fruit crates (or bread) in front of a shop window."""
    trim, wall = color_index(spec, "trim"), color_index(spec, "wall")
    plane = wall_half(spec, "front")
    names = ("coral", "sun", "lime", "tangerine")
    depth, height = 0.1, 0.06
    parts.append(wall_box(spec, "stall_table", "front", along, 0, (width, depth, height), trim, embed=-0.012))
    if produce == "bread":
        add_bread_display(spec, parts, along, width, height, depth)
        return
    count = 4
    for index in range(count):
        a = along - width / 2 + width * (index + 0.5) / count
        parts.append(wall_box(spec, f"stall_crate_{index}", "front", a, height, (width / count - 0.02, depth - 0.03, 0.035), PALETTE_NAMES.index(names[index % len(names)]), embed=-0.025))


def sack(parts, name, x, y, size, color, tilt=0.0):
    """A squat sack: a rounded body pinched into a small tied neck."""
    height = size * 0.9
    profile = [(0.0, 0.0), (size * 0.42, 0.0), (size * 0.5, height * 0.25), (size * 0.46, height * 0.55), (size * 0.2, height * 0.82), (size * 0.1, height * 0.9), (size * 0.14, height * 1.0), (0.0, height * 1.0)]
    ob = lpm.lathe(name, profile, segments=8, at=(0, 0, 0), color=color)
    if tilt:
        lpm.rotate(ob, tilt, "Y")
    lpm.move(ob, x, y, 0.0)
    parts.append(ob)


def add_material_yard(spec, parts, along=0.17, width=0.5):
    """In front of a building material shop: a sack of sand, a sack of gravel and a few scattered wooden planks."""
    plane = wall_half(spec, "front")
    sand, gravel, wood = PALETTE_NAMES.index("usand"), PALETTE_NAMES.index("grey"), PALETTE_NAMES.index("uwood")
    left = along - width / 2
    sack(parts, "yard_sack_sand", left + 0.08, -plane - 0.07, 0.12, sand)
    sack(parts, "yard_sack_gravel", left + 0.2, -plane - 0.05, 0.12, gravel, tilt=6)
    planks = ((0.0, -0.075, 0.28, 8), (0.02, -0.095, 0.24, -14), (-0.02, -0.058, 0.26, 3))
    for index, (dx, dy, length, yaw) in enumerate(planks):
        ob = lpm.box(f"yard_plank_{index}", (length, 0.034, 0.012), at=(0, 0, 0), color=wood)
        lpm.rotate(ob, yaw, "Z")
        lpm.move(ob, left + width * 0.68 + dx, -plane + dy, 0.012 * index)
        parts.append(ob)


def add_marquee(spec, parts, along=0.0, width=None, reach=0.14):
    """A flat metal canopy over the door, held by two slanted ties."""
    width = width or door_layout(spec)[0] + 0.16
    accent = color_index(spec, "accent")
    plane, z = wall_half(spec, "front"), door_layout(spec)[1] + 0.035
    parts.append(wall_box(spec, "marquee_slab", "front", along, z, (width, reach, 0.014), accent))
    parts.append(wall_box(spec, "marquee_edge", "front", along, z - 0.012, (width, 0.012, 0.03), accent, half=plane + reach - 0.01))
    for side in (-1, 1):
        tie = lpm.box(f"marquee_tie_{side}", (0.008, 0.01, 0.15), at=(0, 0, -0.075), color=accent)
        lpm.rotate(tie, -60, "X")
        lpm.move(tie, along + side * (width / 2 - 0.018), -plane - 0.065, z + 0.04)
        parts.append(tie)


def add_wall_tools(spec, parts, along=-0.1, width=0.22):
    """A small board of hung tools on the front wall: a hammer, a saw and a wrench."""
    trim, dark = color_index(spec, "trim"), PALETTE_NAMES.index(spec["cfg"]["ink"])
    metal, wood = PALETTE_NAMES.index("grey"), PALETTE_NAMES.index("uwood")
    z0, board_h = spec["floor_height"] * 0.18, 0.15
    parts.append(wall_box(spec, "tools_board", "front", along, z0, (width, 0.012, board_h), trim))
    parts.append(wall_box(spec, "tool_hammer_handle", "front", along - 0.07, z0 + 0.02, (0.012, 0.012, 0.1), wood, embed=-0.004))
    parts.append(wall_box(spec, "tool_hammer_head", "front", along - 0.07, z0 + 0.105, (0.04, 0.014, 0.022), metal, embed=-0.004))
    parts.append(wall_box(spec, "tool_saw_blade", "front", along, z0 + 0.04, (0.022, 0.01, 0.09), metal, embed=-0.004))
    parts.append(wall_box(spec, "tool_saw_grip", "front", along, z0 + 0.12, (0.03, 0.013, 0.02), wood, embed=-0.004))
    parts.append(wall_box(spec, "tool_wrench_shaft", "front", along + 0.07, z0 + 0.02, (0.012, 0.012, 0.09), metal, embed=-0.004))
    parts.append(wall_box(spec, "tool_wrench_jaw", "front", along + 0.07, z0 + 0.105, (0.03, 0.014, 0.02), metal, embed=-0.004))
    parts.append(wall_box(spec, "tool_wrench_gap", "front", along + 0.07, z0 + 0.112, (0.01, 0.016, 0.012), dark, embed=-0.004))


def add_bush_at(spec, parts, along=0.0):
    """One small round bush against the front wall at a chosen position."""
    profile = [(0.0, 0.0), (0.062, 0.0), (0.07, 0.038), (0.05, 0.077), (0.0, 0.092)]
    x, y, _ = plane_point("front", along, wall_half(spec, "front") - 0.03, 0)
    parts.append(lpm.lathe(f"bush_at_{along}", profile, segments=7, at=(x, y, 0), color=PALETTE_NAMES.index("bush")))


def add_tilted_sash(spec, parts, tag, face, along, z, width, height, tilt=0.04):
    """The sash of a hopper window (vasistas) propped open: a thin pane hinged at the top and swung out at the bottom."""
    trim, glass = color_index(spec, "trim"), color_index(spec, "glass")
    plane = wall_half(spec, face)
    top = z + height
    thick = 0.008
    corners = [(-width / 2, 0.0, top, 0.012), (width / 2, 0.0, top, 0.012), (width / 2, 1.0, z, 0.012 + tilt), (-width / 2, 1.0, z, 0.012 + tilt)]
    front = [plane_point(face, along + a, plane + out, zz) for a, _, zz, out in corners]
    back = [plane_point(face, along + a, plane + out + thick, zz) for a, _, zz, out in corners]
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    parts.append(lpm._object(f"sash_{tag}", _bm(front + back, faces), glass))


def add_industrial_door(spec, parts, face="back", along=0.0, width=0.62):
    """A very wide sectional garage door with a heavy steel frame, ribs, a hazard stripe above it and a lamp."""
    floor = spec["floor_height"]
    height = floor * 0.8
    trim, door = color_index(spec, "trim"), color_index(spec, "door")
    dark, sun = PALETTE_NAMES.index(spec["cfg"]["ink"]), PALETTE_NAMES.index("sun")
    parts.append(wall_box(spec, f"ind_frame_{face}", face, along, 0, (width + 0.07, 0.02, height + 0.04), trim))
    parts.append(wall_box(spec, f"ind_door_{face}", face, along, 0, (width, 0.032, height), door))
    for index in range(1, 6):
        parts.append(wall_box(spec, f"ind_rib_{face}_{index}", face, along, height * index / 6, (width - 0.02, 0.036, 0.008), dark))
    stripes = 8
    step = (width + 0.07) / stripes
    for index in range(stripes):
        parts.append(wall_box(spec, f"ind_hazard_{face}_{index}", face, along - (width + 0.07) / 2 + step * (index + 0.5), height + 0.045, (step - 0.002, 0.018, 0.02), sun if index % 2 == 0 else dark))
    parts.append(wall_box(spec, f"ind_lamp_{face}", face, along + width / 2 + 0.07, height * 0.9, (0.03, 0.04, 0.025), dark))


def add_hazard_band(spec, parts, face="front", level=1, stripes=12, height=0.02):
    """A full-width yellow and dark stripe running at a floor line of a wall."""
    sun, dark = PALETTE_NAMES.index("sun"), PALETTE_NAMES.index(spec["cfg"]["ink"])
    length, _ = wall_extent(spec, face)
    step = (length - 0.02) / stripes
    z = spec["floor_height"] * level - 0.004
    for index in range(stripes):
        parts.append(wall_box(spec, f"hazard_{face}_{level}_{index}", face, -length / 2 + 0.01 + step * (index + 0.5), z, (step - 0.002, 0.016, height), sun if index % 2 == 0 else dark))


def add_hardware_display(spec, parts, along=0.17, width=0.5):
    """A low rack with a few dark toolboxes, spaced apart, each with a handle and tape crossing the top and running down the front and the sides, and two cable spools."""
    trim = color_index(spec, "trim")
    plane = wall_half(spec, "front")
    depth, rack = 0.09, 0.05
    parts.append(wall_box(spec, "hw_rack", "front", along, 0, (width, depth, rack), trim, embed=-0.012))
    dark = ("graphite", "navy", "slate_dark")
    tape, handle = PALETTE_NAMES.index("cream"), PALETTE_NAMES.index("grey")
    size_a, size_d, size_h, out = 0.07, 0.05, 0.045, 0.025
    count = 3
    for index in range(count):
        a = along + (index - (count - 1) / 2) * 0.115
        top = rack + size_h
        parts.append(wall_box(spec, f"hw_box_{index}", "front", a, rack, (size_a, size_d, size_h), PALETTE_NAMES.index(dark[index % 3]), embed=-out))
        parts.append(wall_box(spec, f"hw_tape_top_a_{index}", "front", a, top - 0.002, (0.012, size_d + 0.004, 0.005), tape, embed=-out - 0.002))
        parts.append(wall_box(spec, f"hw_tape_top_b_{index}", "front", a, top - 0.002, (size_a + 0.004, 0.012, 0.005), tape, embed=-out - 0.019))
        parts.append(wall_box(spec, f"hw_tape_front_{index}", "front", a, rack, (0.012, 0.004, size_h), tape, half=plane + out + size_d - 0.002, embed=0.0))
        for side in (-1, 1):
            parts.append(wall_box(spec, f"hw_tape_side_{index}_{side}", "front", a + side * (size_a / 2), rack, (0.004, size_d - 0.01, size_h + 0.003), tape, embed=-out - 0.005))
        for post in (-1, 1):
            parts.append(wall_box(spec, f"hw_handle_post_{index}_{post}", "front", a + post * 0.016, top - 0.02, (0.005, 0.012, 0.022), handle, half=plane + out + size_d - 0.004, embed=0.0))
        parts.append(wall_box(spec, f"hw_handle_bar_{index}", "front", a, top - 0.002, (0.04, 0.012, 0.006), handle, half=plane + out + size_d - 0.004, embed=0.0))
    for index, side in enumerate((-1, 1)):
        reel(parts, f"hw_spool_{index}", along + side * (width / 2 - 0.035), -plane - 0.07, 0.0, 0.04, (0.0, 0.0), "tangerine", "grey")


def reel(parts, name, x, y, z, radius, _unused, cable_color, flange_color, flat=False):
    """A cable spool: two flanges around a cable core, standing on its edge or lying flat."""
    flange, cable = PALETTE_NAMES.index(flange_color), PALETTE_NAMES.index(cable_color)
    for tag, offset, rad, thick, color in (("core", 0.0, radius * 0.75, 0.05, cable), ("a", -0.027, radius, 0.008, flange), ("b", 0.027, radius, 0.008, flange)):
        disc = lpm.prism(f"{name}_{tag}", 10, rad, thick, at=(0, 0, 0), color=color)
        if flat:
            lpm.move(disc, x, y, z + 0.025 + offset - thick / 2)
        else:
            lpm.rotate(disc, 90, "X")
            lpm.move(disc, x, y + offset - thick / 2, z + radius)
        parts.append(disc)


def add_roof_reel(spec, parts, x=0.3, y=0.2):
    """A big cable spool lying on a flat roof as a shop mark."""
    base = roof_surface(spec) - 0.005
    reel(parts, "roof_reel", x, y, base, 0.09, (0.0, 0.0), "tangerine", "grey", flat=True)


def crystal(parts, name, x, y, z, radius, height, color):
    """A faceted crystal: a hexagonal body topped by a point."""
    profile = [(0.0, 0.0), (radius * 0.7, 0.0), (radius, height * 0.3), (radius * 0.85, height * 0.62), (0.0, height)]
    parts.append(lpm.lathe(name, profile, segments=6, at=(x, y, z), color=color))


def add_crystals(spec, parts, along=0.28, on="display"):
    """A few crystals: on a small pedestal in front of the window, or as a cluster on a flat roof."""
    names = ("aqua", "violet", "pink", "sky")
    if on == "roof":
        base = roof_surface(spec) - 0.005
        for index, (dx, dy, r, h) in enumerate(((0.0, 0.0, 0.05, 0.13), (0.07, 0.03, 0.035, 0.09), (-0.06, 0.04, 0.03, 0.08))):
            crystal(parts, f"roof_crystal_{index}", along + dx, dy, base, r, h, PALETTE_NAMES.index(names[index % 4]))
        return
    plane = wall_half(spec, "front")
    parts.append(wall_box(spec, "crystal_plinth", "front", along, 0, (0.26, 0.09, 0.03), color_index(spec, "trim"), embed=-0.012))
    for index, (dx, r, h) in enumerate(((-0.08, 0.025, 0.06), (0.0, 0.03, 0.08), (0.08, 0.025, 0.055))):
        x, y, _ = plane_point("front", along + dx, plane + 0.052, 0.03)
        crystal(parts, f"display_crystal_{index}", x, y, 0.03, r, h, PALETTE_NAMES.index(names[index % 4]))


def add_pilasters(spec, parts, along=0.28, width=0.3, height=None):
    """Two slim fluted pilasters with caps on each side of a shop window."""
    trim, gold = color_index(spec, "trim"), PALETTE_NAMES.index("sun")
    height = height or spec["floor_height"] * 0.88
    for index, side in enumerate((-1, 1)):
        a = along + side * (width / 2 + 0.02)
        parts.append(wall_box(spec, f"pilaster_{index}", "front", a, 0, (0.03, 0.02, height), trim))
        parts.append(wall_box(spec, f"pilaster_cap_{index}", "front", a, height - 0.012, (0.04, 0.026, 0.014), gold))
        parts.append(wall_box(spec, f"pilaster_base_{index}", "front", a, 0, (0.04, 0.026, 0.012), gold))


def add_curved_marquee(spec, parts, along=-0.32, width=None, radius=0.087, drop=0.04):
    """A gold canopy curving from the wall over the door like a quarter of a cylinder."""
    width = width or door_layout(spec)[0] + 0.16
    gold = PALETTE_NAMES.index("sun")
    plane = wall_half(spec, "front")
    zc = door_layout(spec)[1] - drop
    steps, thick = 6, 0.012
    outer = [(radius * math.sin(math.radians(90 * i / steps)), zc + radius * math.cos(math.radians(90 * i / steps))) for i in range(steps + 1)]
    inner = [((radius - thick) * math.sin(math.radians(90 * i / steps)), zc + (radius - thick) * math.cos(math.radians(90 * i / steps))) for i in range(steps + 1)]
    ring = outer + list(reversed(inner))
    count = len(ring)
    verts = [plane_point("front", along - width / 2, plane + d, z) for d, z in ring] + [plane_point("front", along + width / 2, plane + d, z) for d, z in ring]
    faces = [(i, (i + 1) % count, count + (i + 1) % count, count + i) for i in range(count)]
    faces.append(tuple(reversed(range(count))))
    faces.append(tuple(range(count, 2 * count)))
    parts.append(lpm._object("curved_marquee", _bm(verts, faces), gold))


def add_red_carpet(spec, parts, along=-0.32, width=0.18, length=0.16):
    """A flat red carpet laid in front of the door."""
    plane = wall_half(spec, "front")
    parts.append(wall_box(spec, "red_carpet", "front", along, 0, (width, length, 0.006), PALETTE_NAMES.index("brick"), embed=-0.0))


def add_roof_tank(spec, parts, x=-0.4, y=0.3, radius=0.17, height=0.3):
    """A vertical cylindrical tank with a domed top and two bands, standing on a flat roof."""
    trim, accent = color_index(spec, "trim"), color_index(spec, "accent")
    base = roof_surface(spec) - 0.005
    profile = [(0.0, 0.0), (radius, 0.0), (radius, height), (radius * 0.9, height + 0.03), (radius * 0.45, height + 0.06), (0.0, height + 0.07)]
    parts.append(lpm.lathe(f"roof_tank_{x}_{y}", profile, segments=12, at=(x, y, base), color=trim))
    for index, level in enumerate((0.3, 0.7)):
        parts.append(lpm.prism(f"roof_tank_band_{x}_{y}_{index}", 12, radius + 0.008, 0.02, at=(x, y, base + height * level), color=accent))
    parts.append(lpm.prism(f"roof_tank_pipe_{x}_{y}", 6, 0.014, 0.1, at=(x + radius * 0.5, y, base + height + 0.04), color=PALETTE_NAMES.index(spec["cfg"]["ink"])))


def add_roof_pipes(spec, parts, y=-0.1, z_lift=0.1):
    """A run of horizontal ducts on short supports across a flat roof, with an elbow at each end."""
    width, depth = spec["body"]
    trim, dark = color_index(spec, "trim"), PALETTE_NAMES.index(spec["cfg"]["ink"])
    base = roof_surface(spec) - 0.005
    length = width * 0.7
    parts.append(lpm.box("roof_duct", (length, 0.07, 0.06), at=(0, y, base + z_lift), color=trim))
    for index, x in enumerate((-length * 0.4, 0.0, length * 0.4)):
        parts.append(lpm.box(f"roof_duct_support_{index}", (0.03, 0.05, z_lift), at=(x, y, base), color=dark))
    for index, x in enumerate((-length / 2, length / 2)):
        parts.append(lpm.prism(f"roof_duct_elbow_{index}", 8, 0.04, 0.12, at=(x, y, base + z_lift + 0.03), color=trim))


def add_loading_dock(spec, parts, along=0.0, width=0.7):
    """A raised dock platform with a ramp and bumpers in front of a wide loading door."""
    trim, dark, sun = color_index(spec, "trim"), PALETTE_NAMES.index(spec["cfg"]["ink"]), PALETTE_NAMES.index("sun")
    parts.append(wall_box(spec, "dock_platform", "front", along, 0, (width, 0.12, 0.05), trim, embed=-0.1))
    for index, side in enumerate((-1, 1)):
        parts.append(wall_box(spec, f"dock_bumper_{index}", "front", along + side * (width / 2 - 0.04), 0.01, (0.04, 0.02, 0.05), dark, embed=-0.125))
    stripes = 8
    step = width / stripes
    for index in range(stripes):
        parts.append(wall_box(spec, f"dock_edge_{index}", "front", along - width / 2 + step * (index + 0.5), 0.045, (step - 0.002, 0.012, 0.006), sun if index % 2 == 0 else dark, embed=-0.11))


def crate(spec, parts, name, x, y, z, size, color):
    """A wooden crate with two darker slats."""
    slat = PALETTE_NAMES.index("brick")
    parts.append(lpm.box(name, (size, size, size * 0.8), at=(x, y, z), color=color))
    for index, offset in enumerate((-size * 0.25, size * 0.25)):
        parts.append(lpm.box(f"{name}_slat_{index}", (size + 0.004, size * 0.12, size * 0.8 + 0.004), at=(x, y + offset, z), color=slat))


def add_crate_stacks(spec, parts, along=-0.6, count=1, face="front"):
    """Pyramids of wooden crates standing against a wall, `count` stacks side by side."""
    wood = PALETTE_NAMES.index("uwood")
    plane = wall_half(spec, face)
    size = 0.085
    layout = ((0, 0, 0), (1, 0, 0), (2, 0, 0), (0.5, 0, 1), (1.5, 0, 1), (1, 0, 2))
    for stack in range(count):
        base = along + stack * (size * 3 + 0.05)
        for index, (dx, _, level) in enumerate(layout):
            x, y, z = plane_point(face, base + dx * size, plane + size / 2 + 0.02, level * size * 0.8)
            crate(spec, parts, f"crates_{face}_{stack}_{index}", x, y, z, size, wood)


def add_side_conveyor(spec, parts, face="right", along=0.0, length=0.9):
    """A low roller conveyor along a side wall, on two pairs of legs, with a few boxes riding on it."""
    trim, dark, box = color_index(spec, "trim"), PALETTE_NAMES.index(spec["cfg"]["ink"]), PALETTE_NAMES.index("uwood")
    plane = wall_half(spec, face)
    z = 0.11
    x, y, _ = plane_point(face, along, plane + 0.09, z)
    size = (0.12, length, 0.03) if face in ("left", "right") else (length, 0.12, 0.03)
    parts.append(lpm.box(f"conveyor_{face}", size, at=(x, y, z), color=trim))
    for index, a in enumerate((-length * 0.42, length * 0.42)):
        for side in (-1, 1):
            lx, ly, _ = plane_point(face, along + a, plane + 0.09 + side * 0.045, 0)
            parts.append(lpm.box(f"conveyor_leg_{face}_{index}_{side}", (0.015, 0.015, z), at=(lx, ly, 0), color=dark))
    for index, a in enumerate((-length * 0.25, length * 0.1)):
        bx, by, _ = plane_point(face, along + a, plane + 0.09, z + 0.03)
        parts.append(lpm.box(f"conveyor_box_{face}_{index}", (0.07, 0.07, 0.05), at=(bx, by, z + 0.03), color=box))


def add_smokestack(spec, parts, count=1):
    """A tall tapered chimney with two accent bands, standing at a back corner of the roof."""
    accent, trim = color_index(spec, "accent"), color_index(spec, "trim")
    dark = PALETTE_NAMES.index(spec["cfg"]["ink"])
    width, depth = spec["body"]
    base = roof_surface(spec) - 0.05
    height = 0.6
    for number in range(count):
        x, y = width * (0.32 - (0.2 if count <= 3 else 0.14) * number), depth * 0.28
        parts.append(lpm.prism(f"stack_{number}", 8, 0.06, height, at=(x, y, base), color=trim, radius_top=0.045))
        for index, level in enumerate((0.7, 0.82)):
            radius = 0.06 - 0.015 * level
            parts.append(lpm.prism(f"stack_band_{number}_{index}", 8, radius + 0.006, 0.05, at=(x, y, base + height * level), color=accent, radius_top=radius))
        parts.append(lpm.prism(f"stack_cap_{number}", 8, 0.05, 0.02, at=(x, y, base + height), color=dark))


def add_roller_door(spec, parts, along, door_width=0.34):
    """A wide loading door with horizontal slats, offset along the front wall."""
    floor = spec["floor_height"]
    length, _ = wall_extent(spec, "front")
    trim = color_index(spec, "trim")
    width, height = min(door_width, length * 0.3), floor * 0.72 * (1.0 if door_width <= 0.34 else 1.25)
    centre = along * length
    parts.append(wall_box(spec, "roller_frame", "front", centre, 0, (width + 0.05, 0.014, height + 0.03), trim))
    parts.append(wall_box(spec, "roller_door", "front", centre, 0, (width, 0.02, height), color_index(spec, "door")))
    for index in range(1, 5):
        parts.append(wall_quad(spec, f"decal_slat_{index}", "front", centre, height * index / 5, width, 0.008, trim, push=0.02 - 0.01 + DECAL_STEP))


def add_feature(spec, parts, feature):
    kind = feature["type"]
    face = feature.get("face", "front")
    floor = spec["floor_height"]
    cfg = spec["cfg"]
    accent, trim = color_index(spec, "accent"), color_index(spec, "trim")
    dark = PALETTE_NAMES.index(cfg["ink"])
    body_width, body_depth = spec["body"]
    top = spec["floors"] * floor
    length, _ = wall_extent(spec, face)
    if kind == "sign":
        text = feature.get("text", "").upper()
        if text and feature.get("placement") == "roof":
            add_roof_sign(spec, parts, face, text, accent, feature.get("lift", 0.0))
            return
        if text:
            add_sign_text(spec, parts, face, text, accent, feature.get("z", sign_board_z(spec)))
            return
        parts.append(wall_box(spec, f"sign_{face}", face, 0, floor * 0.84, (min(0.6, length * 0.5), 0.03, 0.07), accent))
    elif kind == "awning":
        width, height = door_layout(spec)
        parts.append(wall_box(spec, "awning", "front", spec.get("door_along", 0.0), height + 0.03, (width + 0.14, 0.06, 0.025), accent))
    elif kind == "chimney" and "count" in feature:
        add_chimney_row(spec, parts, feature["count"], top, dark)
    elif kind == "chimney":
        height = roof_height(spec) + 0.14
        parts.append(lpm.box("chimney", (0.07, 0.07, height), at=(body_width * 0.22, body_depth * 0.18, top), color=color_index(spec, "wall")))
        parts.append(lpm.box("chimney_cap", (0.095, 0.095, 0.02), at=(body_width * 0.22, body_depth * 0.18, top + height), color=dark))
    elif kind == "vent":
        if spec["roof"] in ("flat", "mansard"):
            across, ridge_z = 0.0, top + roof_height(spec)
        else:
            _, across, _, ridge_z = slope_frame(spec)
        x, y = _to_xy(spec, roof_dimensions(spec)[0] * 0.25, across)
        parts.append(lpm.prism("vent", 6, 0.032, 0.085, at=(x, y, ridge_z - 0.03), color=PALETTE_NAMES.index("slate")))
        parts.append(lpm.prism("vent_cap", 6, 0.042, 0.016, at=(x, y, ridge_z + 0.055), color=PALETTE_NAMES.index("slate_dark")))
    elif kind == "antenna":
        parts.append(lpm.prism("antenna_pole", 6, 0.008, 0.28, at=(-body_width * 0.2, 0, top), color=dark))
        for level, bar in enumerate((0.13, 0.1, 0.07)):
            parts.append(lpm.box(f"antenna_bar_{level}", (bar, 0.01, 0.01), at=(-body_width * 0.2, 0, top + 0.12 + level * 0.05), color=dark))
    elif kind == "skylight":
        if spec["roof"] == "flat":
            base = top + 0.04
        elif spec["roof"] == "shed":
            base = top + cfg["roof_thickness"] + roof_dimensions(spec)[2] / 2
        else:
            base = top + roof_height(spec) - 0.03
        across = ridge_offset(spec) if spec["roof"] in ("gable_half", "gable_third") else 0.0
        x, y = _to_xy(spec, 0, across)
        parts.append(lpm.box("skylight_frame", (0.2, 0.2, 0.05), at=(x, y, base), color=trim))
        parts.append(lpm.box("skylight_glass", (0.15, 0.15, 0.065), at=(x, y, base), color=color_index(spec, "glass")))
    elif kind == "solar_panels":
        add_solar_panels(spec, parts)
    elif kind == "balcony":
        columns = spec["window_columns"][face]
        for level in feature.get("levels", range(1, spec["floors"])):
            if level >= spec["floors"]:
                continue
            picked = {"outer": [0, len(columns) - 1], "center": [i for i in range(1, len(columns) - 1)], "first": [0], "last": [len(columns) - 1]}.get(feature.get("pick"))
            positions = feature["at"] if "at" in feature else [columns[i] for i in (picked if picked is not None else range(feature.get("offset", 0), len(columns), 1 if feature.get("every") else 2))]
            for index, along in enumerate(positions):
                if level == 1 and face == "front" and has_feature(spec, "sign") and abs(along) < SIGN_CLEARANCE:
                    continue
                if "at" not in feature and any(a0 - 0.1 < along < a1 + 0.1 and level < levels for a0, a1, levels in spec.get("volume_blocked", {}).get(face, [])):
                    continue
                lift = 0.005
                span = 0.22
                if feature.get("under_window"):
                    lift = floor * cfg["window_z"] - cfg["window_pad"] / 2 - 0.065
                    span = widths_of[index] + 0.04 if (widths_of := spec.get("window_widths", {}).get(face)) else 0.22
                parts.append(wall_box(spec, f"balcony_{face}_{level}_{index}", face, along, level * floor + lift, (span, 0.06, 0.02), trim))
                parts.append(wall_box(spec, f"rail_{face}_{level}_{index}", face, along, level * floor + lift + 0.02, (span, 0.06, 0.045), accent))
                if feature.get("plants_every") and index % feature["plants_every"] == feature.get("plants_offset", 0):
                    for plant, side in enumerate((-1, 1)):
                        px, py, _ = plane_point(face, along + side * span * 0.25, wall_half(spec, face) + 0.035, 0)
                        parts.append(lpm.prism(f"balcony_plant_{face}_{level}_{index}_{plant}", 6, 0.035, 0.06, at=(px, py, level * floor + lift + 0.065), color=PALETTE_NAMES.index("bush")))
    elif kind == "clock_tower":
        add_clock_tower(spec, parts, feature.get("clock", True))
    elif kind == "red_cross":
        add_red_cross(spec, parts, feature.get("along", 0.3))
    elif kind == "flagpole":
        add_flagpole(spec, parts)
    elif kind == "penthouse":
        add_penthouse(spec, parts, feature.get("scale", 0.58), tuple(feature.get("offset", (0.0, 0.0))))
    elif kind == "portico":
        add_portico(spec, parts)
    elif kind == "striped_awning":
        add_striped_awning(spec, parts, feature.get("along", 0.17), feature.get("width", 0.5), feature.get("rise", 0.84), feature.get("reach", 0.1), feature.get("stripes", 6), feature.get("level", 0))
    elif kind == "crate_stacks":
        add_crate_stacks(spec, parts, feature.get("along", -0.6), feature.get("count", 1), face)
    elif kind == "side_conveyor":
        add_side_conveyor(spec, parts, face, feature.get("along", 0.0), feature.get("length", 0.9))
    elif kind == "roof_tank":
        add_roof_tank(spec, parts, feature.get("x", -0.4), feature.get("y", 0.3), feature.get("radius", 0.17), feature.get("height", 0.3))
    elif kind == "roof_pipes":
        add_roof_pipes(spec, parts, feature.get("y", -0.1), feature.get("lift", 0.1))
    elif kind == "loading_dock":
        add_loading_dock(spec, parts, feature.get("along", 0.0), feature.get("width", 0.7))
    elif kind == "curved_marquee":
        add_curved_marquee(spec, parts, feature.get("along", -0.32), feature.get("width"), feature.get("radius", 0.087), feature.get("drop", 0.04))
    elif kind == "pilasters":
        add_pilasters(spec, parts, feature.get("along", 0.28), feature.get("width", 0.3))
    elif kind == "crystals":
        add_crystals(spec, parts, feature.get("along", 0.28), feature.get("on", "display"))
    elif kind == "red_carpet":
        add_red_carpet(spec, parts, feature.get("along", -0.32), feature.get("width", 0.18), feature.get("length", 0.16))
    elif kind == "hardware_display":
        add_hardware_display(spec, parts, feature.get("along", 0.17), feature.get("width", 0.5))
    elif kind == "roof_reel":
        add_roof_reel(spec, parts, feature.get("x", 0.3), feature.get("y", 0.2))
    elif kind == "hazard_band":
        add_hazard_band(spec, parts, face, feature.get("level", 1), feature.get("stripes", 12), feature.get("height", 0.02))
    elif kind == "industrial_door":
        add_industrial_door(spec, parts, face, feature.get("along", 0.0), feature.get("width", 0.62))
    elif kind == "bush_at":
        add_bush_at(spec, parts, feature.get("along", 0.0))
    elif kind == "marquee":
        add_marquee(spec, parts, feature.get("along", 0.0), feature.get("width"), feature.get("reach", 0.14))
    elif kind == "wall_tools":
        add_wall_tools(spec, parts, feature.get("along", -0.1), feature.get("width", 0.22))
    elif kind == "material_yard":
        add_material_yard(spec, parts, feature.get("along", 0.17), feature.get("width", 0.5))
    elif kind == "bulb_row":
        top = spec["floors"] * floor
        count = feature.get("count", 14)
        span = feature.get("width", 0.9)
        for index in range(count):
            a = feature.get("along", 0.0) - span / 2 + span * index / max(1, count - 1)
            parts.append(wall_box(spec, f"bulb_{index}", "front", a, feature.get("z", top + 0.035), (0.022, 0.022, 0.022), PALETTE_NAMES.index("white"), embed=-0.012))
    elif kind == "stone_accents":
        stone = color_index(spec, "trim")
        rng_stone = random.Random(spec["id"])
        top = spec["floors"] * floor
        for stone_face in feature.get("faces", FACES):
            stone_length, _ = wall_extent(spec, stone_face)
            for index in range(int(stone_length * feature.get("density", 9))):
                along = rng_stone.uniform(-stone_length / 2 + 0.06, stone_length / 2 - 0.06)
                z = rng_stone.uniform(0.05, top - 0.09)
                if stone_face == "front" and abs(along - spec.get("door_along", 0.0)) < 0.2 and z < floor * 0.8:
                    continue
                if any(abs(along - box[0]) < box[1] / 2 + 0.1 and box[2] - 0.06 < z < box[3] + 0.06 for box in opening_boxes(spec, stone_face)):
                    continue
                parts.append(wall_box(spec, f"stone_{stone_face}_{index}", stone_face, along, z, (0.07, 0.016, 0.03), stone, embed=-0.002))
    elif kind == "roof_vents":
        base = roof_surface(spec)
        width, depth = spec["body"]
        for index in range(3):
            parts.append(lpm.box(f"roof_vent_{index}", (0.34, 0.025, 0.02), at=(-width * 0.2, -depth * 0.12 + index * 0.07, base), color=color_index(spec, "trim")))
        parts.append(lpm.box("roof_unit", (0.3, 0.22, 0.14), at=(width * 0.2, depth * 0.1, base), color=color_index(spec, "trim")))
    elif kind == "roof_coin":
        top = spec["floors"] * floor
        width, depth = spec["body"]
        cx = feature.get("x", -width * 0.42)
        pole_y = -depth / 2 + 0.1
        parts.append(lpm.box("coin_pole", (0.025, 0.025, 0.16), at=(cx, pole_y, top + 0.03), color=color_index(spec, "trim")))
        parts.append(disc("coin", cx, pole_y - 0.02, top + 0.2, 0.1, 0.025, PALETTE_NAMES.index("sun")))
        parts.append(disc("coin_rim", cx, pole_y - 0.012, top + 0.2, 0.075, 0.03, PALETTE_NAMES.index("tangerine"), steps=16))
    elif kind == "poster":
        add_poster(spec, parts, feature)
    elif kind == "roof_die":
        add_roof_die(spec, parts, feature.get("x", 0.55), feature.get("y", 0.4), feature.get("size", 0.22))
    elif kind == "roof_card":
        add_roof_card(spec, parts, feature.get("x", -0.55), feature.get("y", -0.5), feature.get("size", 0.34))
    elif kind == "door_at":
        add_door_at(spec, parts, feature["along"])
    elif kind == "stall":
        add_stall(spec, parts, feature.get("along", 0.17), feature.get("width", 0.44), feature.get("produce", "fruit"))
    elif kind == "roof_lantern":
        add_roof_lantern(spec, parts, feature.get("size", 0.26), feature.get("height", 0.12))
    elif kind == "round_window":
        add_round_window(spec, parts, feature.get("rise", 0.07), feature.get("radius", 0.05), feature.get("on_hood", False), feature.get("stretch", 1.0), face)
    elif kind == "round_dormer":
        add_round_dormer(spec, parts, feature.get("along", 0.0), feature.get("depth_ratio", 0.32))
    elif kind == "stair_head":
        add_stair_head(spec, parts)
    elif kind == "penthouse_terrace":
        add_penthouse_terrace(spec, parts)
    elif kind == "door_hood":
        add_door_hood(spec, parts)
    elif kind == "smokestack":
        add_smokestack(spec, parts, feature.get("count", 1))
    elif kind == "roller_door":
        add_roller_door(spec, parts, feature.get("along", -0.28), feature.get("width", 0.34))
    # monumental_door and bushes are handled by the door and the volume builders


# --------------------------------------------------------------------------- volumes

def boundary_edge_count(ob):
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    count = sum(1 for e in bm.edges if len(e.link_faces) != 2)
    bm.free()
    return count


def assert_closed(parts):
    open_parts = [(p.name, boundary_edge_count(p)) for p in parts if not p.name.startswith("decal_")]
    open_parts = [item for item in open_parts if item[1]]
    if open_parts:
        raise AssertionError(f"open meshes: {open_parts}")


def shift(parts, dx, dy):
    for ob in parts:
        ob.data.transform(Matrix.Translation((dx, dy, 0)))


def add_trim_bands(spec, parts):
    cfg = spec["cfg"]
    body_width, body_depth = spec["body"]
    floor = spec["floor_height"]
    top = spec["floors"] * floor
    trim = color_index(spec, "trim")
    if cfg["cornice"]:
        parts.append(rounded_block("cornice", body_width + 0.03, body_depth + 0.03, 0.025, trim, cfg["corner"], at=(0, 0, top - 0.025)))
    if spec.get("floor_bands"):
        band = color_index(spec, "roof")
        for level in range(1, spec["floors"]):
            parts.append(rounded_block(f"floor_band_{level}", body_width + 0.016, body_depth + 0.016, 0.012, band, cfg["corner"], at=(0, 0, level * floor - 0.006)))
    push = 2 * cfg["belt_push"]
    for level in range(1, spec["floors"] if cfg["belt_height"] else 1):
        parts.append(rounded_block(f"belt_{level}", body_width + push, body_depth + push, cfg["belt_height"], trim, cfg["corner"], at=(0, 0, level * floor - cfg["belt_height"] / 2)))


def plan_volumes(spec):
    """Main volume plus an optional wing (L plan) and an optional front bay (cross gable), all inside spec['footprint']."""
    width, depth = spec["footprint"]
    x0, x1, y0, y1 = -width / 2, width / 2, -depth / 2, depth / 2
    volumes = []
    wing = spec.get("wing")
    wing_side, wing_depth, wing_floors = None, 0.0, 0
    if wing:
        wing_side = wing.get("side", "left")
        wing_width = wing.get("width", round(width * 0.4, 2))
        wing_depth = depth * wing.get("depth_ratio", 0.65)
        wing_floors = wing.get("floors", 1)
        if wing_side == "left":
            x0 += wing_width
        else:
            x1 -= wing_width
        joint = wing.get("overlap", 0.0)
        wing_cx = -width / 2 + (wing_width + joint) / 2 if wing_side == "left" else width / 2 - (wing_width + joint) / 2
        volumes.append({"role": "wing", "cx": wing_cx, "cy": -depth / 2 + wing_depth / 2, "width": wing_width + joint, "depth": wing_depth,
                        "floors": wing_floors, "roof": wing.get("roof", "gable_half"), "door": False,
                        "garage": wing.get("garage", False), "faces": [f for f in FACES if f != ("right" if wing_side == "left" else "left")],
                        "bushes": (-1,) if wing_side == "left" else (1,), "blocked": {}, "plants": wing.get("roof_plants", 0)})
    bay = spec["roof"] == "gable_cross"
    if bay:
        y0 += spec.get("bay_depth", 0.3)
    main = {"role": "main", "cx": (x0 + x1) / 2, "cy": (y0 + y1) / 2, "width": x1 - x0, "depth": y1 - y0, "floors": spec["floors"],
            "roof": "gable_half" if bay else spec["roof"], "door": not bay, "garage": False, "faces": list(FACES), "blocked": {},
            "bushes": ((1,) if wing_side == "left" else (-1,)) if wing else (-1, 1)}
    if wing_side == "left":
        main["blocked"]["left"] = [(depth / 2 - wing_depth + main["cy"], depth / 2 + main["cy"], wing_floors)]
    if wing_side == "right":
        main["blocked"]["right"] = [(-depth / 2 - main["cy"], -depth / 2 + wing_depth - main["cy"], wing_floors)]
    volumes.insert(0, main)
    if bay:
        bay_width = spec.get("bay_width", min(1.0, main["width"] * 0.5))
        bay_depth = main["cy"] + depth / 2
        bay_x = main["cx"] + spec.get("bay_offset", 0.0)
        bay_floors = spec.get("bay_floors", spec["floors"])
        volumes.append({"role": "bay", "cx": bay_x, "cy": -depth / 2 + bay_depth / 2, "width": bay_width, "depth": bay_depth,
                        "floors": bay_floors, "roof": "gable_half", "door": True, "garage": False,
                        "faces": ["front", "left", "right"] if bay_width >= 0.8 else [], "bushes": (-1, 1), "blocked": {}})
        main["blocked"]["front"] = [(bay_x - main["cx"] - bay_width / 2 - 0.02, bay_x - main["cx"] + bay_width / 2 + 0.02, spec["floors"] if spec.get("bay_clear_above") else bay_floors)]
    return volumes


def volume_spec(spec, volume, features):
    cfg = spec["cfg"]
    vs = dict(spec)
    vs.update(footprint=(volume["width"], volume["depth"]), floors=volume["floors"], roof=volume["roof"], features=features, window_columns={})
    vs["hip_ratio"] = spec.get("hip_ratio") if volume["role"] == "main" else None
    over_x = over_y = spec.get("roof_overhang", cfg["overhang"])
    if has_gable_ends(vs):
        if ridge_along_x(vs):
            over_x = cfg["verge"]
        else:
            over_y = cfg["verge"]
    vs["body"] = (volume["width"] - 2 * over_x, volume["depth"] - 2 * over_y)
    return vs


def build_volume(vs, volume, rng, bushes):
    cfg = vs["cfg"]
    body_width, body_depth = vs["body"]
    top = vs["floors"] * vs["floor_height"]
    parts = [rounded_block("walls", body_width, body_depth, top, color_index(vs, "wall"), cfg["corner"])]
    if has_feature(vs, "storefront"):
        parts.append(rounded_block("storefront", body_width + 0.012, body_depth + 0.012, vs["floor_height"], PALETTE_NAMES.index(cfg["ink"]), cfg["corner"]))
    parts.append(rounded_block("base_band", body_width + 2 * cfg["base_push"], body_depth + 2 * cfg["base_push"], cfg["base_height"], color_index(vs, "trim"), cfg["corner"]))
    add_trim_bands(vs, parts)
    parts += roof_parts(vs, top)
    if volume["door"]:
        add_door(vs, parts)
    if volume["garage"]:
        add_garage_door(vs, parts)
    for face in volume["faces"]:
        windows_on_face(vs, parts, face, rng, volume["door"], volume["blocked"])
    if vs["roof"] == "mansard":
        add_dormers(vs, parts)
    vs["volume_blocked"] = volume["blocked"]
    for feature in vs["features"]:
        add_feature(vs, parts, feature)
    if volume.get("plants"):
        add_roof_plants(vs, parts, volume["plants"], rng)
    if bushes:
        add_bushes(vs, parts, volume["bushes"])
    shift(parts, volume["cx"], volume["cy"])
    return parts


def features_of(volume, front, main, features):
    if volume is front and volume is main:
        return features
    if volume is front:
        return [f for f in features if f["type"] in FRONT_FEATURES]
    if volume is main:
        return [f for f in features if f["type"] not in FRONT_FEATURES]
    return []


TURBINE_LAYOUTS = {
    1: ((0.0, 0.0, 0.9),),
    2: ((-0.2, -0.16, 0.95), (0.2, 0.16, 0.7)),
    3: ((-0.2, -0.28, 0.7), (0.2, 0.0, 0.95), (-0.12, 0.28, 0.8)),
}


def bevel_edges(ob, selector, offset, segments):
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    edges = [e for e in bm.edges if selector(e)]
    bmesh.ops.bevel(bm, geom=edges, offset=offset, segments=segments, affect="EDGES")
    bm.to_mesh(ob.data)
    bm.free()
    ob.data.update()
    return ob


def bevel_top(ob, offset):
    """Round the edges of the top face of a block."""
    top = max(v.co.z for v in ob.data.vertices)
    return bevel_edges(ob, lambda e: all(abs(v.co.z - top) < 1e-6 for v in e.verts), offset, 2)


def bevel_all(ob, offset):
    return bevel_edges(ob, lambda e: True, offset, 1)


def blade_outline(radius):
    """A broad rounded blade, (distance along the blade, sideways offset) around the hub."""
    wide = 0.05
    left = [(0.03, -0.03), (radius * 0.35, -wide), (radius * 0.8, -wide * 0.85), (radius * 0.95, -wide * 0.5), (radius, 0.0)]
    right = [(radius * 0.95, wide * 0.5), (radius * 0.8, wide * 0.85), (radius * 0.35, wide), (0.03, 0.03)]
    return left + right


def blade_halves(radius, inner_color, outer_color, split=0.62):
    """The blade cut in two outlines: a root in `inner_color` and a tip in `outer_color`."""
    outline = blade_outline(radius)
    cut = radius * split
    wide = 0.05
    width_at_cut = wide + (wide * 0.85 - wide) * (split - 0.35) / 0.45
    near = [(r, w) for r, w in outline if r <= cut]
    far = [(r, w) for r, w in outline if r > cut]
    side = [(cut, -width_at_cut), (cut, width_at_cut)]
    root_outline = [p for p in near if p[1] <= 0] + [side[0]] + [side[1]] + [p for p in near if p[1] > 0]
    tip_outline = [side[0]] + [p for p in far if p[1] <= 0] + [p for p in far if p[1] > 0] + [side[1]]
    return [(root_outline, inner_color), (tip_outline, outer_color)]


def turbine(index, x, y, height, radius, tower, nacelle, accent, dark, angle, rings=1):
    """A tapered tower, a nacelle and a three-blade rotor facing the front (-Y), turned by `angle` degrees."""
    parts = [
        lpm.prism(f"turbine_{index}_collar", 10, 0.075, 0.05, at=(x, y, 0.03), color=dark),
        lpm.prism(f"turbine_{index}_tower", 10, 0.055, height, at=(x, y, 0.04), color=tower, radius_top=0.03),
    ]
    for ring in range(1, rings + 1):
        level = ring / 5
        parts.append(lpm.prism(f"turbine_{index}_ring_{ring}", 10, 0.055 - 0.025 * level + 0.015, 0.03, at=(x, y, 0.04 + height * level), color=accent))
    top = 0.04 + height
    body_z = top - 0.03
    low, high = slanted_blocks(f"turbine_{index}_nacelle", 0.105, 0.2, 0.1, 0.03 / 0.105, (nacelle, accent), at=(x, y + 0.02, top - 0.03), slope=0.35)
    parts += [low, bevel_top(high, 0.018)]
    parts.append(rounded_block(f"turbine_{index}_nacelle_cap", 0.075, 0.05, 0.04, nacelle, 0.03 / 0.05, at=(x, y - 0.1, top - 0.015)))
    parts.append(bevel_top(rounded_block(f"turbine_{index}_nacelle_cap_top", 0.075, 0.05, 0.035, accent, 0.03 / 0.05, at=(x, y - 0.1, top + 0.025)), 0.012))
    hub_y = y - 0.13
    hub_z = top + 0.02
    for blade in range(3):
        turn = math.radians(angle + 120 * blade)
        for part, (outline, color) in enumerate(blade_halves(radius, tower, accent)):
            turned = [(r * math.sin(turn) - w * math.cos(turn), r * math.cos(turn) + w * math.sin(turn)) for r, w in outline]
            parts.append(bevel_all(lpm.sweep(f"turbine_{index}_blade_{blade}_{part}", turned, 0.03, at=(x, hub_y - 0.015, hub_z), color=color), 0.004))
    parts.append(lpm.box(f"turbine_{index}_hub", (0.09, 0.07, 0.09), at=(x, hub_y - 0.035, hub_z - 0.045), color=accent, taper=(0.65, 1.0)))
    return parts


def build_turbine(spec, out_dir):
    """A wind farm on a thin pad: `count` white turbines with mint rotor hubs, staggered in height so the rotors never touch."""
    style = spec.get("style", "urbtopia")
    palette_for(spec, style)
    count = spec["count"]
    names = PALETTE_NAMES
    tower, nacelle, accent, dark, pad = (names.index(n) for n in ("uwall", "uwall", "uroof", "udark", "uslab"))
    accent = PALETTE_NAMES.index("vtone1")
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in palette_for(spec, style)])
    size = spec["footprint"][0]
    parts = [lpm.prism("turbine_pad", 12, 0.2, 0.03, at=(0, 0, 0), color=accent)]
    for index, (x, y, height) in enumerate(TURBINE_LAYOUTS[1]):
        parts += turbine(index, x, y, height, spec.get("rotor", 0.42), tower, nacelle, accent, dark, 20 + 40 * index, rings=count)
    ob = lpm.finish(spec["id"], parts, palette, budget=2500, center=False)
    return export_model(ob, spec, out_dir)

GEOTHERMAL_TOWERS = ((0.3, 0.28), (0.3, 0.0), (0.3, -0.28))


def build_geothermal(spec, out_dir):
    """A small geothermal plant on a thin pad: a turbine hall with a mint-banded slab roof, a steam manifold and `count` cooling towers, each one with a steam puff."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    wall, mint, dark, slab, glass, white, trim = (index(n) for n in ("uwall", "uroof", "udark", "uslab", "glass_blue", "white", "utrim"))
    mint = PALETTE_NAMES.index("vtone1")
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    parts = [lpm.box("plant_pad", (0.96, 0.96, 0.04), at=(0, 0, 0), color=slab)]
    hx, hy = -0.17, 0.2
    parts.append(rounded_block("hall", 0.5, 0.34, 0.28, wall, 0.03 / 0.34, at=(hx, hy, 0.04)))
    parts.append(rounded_block("hall_band", 0.51, 0.35, 0.025, mint, 0.03 / 0.35, at=(hx, hy, 0.3)))
    parts.append(rounded_block("hall_roof", 0.54, 0.38, 0.03, slab, 0.03 / 0.38, at=(hx, hy, 0.325)))
    front = hy - 0.17
    parts.append(lpm.box("hall_door", (0.12, 0.014, 0.17), at=(hx - 0.14, front - 0.004, 0.04), color=dark))
    parts.append(lpm.box("hall_window", (0.22, 0.012, 0.09), at=(hx + 0.1, front - 0.003, 0.12), color=glass))
    count = spec["count"]
    x, y = GEOTHERMAL_TOWERS[0]
    height = 0.55 + 0.15 * (count - 1)
    scale = height / 0.55
    profile = [(r, z * scale) for r, z in ((0.0, 0.0), (0.14, 0.0), (0.12, 0.2), (0.095, 0.38), (0.115, 0.52), (0.115, 0.55), (0.0, 0.55))]
    parts.append(lpm.lathe("tower", profile, segments=12, at=(x, y, 0.04), color=wall))
    for ring in range(count):
        level = height - 0.08 - 0.08 * ring
        radius = next(r0 + (r1 - r0) * (level - z0) / (z1 - z0) for (r0, z0), (r1, z1) in zip(profile, profile[1:]) if z0 <= level <= z1 and z1 > z0)
        parts.append(lpm.prism(f"tower_ring_{ring}", 12, radius + 0.008, 0.04, at=(x, y, 0.04 + level), color=mint))
    parts.append(lpm.prism("tower_rim", 12, 0.118, 0.012, at=(x, y, 0.04 + height), color=dark))
    puff = [(0.0, 0.0), (0.06, 0.02), (0.085, 0.08), (0.06, 0.15), (0.0, 0.17)]
    parts.append(lpm.lathe("steam", puff, segments=8, at=(x, y, 0.04 + height + 0.02), color=white))
    parts.append(lpm.box("hall_link", (0.14, 0.035, 0.035), at=(0.08 + 0.07, y, 0.1), color=trim))
    wx, wy = -0.3, -0.22
    parts.append(lpm.prism("wellhead", 10, 0.05, 0.16, at=(wx, wy, 0.04), color=trim))
    parts.append(lpm.prism("wellhead_flange", 10, 0.065, 0.025, at=(wx, wy, 0.04 + 0.1), color=mint))
    parts.append(lpm.prism("wellhead_cap", 10, 0.045, 0.02, at=(wx, wy, 0.04 + 0.16), color=dark))
    parts.append(lpm.box("wellhead_pipe", (0.035, abs(front - wy), 0.035), at=(wx, (front + wy) / 2, 0.11), color=trim))
    ob = lpm.finish(spec["id"], parts, palette, budget=3000, center=False)
    return export_model(ob, spec, out_dir)

def build_coal(spec, out_dir):
    """A coal plant on a thin pad: a boiler hall, a coal heap fed by a short conveyor, and one slim chimney with a dark smoke plume. The Tier is the chimney height (0.55 to 0.85) and its number of mint rings."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    wall, mint, dark, slab, glass, smoke, trim = (index(n) for n in ("uwall", "uroof", "udark", "uslab", "glass_blue", "slate", "utrim"))
    mint = PALETTE_NAMES.index("vtone1")
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    count = spec["count"]
    parts = [lpm.box("plant_pad", (0.96, 0.96, 0.04), at=(0, 0, 0), color=slab)]
    hx, hy = -0.17, 0.2
    parts.append(rounded_block("hall", 0.5, 0.34, 0.28, wall, 0.03 / 0.34, at=(hx, hy, 0.04)))
    parts.append(rounded_block("hall_band", 0.51, 0.35, 0.025, mint, 0.03 / 0.35, at=(hx, hy, 0.3)))
    parts.append(rounded_block("hall_roof", 0.54, 0.38, 0.03, slab, 0.03 / 0.38, at=(hx, hy, 0.325)))
    front = hy - 0.17
    parts.append(lpm.box("hall_door", (0.12, 0.014, 0.17), at=(hx - 0.14, front - 0.004, 0.04), color=dark))
    parts.append(lpm.box("hall_window", (0.17, 0.012, 0.09), at=(-0.08, front - 0.003, 0.12), color=glass))
    frame = PALETTE_NAMES.index("uframe")
    for name, cx, bottom, width, height, sides in (("door", hx - 0.14, 0.04, 0.12, 0.17, ("left", "right", "top")), ("window", -0.08, 0.12, 0.17, 0.09, ("left", "right", "top", "bottom"))):
        thick = 0.012
        if "left" in sides:
            parts.append(lpm.box(f"{name}_frame_left", (thick, 0.01, height + thick * (1 if "top" in sides else 0) + (thick if "bottom" in sides else 0)), at=(cx - width / 2 - thick / 2, front - 0.004, bottom - (thick if "bottom" in sides else 0)), color=frame))
        if "right" in sides:
            parts.append(lpm.box(f"{name}_frame_right", (thick, 0.01, height + thick * (1 if "top" in sides else 0) + (thick if "bottom" in sides else 0)), at=(cx + width / 2 + thick / 2, front - 0.004, bottom - (thick if "bottom" in sides else 0)), color=frame))
        if "top" in sides:
            parts.append(lpm.box(f"{name}_frame_top", (width + 2 * thick, 0.01, thick), at=(cx, front - 0.004, bottom + height), color=frame))
        if "bottom" in sides:
            parts.append(lpm.box(f"{name}_frame_bottom", (width + 2 * thick, 0.01, thick), at=(cx, front - 0.004, bottom - thick), color=frame))
    heap = [(0.0, 0.0), (0.16, 0.0), (0.12, 0.05), (0.07, 0.1), (0.0, 0.13)]
    parts.append(lpm.lathe("coal_heap", heap, segments=9, at=(0.05, -0.27, 0.04), color=dark))
    parts.append(lpm.box("conveyor", (0.06, 0.3, 0.025), at=(0.05, -0.12, 0.13), color=trim))
    for number, y in enumerate((-0.24, -0.04)):
        for side in (-1, 1):
            parts.append(lpm.box(f"conveyor_leg_{number}_{side}", (0.012, 0.012, 0.09), at=(0.05 + side * 0.024, y, 0.04), color=dark))
    x, y = 0.3, 0.25
    height = 0.55 + 0.1 * (count - 1)
    radius_at = lambda z: 0.075 - 0.02 * z / height
    parts.append(lpm.prism("chimney", 10, 0.075, height, at=(x, y, 0.04), color=wall, radius_top=0.055))
    for ring in range(count):
        level = height - 0.08 - 0.07 * ring
        parts.append(lpm.prism(f"chimney_ring_{ring}", 10, radius_at(level) + 0.008, 0.035, at=(x, y, 0.04 + level), color=mint))
    parts.append(lpm.prism("chimney_cap", 10, 0.062, 0.014, at=(x, y, 0.04 + height), color=dark))
    for number, (radius, rise, drift) in enumerate(((0.06, 0.02, 0.0), (0.075, 0.12, 0.03), (0.06, 0.22, 0.07))):
        puff = [(0.0, 0.0), (radius, 0.02), (radius * 1.1, 0.07), (radius * 0.8, 0.12), (0.0, 0.14)]
        parts.append(lpm.lathe(f"smoke_{number}", puff, segments=8, at=(x + drift, y, 0.04 + height + 0.02 + rise), color=smoke))
    parts.append(lpm.box("hall_link", (0.14, 0.035, 0.035), at=(0.08 + 0.07, y, 0.1), color=trim))
    ob = lpm.finish(spec["id"], parts, palette, budget=3000, center=False)
    return export_model(ob, spec, out_dir)

MOUND_HEAPS = {
    1: ((0.0, 0.02, 0.38, 0.15),),
    2: ((-0.17, 0.06, 0.31, 0.22), (0.19, -0.03, 0.28, 0.3)),
    3: ((-0.19, 0.12, 0.29, 0.26), (0.2, 0.05, 0.28, 0.34), (-0.02, -0.12, 0.33, 0.42)),
}
MOUND_STRATA = (("udark", 0.45, 0.9), ("utrim", 0.35, 0.72), ("uwood", 0.2, 0.0))


def mound_heap(parts, number, x, y, radius, height, shift):
    """A faceted heap of three stacked layers; `shift` rotates the layer colors so neighbouring heaps differ."""
    z = 0.0
    layer_radius = radius
    for layer, (name, share, top) in enumerate(MOUND_STRATA):
        color = PALETTE_NAMES.index(MOUND_STRATA[(layer + shift) % 3][0])
        layer_height = height * share
        top_radius = radius * top if top else layer_radius * 0.55
        parts.append(lpm.prism(f"heap_{number}_{layer}", 8, layer_radius, layer_height, at=(x, y, z), color=color, radius_top=top_radius))
        z += layer_height
        layer_radius = top_radius


def mound_surface(radius, height, distance):
    """Height of a heap of `mound_heap` at `distance` from its axis, or None outside it."""
    z, layer_radius = 0.0, radius
    for _, share, top in MOUND_STRATA:
        layer_height = height * share
        top_radius = radius * top if top else layer_radius * 0.55
        if distance <= layer_radius and distance > top_radius:
            return z + layer_height * (layer_radius - distance) / (layer_radius - top_radius)
        z += layer_height
        layer_radius = top_radius
    return z if distance <= layer_radius else None


MOUND_BAG = [(0.0, 0.0), (0.045, 0.0), (0.06, 0.035), (0.05, 0.075), (0.018, 0.1), (0.0, 0.108)]
MOUND_LITTER = (
    ("bag", 0.15, 0.5, "graphite"), ("tin", 0.9, 0.62, "coral"), ("can", 1.6, 0.4, "aqua"), ("bag", 2.3, 0.72, "bush"),
    ("tin", 3.0, 0.35, "sun"), ("can", 3.7, 0.66, "utrim"), ("bag", 4.4, 0.45, "graphite"), ("tin", 5.1, 0.7, "tangerine"),
    ("can", 5.8, 0.55, "coral"), ("tin", 0.5, 0.8, "utrim"), ("bag", 1.2, 0.85, "bush"), ("can", 2.8, 0.8, "sun"),
)[:6]


def mound_litter(parts, heap_number, x, y, radius, height):
    """Garbage bags, tins and crushed cans lying on the surface of one heap."""
    index = PALETTE_NAMES.index
    for number, (kind, angle, share, color) in enumerate(MOUND_LITTER):
        angle += heap_number * 0.9
        distance = radius * share
        z = mound_surface(radius, height, distance)
        if z is None:
            continue
        px, py = x + distance * math.cos(angle), y + distance * math.sin(angle)
        name = f"litter_{heap_number}_{number}"
        if kind == "bag":
            parts.append(lpm.lathe(name, MOUND_BAG, segments=7, at=(px, py, z - 0.012), color=index(color)))
        elif kind == "tin":
            parts.append(lpm.prism(name, 8, 0.024, 0.04, at=(px, py, z - 0.008), color=index(color)))
        else:
            parts.append(tilted_box(name, px, py, z - 0.004, 0.05, 0.034, 0.012, 20 + 8 * (number % 3), index(color)))
            parts.append(lpm.prism(f"{name}_top", 6, 0.014, 0.012, at=(px + 0.03, py, z + 0.004), color=index(color)))


def build_mound(spec, out_dir):
    """A landfill mound straight on the ground: one to three faceted heaps of rubble in layers (the Tier is the count and height of the heaps), covered with garbage bags, tins and crushed cans, with planks and sacks lying around them."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    wood, white = index("uwood"), index("white")
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    tier = spec["count"]
    parts = []
    for number, (x, y, radius, height) in enumerate(MOUND_HEAPS[tier]):
        mound_heap(parts, number, x, y, radius, height, number)
        mound_litter(parts, number, x, y, radius, height)
    for number, (x, y, angle) in enumerate(((-0.1, -0.34, 12), (0.05, -0.3, 22))[:tier]):
        parts.append(tilted_box(f"plank_{number}", x, y, 0.0, 0.22, 0.045, 0.015, angle, wood))
    for number, (x, y) in enumerate(((0.28, -0.22), (-0.34, -0.12), (0.34, 0.3))[:tier]):
        parts.append(rounded_block(f"sack_{number}", 0.1, 0.07, 0.05, white, 0.3, at=(x, y, 0.0)))
    ob = lpm.finish(spec["id"], parts, palette, budget=2500, center=False)
    return export_model(ob, spec, out_dir)


INCINERATOR_STACK_HEIGHTS = (0.7, 1.0, 1.3, 1.6)


def build_incinerator(spec, out_dir):
    """A waste incinerator filling its 2x2 cell: a low rounded hall with a tipping door on a loading dock under a hazard band, a service door and framed windows, and one wide central chimney whose height is the Tier (0.7 to 1.6) and whose brick rings count the Tier. Orange and brick accents, a thin smoke plume."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    wall, dark, slab, trim, frame, glass, brick, orange, sun, smoke = (index(n) for n in ("uwall", "udark", "uslab", "utrim", "uframe", "glass_blue", "brick", "tangerine", "sun", "slate"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    tier = spec["count"]
    cy, width, depth, height = 0.1, 1.9, 1.4, 0.42
    front, back = cy - depth / 2, cy + depth / 2
    parts = [rounded_block("hall", width, depth, height, wall, 0.03 / depth, at=(0, cy, 0))]
    parts.append(rounded_block("hall_plinth", width + 0.01, depth + 0.01, 0.09, brick, 0.03 / depth, at=(0, cy, 0)))
    parts.append(rounded_block("hall_band", width + 0.01, depth + 0.01, 0.07, brick, 0.03 / depth, at=(0, cy, height - 0.11)))
    parts.append(lpm.box("hall_roof", (width + 0.04, depth + 0.04, 0.03), at=(0, cy, height), color=slab))
    for name, size, at in (("front", (width + 0.04, 0.015, 0.03), (0, front - 0.02, height + 0.03)), ("back", (width + 0.04, 0.015, 0.03), (0, back + 0.02, height + 0.03)),
                           ("left", (0.015, depth + 0.04, 0.03), (-width / 2 - 0.02, cy, height + 0.03)), ("right", (0.015, depth + 0.04, 0.03), (width / 2 + 0.02, cy, height + 0.03))):
        parts.append(lpm.box(f"parapet_{name}", size, at=at, color=dark))
    dock_x, dock_w = -0.4, 0.8
    parts.append(lpm.box("dock", (dock_w + 0.1, 0.22, 0.04), at=(dock_x, front - 0.11, 0.0), color=trim))
    parts.append(lpm.box("tipping_door", (dock_w, 0.014, 0.28), at=(dock_x, front - 0.004, 0.04), color=dark))
    door_frame(parts, "tipping_door", dock_x, front, 0.04, dock_w, 0.28, frame)
    for number in range(8):
        parts.append(lpm.box(f"hazard_{number}", (dock_w / 8, 0.016, 0.04), at=(dock_x - dock_w / 2 + dock_w / 8 * (number + 0.5), front - 0.006, 0.34), color=sun if number % 2 == 0 else dark))
    parts.append(lpm.box("service_door", (0.16, 0.014, 0.22), at=(0.45, front - 0.004, 0.0), color=dark))
    door_frame(parts, "service_door", 0.45, front, 0.0, 0.16, 0.22, frame)
    parts.append(lpm.box("front_window", (0.22, 0.012, 0.1), at=(0.75, front - 0.003, 0.16), color=glass))
    window_frame(parts, "front_window", 0.75, front, 0.16, 0.22, 0.1, frame)
    for side, name in ((-1, "left"), (1, "right")):
        x = side * (width / 2)
        parts.append(lpm.box(f"{name}_window", (0.012, 0.3, 0.1), at=(x + side * 0.003 - 0.006, cy, 0.16), color=glass))
        for edge, (dy, dz, sy, sz) in enumerate(((0.16, 0.0, 0.012, 0.124), (-0.16, 0.0, 0.012, 0.124), (0.0, 0.112, 0.34, 0.012), (0.0, -0.012, 0.34, 0.012))):
            parts.append(lpm.box(f"{name}_window_frame_{edge}", (0.01, sy, sz), at=(x + side * 0.001 - 0.005, cy + dy, 0.16 + dz), color=frame))
    for number, vx in enumerate((-0.7, 0.7)):
        parts.append(lpm.prism(f"roof_vent_{number}", 6, 0.07, 0.07, at=(vx, back - 0.25, height + 0.03), color=trim))
        parts.append(lpm.prism(f"roof_vent_cap_{number}", 6, 0.085, 0.015, at=(vx, back - 0.25, height + 0.1), color=dark))
    base_top = height + 0.03 + 0.1
    parts.append(rounded_block("flue_box", 0.92, 0.92, 0.1, slab, 0.2, at=(0, cy, height + 0.03)))
    parts.append(rounded_block("flue_band", 0.93, 0.93, 0.03, orange, 0.2, at=(0, cy, height + 0.03 + 0.06)))
    stack = INCINERATOR_STACK_HEIGHTS[tier - 1]
    base_radius, top_radius = 0.37, 0.27
    radius_at = lambda z: base_radius - (base_radius - top_radius) * z / stack
    parts.append(lpm.prism("chimney", 12, base_radius, stack, at=(0, cy, base_top), color=wall, radius_top=top_radius))
    for ring in range(tier):
        level = stack - 0.1 - 0.13 * ring
        parts.append(lpm.prism(f"chimney_ring_{ring}", 12, radius_at(level) + 0.012, 0.06, at=(0, cy, base_top + level), color=brick))
    parts.append(lpm.prism("chimney_cap", 12, top_radius + 0.02, 0.025, at=(0, cy, base_top + stack), color=dark))
    for number, (radius, rise, drift) in enumerate(((0.12, 0.03, 0.0), (0.15, 0.2, 0.06))):
        puff = [(0.0, 0.0), (radius, 0.02), (radius * 1.1, 0.07), (radius * 0.8, 0.12), (0.0, 0.14)]
        parts.append(lpm.lathe(f"smoke_{number}", puff, segments=8, at=(drift, cy, base_top + stack + 0.02 + rise), color=smoke))
    ob = lpm.finish(spec["id"], parts, palette, budget=3500, center=False)
    return export_model(ob, spec, out_dir)


RECYCLING_BINS = (("sky", -0.5), ("sun", -0.1), ("lime", 0.3), ("utrim", 0.7))


def build_recycling(spec, out_dir):
    """A recycling plant filling its 3x2 cell: a long low hall with a mint band and a sawtooth roof of blue skylights, a ribbed sliding door, a service door and a "RECYCLING" lettering on the front, a rack-and-pinion style distribution ramp (two rails and regular cleats) climbing to an intake opening, and a row of sorting bins in the yard, one more per Tier (one to four)."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    cfg = STYLES[style]
    index = PALETTE_NAMES.index
    wall, dark, slab, trim, frame, glass, mint, graphite = (index(n) for n in ("uwall", "udark", "uslab", "utrim", "uframe", "glass_blue", "uroof", "graphite"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    tier = spec["count"]
    width, depth, height = 2.9, 1.05, 0.5
    cy = 0.425
    front, back = cy - depth / 2, cy + depth / 2
    parts = [rounded_block("hall", width, depth, height, wall, 0.03 / depth, at=(0, cy, 0))]
    parts.append(rounded_block("hall_band", width + 0.01, depth + 0.01, 0.06, mint, 0.03 / depth, at=(0, cy, height - 0.07)))
    parts.append(lpm.box("hall_roof", (width + 0.04, depth + 0.04, 0.03), at=(0, cy, height), color=slab))
    teeth, tooth_depth, tooth_rise = 3, (depth - 0.04) / 3, 0.18
    for number in range(teeth):
        ya = front + 0.02 + number * tooth_depth
        parts.append(extrude_x(f"sawtooth_{number}", [(ya, height + 0.03), (ya + tooth_depth, height + 0.03), (ya, height + 0.03 + tooth_rise)], -width / 2 + 0.1, width / 2 - 0.1, slab))
        parts.append(lpm.box(f"skylight_{number}", (width - 0.3, 0.008, tooth_rise - 0.03), at=(0, ya - 0.006, height + 0.045), color=glass))
    door_x, door_w = -0.95, 0.6
    parts.append(lpm.box("sliding_door", (door_w, 0.014, 0.3), at=(door_x, front - 0.004, 0.0), color=dark))
    for number in range(5):
        parts.append(lpm.box(f"door_rib_{number}", (door_w - 0.04, 0.018, 0.012), at=(door_x, front - 0.007, 0.04 + 0.055 * number), color=trim))
    door_frame(parts, "sliding_door", door_x, front, 0.0, door_w, 0.3, frame)
    parts.append(glyph_decal({"cfg": cfg}, "sign_text", "front", "RECYCLING", 0.0, 0.34, 0.07, graphite, -(front - 0.002)))
    side_x = width / 2
    parts.append(lpm.box("service_door", (0.014, 0.16, 0.24), at=(side_x + 0.004, cy, 0.0), color=dark))
    for edge, (dy, sy, sz, dz) in enumerate(((0.092, 0.012, 0.252, 0.0), (-0.092, 0.012, 0.252, 0.0), (0.0, 0.176, 0.012, 0.24))):
        parts.append(lpm.box(f"service_door_frame_{edge}", (0.01, sy, sz), at=(side_x + 0.005, cy + dy, dz), color=frame))
    ramp_x, ramp_w = 1.2, 0.26
    y0, z0 = front - 0.8, 0.02
    run, rise = 0.8, 0.32
    tilt = math.degrees(math.atan2(rise, run))
    length = math.hypot(run, rise)
    parts.append(lpm.box("intake", (0.3, 0.014, 0.12), at=(ramp_x, front - 0.004, 0.3), color=dark))
    door_frame(parts, "intake", ramp_x, front, 0.3, 0.3, 0.12, frame)
    parts.append(tilted_box("ramp_bed", ramp_x, y0 + run / 2, z0, ramp_w, length, 0.02, tilt, trim))
    for side in (-1, 1):
        parts.append(tilted_box(f"ramp_rail_{side}", ramp_x + side * (ramp_w / 2 + 0.01), y0 + run / 2, z0, 0.02, length, 0.05, tilt, frame))
    step = 0.06
    for number in range(int(length / step) - 1):
        along = step * (number + 1)
        parts.append(tilted_box(f"ramp_cleat_{number}", ramp_x, y0 + along * math.cos(math.radians(tilt)), z0 + 0.02 + along * math.sin(math.radians(tilt)), ramp_w - 0.02, 0.022, 0.014, tilt, dark))
    for number, fraction in enumerate((0.2, 0.55, 0.9)):
        top = z0 + rise * fraction
        parts.append(lpm.box(f"ramp_leg_{number}", (0.03, 0.03, top), at=(ramp_x + ramp_w / 2 + 0.01, y0 + run * fraction, 0.0), color=dark))
        parts.append(lpm.box(f"ramp_leg_b_{number}", (0.03, 0.03, top), at=(ramp_x - ramp_w / 2 - 0.01, y0 + run * fraction, 0.0), color=dark))
    for number, (color, x) in enumerate(RECYCLING_BINS[:tier]):
        parts.append(rounded_block(f"bin_{number}", 0.3, 0.34, 0.26, index(color), 0.2, at=(x, front - 0.45, 0.0)))
        parts.append(rounded_block(f"bin_lid_{number}", 0.32, 0.36, 0.035, dark, 0.2, at=(x, front - 0.45, 0.26)))
    ob = lpm.finish(spec["id"], parts, palette, budget=4000, center=False)
    return export_model(ob, spec, out_dir)


def door_frame(parts, name, cx, y, bottom, width, height, color, thick=0.012):
    """Thin surround on the left, right and top of a door; `y` is the wall plane (front, -Y)."""
    parts.append(lpm.box(f"{name}_frame_left", (thick, 0.01, height + thick), at=(cx - width / 2 - thick / 2, y - 0.004, bottom), color=color))
    parts.append(lpm.box(f"{name}_frame_right", (thick, 0.01, height + thick), at=(cx + width / 2 + thick / 2, y - 0.004, bottom), color=color))
    parts.append(lpm.box(f"{name}_frame_top", (width + 2 * thick, 0.01, thick), at=(cx, y - 0.004, bottom + height), color=color))


BACKUP_SLOTS = [(x, y) for y in (0.62, -0.35) for x in (0.65, 0.0, -0.65)]


def build_backup(spec, out_dir):
    """A backup power plant filling its 2x2 cell: a tall generator hall with two ribbed garage doors and, on the roof, `count` battery cabinets joined by a cable run to a junction box."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    wall, mint, dark, slab, trim, frame = (index(n) for n in ("uwall", "uroof", "udark", "uslab", "utrim", "uframe"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    width, depth, height = 1.92, 1.92, 0.63
    parts = [rounded_block("hall", width, depth, height, wall, 0.03 / 1.92, at=(0, 0, 0))]
    parts.append(rounded_block("hall_band", width + 0.01, depth + 0.01, 0.03, mint, 0.03 / 1.92, at=(0, 0, height - 0.04)))
    parts.append(rounded_block("hall_roof", 1.96, 1.96, 0.03, slab, 0.03 / 1.96, at=(0, 0, height)))
    front = -depth / 2
    for number, side in enumerate((-1, 1)):
        cx = side * 0.5
        parts.append(lpm.box(f"garage_door_{number}", (0.5, 0.014, 0.45), at=(cx, front - 0.004, 0.0), color=dark))
        for rib in range(1, 7):
            parts.append(lpm.box(f"garage_rib_{number}_{rib}", (0.5, 0.006, 0.008), at=(cx, front - 0.01, 0.45 * rib / 7), color=trim))
        door_frame(parts, f"garage_{number}", cx, front, 0.0, 0.5, 0.45, frame)
    roof = height + 0.03
    k = 1.5
    used = BACKUP_SLOTS[:spec["count"]]
    trunk_y = 0.13
    for number, (x, y) in enumerate(used):
        parts.append(rounded_block(f"battery_{number}", 0.34 * k, 0.28 * k, 0.26 * k, wall, 0.03 / (0.28 * k), at=(x, y, roof)))
        parts.append(lpm.box(f"battery_{number}_stripe", (0.345 * k, 0.285 * k, 0.03 * k), at=(x, y, roof + 0.16 * k), color=mint))
        parts.append(lpm.box(f"battery_{number}_vent", (0.2 * k, 0.012, 0.08 * k), at=(x - 0.02 * k, y - 0.145 * k, roof + 0.05 * k), color=dark))
        parts.append(lpm.prism(f"battery_{number}_terminal", 8, 0.03 * k, 0.08 * k, at=(x + 0.09 * k, y, roof + 0.26 * k), color=dark))
        edge = y - 0.14 * k if y > trunk_y else y + 0.14 * k
        parts.append(lpm.box(f"cable_branch_{number}", (0.025, abs(trunk_y - edge) + 0.025, 0.014), at=(x, (edge + trunk_y) / 2, roof), color=dark))
    left, right = -0.84, max(x for x, _ in used) + 0.05
    parts.append(lpm.box("cable_trunk", (right - left, 0.025, 0.014), at=((left + right) / 2, trunk_y, roof), color=dark))
    for number in range(int((right - left) / 0.3)):
        parts.append(lpm.box(f"cable_clip_{number}", (0.03, 0.045, 0.02), at=(left + 0.15 + number * 0.3, trunk_y, roof), color=trim))
    parts.append(rounded_block("junction_box", 0.14, 0.12, 0.12, wall, 0.03 / 0.12, at=(left - 0.05, trunk_y, roof)))
    parts.append(lpm.box("junction_box_stripe", (0.145, 0.125, 0.02), at=(left - 0.05, trunk_y, roof + 0.08), color=mint))
    ob = lpm.finish(spec["id"], parts, palette, budget=6000, center=False)
    return export_model(ob, spec, out_dir)


def build_battery(spec, out_dir):
    """A neighborhood battery filling its 1x1 cell: a small rounded block with a framed door and a row of mint cell panels on the front, louvres on the sides, two cooling units and a cable run on the roof."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    wall, mint, dark, slab, trim, frame = (index(n) for n in ("uwall", "uroof", "udark", "uslab", "utrim", "uframe"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    size, height = 0.92, 0.56
    parts = [rounded_block("block", size, size, height, wall, 0.03 / size, at=(0, 0, 0))]
    parts.append(rounded_block("block_band", size + 0.01, size + 0.01, 0.03, mint, 0.03 / size, at=(0, 0, height - 0.04)))
    parts.append(rounded_block("block_roof", 0.96, 0.96, 0.03, slab, 0.03 / 0.96, at=(0, 0, height)))
    front = -size / 2
    door_x, door_w, door_h = -0.3, 0.2, 0.32
    parts.append(lpm.box("door", (door_w, 0.014, door_h), at=(door_x, front - 0.004, 0.0), color=dark))
    door_frame(parts, "door", door_x, front, 0.0, door_w, door_h, frame)
    for number in range(3):
        x = -0.03 + number * 0.18
        parts.append(lpm.box(f"cell_{number}", (0.14, 0.012, 0.34), at=(x, front - 0.003, 0.08), color=mint))
        for edge, side in enumerate((-1, 1)):
            parts.append(lpm.box(f"cell_{number}_frame_{edge}", (0.01, 0.01, 0.36), at=(x + side * 0.0775, front - 0.004, 0.07), color=frame))
        parts.append(lpm.box(f"cell_{number}_frame_top", (0.165, 0.01, 0.01), at=(x, front - 0.004, 0.42), color=frame))
        parts.append(lpm.box(f"cell_{number}_frame_bottom", (0.165, 0.01, 0.01), at=(x, front - 0.004, 0.07), color=frame))
    for side in (-1, 1):
        for slot in range(4):
            parts.append(lpm.box(f"louvre_{side}_{slot}", (0.012, 0.3, 0.012), at=(side * (size / 2 + 0.002), 0.0, 0.18 + slot * 0.05), color=trim))
    roof = height + 0.03
    for number, x in enumerate((-0.22, 0.22)):
        parts.append(rounded_block(f"cooler_{number}", 0.3, 0.3, 0.12, wall, 0.03 / 0.3, at=(x, 0.18, roof)))
        parts.append(lpm.prism(f"cooler_{number}_fan", 10, 0.1, 0.012, at=(x, 0.18, roof + 0.12), color=dark))
    parts.append(lpm.box("cable_run", (0.44, 0.025, 0.014), at=(0, -0.15, roof), color=dark))
    for number, x in enumerate((-0.22, 0.22)):
        parts.append(lpm.box(f"cable_branch_{number}", (0.025, 0.18, 0.014), at=(x, -0.06, roof), color=dark))
    parts.append(rounded_block("junction_box", 0.12, 0.1, 0.1, wall, 0.03 / 0.1, at=(-0.36, -0.15, roof)))
    parts.append(lpm.box("junction_box_stripe", (0.125, 0.105, 0.02), at=(-0.36, -0.15, roof + 0.07), color=mint))
    ob = lpm.finish(spec["id"], parts, palette, budget=3000, center=False)
    return export_model(ob, spec, out_dir)


def tilted_box(name, cx, cy, z0, width, length, thickness, tilt_deg, color):
    """A flat slab of `width` (X) by `length` (Y, measured along the slope) tilted so that its back (+Y) edge is higher; z0 is the height of its front-bottom edge."""
    tilt = math.radians(tilt_deg)
    run, rise = length * math.cos(tilt), length * math.sin(tilt)
    up = (0.0, -math.sin(tilt), math.cos(tilt))
    verts = []
    for layer in (0, 1):
        for sx, along in ((-1, 0), (1, 0), (1, 1), (-1, 1)):
            x = cx + sx * width / 2 + up[0] * thickness * layer
            y = cy - run / 2 + along * run + up[1] * thickness * layer
            z = z0 + along * rise + up[2] * thickness * layer
            verts.append((x, y, z))
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    return lpm._object(name, _bm(verts, faces), color)


def build_solar(spec, out_dir):
    """A solar installation on bare ground: three rows of three tilted panels on short legs, an inverter cabin at the front right corner and cables running on the ground under every panel to it. `count` minus one battery cabinets line up to the left of the inverter."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    wall, mint, dark, slab, trim, frame, glass = (index(n) for n in ("uwall", "uroof", "udark", "uslab", "utrim", "uframe", "navy"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    parts = []
    row_ys = (-0.5, 0.1, 0.7)
    for row, y in enumerate(row_ys):
        for column, x in enumerate((-0.6, 0.0, 0.6)):
            parts.append(tilted_box(f"panel_frame_{row}_{column}", x, y, 0.13, 0.52, 0.44, 0.03, 25, frame))
            parts.append(tilted_box(f"panel_{row}_{column}", x, y - 0.03 * math.sin(math.radians(25)), 0.13 + 0.025 * math.sin(math.radians(25)) + 0.03 * math.cos(math.radians(25)), 0.47, 0.39, 0.012, 25, glass))
            parts.append(lpm.box(f"panel_leg_{row}_{column}_a", (0.03, 0.03, 0.18), at=(x - 0.18, y - 0.18, 0.0), color=dark))
            parts.append(lpm.box(f"panel_leg_{row}_{column}_b", (0.03, 0.03, 0.24), at=(x + 0.18, y + 0.19, 0.0), color=dark))
    x, y = 0.72, -0.85
    parts.append(rounded_block("inverter", 0.34, 0.22, 0.3, wall, 0.03 / 0.22, at=(x, y, 0.04)))
    parts.append(lpm.box("inverter_stripe", (0.345, 0.225, 0.03), at=(x, y, 0.2), color=mint))
    parts.append(rounded_block("inverter_roof", 0.38, 0.26, 0.025, slab, 0.025 / 0.26, at=(x, y, 0.3)))
    parts.append(lpm.box("inverter_door", (0.12, 0.014, 0.19), at=(x - 0.07, y - 0.114, 0.0), color=dark))
    door_frame(parts, "inverter_door", x - 0.07, y - 0.11, 0.0, 0.12, 0.19, frame)
    parts.append(lpm.box("cable_trunk", (0.025, 1.7, 0.014), at=(0.92, 0.0, 0.0), color=dark))
    for number, row_y in enumerate(row_ys):
        parts.append(lpm.box(f"cable_row_{number}", (1.78, 0.025, 0.014), at=(0.03, row_y, 0.0), color=dark))
        for column, panel_x in enumerate((-0.6, 0.0, 0.6)):
            parts.append(lpm.box(f"cable_box_{number}_{column}", (0.06, 0.05, 0.03), at=(panel_x, row_y, 0.0), color=trim))
    for number in range(spec.get("count", 1) - 1):
        bx = x - 0.4 * (number + 1)
        parts.append(rounded_block(f"battery_{number}", 0.34, 0.22, 0.26, wall, 0.03 / 0.22, at=(bx, y, 0.0)))
        parts.append(lpm.box(f"battery_{number}_stripe", (0.345, 0.225, 0.03), at=(bx, y, 0.16), color=mint))
        parts.append(lpm.box(f"battery_{number}_vent", (0.2, 0.012, 0.08), at=(bx - 0.02, y - 0.115, 0.05), color=dark))
        parts.append(lpm.prism(f"battery_{number}_terminal", 8, 0.03, 0.08, at=(bx + 0.09, y, 0.26), color=dark))
        parts.append(lpm.box(f"battery_{number}_cable", (0.06, 0.025, 0.014), at=(bx + 0.2, y - 0.0, 0.0), color=dark))
    parts.append(lpm.box("cable_feed", (0.025, 0.16, 0.014), at=(0.92, -0.86, 0.0), color=dark))
    ob = lpm.finish(spec["id"], parts, palette, budget=6000, center=False)
    return export_model(ob, spec, out_dir)


STOPS = {
    "bus": {"width": 0.6, "x": -0.12, "benches": 1, "machine": False, "text": "BUS", "plate": "uroof", "ink": "white"},
    "brt": {"width": 0.62, "x": -0.13, "benches": 2, "machine": True, "text": "BRT", "plate": "udark", "ink": "uroof", "roof_panels": True},
}


def build_stop(spec, out_dir):
    """A transit stop on bare ground: a glass shelter with a bench, and a sign post facing the road (front, -Y). `kind` is `bus` or `brt`."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    wall, mint, dark, slab, trim, frame, glass, wood, white = (index(n) for n in ("uwall", "uroof", "udark", "uslab", "utrim", "uframe", "glass_blue", "uwood", "white"))
    cfg = STYLES[style]
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    options = STOPS[spec["kind"]]
    width, cx, cy, depth, post_height = options["width"], options["x"], 0.2, 0.3, 0.46
    floor = 0.0
    parts = []
    roof_z = floor + post_height
    parts.append(rounded_block("shelter_roof", width + 0.08, depth + 0.08, 0.03, slab, 0.03 / (depth + 0.08), at=(cx, cy, roof_z)))
    parts.append(rounded_block("shelter_band", width + 0.09, depth + 0.09, 0.02, mint, 0.02 / (depth + 0.09), at=(cx, cy, roof_z - 0.02)))
    for number, (px, py) in enumerate(((-1, -1), (1, -1), (-1, 1), (1, 1))):
        parts.append(lpm.box(f"post_{number}", (0.03, 0.03, post_height), at=(cx + px * (width / 2 - 0.015), cy + py * (depth / 2 - 0.015), floor), color=dark))
    parts.append(lpm.box("glass_back", (width - 0.06, 0.012, 0.3), at=(cx, cy + depth / 2 - 0.015, floor + 0.1), color=glass))
    parts.append(lpm.box("glass_side", (0.012, depth - 0.06, 0.3), at=(cx - width / 2 + 0.015, cy, floor + 0.1), color=glass))
    for number in range(options["benches"]):
        double = options["benches"] > 1
        bx = cx + (0.0 if not double else (-0.01 if number == 0 else 0.21))
        length = 0.2 if double else 0.38
        parts.append(lpm.box(f"bench_{number}", (length, 0.09, 0.03), at=(bx, cy + depth / 2 - 0.1, floor + 0.12), color=wood))
        for side in (-1, 1):
            parts.append(lpm.box(f"bench_{number}_leg_{side}", (0.025, 0.07, 0.12), at=(bx + side * (length / 2 - 0.03), cy + depth / 2 - 0.1, floor), color=dark))
    if options["machine"]:
        mx = cx - width / 2 + 0.12
        parts.append(rounded_block("ticket_machine", 0.1, 0.08, 0.26, dark, 0.03 / 0.08, at=(mx, cy + depth / 2 - 0.1, floor)))
        parts.append(lpm.box("ticket_screen", (0.07, 0.012, 0.07), at=(mx, cy + depth / 2 - 0.14, floor + 0.14), color=mint))
    if options.get("roof_panels"):
        top = roof_z + 0.03
        for number, side in enumerate((-1, 1)):
            px = cx + side * 0.16
            parts.append(tilted_box(f"roof_panel_frame_{number}", px, cy, top + 0.03, 0.26, 0.24, 0.02, 20, frame))
            parts.append(tilted_box(f"roof_panel_{number}", px, cy - 0.02 * math.sin(math.radians(20)), top + 0.03 + 0.02 * math.sin(math.radians(20)) + 0.02 * math.cos(math.radians(20)), 0.22, 0.2, 0.01, 20, PALETTE_NAMES.index("navy")))
            for leg, along in enumerate((-0.07, 0.07)):
                parts.append(lpm.box(f"roof_panel_leg_{number}_{leg}", (0.02, 0.02, 0.03 + (0.06 if along > 0 else 0.0)), at=(px, cy + along * 1.5, top), color=dark))
    pole_x, pole_y = cx + width / 2 + 0.16, -0.2
    parts.append(lpm.prism("sign_pole", 8, 0.014, 0.6, at=(pole_x, pole_y, floor), color=frame))
    plate_z, plate_w, plate_h = floor + 0.42, 0.24, 0.16
    plate_front = pole_y - 0.027
    parts.append(lpm.box("sign_plate", (plate_w, 0.014, plate_h), at=(pole_x, pole_y - 0.02, plate_z), color=index(options["plate"])))
    parts.append(lpm.box("sign_frame_top", (plate_w + 0.012, 0.016, 0.01), at=(pole_x, pole_y - 0.02, plate_z + plate_h), color=frame))
    parts.append(lpm.box("sign_frame_bottom", (plate_w + 0.012, 0.016, 0.01), at=(pole_x, pole_y - 0.02, plate_z - 0.01), color=frame))
    for side in (-1, 1):
        parts.append(lpm.box(f"sign_frame_{side}", (0.01, 0.016, plate_h + 0.02), at=(pole_x + side * (plate_w / 2 + 0.001), pole_y - 0.02, plate_z - 0.01), color=frame))
    glyphs = glyph_decal({"cfg": cfg}, "sign_text", "front", options["text"], pole_x, plate_z + (plate_h - 0.09) / 2, 0.09, index(options["ink"]), -plate_front + 0.002)
    parts.append(glyphs)
    ob = lpm.finish(spec["id"], parts, palette, budget=3000, center=False)
    return export_model(ob, spec, out_dir)


def window_frame(parts, name, cx, y, bottom, width, height, color, thick=0.012):
    """Thin surround on the four sides of a window on the front wall plane `y`."""
    parts.append(lpm.box(f"{name}_frame_left", (thick, 0.01, height + 2 * thick), at=(cx - width / 2 - thick / 2, y - 0.004, bottom - thick), color=color))
    parts.append(lpm.box(f"{name}_frame_right", (thick, 0.01, height + 2 * thick), at=(cx + width / 2 + thick / 2, y - 0.004, bottom - thick), color=color))
    parts.append(lpm.box(f"{name}_frame_top", (width + 2 * thick, 0.01, thick), at=(cx, y - 0.004, bottom + height), color=color))
    parts.append(lpm.box(f"{name}_frame_bottom", (width + 2 * thick, 0.01, thick), at=(cx, y - 0.004, bottom - thick), color=color))


def extrude_x(name, outline, x0, x1, color):
    """Extrude a closed (y, z) outline along X from x0 to x1."""
    count = len(outline)
    verts = [(x0, y, z) for y, z in outline] + [(x1, y, z) for y, z in outline]
    faces = [(i, count + i, count + (i + 1) % count, (i + 1) % count) for i in range(count)]
    faces.append(tuple(range(count)))
    faces.append(tuple(reversed(range(count, 2 * count))))
    return lpm._object(name, _bm(verts, faces), color)


def vault_outline(cy, half_depth, base, rise, steps=10, grow=0.0):
    """Arc of a barrel vault as a closed segment (y, z), widened by `grow` all around."""
    points = []
    for step in range(steps + 1):
        angle = math.pi * step / steps
        points.append((cy - (half_depth + grow) * math.cos(angle), base + (rise + grow) * math.sin(angle) ** 0.9))
    return points


def build_station(spec, out_dir):
    """A railway station filling its 2x1 cell: a long hall with a two-pitch roof on each outer third and a taller central pavilion with a two-pitch roof on the same ridge direction, under the clock, with a framed door and six glazed doors on the front, a window at each end, an off-centre back door, a canopy of seven tenths of the width on posts, centred on the front, a clock tower and a sign."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    cfg = STYLES[style]
    index = PALETTE_NAMES.index
    wall, mint, dark, slab, trim, frame, glass, white = (index(n) for n in ("uwall", "uroof", "udark", "uslab", "utrim", "uframe", "glass_blue", "white"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    width, depth, height = 1.92, 0.76, 0.5
    cy = 0.1
    front = cy - depth / 2
    parts = [rounded_block("hall", width, depth, height, wall, 0.03 / depth, at=(0, cy, 0))]
    parts.append(rounded_block("hall_band", width + 0.01, depth + 0.01, 0.03, mint, 0.03 / depth, at=(0, cy, height - 0.04)))
    overhang = 0.03
    wing_rise = 0.2
    gable = [(cy - depth / 2 - overhang, height), (cy, height + wing_rise), (cy + depth / 2 + overhang, height)]
    parts.append(extrude_x("wing_roof_left", gable, -0.98, -0.32, trim))
    parts.append(extrude_x("wing_roof_right", gable, 0.32, 0.98, trim))
    story_height, story_rise = 0.26, wing_rise
    story_top = height + story_height
    parts.append(rounded_block("story", 0.64, depth, story_height + 0.02, wall, 0.03 / 0.64, at=(0, cy, height - 0.02)))
    parts.append(rounded_block("story_band", 0.65, depth + 0.01, 0.03, mint, 0.03 / 0.65, at=(0, cy, story_top - 0.04)))
    story_gable = [(cy - depth / 2 - overhang, story_top), (cy, story_top + wing_rise), (cy + depth / 2 + overhang, story_top)]
    parts.append(extrude_x("story_roof", story_gable, -0.32 - overhang, 0.32 + overhang, trim))
    for face_name, wy in (("front", front), ("back", cy + depth / 2)):
        direction = -1 if face_name == "front" else 1
        parts.append(lpm.box(f"story_window_{face_name}", (0.3, 0.012, 0.14), at=(0, wy + direction * 0.003, height + 0.05), color=glass))
        parts.append(lpm.box(f"story_window_{face_name}_frame_left", (0.012, 0.01, 0.164), at=(-0.156, wy + direction * 0.004, height + 0.038), color=frame))
        parts.append(lpm.box(f"story_window_{face_name}_frame_right", (0.012, 0.01, 0.164), at=(0.156, wy + direction * 0.004, height + 0.038), color=frame))
        parts.append(lpm.box(f"story_window_{face_name}_frame_top", (0.324, 0.01, 0.012), at=(0, wy + direction * 0.004, height + 0.19), color=frame))
        parts.append(lpm.box(f"story_window_{face_name}_frame_bottom", (0.324, 0.01, 0.012), at=(0, wy + direction * 0.004, height + 0.038), color=frame))
    parts.append(lpm.box("door", (0.22, 0.014, 0.3), at=(0, front - 0.004, 0.0), color=dark))
    door_frame(parts, "door", 0.0, front, 0.0, 0.22, 0.3, frame)
    for number, x in enumerate((-0.78, -0.55, -0.32, 0.32, 0.55, 0.78)):
        parts.append(lpm.box(f"glazed_door_{number}", (0.17, 0.012, 0.3), at=(x, front - 0.003, 0.0), color=glass))
        door_frame(parts, f"glazed_door_{number}", x, front, 0.0, 0.17, 0.3, frame)
        parts.append(lpm.box(f"glazed_door_{number}_mullion", (0.01, 0.01, 0.3), at=(x, front - 0.006, 0.0), color=frame))
        parts.append(lpm.box(f"glazed_door_{number}_transom", (0.17, 0.01, 0.01), at=(x, front - 0.006, 0.2), color=frame))
    thick = 0.012
    for number, side in enumerate((-1, 1)):
        wx = side * (width / 2)
        parts.append(lpm.box(f"end_window_{number}", (0.012, 0.26, 0.2), at=(wx + side * 0.003, cy, 0.12), color=glass))
        for edge, offset in enumerate((-1, 1)):
            parts.append(lpm.box(f"end_window_{number}_frame_{edge}", (0.01, thick, 0.2 + 2 * thick), at=(wx + side * 0.004, cy + offset * (0.13 + thick / 2), 0.12 - thick), color=frame))
        parts.append(lpm.box(f"end_window_{number}_frame_top", (0.01, 0.26 + 2 * thick, thick), at=(wx + side * 0.004, cy, 0.32), color=frame))
        parts.append(lpm.box(f"end_window_{number}_frame_bottom", (0.01, 0.26 + 2 * thick, thick), at=(wx + side * 0.004, cy, 0.12 - thick), color=frame))
    back, back_x = cy + depth / 2, 0.5
    parts.append(lpm.box("back_door", (0.22, 0.014, 0.3), at=(back_x, back + 0.004, 0.0), color=dark))
    for edge, offset in enumerate((-1, 1)):
        parts.append(lpm.box(f"back_door_frame_{edge}", (thick, 0.01, 0.3 + thick), at=(back_x + offset * (0.11 + thick / 2), back + 0.004, 0.0), color=frame))
    parts.append(lpm.box("back_door_frame_top", (0.22 + 2 * thick, 0.01, thick), at=(back_x, back + 0.004, 0.3), color=frame))
    canopy_z = 0.34
    parts.append(rounded_block("canopy", 1.34, 0.16, 0.025, slab, 0.025 / 0.16, at=(0, front - 0.06, canopy_z)))
    parts.append(rounded_block("canopy_band", 1.35, 0.17, 0.015, mint, 0.015 / 0.17, at=(0, front - 0.06, canopy_z - 0.015)))
    for number, x in enumerate((-0.65, -0.18, 0.18, 0.65)):
        parts.append(lpm.box(f"canopy_post_{number}", (0.025, 0.025, canopy_z), at=(x, front - 0.125, 0.0), color=dark))
    plate_w, plate_h = 0.7, 0.1
    parts.append(lpm.box("sign_plate", (plate_w, 0.014, plate_h), at=(0, front - 0.004, 0.37), color=mint))
    parts.append(glyph_decal({"cfg": cfg}, "sign_text", "front", "STATION", 0.0, 0.37 + (plate_h - 0.06) / 2, 0.06, white, -front + 0.012))
    roof = story_top + story_rise - 0.02
    parts.append(rounded_block("clock_tower", 0.2, 0.18, 0.17, wall, 0.03 / 0.2, at=(0, cy, roof)))
    parts.append(lpm.box("clock_face", (0.12, 0.012, 0.12), at=(0, cy - 0.094, roof + 0.025), color=white))
    parts.append(lpm.box("clock_hand_hour", (0.012, 0.014, 0.04), at=(0, cy - 0.101, roof + 0.085), color=dark))
    parts.append(lpm.box("clock_hand_minute", (0.05, 0.014, 0.012), at=(0.02, cy - 0.101, roof + 0.085), color=dark))
    parts.append(rounded_block("clock_cap", 0.23, 0.21, 0.03, mint, 0.03 / 0.21, at=(0, cy, roof + 0.17)))
    ob = lpm.finish(spec["id"], parts, palette, budget=5000, center=False)
    return export_model(ob, spec, out_dir)


def parked_bike(parts, name, x, y, frame_color, tire, metal, scale=1.0):
    """A bicycle seen from the front, standing on the ground with its axis along x: two wheels, a frame, a saddle and handlebars, all scaled by `scale`."""
    k = scale
    for side, wx in (("rear", -0.1), ("front", 0.1)):
        parts.append(disc(f"{name}_{side}_tire", x + wx * k, y, 0.055 * k, 0.055 * k, 0.012 * k, tire, steps=12))
        parts.append(disc(f"{name}_{side}_hub", x + wx * k, y, 0.055 * k, 0.045 * k, 0.014 * k, metal, steps=12))
    parts.append(lpm.box(f"{name}_top_tube", (0.2 * k, 0.01 * k, 0.01 * k), at=(x, y - 0.005 * k, 0.095 * k), color=frame_color))
    parts.append(lpm.box(f"{name}_seat_tube", (0.01 * k, 0.01 * k, 0.06 * k), at=(x - 0.045 * k, y - 0.005 * k, 0.045 * k), color=frame_color))
    parts.append(lpm.box(f"{name}_fork", (0.01 * k, 0.01 * k, 0.07 * k), at=(x + 0.1 * k, y - 0.005 * k, 0.05 * k), color=frame_color))
    parts.append(lpm.box(f"{name}_saddle", (0.05 * k, 0.02 * k, 0.012 * k), at=(x - 0.06 * k, y - 0.01 * k, 0.11 * k), color=tire))
    parts.append(lpm.box(f"{name}_handlebar", (0.012 * k, 0.045 * k, 0.012 * k), at=(x + 0.1 * k, y - 0.0225 * k, 0.115 * k), color=metal))


def build_hub(spec, out_dir):
    """A transit hub filling its 3x2 cell: a long low hall with flat grey wing roofs and a taller central pavilion with a two-pitch roof under a clock, a framed door, glazed doors and a "HUB" plate under a front canopy, a narrow canopy over a door on each end, and a shelter with parked bicycles behind the hall, in the back right corner, facing a back door, and a tall double door in the middle of the back for the travelers. The accent follows the tone."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    cfg = STYLES[style]
    index = PALETTE_NAMES.index
    wall, dark, slab, trim, frame, glass, white = (index(n) for n in ("uwall", "udark", "uslab", "utrim", "uframe", "glass_blue", "white"))
    mint = index("vtone1")
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    width, depth, height = 2.6, 0.9, 0.5
    cy = 0.15
    front, back = cy - depth / 2, cy + depth / 2
    thick = 0.012
    parts = [rounded_block("hall", width, depth, height, wall, 0.03 / depth, at=(0, cy, 0))]
    parts.append(rounded_block("hall_band", width + 0.01, depth + 0.01, 0.03, mint, 0.03 / depth, at=(0, cy, height - 0.04)))
    for side, name in ((-1, "left"), (1, "right")):
        x0, x1 = (side * 0.5, side * (width / 2 + 0.03))
        low, high = min(x0, x1), max(x0, x1)
        parts.append(lpm.box(f"{name}_roof", (high - low, depth + 0.06, 0.03), at=((low + high) / 2, cy, height), color=slab))
        parts.append(lpm.box(f"{name}_parapet_front", (high - low, 0.015, 0.03), at=((low + high) / 2, front - 0.0225, height + 0.03), color=mint))
        parts.append(lpm.box(f"{name}_parapet_back", (high - low, 0.015, 0.03), at=((low + high) / 2, back + 0.0225, height + 0.03), color=mint))
        parts.append(lpm.box(f"{name}_parapet_end", (0.015, depth + 0.06, 0.03), at=(side * (width / 2 + 0.0225), cy, height + 0.03), color=mint))
    story_width, story_height, rise, overhang = 1.0, 0.26, 0.2, 0.03
    story_top = height + story_height
    parts.append(rounded_block("story", story_width, depth, story_height + 0.02, wall, 0.03 / story_width, at=(0, cy, height - 0.02)))
    parts.append(rounded_block("story_band", story_width + 0.01, depth + 0.01, 0.03, mint, 0.03 / story_width, at=(0, cy, story_top - 0.04)))
    gable = [(front - overhang, story_top), (cy, story_top + rise), (back + overhang, story_top)]
    parts.append(extrude_x("story_roof", gable, -story_width / 2 - overhang, story_width / 2 + overhang, trim))
    for face_name, wy in (("front", front), ("back", back)):
        direction = -1 if face_name == "front" else 1
        parts.append(lpm.box(f"story_window_{face_name}", (0.7, 0.012, 0.14), at=(0, wy + direction * 0.003, height + 0.05), color=glass))
        for edge, ex in enumerate((-0.362, 0.362)):
            parts.append(lpm.box(f"story_window_{face_name}_frame_{edge}", (thick, 0.01, 0.164), at=(ex, wy + direction * 0.004, height + 0.038), color=frame))
        parts.append(lpm.box(f"story_window_{face_name}_frame_top", (0.736, 0.01, thick), at=(0, wy + direction * 0.004, height + 0.19), color=frame))
        parts.append(lpm.box(f"story_window_{face_name}_frame_bottom", (0.736, 0.01, thick), at=(0, wy + direction * 0.004, height + 0.038), color=frame))
        parts.append(lpm.box(f"story_window_{face_name}_mullion", (0.01, 0.01, 0.14), at=(0, wy + direction * 0.006, height + 0.05), color=frame))
    parts.append(lpm.box("door", (0.24, 0.014, 0.3), at=(0, front - 0.004, 0.0), color=dark))
    door_frame(parts, "door", 0.0, front, 0.0, 0.24, 0.3, frame)
    for number, x in enumerate((-0.3, 0.3, -0.72, -1.0, 0.72, 1.0)):
        parts.append(lpm.box(f"glazed_door_{number}", (0.17, 0.012, 0.3), at=(x, front - 0.003, 0.0), color=glass))
        door_frame(parts, f"glazed_door_{number}", x, front, 0.0, 0.17, 0.3, frame)
        parts.append(lpm.box(f"glazed_door_{number}_mullion", (0.01, 0.01, 0.3), at=(x, front - 0.006, 0.0), color=frame))
        parts.append(lpm.box(f"glazed_door_{number}_transom", (0.17, 0.01, thick), at=(x, front - 0.006, 0.2), color=frame))
    canopy_z = 0.34
    for side, name in ((-1, "left"), (1, "right")):
        end_x = side * width / 2
        parts.append(lpm.box(f"{name}_end_door", (0.014, 0.26, 0.3), at=(end_x + side * 0.004, cy, 0.0), color=dark))
        for edge, offset in enumerate((-1, 1)):
            parts.append(lpm.box(f"{name}_end_door_frame_{edge}", (0.01, thick, 0.3 + thick), at=(end_x + side * 0.004, cy + offset * (0.13 + thick / 2), 0.0), color=frame))
        parts.append(lpm.box(f"{name}_end_door_frame_top", (0.01, 0.26 + 2 * thick, thick), at=(end_x + side * 0.004, cy, 0.3), color=frame))
        parts.append(rounded_block(f"{name}_end_canopy", 0.2, 0.8, 0.025, slab, 0.025 / 0.2, at=(end_x + side * 0.08, cy, canopy_z)))
        parts.append(rounded_block(f"{name}_end_canopy_band", 0.21, 0.81, 0.015, mint, 0.015 / 0.21, at=(end_x + side * 0.08, cy, canopy_z - 0.015)))
        for number, py in enumerate((cy - 0.37, cy + 0.37)):
            parts.append(lpm.box(f"{name}_end_post_{number}", (0.025, 0.025, canopy_z), at=(end_x + side * 0.17, py, 0.0), color=dark))
    back_x = width / 2 - 0.72 / 2
    for door_number, door_x in enumerate((back_x, -back_x)):
        parts.append(lpm.box(f"back_door_{door_number}", (0.22, 0.014, 0.3), at=(door_x, back + 0.004, 0.0), color=dark))
        for edge, offset in enumerate((-1, 1)):
            parts.append(lpm.box(f"back_door_{door_number}_frame_{edge}", (thick, 0.01, 0.3 + thick), at=(door_x + offset * (0.11 + thick / 2), back + 0.004, 0.0), color=frame))
        parts.append(lpm.box(f"back_door_{door_number}_frame_top", (0.22 + 2 * thick, 0.01, thick), at=(door_x, back + 0.004, 0.3), color=frame))
    gate_w, gate_h = 0.56, 0.44
    for number, leaf_x in enumerate((-gate_w / 4, gate_w / 4)):
        parts.append(lpm.box(f"travelers_door_leaf_{number}", (gate_w / 2 - 0.004, 0.012, gate_h), at=(leaf_x, back + 0.003, 0.0), color=glass))
        parts.append(lpm.box(f"travelers_door_leaf_{number}_transom", (gate_w / 2 - 0.004, 0.01, thick), at=(leaf_x, back + 0.006, gate_h - 0.1), color=frame))
        parts.append(lpm.box(f"travelers_door_leaf_{number}_handle", (0.008, 0.014, 0.08), at=(leaf_x + (-1 if number else 1) * 0.02, back + 0.012, 0.18), color=dark))
    parts.append(lpm.box("travelers_door_mullion", (thick, 0.012, gate_h), at=(0, back + 0.006, 0.0), color=frame))
    for edge, offset in enumerate((-1, 1)):
        parts.append(lpm.box(f"travelers_door_frame_{edge}", (thick, 0.012, gate_h + thick), at=(offset * (gate_w / 2 + thick / 2), back + 0.005, 0.0), color=frame))
    parts.append(lpm.box("travelers_door_frame_top", (gate_w + 2 * thick, 0.012, thick), at=(0, back + 0.005, gate_h), color=frame))
    back_plate_w, back_plate_h, back_plate_z = 0.62, 0.085, gate_h + thick
    parts.append(lpm.box("back_sign_plate", (back_plate_w, 0.014, back_plate_h), at=(0, back + 0.004, back_plate_z), color=mint))
    parts.append(glyph_decal({"cfg": cfg}, "back_sign_text", "back", "HUB", 0.0, back_plate_z + (back_plate_h - 0.05) / 2, 0.05, white, back + 0.012))
    parts.append(rounded_block("canopy", 1.3, 0.28, 0.025, slab, 0.025 / 0.28, at=(0, front - 0.12, canopy_z)))
    parts.append(rounded_block("canopy_band", 1.31, 0.29, 0.015, mint, 0.015 / 0.29, at=(0, front - 0.12, canopy_z - 0.015)))
    for number, x in enumerate((-0.6, -0.2, 0.2, 0.6)):
        parts.append(lpm.box(f"canopy_post_{number}", (0.025, 0.025, canopy_z), at=(x, front - 0.245, 0.0), color=dark))
    plate_w, plate_h, plate_z = 0.5, 0.1, 0.37
    parts.append(lpm.box("sign_plate", (plate_w, 0.014, plate_h), at=(0, front - 0.004, plate_z), color=mint))
    parts.append(glyph_decal({"cfg": cfg}, "sign_text", "front", "HUB", 0.0, plate_z + (plate_h - 0.06) / 2, 0.06, white, -front + 0.012))
    shelter_w, shelter_z = 0.72, 0.28
    shelter_x = width / 2 - shelter_w / 2
    roof_y, roof_d = 0.8, 0.36
    parts.append(rounded_block("shelter_roof", shelter_w, roof_d, 0.02, mint, 0.02 / roof_d, at=(shelter_x, roof_y, shelter_z)))
    parts.append(rounded_block("shelter_band", shelter_w + 0.01, roof_d + 0.01, 0.012, slab, 0.012 / roof_d, at=(shelter_x, roof_y, shelter_z - 0.012)))
    for number, (px, py) in enumerate(((-1, -1), (1, -1), (-1, 1), (1, 1))):
        parts.append(lpm.box(f"shelter_post_{number}", (0.02, 0.02, shelter_z), at=(shelter_x + px * (shelter_w / 2 - 0.03), roof_y + py * (roof_d / 2 - 0.03), 0.0), color=dark))
    parts.append(lpm.box("shelter_rail", (shelter_w - 0.1, 0.012, 0.012), at=(shelter_x, roof_y - 0.13, 0.075), color=slab))
    for number, by in enumerate((0.69, 0.81, 0.93)):
        parked_bike(parts, f"bike_{number}", shelter_x, by, mint if number != 1 else dark, dark, slab, scale=1.4)
    roof = story_top + rise - 0.02
    parts.append(rounded_block("clock_tower", 0.2, 0.18, 0.17, wall, 0.03 / 0.2, at=(0, cy, roof)))
    parts.append(lpm.box("clock_face", (0.12, 0.012, 0.12), at=(0, cy - 0.094, roof + 0.025), color=white))
    parts.append(lpm.box("clock_hand_hour", (thick, 0.014, 0.04), at=(0, cy - 0.101, roof + 0.085), color=dark))
    parts.append(lpm.box("clock_hand_minute", (0.05, 0.014, thick), at=(0.02, cy - 0.101, roof + 0.085), color=dark))
    parts.append(rounded_block("clock_cap", 0.23, 0.21, 0.03, mint, 0.03 / 0.21, at=(0, cy, roof + 0.17)))
    ob = lpm.finish(spec["id"], parts, palette, budget=8000, center=False)
    return export_model(ob, spec, out_dir)


def depot_pile(parts, number, x, y, kind):
    """One pile of material standing in the yard: planks, bricks, a sand heap, sacks, a gravel heap or steel beams."""
    index = PALETTE_NAMES.index
    wood, brick, sand, grey, trim, dark = (index(n) for n in ("uwood", "brick", "usand", "grey", "utrim", "udark"))
    if kind == "planks":
        for layer in range(5):
            parts.append(lpm.box(f"pile_{number}_plank_{layer}", (0.26, 0.11, 0.028), at=(x, y, layer * 0.03), color=wood))
            for slat in (-0.09, 0.09):
                parts.append(lpm.box(f"pile_{number}_slat_{layer}_{slat}", (0.02, 0.12, 0.006), at=(x + slat, y, layer * 0.03 + 0.028), color=dark))
    elif kind == "bricks":
        for layer in range(4):
            offset = 0.03 if layer % 2 else 0.0
            parts.append(lpm.box(f"pile_{number}_bricks_{layer}", (0.24, 0.14, 0.028), at=(x + offset, y, layer * 0.03), color=brick))
    elif kind in ("sand", "gravel"):
        profile = [(0.0, 0.0), (0.16, 0.0), (0.1, 0.07), (0.05, 0.13), (0.0, 0.16)]
        parts.append(lpm.lathe(f"pile_{number}_heap", profile, segments=9, at=(x, y, 0.0), color=sand if kind == "sand" else grey))
    elif kind == "sacks":
        for sack_number, (dx, dy, dz) in enumerate(((-0.07, 0.0, 0.0), (0.07, 0.0, 0.0), (0.0, 0.0, 0.1))):
            sack(parts, f"pile_{number}_sack_{sack_number}", x + dx, y + dy, 0.12, sand if sack_number != 1 else grey)
            if dz:
                lpm.move(parts[-1], 0, 0, dz)
    else:
        for layer, (dx, dz) in enumerate(((-0.05, 0.0), (0.05, 0.0), (0.0, 0.045))):
            parts.append(lpm.box(f"pile_{number}_beam_{layer}", (0.26, 0.04, 0.04), at=(x + dx * 0.4, y + dx, dz), color=trim))


DEPOT_PILES = ("planks", "bricks", "sand", "sacks", "gravel", "beams")


def build_depot(spec, out_dir):
    """A material depot filling its 2x1 cell: a low hall with a two-pitch roof at the back, a sliding gate, a door, a window and a sign, and an open yard in front where `count` piles of material stand."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    cfg = STYLES[style]
    index = PALETTE_NAMES.index
    wall, mint, dark, slab, trim, frame, glass, white = (index(n) for n in ("uwall", "uroof", "udark", "uslab", "utrim", "uframe", "glass_blue", "white"))
    mint = PALETTE_NAMES.index("vtone1")
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    width, depth, height = 1.92, 0.58, 0.46
    cy = 0.19
    front = cy - depth / 2
    parts = [rounded_block("hall", width, depth, height, wall, 0.03 / depth, at=(0, cy, 0))]
    parts.append(rounded_block("hall_band", width + 0.01, depth + 0.01, 0.03, mint, 0.03 / depth, at=(0, cy, height - 0.04)))
    overhang = 0.03
    parts.append(extrude_x("roof", [(cy - depth / 2 - overhang, height), (cy, height + 0.15), (cy + depth / 2 + overhang, height)], -0.98, 0.98, trim))
    gate_x = -0.3
    parts.append(lpm.box("gate", (0.5, 0.014, 0.3), at=(gate_x, front - 0.004, 0.0), color=dark))
    for rib in range(1, 6):
        parts.append(lpm.box(f"gate_rib_{rib}", (0.5, 0.006, 0.008), at=(gate_x, front - 0.01, 0.3 * rib / 6), color=trim))
    door_frame(parts, "gate", gate_x, front, 0.0, 0.5, 0.3, frame)
    parts.append(lpm.box("door", (0.18, 0.014, 0.28), at=(0.35, front - 0.004, 0.0), color=dark))
    door_frame(parts, "door", 0.35, front, 0.0, 0.18, 0.28, frame)
    window_x = 0.72
    parts.append(lpm.box("window", (0.26, 0.012, 0.18), at=(window_x, front - 0.003, 0.1), color=glass))
    window_frame(parts, "window", window_x, front, 0.1, 0.26, 0.18, frame)
    plate_w, plate_h, plate_z = 0.56, 0.1, 0.33
    parts.append(lpm.box("sign_plate", (plate_w, 0.014, plate_h), at=(gate_x, front - 0.004, plate_z), color=mint))
    parts.append(glyph_decal({"cfg": cfg}, "sign_text", "front", "DEPOT", gate_x, plate_z + (plate_h - 0.06) / 2, 0.06, white, -front + 0.012))
    for number in range(spec["count"]):
        depot_pile(parts, number, -0.75 + 0.3 * number, -0.3, DEPOT_PILES[number])
    ob = lpm.finish(spec["id"], parts, palette, budget=6000, center=False)
    return export_model(ob, spec, out_dir)


def disc(name, cx, y, cz, radius, depth, color, steps=20):
    """A round plate facing the front (-Y), centred on (cx, cz), thickness `depth` centred on `y`."""
    outline = [(radius * math.cos(2 * math.pi * i / steps), radius * math.sin(2 * math.pi * i / steps)) for i in range(steps)]
    return lpm.sweep(name, outline, depth, at=(cx, y, cz), color=color, axis="y")


def build_vault(spec, out_dir):
    """A vault filling its 2x1 cell: a squat rounded block with a parapet roof, a round armoured door with `count` bolts around it, a barred window on each side, a raised roof sign and an off-centre back door."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    cfg = STYLES[style]
    index = PALETTE_NAMES.index
    wall, mint, dark, slab, trim, frame, glass, white = (index(n) for n in ("uwall", "uroof", "udark", "uslab", "utrim", "uframe", "glass_blue", "white"))
    mint = PALETTE_NAMES.index("vtone1")
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    width, depth, height = 1.92, 0.92, 0.52
    front, back = -depth / 2, depth / 2
    parts = [rounded_block("block", width, depth, height, wall, 0.03 / depth, at=(0, 0, 0))]
    parts.append(rounded_block("block_band", width + 0.01, depth + 0.01, 0.03, mint, 0.03 / depth, at=(0, 0, height - 0.04)))
    parts.append(rounded_block("block_roof", 1.96, 0.96, 0.03, slab, 0.03 / 0.96, at=(0, 0, height)))
    rim_z = height + 0.03
    parts.append(lpm.box("parapet_front", (1.96, 0.03, 0.05), at=(0, -0.465, rim_z), color=slab))
    parts.append(lpm.box("parapet_back", (1.96, 0.03, 0.05), at=(0, 0.465, rim_z), color=slab))
    for side in (-1, 1):
        parts.append(lpm.box(f"parapet_{side}", (0.03, 0.96, 0.05), at=(side * 0.965, 0, rim_z), color=slab))
    door_z = 0.27
    parts.append(disc("vault_ring", 0.0, front - 0.004, door_z, 0.2, 0.012, mint))
    parts.append(disc("vault_door", 0.0, front - 0.008, door_z, 0.17, 0.012, dark))
    parts.append(disc("vault_hub", 0.0, front - 0.014, door_z, 0.05, 0.012, mint, steps=14))
    parts.append(lpm.box("vault_spoke_a", (0.16, 0.012, 0.016), at=(0.0, front - 0.02, door_z - 0.008), color=frame))
    parts.append(lpm.box("vault_spoke_b", (0.016, 0.012, 0.16), at=(0.0, front - 0.02, door_z - 0.08), color=frame))
    for number in range(spec["count"]):
        angle = math.radians(90 - 60 * number)
        bx, bz = 0.185 * math.cos(angle), door_z + 0.185 * math.sin(angle)
        parts.append(lpm.box(f"vault_bolt_{number}", (0.036, 0.018, 0.036), at=(bx, front - 0.012, bz - 0.018), color=white))
    for number, side in enumerate((-1, 1)):
        wx = side * 0.7
        parts.append(lpm.box(f"window_{number}", (0.22, 0.012, 0.14), at=(wx, front - 0.003, 0.22), color=glass))
        window_frame(parts, f"window_{number}", wx, front, 0.22, 0.22, 0.14, frame)
        for bar in (-0.05, 0.0, 0.05):
            parts.append(lpm.box(f"window_{number}_bar_{bar}", (0.01, 0.014, 0.14), at=(wx + bar, front - 0.006, 0.22), color=dark))
    thick = 0.012
    back_x = 0.5
    parts.append(lpm.box("back_door", (0.2, 0.014, 0.3), at=(back_x, back + 0.004, 0.0), color=dark))
    for edge, offset in enumerate((-1, 1)):
        parts.append(lpm.box(f"back_door_frame_{edge}", (thick, 0.01, 0.3 + thick), at=(back_x + offset * (0.1 + thick / 2), back + 0.004, 0.0), color=frame))
    parts.append(lpm.box("back_door_frame_top", (0.2 + 2 * thick, 0.01, thick), at=(back_x, back + 0.004, 0.3), color=frame))
    plate_w, plate_h = 0.56, 0.1
    sign_z = rim_z + 0.05
    for side in (-1, 1):
        parts.append(lpm.box(f"sign_leg_{side}", (0.03, 0.03, 0.12), at=(side * 0.2, -0.3, rim_z - 0.02), color=trim))
    parts.append(lpm.box("sign_plate", (plate_w, 0.014, plate_h), at=(0, -0.3, sign_z + 0.03), color=mint))
    parts.append(glyph_decal({"cfg": cfg}, "sign_text", "front", "VAULT", 0.0, sign_z + 0.03 + (plate_h - 0.06) / 2, 0.06, white, 0.3 + 0.007 + 0.002))
    ob = lpm.finish(spec["id"], parts, palette, budget=6000, center=False)
    return export_model(ob, spec, out_dir)


def build_storehouse(spec, out_dir):
    """A storehouse filling its 2x2 cell: a tall hall at the back with a two-pitch roof, three roller dock doors, a staff door, a window and a sign, two garage doors at the back, and an open yard in front where `count` pallet stacks stand (two rows of five)."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    cfg = STYLES[style]
    index = PALETTE_NAMES.index
    wall, mint, dark, slab, trim, frame, glass, white, wood = (index(n) for n in ("uwall", "uroof", "udark", "uslab", "utrim", "uframe", "glass_blue", "white", "uwood"))
    mint = PALETTE_NAMES.index("vtone1")
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    width, depth, height = 1.92, 0.9, 0.6
    cy = 0.5
    front = cy - depth / 2
    parts = [rounded_block("hall", width, depth, height, wall, 0.03 / depth, at=(0, cy, 0))]
    parts.append(rounded_block("hall_band", width + 0.01, depth + 0.01, 0.03, mint, 0.03 / depth, at=(0, cy, height - 0.04)))
    overhang = 0.03
    parts.append(extrude_x("roof", [(cy - depth / 2 - overhang, height), (cy, height + 0.16), (cy + depth / 2 + overhang, height)], -0.98, 0.98, trim))
    for number, x in enumerate((-0.5, 0.0, 0.5)):
        parts.append(lpm.box(f"dock_door_{number}", (0.4, 0.014, 0.34), at=(x, front - 0.004, 0.0), color=dark))
        for rib in range(1, 7):
            parts.append(lpm.box(f"dock_rib_{number}_{rib}", (0.4, 0.006, 0.008), at=(x, front - 0.01, 0.34 * rib / 7), color=trim))
        door_frame(parts, f"dock_{number}", x, front, 0.0, 0.4, 0.34, frame)
    parts.append(lpm.box("staff_door", (0.14, 0.014, 0.28), at=(0.85, front - 0.004, 0.0), color=dark))
    door_frame(parts, "staff", 0.85, front, 0.0, 0.14, 0.28, frame)
    parts.append(lpm.box("window", (0.14, 0.012, 0.14), at=(-0.86, front - 0.003, 0.14), color=glass))
    window_frame(parts, "window", -0.86, front, 0.14, 0.14, 0.14, frame)
    back = cy + depth / 2
    for number, x in enumerate((-0.45, 0.45)):
        parts.append(lpm.box(f"garage_door_{number}", (0.5, 0.014, 0.38), at=(x, back + 0.004, 0.0), color=dark))
        for rib in range(1, 8):
            parts.append(lpm.box(f"garage_rib_{number}_{rib}", (0.5, 0.006, 0.008), at=(x, back + 0.01, 0.38 * rib / 8), color=trim))
        for side in (-1, 1):
            parts.append(lpm.box(f"garage_{number}_frame_{side}", (0.012, 0.01, 0.392), at=(x + side * 0.256, back + 0.004, 0.0), color=frame))
        parts.append(lpm.box(f"garage_{number}_frame_top", (0.524, 0.01, 0.012), at=(x, back + 0.004, 0.38), color=frame))
    plate_w, plate_h, plate_z = 0.62, 0.1, 0.42
    parts.append(lpm.box("sign_plate", (plate_w, 0.014, plate_h), at=(0, front - 0.004, plate_z), color=mint))
    parts.append(glyph_decal({"cfg": cfg}, "sign_text", "front", "STORAGE", 0.0, plate_z + (plate_h - 0.06) / 2, 0.06, white, -front + 0.012))
    for number in range(spec["count"]):
        x = -0.76 + 0.38 * (number % 5)
        y = -0.3 - 0.45 * (number // 5)
        parts.append(lpm.box(f"pallet_{number}", (0.3, 0.3, 0.04), at=(x, y, 0.0), color=wood))
        for layer in range(2):
            for column, (dx, dy) in enumerate(((-0.065, -0.065), (0.065, -0.065), (-0.065, 0.065), (0.065, 0.065))):
                if layer == 1 and column > 1:
                    continue
                crate(None, parts, f"stack_{number}_crate_{layer}_{column}", x + dx, y + dy, 0.04 + layer * 0.1, 0.12, wood)
    ob = lpm.finish(spec["id"], parts, palette, budget=9000, center=False)
    return export_model(ob, spec, out_dir)


SILO_ROWS = {1: (0.0,), 2: (-0.4, 0.4), 3: (-0.62, 0.0, 0.62), 4: (-0.62, 0.0, 0.62)}


def tone_entries(entries, tones, tone):
    """The palette entries with the role cells (`vtone1`, `vtone2`...) set to the colors of `tone`; a color is a palette name or a hex."""
    colors = tones[tone]
    by_name = dict(entries)
    return [(name, (colors[name] if colors[name].startswith("#") else by_name[colors[name]]) if name in colors else hex_) for name, hex_ in entries]


def palette_for(spec, style):
    """The palette entries of a model: the style's cells, with the role cells set to the colors of its first tone, and the global color table kept in step."""
    entries = use_palette(STYLES[style])
    if "tones" in spec:
        entries = tone_entries(entries, spec["tones"], "a")
        PALETTE_HEX.update(dict(entries))
    return entries


def write_tone_textures(spec, out_dir):
    """One palette PNG per tone other than the first, next to the model: `<id>.tone-b.png`..."""
    tones = spec.get("tones")
    if not tones:
        return
    base_entries = use_palette(STYLES[spec.get("style", "urbtopia")])
    for tone in tones:
        if tone == "a":
            continue
        palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in tone_entries(base_entries, tones, tone)])
        base, mask = palette.images(f"{spec['id']}_tone_{tone}")
        base.filepath_raw = os.path.join(out_dir, f"{spec['id']}.tone-{tone}.png")
        base.file_format = "PNG"
        base.save()
        bpy.data.images.remove(base)
        bpy.data.images.remove(mask)


def export_model(ob, spec, out_dir):
    """Exports the model and, for a model with color tones, its palette textures and the names of its tones."""
    report = lpm.export_glb(ob, os.path.join(out_dir, spec["id"]))
    write_tone_textures(spec, out_dir)
    if spec.get("tones"):
        with open(os.path.join(out_dir, f"{spec['id']}.tones.json"), "w") as handle:
            json.dump(tone_labels.tone_labels(spec["tones"], use_palette(STYLES[spec.get("style", "urbtopia")])), handle, indent=1)
            handle.write("\n")
    return report


def build_silo(spec, out_dir):
    """A grain silo plant on a 2x2 cell: one to four tall red cylinder silos (one more every two Tiers) with a prominent hoop per Tier in a slightly darker red, spaced like the Tier 3 ones and a white dome, and a red barn with a two-pitch roof at the front left, no slab."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    cfg = STYLES[style]
    index = PALETTE_NAMES.index
    dark_red = index("vtone2")
    wall, mint, dark, slab, trim, frame, white, red = (index(n) for n in ("uwall", "uroof", "udark", "uslab", "utrim", "uframe", "white", "vtone1"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    tier = spec["count"]
    count = min(4, 1 + (tier - 1) // 2)
    spacing = 0.19
    height = 0.1 + spacing * (tier - 1) + 0.12
    positions = [(x, 0.5) for x in SILO_ROWS[count]]
    if count == 4:
        positions[-1] = (0.62, -0.3)
    parts = []
    for number, (x, y) in enumerate(positions):
        parts.append(lpm.prism(f"silo_{number}", 12, 0.27, height, at=(x, y, 0.0), color=red))
        parts.append(lpm.prism(f"silo_{number}_foot", 12, 0.285, 0.05, at=(x, y, 0.0), color=slab))
        for ring in range(tier):
            parts.append(lpm.prism(f"silo_{number}_hoop_{ring}", 12, 0.3, 0.035, at=(x, y, 0.09 + ring * spacing), color=dark_red))
        dome = [(0.29 * math.cos(math.radians(a)), 0.29 * math.sin(math.radians(a))) for a in (0, 15, 30, 45, 60, 75, 90)]
        parts.append(lpm.lathe(f"silo_{number}_dome", dome, segments=12, at=(x, y, height), color=wall))
        parts.append(lpm.prism(f"silo_{number}_vent", 8, 0.04, 0.04, at=(x, y, height + 0.285), color=dark))
        parts.append(lpm.box(f"silo_{number}_ladder", (0.04, 0.012, height - 0.05), at=(x + 0.12, y - 0.27, 0.0), color=frame))
    sx, sy, sw, sd, sh = -0.5, -0.45, 0.8, 0.5, 0.3
    front = sy - sd / 2
    parts.append(rounded_block("barn", sw, sd, sh, red, 0.03 / sd, at=(sx, sy, 0)))
    parts.append(rounded_block("barn_band", sw + 0.01, sd + 0.01, 0.03, wall, 0.03 / sd, at=(sx, sy, sh - 0.04)))
    parts.append(extrude_x("barn_roof", [(sy - sd / 2 - 0.03, sh), (sy, sh + 0.16), (sy + sd / 2 + 0.03, sh)], sx - sw / 2 - 0.02, sx + sw / 2 + 0.02, dark))
    parts.append(lpm.box("shed_door", (0.22, 0.014, 0.2), at=(sx - 0.2, front - 0.004, 0.0), color=dark))
    door_frame(parts, "shed_door", sx - 0.2, front, 0.0, 0.22, 0.2, frame)
    parts.append(lpm.box("shed_plate", (0.28, 0.014, 0.08), at=(sx + 0.17, front - 0.004, 0.1), color=wall))
    parts.append(glyph_decal({"cfg": cfg}, "sign_text", "front", "GRAIN", sx + 0.17, 0.1 + 0.01, 0.05, dark, -front + 0.012))
    ob = lpm.finish(spec["id"], parts, palette, budget=9000, center=False)
    return export_model(ob, spec, out_dir)


def offset_path(points, distance):
    """Offset an open polyline to its right-hand side (dy, -dx) by `distance`, with mitred joints."""
    normals = []
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        length = math.hypot(x1 - x0, y1 - y0)
        normals.append(((y1 - y0) / length, -(x1 - x0) / length))
    result = []
    for index, (x, y) in enumerate(points):
        if index == 0:
            nx, ny = normals[0]
            scale = 1.0
        elif index == len(points) - 1:
            nx, ny = normals[-1]
            scale = 1.0
        else:
            ax, ay = normals[index - 1]
            bx, by = normals[index]
            mx, my = ax + bx, ay + by
            norm = math.hypot(mx, my)
            nx, ny = mx / norm, my / norm
            scale = 1.0 / max(0.3, nx * ax + ny * ay)
        result.append((x + nx * distance * scale, y + ny * distance * scale))
    return result


def arc_points(cx, cy, radius, start, end, steps):
    return [(cx + radius * math.sin(math.radians(start + (end - start) * i / steps)), cy + radius * math.cos(math.radians(start + (end - start) * i / steps))) for i in range(steps + 1)]


def build_ballpark(spec, out_dir):
    """A baseball ballpark filling 7x7: a fan-shaped field with a diamond and a warning track under a blue outfield wall, three red grandstand tiers wrapping behind home plate and along the foul lines, six floodlight masts, a scoreboard and two dugout benches."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    red, navy, blue = (index(n) for n in ("vtone1", "vtone2", "vtone3"))
    grass, dirt, white, slab, grey, black = (index(n) for n in ("bush", "uwood", "white", "uslab", "utrim", "graphite"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    hx, hy = 0.0, -2.2
    radius = 4.7
    track_outer = radius - 0.35
    parts = []

    def solid(name, outline, z0, depth, color):
        parts.append(lpm.sweep(name, outline, depth, at=(0, 0, z0), color=color, axis="z"))

    def band(name, outer_line, inner_line, z0, depth, color):
        """A closed solid under a strip of quads between two polylines of the same length."""
        count = len(outer_line)
        verts = [(x, y, z0) for x, y in outer_line] + [(x, y, z0) for x, y in inner_line] + [(x, y, z0 + depth) for x, y in outer_line] + [(x, y, z0 + depth) for x, y in inner_line]
        o0, i0, o1, i1 = 0, count, 2 * count, 3 * count
        faces = []
        for k in range(count - 1):
            faces += [(o1 + k, o1 + k + 1, i1 + k + 1, i1 + k), (o0 + k, i0 + k, i0 + k + 1, o0 + k + 1),
                      (o0 + k, o0 + k + 1, o1 + k + 1, o1 + k), (i0 + k + 1, i0 + k, i1 + k, i1 + k + 1)]
        faces += [(o0, o1, i1, i0), (o0 + count - 1, i0 + count - 1, i1 + count - 1, o1 + count - 1)]
        parts.append(lpm._object(name, _bm(verts, faces), color))

    stand_path = [(-2.58, 0.02), (-0.636, -1.988), (-0.6, -2.55), (0.6, -2.55), (0.636, -1.988), (2.58, 0.02)]
    floor_outline = offset_path(stand_path, 0.84) + [(radius * 0.7071 + 0.07, hy + radius * 0.7071)] + list(reversed(arc_points(hx, hy, radius + 0.07, -45, 45, 18))) + [(-radius * 0.7071 - 0.07, hy + radius * 0.7071)]
    fan_center = (hx, hy)
    count = len(floor_outline)
    verts = [(x, y, 0.0) for x, y in floor_outline] + [(x, y, 0.02) for x, y in floor_outline] + [(fan_center[0], fan_center[1], 0.0), (fan_center[0], fan_center[1], 0.02)]
    bottom_center, top_center = 2 * count, 2 * count + 1
    faces = []
    for k in range(count):
        n = (k + 1) % count
        faces += [(top_center, k + count, n + count), (bottom_center, n, k), (k, n, n + count, k + count)]
    parts.append(lpm._object("floor", _bm(verts, faces), slab))
    wedge = [(hx, hy)] + arc_points(hx, hy, track_outer, -45, 45, 18)
    solid("grass", wedge, 0.0, 0.03, grass)
    band("warning_track", arc_points(hx, hy, track_outer, -45, 45, 18), arc_points(hx, hy, track_outer - 0.4, -45, 45, 18), 0.03, 0.006, dirt)
    d = (0.7071, 0.7071)
    infield_r = 1.6
    diamond = [(hx, hy - 0.45), (hx + infield_r, hy + infield_r - 0.45), (hx, hy + 2 * infield_r - 0.45), (hx - infield_r, hy + infield_r - 0.45)]
    solid("infield_dirt", [(x * 1.0, y * 1.0) for x, y in arc_points(hx, hy + infield_r, infield_r * 1.55, 100, 260, 14)] + [(hx, hy - 0.45)] if False else [(hx - 0.55, hy - 0.45), (hx + 0.55, hy - 0.45), (hx + infield_r + 0.45, hy + infield_r - 0.45), (hx, hy + 2 * infield_r + 0.2), (hx - infield_r - 0.45, hy + infield_r - 0.45)], 0.036, 0.006, dirt)
    inner = [(hx, hy + 0.35), (hx + infield_r - 0.45, hy + infield_r - 0.45), (hx, hy + 2 * infield_r - 0.95), (hx - infield_r + 0.45, hy + infield_r - 0.45)]
    solid("infield_grass", inner, 0.042, 0.006, grass)
    for number, (bx, by) in enumerate(((hx + infield_r - 0.15, hy + infield_r - 0.45), (hx, hy + 2 * infield_r - 0.45), (hx - infield_r + 0.15, hy + infield_r - 0.45))):
        parts.append(lpm.box(f"base_{number}", (0.12, 0.12, 0.014), at=(bx, by, 0.048), color=white))
    parts.append(lpm.prism("home_plate", 5, 0.09, 0.014, at=(hx, hy - 0.2, 0.048), color=white))
    parts.append(lpm.prism("mound", 12, 0.2, 0.05, at=(hx, hy + infield_r - 0.45, 0.048), color=dirt, radius_top=0.14))
    for side in (-1, 1):
        length = track_outer - 0.4
        end = (hx + side * length * 0.7071, hy + length * 0.7071)
        mx, my = (hx + end[0]) / 2, (hy + end[1]) / 2
        parts.append(lpm.box(f"foul_line_{side}", (0.03, length, 0.008), at=(0, 0, 0.048), color=white))
        lpm.rotate(parts[-1], -side * 45, "Z")
        lpm.move(parts[-1], mx, my, 0.0)

    wall_outer = arc_points(hx, hy, radius + 0.07, -45, 45, 18)
    band("outfield_wall", wall_outer, arc_points(hx, hy, radius, -45, 45, 18), 0.03, 0.58, navy)
    band("outfield_cap", arc_points(hx, hy, radius + 0.1, -45, 45, 18), arc_points(hx, hy, radius - 0.03, -45, 45, 18), 0.61, 0.03, slab)

    path = [(-2.58, 0.02), (-0.636, -1.988), (-0.6, -2.55), (0.6, -2.55), (0.636, -1.988), (2.58, 0.02)]
    offsets = [0.0, 0.28, 0.56, 0.84]
    heights = [0.3, 0.6, 0.9, 1.2]
    for tier in range(3):
        outer = offset_path(path, offsets[tier + 1])
        inner_edge = offset_path(path, offsets[tier])
        band(f"stand_tier_{tier}", outer, inner_edge, 0.03, heights[tier], red)
        rail = offset_path(path, offsets[tier] + 0.02)
        rail_in = offset_path(path, offsets[tier])
        band(f"stand_rail_{tier}", rail, rail_in, 0.03 + heights[tier], 0.03, slab)
    back = offset_path(path, 0.84 + 0.05)
    band("stand_back_wall", back, offset_path(path, 0.84 - 0.02), 0.03, 1.22, navy)
    band("stand_back_cap", offset_path(path, 0.94), offset_path(path, 0.82), 1.25, 0.03, slab)
    for side in (-1, 1):
        tip = offset_path(path, 0.84)[0 if side < 0 else -1]
        wall_end = (side * (radius * 0.7071 + 0.0), hy + radius * 0.7071)
        line_a, line_b = [(tip[0], tip[1]), (wall_end[0] + side * 0.07, wall_end[1])], [(tip[0] - side * 0.07, tip[1]), (wall_end[0], wall_end[1])]
        if side < 0:
            line_a, line_b = line_b, line_a
        band(f"side_wall_{side}", line_a, line_b, 0.03, 0.58, navy)
    canopy_z = 0.03 + heights[2] + 0.5
    band("stand_canopy", offset_path(path, 0.95), offset_path(path, 0.5), canopy_z, 0.04, slab)
    band("stand_canopy_edge", offset_path(path, 0.96), offset_path(path, 0.92), canopy_z + 0.04, 0.03, red)
    for number, (px, py) in enumerate(offset_path(path, 0.88)):
        parts.append(lpm.box(f"canopy_post_{number}", (0.04, 0.04, canopy_z - 0.03 - heights[2] + 0.1), at=(px, py, 0.03 + heights[2] - 0.1 + 0.0), color=grey))
    for tier, frac in ((1, 0.35), (1, 0.65), (2, 0.5), (2, 0.2), (2, 0.8)):
        line = offset_path(path, offsets[tier] + 0.14)
        segment = 2 if tier == 2 else 1
        x = line[segment][0] + (line[segment + 1][0] - line[segment][0]) * frac
        y = line[segment][1] + (line[segment + 1][1] - line[segment][1]) * frac
        parts.append(lpm.box(f"speaker_{tier}_{frac}", (0.07, 0.07, 0.07), at=(x, y, 0.03 + heights[tier]), color=black))
    for side in (-1, 1):
        parts.append(lpm.box(f"dugout_{side}", (0.34, 0.08, 0.05), at=(side * 1.55, -1.55 - 0.0, 0.03), color=blue))
        lpm.rotate(parts[-1], -side * 45, "Z")
    masts = [(-3.2, 0.1, 0.03, 1.35), (3.2, 0.1, 0.03, 1.35), (-1.9, -2.35, 0.03, 1.35), (1.9, -2.35, 0.03, 1.35), (-0.9, -3.2, 0.03, 1.35), (0.9, -3.2, 0.03, 1.35)]
    for angle in (-38, -17, 17, 38):
        wx, wy = arc_points(hx, hy, radius - 0.02, angle, angle, 1)[0]
        masts.append((wx, wy, 0.64, 1.0))
    for number, (mx, my, base_z, height) in enumerate(masts):
        parts.append(lpm.prism(f"mast_{number}", 6, 0.022, height, at=(mx, my, base_z), color=grey))
        bank = lpm.box(f"lights_{number}", (0.3, 0.05, 0.14), at=(0, 0, -0.07), color=white)
        lpm.rotate(bank, 28, "X")
        lpm.rotate(bank, math.degrees(math.atan2(hx - mx, -(hy + 2.5 - my))), "Z")
        lpm.move(bank, mx, my, base_z + height - 0.02)
        parts.append(bank)
    sx, sy = 0.0, hy + radius
    cap_top = 0.64
    for side in (-1, 1):
        parts.append(lpm.box(f"board_post_{side}", (0.05, 0.05, 0.42), at=(sx + side * 0.42, sy, cap_top - 0.02), color=grey))
    parts.append(lpm.box("scoreboard", (1.15, 0.08, 0.6), at=(sx, sy - 0.02, cap_top + 0.38), color=slab))
    parts.append(lpm.box("scoreboard_screen", (1.05, 0.02, 0.5), at=(sx, sy - 0.07, cap_top + 0.43), color=black))
    ob = lpm.finish(spec["id"], parts, palette, budget=12000, center=False)
    return export_model(ob, spec, out_dir)


def stadium_points(cx, cy, straight, radius, steps=14):
    """A running-track outline: two straights of half length `straight` closed by half circles, counter-clockwise from the top left."""
    points = [(cx - straight, cy + radius), (cx + straight, cy + radius)]
    points += [(cx + straight + radius * math.cos(math.radians(90 - 180 * i / steps)), cy + radius * math.sin(math.radians(90 - 180 * i / steps))) for i in range(1, steps)]
    points += [(cx + straight, cy - radius), (cx - straight, cy - radius)]
    points += [(cx - straight - radius * math.cos(math.radians(90 - 180 * i / steps)), cy - radius * math.sin(math.radians(90 - 180 * i / steps))) for i in range(1, steps)]
    return points


def build_stadium(spec, out_dir):
    """An athletics stadium filling 9x5: a grey floor, a six-lane running track with white lines and a white curb around a grass infield with jump runways, sand pits, throw sectors and a cage, a two-tier grandstand along one side with a scoreboard on its back wall, and floodlight masts."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    track = index("brick")
    grass, white, slab, grey, black, sand, orange, magenta, blue, lime, seat = (index(n) for n in ("bush", "white", "uslab", "utrim", "graphite", "usand", "tangerine", "magenta", "sky", "lime", "vtone1"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    parts = []
    cx, cy, straight = 0.0, -0.2, 2.2

    def loop(radius):
        points = stadium_points(cx, cy, straight, radius)
        return points + [points[0]]

    def ring(name, outer_radius, inner_radius, z0, depth, color):
        outer, inner = loop(outer_radius), loop(inner_radius)
        count = len(outer)
        verts = [(x, y, z0) for x, y in outer] + [(x, y, z0) for x, y in inner] + [(x, y, z0 + depth) for x, y in outer] + [(x, y, z0 + depth) for x, y in inner]
        o0, i0, o1, i1 = 0, count, 2 * count, 3 * count
        faces = []
        for k in range(count - 1):
            faces += [(o1 + k, o1 + k + 1, i1 + k + 1, i1 + k), (o0 + k, i0 + k, i0 + k + 1, o0 + k + 1),
                      (o0 + k, o0 + k + 1, o1 + k + 1, o1 + k), (i0 + k + 1, i0 + k, i1 + k, i1 + k + 1)]
        parts.append(lpm._object(name, _bm(verts, faces), color))

    def flat(name, outline, z0, depth, color):
        parts.append(lpm.sweep(name, outline, depth, at=(0, 0, z0), color=color, axis="z"))

    flat("floor", stadium_points(0.0, 0.0, 2.0, 2.45), 0.0, 0.02, slab)
    flat("infield", stadium_points(cx, cy, straight, 1.45), 0.02, 0.012, grass)
    ring("track", 1.75, 1.45, 0.02, 0.012, track)
    for lane in range(1, 6):
        radius = 1.45 + 0.05 * lane
        ring(f"lane_line_{lane}", radius + 0.004, radius - 0.004, 0.032, 0.004, white)
    ring("curb_inner", 1.45, 1.41, 0.02, 0.03, white)
    ring("curb_outer", 1.79, 1.75, 0.02, 0.03, white)
    for number, y in enumerate((0.1, -0.25)):
        flat(f"runway_{number}", [(-1.9, y - 0.05), (0.9, y - 0.05), (0.9, y + 0.05), (-1.9, y + 0.05)], 0.032, 0.004, orange)
        flat(f"sand_pit_{number}", [(0.95, y - 0.12), (1.35, y - 0.12), (1.35, y + 0.12), (0.95, y + 0.12)], 0.032, 0.006, sand)
    for number, (hx, hy) in enumerate(((-2.9, 0.35), (-2.9, -0.75))):
        flat(f"semicircle_{number}", [(hx + 0.5 * math.cos(math.radians(a)), hy + 0.5 * math.sin(math.radians(a))) for a in range(-90, 91, 20)], 0.032, 0.004, orange)
        parts.append(lpm.box(f"mat_{number}", (0.3, 0.2, 0.05), at=(hx + 0.05, hy, 0.032), color=magenta))
    flat("pole_vault_runway", [(-1.6, 0.67), (0.4, 0.67), (0.4, 0.73), (-1.6, 0.73)], 0.032, 0.004, orange)
    parts.append(lpm.box("pole_vault_box", (0.1, 0.1, 0.02), at=(0.45, 0.7, 0.032), color=black))
    parts.append(lpm.box("pole_vault_pit", (0.42, 0.5, 0.07), at=(0.72, 0.7, 0.032), color=blue))
    parts.append(lpm.box("pole_vault_pit_top", (0.38, 0.46, 0.012), at=(0.72, 0.7, 0.102), color=white))
    for side in (-1, 1):
        parts.append(lpm.box(f"pole_vault_upright_{side}", (0.02, 0.02, 0.34), at=(0.5, 0.7 + side * 0.3, 0.032), color=grey))
    parts.append(lpm.box("pole_vault_bar", (0.012, 0.6, 0.012), at=(0.5, 0.7, 0.34), color=white))
    hj_x, hj_y = 0.3, -1.15
    flat("high_jump_fan", [(hj_x + 0.42 * math.cos(math.radians(a)), hj_y + 0.42 * math.sin(math.radians(a))) for a in range(0, 181, 15)], 0.032, 0.004, orange)
    parts.append(lpm.box("high_jump_mat", (0.5, 0.26, 0.06), at=(hj_x, hj_y + 0.05, 0.032), color=blue))
    parts.append(lpm.box("high_jump_mat_top", (0.46, 0.22, 0.012), at=(hj_x, hj_y + 0.05, 0.092), color=white))
    for side in (-1, 1):
        parts.append(lpm.box(f"high_jump_upright_{side}", (0.02, 0.02, 0.3), at=(hj_x + side * 0.27, hj_y - 0.12, 0.032), color=grey))
    parts.append(lpm.box("high_jump_bar", (0.54, 0.012, 0.012), at=(hj_x, hj_y - 0.12, 0.3), color=white))
    flat("throw_sector_a", [(1.9, 0.25), (3.0, 0.7), (3.0, -0.3)], 0.032, 0.004, lime)
    flat("throw_sector_b", [(1.9, -0.55), (2.7, -0.3), (2.7, -0.85)], 0.032, 0.004, lime)
    parts.append(lpm.box("cage", (0.22, 0.22, 0.16), at=(1.9, 0.25, 0.032), color=grey))
    parts.append(lpm.box("blue_mat", (0.26, 0.18, 0.04), at=(-1.2, -0.7, 0.032), color=blue))
    for number in range(4):
        parts.append(lpm.box(f"hurdle_{number}", (0.04, 0.2, 0.05), at=(-0.5 + number * 0.25, -0.7, 0.032), color=white))
    tiers = [(0.2, 0.12), (0.4, 0.24), (0.6, 0.36)]
    y0 = cy + 1.75 + 0.15
    for number, (depth, height) in enumerate(tiers):
        parts.append(lpm.box(f"stand_{number}", (6.0, 0.18, height), at=(0.0, y0 + number * 0.18 + 0.09, 0.02), color=seat))
        parts.append(lpm.box(f"stand_rail_{number}", (6.0, 0.02, 0.03), at=(0.0, y0 + number * 0.18 + 0.01, 0.02 + height), color=slab))
    wall_y = y0 + 3 * 0.18 + 0.03
    parts.append(lpm.box("stand_back_wall", (6.0, 0.05, 0.5), at=(0.0, wall_y, 0.02), color=track))
    parts.append(lpm.box("stand_back_cap", (6.04, 0.09, 0.03), at=(0.0, wall_y, 0.52), color=slab))
    parts.append(lpm.box("stand_canopy", (6.0, 0.4, 0.03), at=(0.0, wall_y - 0.25, 0.9), color=slab))
    for side in (-1, 1):
        parts.append(lpm.box(f"canopy_post_{side}", (0.04, 0.04, 0.88), at=(side * 2.9, wall_y - 0.42, 0.02), color=grey))
    board_y = -2.3
    for side in (-1, 1):
        parts.append(lpm.box(f"board_post_{side}", (0.05, 0.05, 0.62), at=(side * 0.42, board_y, 0.02), color=grey))
    parts.append(lpm.box("scoreboard", (1.2, 0.08, 0.55), at=(0.0, board_y, 0.6), color=slab))
    parts.append(lpm.box("scoreboard_screen", (1.1, 0.02, 0.45), at=(0.0, board_y + 0.05, 0.65), color=black))
    masts = [(-3.6, cy - 2.05), (3.6, cy - 2.05), (-3.6, cy + 2.05), (3.6, cy + 2.05), (-1.5, cy - 2.1), (1.5, cy - 2.1)]
    for number, (mx, my) in enumerate(masts):
        parts.append(lpm.prism(f"mast_{number}", 6, 0.022, 1.2, at=(mx, my, 0.02), color=grey))
        bank = lpm.box(f"lights_{number}", (0.28, 0.05, 0.13), at=(0, 0, -0.065), color=white)
        lpm.rotate(bank, 28, "X")
        lpm.rotate(bank, math.degrees(math.atan2(cx - mx, -(cy - my))), "Z")
        lpm.move(bank, mx, my, 1.2)
        parts.append(bank)
    ob = lpm.finish(spec["id"], parts, palette, budget=12000, center=False)
    return export_model(ob, spec, out_dir)


def oval_points(a, b, count=40, exponent=2.6):
    """A rounded-rectangle outline (a superellipse) of half sizes a and b, `count` points counter-clockwise from +x; the same index is the same angle on every outline, so two outlines can be joined."""
    points = []
    for i in range(count):
        c, s = math.cos(2 * math.pi * i / count), math.sin(2 * math.pi * i / count)
        points.append((a * math.copysign(abs(c) ** (2 / exponent), c), b * math.copysign(abs(s) ** (2 / exponent), s)))
    return points


def loop_solid(name, outer, inner, outer_z, inner_z, color, facets=False):
    """A closed solid ring between two outlines with as many points. `outer_z` and `inner_z` are (bottom, top) pairs, each a height or a list of one height per point. `facets` splits the top and bottom in triangles."""
    count = len(outer)

    def heights(pair):
        return [[h] * count if isinstance(h, (int, float)) else h for h in pair]

    (ob, ot), (ib, it) = heights(outer_z), heights(inner_z)
    verts = [(x, y, ob[k]) for k, (x, y) in enumerate(outer)] + [(x, y, ot[k]) for k, (x, y) in enumerate(outer)]
    verts += [(x, y, ib[k]) for k, (x, y) in enumerate(inner)] + [(x, y, it[k]) for k, (x, y) in enumerate(inner)]
    a, b, c, d = 0, count, 2 * count, 3 * count
    faces = []
    for k in range(count):
        n = (k + 1) % count
        if facets:
            faces += [(b + k, b + n, d + n), (b + k, d + n, d + k), (a + k, c + k, c + n), (a + k, c + n, a + n)]
        else:
            faces += [(b + k, b + n, d + n, d + k), (a + k, c + k, c + n, a + n)]
        faces += [(a + k, a + n, b + n, b + k), (c + n, c + k, d + k, d + n)]
    return lpm._object(name, _bm(verts, faces), color)


def faceted_ring(name, rings, tops, thickness, color):
    """A closed roof ring made of `rings` (outlines of equal size, outermost first), each with a list of top heights, the top surface split in triangles with alternating diagonals and a flat underside `thickness` below."""
    count = len(rings[0])
    verts = [(x, y, tops[r][k]) for r, ring in enumerate(rings) for k, (x, y) in enumerate(ring)]
    verts += [(x, y, tops[r][k] - thickness) for r, ring in enumerate(rings) for k, (x, y) in enumerate(ring)]
    under = len(rings) * count
    faces = []
    for r in range(len(rings) - 1):
        for k in range(count):
            n = (k + 1) % count
            a, b, c, d = r * count + k, r * count + n, (r + 1) * count + n, (r + 1) * count + k
            faces += [(a, b, c), (a, c, d)] if (k + r) % 2 else [(a, b, d), (b, c, d)]
            faces += [(under + a, under + d, under + c), (under + a, under + c, under + b)]
    last = (len(rings) - 1) * count
    for k in range(count):
        n = (k + 1) % count
        faces += [(k, under + k, under + n, n), (last + n, under + last + n, under + last + k, last + k)]
    return lpm._object(name, _bm(verts, faces), color)


def build_football_stadium(spec, out_dir):
    """A football stadium filling 12x9: a striped pitch with lines, goals and corner flags inside an oval bowl of three seat tiers (tone color) under a wavy white faceted roof ring carried by columns, a concrete facade with a glass band, and trees at the corners."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    grass, grass_light, white, slab, grey, black, wall, glass, red, seat = (index(n) for n in ("bush", "softgreen", "white", "uslab", "utrim", "graphite", "uwall", "glass_blue", "coral", "vtone1"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    parts = []
    count = 40
    angles = [2 * math.pi * i / count for i in range(count)]

    roof_count = 24
    roof_angles = [2 * math.pi * i / roof_count for i in range(roof_count)]

    def oval(a, b, points=count):
        return oval_points(a, b, points)

    def roof_height(t):
        return 1.5 + 0.32 * math.cos(2 * t) + 0.12 * math.sin(4 * t) + 0.06 * math.cos(t - 0.6)

    parts.append(lpm.sweep("bowl_floor", oval(3.55, 2.55), 0.006, at=(0, 0, 0.02), color=grass, axis="z"))

    pitch_x, pitch_y, stripes, top = 4.6, 3.0, 10, 0.032
    for number in range(stripes):
        width = pitch_x / stripes
        parts.append(lpm.box(f"stripe_{number}", (width, pitch_y, 0.012), at=(-pitch_x / 2 + width * (number + 0.5), 0, 0.02), color=grass_light if number % 2 else grass))

    def line(name, size, at):
        parts.append(lpm.box(name, (size[0], size[1], 0.004), at=(at[0], at[1], top), color=white))

    half_x, half_y, mark = pitch_x / 2, pitch_y / 2, 0.012
    for side in (-1, 1):
        line(f"touch_line_{side}", (pitch_x, mark), (0, side * half_y))
        line(f"goal_line_{side}", (mark, pitch_y), (side * half_x, 0))
        for number, (area_depth, area_width) in enumerate(((0.72, 1.77), (0.24, 0.8))):
            edge_x = side * (half_x - area_depth)
            line(f"area_{number}_front_{side}", (mark, area_width), (edge_x, 0))
            for end in (-1, 1):
                line(f"area_{number}_side_{side}_{end}", (area_depth, mark), (side * (half_x - area_depth / 2), end * area_width / 2))
        line(f"penalty_spot_{side}", (0.03, 0.03), (side * (half_x - 0.48), 0))
    line("halfway_line", (mark, pitch_y), (0, 0))
    circle = [(0.3 * math.cos(a), 0.3 * math.sin(a)) for a in angles]
    parts.append(loop_solid("centre_circle", circle, [(0.288 * math.cos(a), 0.288 * math.sin(a)) for a in angles], (top, top + 0.004), (top, top + 0.004), white))
    line("centre_spot", (0.04, 0.04), (0, 0))

    for side in (-1, 1):
        goal_x = side * (half_x + 0.04)
        for post in (-1, 1):
            parts.append(lpm.box(f"goal_post_{side}_{post}", (0.016, 0.016, 0.1), at=(side * (half_x + 0.01), post * 0.18, 0.02), color=white))
            parts.append(lpm.box(f"goal_back_post_{side}_{post}", (0.012, 0.012, 0.06), at=(side * (half_x + 0.1), post * 0.18, 0.02), color=white))
        parts.append(lpm.box(f"goal_bar_{side}", (0.016, 0.376, 0.016), at=(side * (half_x + 0.01), 0, 0.104), color=white))
        parts.append(lpm.box(f"goal_net_{side}", (0.1, 0.376, 0.008), at=(goal_x + side * 0.04, 0, 0.098), color=white))
        for end in (-1, 1):
            parts.append(lpm.prism(f"flag_{side}_{end}", 4, 0.005, 0.07, at=(side * half_x, end * half_y, 0.02), color=white))
            parts.append(lpm.box(f"flag_cloth_{side}_{end}", (0.025, 0.004, 0.02), at=(side * half_x - side * 0.014, end * half_y, 0.07), color=red))

    bench_y = half_y + 0.3
    for number, x in enumerate((-0.75, 0.75)):
        line(f"technical_area_{number}", (0.7, mark), (x, half_y + 0.14))
        parts.append(lpm.box(f"dugout_floor_{number}", (0.6, 0.2, 0.01), at=(x, bench_y, 0.02), color=slab))
        parts.append(lpm.box(f"dugout_back_{number}", (0.6, 0.02, 0.12), at=(x, bench_y + 0.09, 0.03), color=glass))
        parts.append(lpm.box(f"dugout_bench_{number}", (0.5, 0.06, 0.035), at=(x, bench_y + 0.04, 0.03), color=seat))
        parts.append(lpm.box(f"dugout_backrest_{number}", (0.5, 0.012, 0.04), at=(x, bench_y + 0.075, 0.065), color=grey))
        parts.append(lpm.box(f"dugout_roof_{number}", (0.64, 0.24, 0.015), at=(x, bench_y, 0.15), color=white))
        for end in (-1, 1):
            parts.append(lpm.box(f"dugout_side_{number}_{end}", (0.015, 0.2, 0.12), at=(x + end * 0.3, bench_y, 0.03), color=grey))

    tiers = [((3.55, 2.55), (4.05, 3.05), 0.28), ((4.05, 3.05), (4.25, 3.25), 0.3), ((4.25, 3.25), (4.75, 3.7), 0.52), ((4.75, 3.7), (5.2, 4.05), 0.74)]
    for number, (inner, outer, height) in enumerate(tiers):
        colour = slab if number == 1 else seat
        parts.append(loop_solid(f"tier_{number}", oval(*outer), oval(*inner), (0.02, height), (0.02, height), colour))
        parts.append(loop_solid(f"tier_rail_{number}", oval(*inner), oval(inner[0] + 0.03, inner[1] + 0.03), (height - 0.02, height + 0.025), (height - 0.02, height + 0.025), grey))
    for number in range(16):
        angle = 2 * math.pi * (number + 0.5) / 16
        x, y = oval_points(4.55, 3.5, 16)[number]
        aisle = lpm.box(f"aisle_{number}", (0.04, 0.9, 0.02), at=(0, 0, 0), color=wall)
        lpm.rotate(aisle, math.degrees(math.atan2(y * 0.67, x * 0.67)) + 90)
        lpm.move(aisle, x, y, 0.52)
        parts.append(aisle)
    parts.append(loop_solid("facade", oval(5.4, 4.15), oval(5.2, 3.95), (0.02, 0.8), (0.02, 0.8), wall))
    parts.append(loop_solid("facade_glass", oval(5.42, 4.17), oval(5.4, 4.15), (0.22, 0.6), (0.22, 0.6), glass))
    parts.append(loop_solid("facade_plinth", oval(5.44, 4.19), oval(5.4, 4.15), (0.02, 0.1), (0.02, 0.1), grey))

    outer_roof, inner_roof = oval(6.0, 4.5, roof_count), oval(4.9, 3.5, roof_count)
    middle_roof = [((ox + ix) / 2, (oy + iy) / 2) for (ox, oy), (ix, iy) in zip(outer_roof, inner_roof)]
    wave = [roof_height(t) for t in roof_angles]
    outer_top = [h - 0.1 for h in wave]
    middle_top = [h + 0.1 + (0.06 if k % 2 else -0.06) for k, h in enumerate(wave)]
    inner_top = [h + 0.2 for h in wave]
    parts.append(faceted_ring("roof", [outer_roof, middle_roof, inner_roof], [outer_top, middle_top, inner_top], 0.09, white))
    parts.append(loop_solid("roof_rim", oval(5.05, 3.65, roof_count), inner_roof, ([h - 0.18 for h in inner_top], [h - 0.09 for h in inner_top]), ([h - 0.18 for h in inner_top], [h - 0.09 for h in inner_top]), wall))
    for number, (x, y) in enumerate(oval_points(5.85, 4.4, 20)):
        parts.append(lpm.prism(f"column_{number}", 6, 0.04, roof_height(2 * math.pi * number / 20) - 0.17 - 0.02, at=(x, y, 0.02), color=wall))

    trees = [(sx * x, sy * y) for sx in (-1, 1) for sy in (-1, 1) for x, y in ((5.6, 4.1), (4.4, 4.2), (5.7, 3.0))]
    for number, (x, y) in enumerate(trees):
        parts.append(lpm.box(f"planter_{number}", (0.3, 0.3, 0.04), at=(x, y, 0.02), color=grey))
        parts.append(lpm.prism(f"trunk_{number}", 5, 0.02, 0.1, at=(x, y, 0.06), color=slab))
        parts.append(lpm.lathe(f"crown_{number}", [(0.0, 0.14), (0.12, 0.18), (0.14, 0.28), (0.08, 0.38), (0.0, 0.42)], segments=6, at=(x, y, 0.06), color=grass))
    ob = lpm.finish(spec["id"], parts, palette, budget=12000, center=False)
    return export_model(ob, spec, out_dir)


def build_padel(spec, out_dir):
    """A block of four padel courts filling 3x3: four blue courts of 1x2 turned like a pinwheel around a 1x1 yard, each with white lines, a net, glass back walls, glass and mesh side walls, a door on the yard, floodlight masts at the corners, and benches, ball baskets and a bush in the yard."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    court, apron, white, slab, frame, glass, wood, ball, bush = (index(n) for n in ("cobalt", "bush", "white", "uslab", "graphite", "glass_blue", "uwood", "sun", "bush"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    parts = []
    half_width, half_length, base = 0.44, 0.94, 0.02
    center_x, center_y = -1.0, -0.5
    glass_tall, glass_low, mesh_top = 0.15, 0.1, 0.22

    def put(name, size, at, color, quarter):
        """A box given in the frame of the left court, turned by `quarter` quarter turns around the block center."""
        x, y = at[0], at[1]
        sx, sy = size[0], size[1]
        for _ in range(quarter):
            x, y, sx, sy = -y, x, sy, sx
        parts.append(lpm.box(name, (sx, sy, size[2]), at=(x, y, at[2]), color=color))

    def court_part(name, size, at, color, quarter):
        put(name, size, (center_x + at[0], center_y + at[1], at[2]), color, quarter)

    parts.append(lpm.box("apron", (2.98, 2.98, base), at=(0, 0, 0), color=apron))
    parts.append(lpm.box("yard", (0.98, 0.98, 0.004), at=(0, 0, base), color=slab))

    posts_x = (-half_width - 0.01, -0.15, 0.15, half_width + 0.01)
    door_y, door_half = 0.28, 0.08
    for quarter in range(4):
        tag = f"court{quarter}"

        def add(name, size, at, color):
            court_part(f"{tag}_{name}", size, at, color, quarter)

        add("surface", (2 * half_width, 2 * half_length, 0.01), (0, 0, base), court)
        line_z = base + 0.01
        for side in (-1, 1):
            add(f"side_line_{side}", (0.008, 2 * half_length - 0.02, 0.003), (side * (half_width - 0.012), 0, line_z), white)
            add(f"end_line_{side}", (2 * half_width - 0.02, 0.008, 0.003), (0, side * (half_length - 0.012), line_z), white)
            add(f"service_line_{side}", (2 * half_width - 0.02, 0.008, 0.003), (0, side * 0.65, line_z), white)
        add("center_line", (0.008, 1.3, 0.003), (0, 0, line_z), white)

        add("net", (2 * half_width, 0.006, 0.07), (0, 0, line_z), frame)
        add("net_tape", (2 * half_width, 0.01, 0.008), (0, 0, line_z + 0.07), white)
        for side in (-1, 1):
            add(f"net_post_{side}", (0.014, 0.014, 0.09), (side * (half_width + 0.008), 0, line_z), frame)

        for side in (-1, 1):
            wall_y = side * (half_length + 0.01)
            add(f"back_glass_{side}", (2 * half_width + 0.04, 0.008, glass_tall), (0, wall_y, base), glass)
            for number, rail in enumerate((glass_tall, 0.185, mesh_top)):
                add(f"back_rail_{side}_{number}", (2 * half_width + 0.04, 0.01, 0.008), (0, wall_y, base + rail), frame)
            for number, post_x in enumerate(posts_x):
                add(f"back_post_{side}_{number}", (0.014, 0.014, mesh_top), (post_x, wall_y, base), frame)

        for side in (-1, 1):
            wall_x = side * (half_width + 0.01)
            for end in (-1, 1):
                add(f"corner_glass_{side}_{end}", (0.008, 0.46, glass_tall), (wall_x, end * (half_length - 0.23), base), glass)
            segments = [(-0.48, 0.48)] if side == -1 else [(-0.48, door_y - door_half), (door_y + door_half, 0.48)]
            for number, (start, stop) in enumerate(segments):
                add(f"low_glass_{side}_{number}", (0.008, stop - start, glass_low), (wall_x, (start + stop) / 2, base), glass)
            for number, rail in enumerate((glass_low, 0.15, 0.185, mesh_top)):
                add(f"side_rail_{side}_{number}", (0.01, 2 * half_length, 0.008), (wall_x, 0, base + rail), frame)
            for number, post_y in enumerate((-half_length, -0.48, 0.0, 0.48, half_length)):
                add(f"side_post_{side}_{number}", (0.014, 0.014, mesh_top), (wall_x, post_y, base), frame)
        for edge in (-1, 1):
            add(f"door_post_{edge}", (0.018, 0.018, 0.17), (half_width + 0.01, door_y + edge * door_half, base), frame)

        bench_y = door_y
        put(f"{tag}_bench_seat", (0.07, 0.26, 0.03), (center_x + half_width + 0.17, center_y + bench_y, base + 0.004), wood, quarter)
        put(f"{tag}_bench_back", (0.012, 0.26, 0.04), (center_x + half_width + 0.205, center_y + bench_y, base + 0.034), wood, quarter)
        for leg in (-1, 1):
            put(f"{tag}_bench_leg_{leg}", (0.05, 0.015, 0.03), (center_x + half_width + 0.17, center_y + bench_y + leg * 0.1, base + 0.004), frame, quarter)
        put(f"{tag}_basket", (0.07, 0.07, 0.05), (center_x + half_width + 0.3, center_y + bench_y - 0.22, base + 0.004), frame, quarter)
        for number, (dx, dy) in enumerate(((-0.015, -0.01), (0.012, 0.012), (0.0, 0.0))):
            put(f"{tag}_basket_ball_{number}", (0.026, 0.026, 0.026), (center_x + half_width + 0.3 + dx, center_y + bench_y - 0.22 + dy, base + 0.054 + 0.018 * (number == 2)), ball, quarter)

    parts.append(lpm.box("planter", (0.18, 0.18, 0.04), at=(0, 0, base + 0.004), color=slab))
    parts.append(lpm.lathe("bush", [(0.0, 0.0), (0.08, 0.02), (0.1, 0.07), (0.06, 0.12), (0.0, 0.14)], segments=7, at=(0, 0, base + 0.044), color=bush))

    for number, (sx, sy) in enumerate(((-1, -1), (1, -1), (1, 1), (-1, 1))):
        x, y = sx * 1.4, sy * 1.4
        parts.append(lpm.prism(f"mast_{number}", 6, 0.014, 0.4, at=(x, y, base), color=frame))
        bank = lpm.box(f"light_back_{number}", (0.16, 0.03, 0.06), at=(0, 0, 0), color=frame)
        lamp = lpm.box(f"light_{number}", (0.14, 0.012, 0.05), at=(0, 0.02, 0.005), color=white)
        for piece in (bank, lamp):
            lpm.rotate(piece, -20, "X")
            lpm.rotate(piece, math.degrees(math.atan2(sx, -sy)), "Z")
            lpm.move(piece, x, y, base + 0.4)
            parts.append(piece)
    ob = lpm.finish(spec["id"], parts, palette, budget=8000, center=False)
    return export_model(ob, spec, out_dir)


def build_colosseum(spec, out_dir):
    """A ruined colosseum filling 5x5: an elliptical ring of arcaded bays turned 45 degrees, three arch levels and an attic on the tall side, stepping down to broken stumps on the other, with stepped seating, a sand arena with low cellar walls, rubble and bushes."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    stone, cornice, seat, sand, dark, slab, green = (index(n) for n in ("cream", "usand", "uwall", "usand", "graphite", "uslab", "bush"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    rng = random.Random(spec.get("seed", spec["id"]))
    parts = []
    bays = 40
    turn = math.radians(45)
    tall_angle = math.radians(100)
    levels = [0.0, 0.28, 0.56, 0.84, 1.04]
    wall_a, wall_b, wall_width = 2.62, 2.15, 0.32

    def ring(a, b):
        return [(a * math.cos(2 * math.pi * i / bays) * math.cos(turn) - b * math.sin(2 * math.pi * i / bays) * math.sin(turn),
                 a * math.cos(2 * math.pi * i / bays) * math.sin(turn) + b * math.sin(2 * math.pi * i / bays) * math.cos(turn)) for i in range(bays)]

    def ruin(x, y):
        """0 on the tall side, 1 on the opposite side."""
        gap = abs((math.atan2(y, x) - tall_angle + math.pi) % (2 * math.pi) - math.pi)
        return gap / math.pi

    def wedge(name, o0, o1, i0, i1, z0, z1, color):
        verts = [(x, y, z) for z in (z0, z1) for x, y in (o0, o1, i1, i0)]
        faces = [(0, 1, 2, 3), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
        return lpm._object(name, _bm(verts, faces), color)

    def opening(name, middle, right, normal, z, width, height, round_top, color):
        outline = [(-width / 2, 0), (width / 2, 0)]
        if round_top:
            rise = height - width / 2
            outline += [(width / 2, rise)] + [(width / 2 * math.cos(math.radians(a)), rise + width / 2 * math.sin(math.radians(a))) for a in (30, 60, 90, 120, 150)] + [(-width / 2, rise)]
        else:
            outline += [(width / 2, height), (-width / 2, height)]
        points = [(middle[0] + right[0] * u + normal[0] * DECAL_OFFSET, middle[1] + right[1] * u + normal[1] * DECAL_OFFSET, z + v) for u, v in outline]
        parts.append(_decal(name, points, color))

    outer_ring = ring(wall_a, wall_b)
    inner_ring = ring(wall_a - wall_width, wall_b - wall_width)
    cornice_ring = ring(wall_a + 0.014, wall_b + 0.014)
    parts.append(lpm.sweep("plinth", ring(2.72, 2.25), 0.03, color=slab, axis="z"))

    tops = []
    for k in range(bays):
        n = (k + 1) % bays
        mid = ((outer_ring[k][0] + outer_ring[n][0]) / 2, (outer_ring[k][1] + outer_ring[n][1]) / 2)
        gap = ruin(*mid) + rng.uniform(-0.05, 0.05)
        full = 4 if gap < 0.2 else 3 if gap < 0.36 else 2 if gap < 0.52 else 1 if gap < 0.8 else 0
        if full == 0 and rng.random() < 0.2:
            tops.append((0, 0.0))
            continue
        partial = 0.0 if full == 4 else rng.uniform(0.3, 0.9) if full else rng.uniform(0.2, 0.7)
        height = levels[full] + partial * (levels[min(full + 1, 4)] - levels[full])
        tops.append((full, height))
        parts.append(wedge(f"bay_{k}", outer_ring[k], outer_ring[n], inner_ring[k], inner_ring[n], 0.02, height, stone))

        tangent = (outer_ring[n][0] - outer_ring[k][0], outer_ring[n][1] - outer_ring[k][1])
        length = math.hypot(*tangent)
        tangent = (tangent[0] / length, tangent[1] / length)
        outward = (tangent[1], -tangent[0])
        inner_tangent = (inner_ring[n][0] - inner_ring[k][0], inner_ring[n][1] - inner_ring[k][1])
        inner_length = math.hypot(*inner_tangent)
        inner_tangent = (inner_tangent[0] / inner_length, inner_tangent[1] / inner_length)
        inner_middle = ((inner_ring[k][0] + inner_ring[n][0]) / 2, (inner_ring[k][1] + inner_ring[n][1]) / 2)
        for level in range(full):
            top = levels[level + 1]
            parts.append(wedge(f"cornice_{k}_{level}", cornice_ring[k], cornice_ring[n], outer_ring[k], outer_ring[n], top - 0.016, top, cornice))
            attic = level == 3
            width, rise = (0.1, 0.1) if attic else (length * 0.54, 0.22)
            z = levels[level] + (0.06 if attic else 0.035)
            opening(f"opening_{k}_{level}", mid, tangent, outward, z, width, rise, not attic, dark)
            if level >= 2:
                opening(f"inner_opening_{k}_{level}", inner_middle, (-inner_tangent[0], -inner_tangent[1]), (-inner_tangent[1], inner_tangent[0]), z, width * 0.85, rise, not attic, dark)

    seat_a, seat_b = wall_a - wall_width, wall_b - wall_width
    step_depth, step_heights = 0.17, [0.46, 0.37, 0.28, 0.19]
    for number, base in enumerate(step_heights):
        outer_steps = ring(seat_a - step_depth * number, seat_b - step_depth * number)
        inner_steps = ring(seat_a - step_depth * (number + 1), seat_b - step_depth * (number + 1))
        heights = [base * (1.0 if ruin(*p) < 0.5 else max(0.3, 1.0 - (ruin(*p) - 0.5) * 1.4)) for p in outer_steps]
        parts.append(loop_solid(f"seats_{number}", outer_steps, inner_steps, (0.02, heights), (0.02, heights), seat if number % 2 == 0 else cornice))

    arena_a, arena_b = seat_a - step_depth * len(step_heights), seat_b - step_depth * len(step_heights)
    parts.append(lpm.sweep("arena", ring(arena_a, arena_b), 0.03, at=(0, 0, 0.02), color=sand, axis="z"))
    for number, y in enumerate((-0.7, -0.35, 0.0, 0.35, 0.7)):
        half = arena_a * math.sqrt(1 - (y / arena_b) ** 2) - 0.12
        wall = lpm.box(f"cellar_long_{number}", (2 * half, 0.025, 0.05), at=(0, y, 0.05), color=stone)
        parts.append(lpm.rotate(wall, 45))
    for number, x in enumerate((-1.0, -0.5, 0.5, 1.0)):
        half = arena_b * math.sqrt(1 - (x / arena_a) ** 2) - 0.1
        wall = lpm.box(f"cellar_cross_{number}", (0.025, 2 * half, 0.05), at=(x, 0, 0.05), color=stone)
        parts.append(lpm.rotate(wall, 45))

    for number in range(16):
        t = rng.uniform(0, 2 * math.pi)
        a, b = wall_a + rng.uniform(0.02, 0.08), wall_b + rng.uniform(0.02, 0.08)
        x, y = a * math.cos(t) * math.cos(turn) - b * math.sin(t) * math.sin(turn), a * math.cos(t) * math.sin(turn) + b * math.sin(t) * math.cos(turn)
        if ruin(x, y) < 0.55:
            continue
        size = rng.uniform(0.05, 0.12)
        block = lpm.box(f"rubble_{number}", (size, size * rng.uniform(0.7, 1.3), rng.uniform(0.04, 0.09)), at=(x, y, 0.03), color=rng.choice((stone, cornice, slab)))
        parts.append(lpm.rotate(block, rng.uniform(0, 180), about=(x, y, 0)))

    for number, (full, height) in enumerate(tops):
        if full == 4 or not height or rng.random() > 0.35:
            continue
        x, y = (outer_ring[number][0] + inner_ring[number][0]) / 2, (outer_ring[number][1] + inner_ring[number][1]) / 2
        parts.append(lpm.lathe(f"bush_{number}", [(0.0, 0.0), (0.06, 0.015), (0.065, 0.05), (0.035, 0.09), (0.0, 0.1)], segments=6, at=(x, y, height), color=green))

    ob = lpm.finish(spec["id"], parts, palette, budget=9000, center=False)
    return export_model(ob, spec, out_dir)


def build(spec, out_dir):
    """Build, check, export <out_dir>/<id>.blend + <id>.glb. Returns the lpm report."""
    style = spec.get("style", "kenney")
    palette_for(spec, style)
    check_spec(spec)
    cfg = STYLES[style]
    spec["cfg"] = cfg
    spec["style"] = style
    width, depth = spec["footprint"]
    spec["colors"] = {**cfg["colors"], **spec.get("colors", {})}
    spec["floor_height"] = cfg.get("floor_height", FLOOR_HEIGHT)[spec["kind"]] * spec.get("floor_height_scale", 1.0)
    rng = random.Random(spec.get("seed", spec["id"]))

    volumes = plan_volumes(spec)
    features = spec.get("features", [])
    main = volumes[0]
    front = next((v for v in volumes if v["role"] == "bay"), main)
    specs = {v["role"]: volume_spec(spec, v, features_of(v, front, main, features)) for v in volumes}
    if "bay" in specs and specs["bay"]["floors"] == specs["main"]["floors"] and not spec.get("bay_natural_roof"):
        specs["bay"]["roof_height"] = roof_dimensions(specs["main"])[2]
    bushes = has_feature(spec, "bushes")

    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in palette_for(spec, style)])
    parts = []
    for volume in volumes:
        parts += build_volume(specs[volume["role"]], volume, rng, bushes)
    assert_closed(parts)
    projection = PORTICO_PROJECTION if has_feature(spec, "portico") else 0.0
    shift(parts, 0, projection / 2)

    extra_volumes = len(volumes) - 1
    if style != "vivid":
        budget = 600 + cfg["budget_per_floor_tile"] * width * depth * spec["floors"] + 450 * extra_volumes + 150 * len(features)
    else:
        budget = 700 + spec["floors"] * 2 * (width + depth) * cfg["budget_per_floor_tile"] + 150 * len(features) + 600 * extra_volumes
    if spec["roof"] == "mansard":
        budget += 1500
    ob = lpm.finish(spec["id"], parts, palette, budget=int(budget), center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [width, depth + projection]
    return report
