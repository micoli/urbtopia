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
            "vent", "solar_panels", "bushes", "clock_tower", "flagpole", "smokestack", "roller_door", "storefront", "penthouse", "portico", "red_cross", "door_hood", "penthouse_terrace", "stair_head", "round_dormer", "round_window", "roof_lantern", "striped_awning", "stall", "material_yard", "marquee", "wall_tools", "bush_at", "industrial_door", "hazard_band", "hardware_display", "roof_reel", "curved_marquee", "pilasters", "crystals", "red_carpet", "roof_tank", "roof_pipes", "loading_dock", "crate_stacks", "side_conveyor", "bulb_row", "stone_accents", "roof_vents", "roof_coin", "poster", "roof_die", "roof_card", "door_at", "colonnade", "dome", "raised_center", "barrel_wings", "cypresses")
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

# Palette cells of the world architecture styles (see .scratch/housing-architecture-styles); a style that needs more cells appends them here.
WORLD_ENTRIES = URBTOPIA_ENTRIES + [
    ("brownstone", "#8f5a43"), ("brownstone_dark", "#6e4333"), ("brick_dark", "#8e3322"),
    ("limestone", "#bdb7a6"), ("limestone_dark", "#8f8a7c"), ("yellowbrick", "#d8b45c"), ("yellowbrick_dark", "#b38f3f"),
    ("shutter_green", "#355e4a"),
    ("timber", "#4b3424"), ("plaster", "#efe4cc"), ("whitewash", "#f6f3ec"), ("blackwood", "#2b2724"), ("ochre", "#d9b878"), ("thatch", "#b99a58"), ("tile", "#a85a3c"), ("siena", "#cf8a5a"), ("dustypink", "#d9a89a"),
    ("pine", "#c9955c"), ("darkwood", "#8a5a3a"), ("honey", "#d9a85c"), ("greywood", "#9a9488"), ("shingle", "#5a4636"), ("falured", "#9b3a2a"), ("dalablue", "#6a8aa3"),
    ("tarwood", "#5b4332"), ("earth", "#7b6a4f"), ("turfgreen", "#6f9a4a"),
    ("aegeanblue", "#2f6fb0"), ("turquoise", "#2aa7b5"), ("pastelpink", "#e8b8b0"),
    ("greybrick", "#7d7f84"), ("lacquer", "#a8322a"), ("strawgold", "#d4b060"), ("greythatch", "#8e8a78"), ("mosshatch", "#7f8a54"), ("clayplaster", "#d3bf94"), ("sandwall", "#d9d0bd"), ("kawara", "#54585f"), ("kawara_blue", "#46566e"), ("kawara_brown", "#5d4b43"), ("bamboo", "#c9b46a"),
    ("concrete", "#a7a7a2"), ("concrete_warm", "#b3a894"), ("concrete_dark", "#7b7b78"), ("concrete_pink", "#b99f98"), ("riadrose", "#c98a6a"), ("sandstone", "#d8c08a"), ("redclay", "#b5573a"), ("zellige", "#2a7f8c"), ("majorelle", "#2e4fbf"), ("tilegreen", "#2f7d4f"),
]
STYLES["world"] = {**STYLES["urbtopia"], "palette_extra": WORLD_ENTRIES}

COLONNADE_PROJECTION = 0.22  # a colonnade stands this far out of the front wall
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


def add_colonnade(spec, parts, columns=4, text=None, width=None):
    """A classical front: steps, a row of columns, a frieze (optionally lettered) and a triangular pediment."""
    floor = spec["floor_height"]
    length, _ = wall_extent(spec, "front")
    wall, trim, ink = color_index(spec, "wall"), color_index(spec, "trim"), PALETTE_NAMES.index(spec["cfg"]["ink"])
    front = wall_half(spec, "front")
    span = width if width else min(1.1, length * 0.55)
    reach = COLONNADE_PROJECTION
    column_height = floor * 1.75
    frieze = 0.07
    parts.append(wall_box(spec, "colonnade_step_low", "front", 0, 0, (span + 0.2, reach + 0.1, 0.02), trim))
    parts.append(wall_box(spec, "colonnade_step_high", "front", 0, 0.02, (span + 0.12, reach + 0.04, 0.02), trim))
    base = 0.04
    column_y = -(front + reach - 0.05)
    for index in range(columns):
        x = -span / 2 + 0.05 + index * (span - 0.1) / (columns - 1)
        parts.append(lpm.box(f"column_base_{index}", (0.07, 0.07, 0.02), at=(x, column_y, base), color=trim))
        parts.append(lpm.prism(f"column_{index}", 8, 0.026, column_height - base - 0.04, at=(x, column_y, base + 0.02), color=wall))
        parts.append(lpm.box(f"column_capital_{index}", (0.075, 0.075, 0.025), at=(x, column_y, column_height - 0.025), color=trim))
    parts.append(wall_box(spec, "colonnade_frieze", "front", 0, column_height, (span + 0.08, reach + 0.01, frieze), wall))
    rise = span * 0.16
    parts.append(lpm.sweep("pediment", [(-span / 2 - 0.04, 0.0), (span / 2 + 0.04, 0.0), (0.0, rise)], depth=reach + 0.01, at=(0.0, -(front + (reach + 0.01) / 2 - 0.01), column_height + frieze), color=trim))
    parts.append(lpm.sweep("pediment_face", [(-span / 2 + 0.02, 0.012), (span / 2 - 0.02, 0.012), (0.0, rise - 0.025)], depth=0.012, at=(0.0, -(front + reach + 0.004), column_height + frieze), color=wall))
    if text:
        add_vector_sign_text(spec, parts, "front", text, trim, column_height + 0.0, 0.032, half=front + reach - 0.015)


def raised_height(spec):
    return spec["floor_height"] * 0.95


def add_raised_center(spec, parts, ratio=0.45):
    """A taller block over the middle of a flat roof, with a window row on its front and back, so the sides read as wings."""
    body_width, body_depth = spec["body"]
    wall, roof = color_index(spec, "wall"), color_index(spec, "roof")
    width, depth, height = body_width * ratio, body_depth * 0.8, raised_height(spec)
    base = roof_surface(spec) - 0.005
    parts.append(rounded_block("raised_center", width, depth, height, wall, spec["cfg"]["corner"], at=(0, 0, base)))
    parts.append(lpm.box("raised_cornice", (width + 0.05, depth + 0.05, 0.025), at=(0, 0, base + height), color=roof))
    count = max(3, int(width / 0.32))
    for face in ("front", "back"):
        for index in range(count):
            along = (index - (count - 1) / 2) * (width - 0.16) / count
            add_window(spec, parts, f"raised_{face}_{index}", face, along, base + height * 0.22, 0.16, height * 0.56, half=depth / 2)


def add_barrel_wings(spec, parts, inner=0.45, rise=0.14):
    """A glazed barrel vault over each side of a flat roof, with ribs, flanking the raised center."""
    body_width, body_depth = spec["body"]
    trim, glass = color_index(spec, "trim"), PALETTE_NAMES.index("glass_blue")
    centre_half = body_width * inner / 2
    width = (body_width / 2 - centre_half) * 0.75
    centre_x = centre_half + (body_width / 2 - centre_half) / 2
    depth = body_depth * 0.7
    base = roof_surface(spec) - 0.005

    def arch(span, lift):
        return [(span / 2 * math.cos(math.radians(a)), lift * math.sin(math.radians(a))) for a in range(0, 181, 30)]

    for side in (-1, 1):
        x = side * centre_x
        parts.append(lpm.box(f"barrel_plinth_{side}", (width + 0.04, depth + 0.04, 0.03), at=(x, 0, base), color=trim))
        parts.append(lpm.sweep(f"barrel_vault_{side}", arch(width, rise), depth=depth, at=(x, 0, base + 0.03), color=glass))
        for index, y in enumerate((-depth / 2, 0.0, depth / 2)):
            parts.append(lpm.sweep(f"barrel_rib_{side}_{index}", arch(width + 0.025, rise + 0.012), depth=0.022, at=(x, y, base + 0.03), color=trim))


def add_cypresses(spec, parts, per_side=3, span=1.0):
    """Slim dark trees in a row on each side of the entrance steps, inside the footprint of the colonnade."""
    front = wall_half(spec, "front")
    leaf = PALETTE_NAMES.index("bush")
    for side in (-1, 1):
        for index in range(per_side):
            x = side * (span / 2 + 0.28 + index * 0.24)
            parts.append(lpm.prism(f"cypress_{side}_{index}", 6, 0.05, 0.3, at=(x, -(front + 0.12), 0.0), color=leaf, radius_top=0.008))


def add_dome(spec, parts, radius=0.3, offset=(0.0, 0.0), drum=0.1, lift=0.0, ring=False):
    """A round drum under a copper dome with a small lantern, standing on a flat roof."""
    wall, trim, accent = color_index(spec, "wall"), color_index(spec, "trim"), color_index(spec, "accent")
    ox, oy = offset
    base = roof_surface(spec) - 0.005 + lift
    parts.append(lpm.prism("dome_drum", 12, radius * (0.9 if ring else 1.0), drum, at=(ox, oy, base), color=wall))
    if ring:
        for index in range(12):
            angle = math.radians(index * 30)
            parts.append(lpm.prism(f"dome_column_{index}", 6, 0.014, drum, at=(ox + radius * 0.97 * math.cos(angle), oy + radius * 0.97 * math.sin(angle), base), color=wall))
    parts.append(lpm.prism("dome_ring", 12, radius + 0.018, 0.018, at=(ox, oy, base + drum - 0.01), color=trim))
    top = base + drum + 0.008
    profile = [(radius * math.cos(math.radians(a)), radius * 0.9 * math.sin(math.radians(a))) for a in (0, 25, 50, 70, 85)] + [(0.0, radius * 0.9)]
    parts.append(lpm.lathe("dome_shell", profile, segments=12, at=(ox, oy, top), color=accent))
    parts.append(lpm.prism("dome_lantern", 8, 0.04, 0.07, at=(ox, oy, top + radius * 0.9 - 0.01), color=trim))
    parts.append(lpm.prism("dome_finial", 6, 0.012, 0.06, at=(ox, oy, top + radius * 0.9 + 0.05), color=accent, radius_top=0.003))


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
    elif kind == "colonnade":
        add_colonnade(spec, parts, feature.get("columns", 4), feature.get("text"), feature.get("width"))
    elif kind == "dome":
        add_dome(spec, parts, feature.get("radius", 0.3), tuple(feature.get("offset", (0.0, 0.0))), feature.get("drum", 0.1), raised_height(spec) if has_feature(spec, "raised_center") else 0.0, feature.get("ring", False))
    elif kind == "cypresses":
        add_cypresses(spec, parts, feature.get("per_side", 3), feature.get("span", 1.0))
    elif kind == "raised_center":
        add_raised_center(spec, parts, feature.get("ratio", 0.45))
    elif kind == "barrel_wings":
        add_barrel_wings(spec, parts, feature.get("inner", 0.45), feature.get("rise", 0.14))
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
GEOTHERMAL_TOWER_ROW = ((0.3, 0.3), (0.3, 0.0), (0.3, -0.3))
GEOTHERMAL_TOWER_COUNT = {4: 2, 5: 3, 6: 3}


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
    stage = min(count, 3)
    towers = GEOTHERMAL_TOWERS if count <= 3 else GEOTHERMAL_TOWER_ROW[:GEOTHERMAL_TOWER_COUNT[count]]
    height = 0.55 + 0.15 * (stage - 1)
    scale = height / 0.55
    profile = [(r, z * scale) for r, z in ((0.0, 0.0), (0.14, 0.0), (0.12, 0.2), (0.095, 0.38), (0.115, 0.52), (0.115, 0.55), (0.0, 0.55))]
    puff = [(0.0, 0.0), (0.06, 0.02), (0.085, 0.08), (0.06, 0.15), (0.0, 0.17)]
    for number, (x, y) in enumerate(towers[:1] if count <= 3 else towers):
        parts.append(lpm.lathe(f"tower_{number}", profile, segments=12, at=(x, y, 0.04), color=wall))
        for ring in range(stage):
            level = height - 0.08 - 0.08 * ring
            radius = next(r0 + (r1 - r0) * (level - z0) / (z1 - z0) for (r0, z0), (r1, z1) in zip(profile, profile[1:]) if z0 <= level <= z1 and z1 > z0)
            parts.append(lpm.prism(f"tower_{number}_ring_{ring}", 12, radius + 0.008, 0.04, at=(x, y, 0.04 + level), color=mint))
        parts.append(lpm.prism(f"tower_{number}_rim", 12, 0.118, 0.012, at=(x, y, 0.04 + height), color=dark))
        parts.append(lpm.lathe(f"steam_{number}", puff, segments=8, at=(x, y, 0.04 + height + 0.02), color=white))
    x, y = towers[0]
    if count >= 6:
        parts.append(rounded_block("annex", 0.3, 0.2, 0.2, wall, 0.03 / 0.2, at=(0.0, -0.28, 0.04)))
        parts.append(rounded_block("annex_band", 0.31, 0.21, 0.02, mint, 0.03 / 0.21, at=(0.0, -0.28, 0.21)))
        parts.append(rounded_block("annex_roof", 0.34, 0.24, 0.03, slab, 0.03 / 0.24, at=(0.0, -0.28, 0.23)))
    parts.append(lpm.box("hall_link", (0.14, 0.035, 0.035), at=(0.08 + 0.07, y, 0.1), color=trim))
    wx, wy = -0.3, -0.22
    parts.append(lpm.prism("wellhead", 10, 0.05, 0.16, at=(wx, wy, 0.04), color=trim))
    parts.append(lpm.prism("wellhead_flange", 10, 0.065, 0.025, at=(wx, wy, 0.04 + 0.1), color=mint))
    parts.append(lpm.prism("wellhead_cap", 10, 0.045, 0.02, at=(wx, wy, 0.04 + 0.16), color=dark))
    parts.append(lpm.box("wellhead_pipe", (0.035, abs(front - wy), 0.035), at=(wx, (front + wy) / 2, 0.11), color=trim))
    ob = lpm.finish(spec["id"], parts, palette, budget=3000, center=False)
    return export_model(ob, spec, out_dir)

def build_large_geothermal(spec, out_dir):
    """A large geothermal plant on a 2x2 pad: a wide turbine hall with a mint band, four flared cooling towers with steam puffs fed by a manifold, and two wellheads piped to the hall."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    wall, mint, dark, slab, glass, white, trim, frame = (index(n) for n in ("uwall", "uroof", "udark", "uslab", "glass_blue", "white", "utrim", "uframe"))
    mint = PALETTE_NAMES.index("vtone1")
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    parts = [lpm.box("plant_pad", (1.92, 1.92, 0.04), at=(0, 0, 0), color=slab)]
    hx, hy, hw, hd = 0.0, -0.2, 1.3, 0.6
    parts.append(rounded_block("hall", hw, hd, 0.32, wall, 0.03 / hd, at=(hx, hy, 0.04)))
    parts.append(rounded_block("hall_band", hw + 0.01, hd + 0.01, 0.03, mint, 0.03 / hd, at=(hx, hy, 0.34)))
    parts.append(rounded_block("hall_roof", hw + 0.05, hd + 0.05, 0.035, slab, 0.03 / hd, at=(hx, hy, 0.37)))
    front = hy - hd / 2
    for name, cx, bottom, width, height, sides in (("door", -0.45, 0.04, 0.14, 0.2, ("left", "right", "top")), ("window_a", -0.1, 0.13, 0.24, 0.1, ("left", "right", "top", "bottom")), ("window_b", 0.3, 0.13, 0.24, 0.1, ("left", "right", "top", "bottom"))):
        parts.append(lpm.box(name, (width, 0.012, height), at=(cx, front - 0.003, bottom), color=dark if name == "door" else glass))
        thick = 0.012
        low = thick if "bottom" in sides else 0
        parts.append(lpm.box(f"{name}_frame_left", (thick, 0.01, height + thick + low), at=(cx - width / 2 - thick / 2, front - 0.004, bottom - low), color=frame))
        parts.append(lpm.box(f"{name}_frame_right", (thick, 0.01, height + thick + low), at=(cx + width / 2 + thick / 2, front - 0.004, bottom - low), color=frame))
        parts.append(lpm.box(f"{name}_frame_top", (width + 2 * thick, 0.01, thick), at=(cx, front - 0.004, bottom + height), color=frame))
        if low:
            parts.append(lpm.box(f"{name}_frame_bottom", (width + 2 * thick, 0.01, thick), at=(cx, front - 0.004, bottom - thick), color=frame))
    height = 0.85
    scale = height / 0.55
    k = 1.25
    profile = [(r * k, z * scale) for r, z in ((0.0, 0.0), (0.14, 0.0), (0.12, 0.2), (0.095, 0.38), (0.115, 0.52), (0.115, 0.55), (0.0, 0.55))]
    puff = [(r * k, z) for r, z in ((0.0, 0.0), (0.06, 0.02), (0.085, 0.08), (0.06, 0.15), (0.0, 0.17))]
    ty = 0.62
    for number, tx in enumerate((-0.72, -0.24, 0.24, 0.72)):
        parts.append(lpm.lathe(f"tower_{number}", profile, segments=14, at=(tx, ty, 0.04), color=wall))
        for ring in range(3):
            level = height - 0.08 - 0.08 * ring
            radius = next(r0 + (r1 - r0) * (level - z0) / (z1 - z0) for (r0, z0), (r1, z1) in zip(profile, profile[1:]) if z0 <= level <= z1 and z1 > z0)
            parts.append(lpm.prism(f"tower_{number}_ring_{ring}", 14, radius + 0.008, 0.04, at=(tx, ty, 0.04 + level), color=mint))
        parts.append(lpm.prism(f"tower_{number}_rim", 14, 0.115 * k + 0.003, 0.012, at=(tx, ty, 0.04 + height), color=dark))
        parts.append(lpm.lathe(f"steam_{number}", puff, segments=8, at=(tx, ty, 0.04 + height + 0.02), color=white))
        parts.append(lpm.box(f"tower_{number}_link", (0.035, 0.2, 0.035), at=(tx, 0.32, 0.1), color=trim))
    parts.append(lpm.box("manifold", (1.5, 0.04, 0.04), at=(0, 0.32, 0.1), color=trim))
    parts.append(lpm.box("manifold_hall_link", (0.04, 0.12, 0.04), at=(0, 0.14, 0.1), color=trim))
    for number, wx in enumerate((-0.7, 0.7)):
        wy = -0.78
        parts.append(lpm.prism(f"wellhead_{number}", 10, 0.055, 0.17, at=(wx, wy, 0.04), color=trim))
        parts.append(lpm.prism(f"wellhead_{number}_flange", 10, 0.07, 0.025, at=(wx, wy, 0.15), color=mint))
        parts.append(lpm.prism(f"wellhead_{number}_cap", 10, 0.05, 0.02, at=(wx, wy, 0.21), color=dark))
        parts.append(lpm.box(f"wellhead_{number}_pipe", (0.035, abs(front - wy) + 0.02, 0.035), at=(wx * 0.9, (front + wy) / 2, 0.11), color=trim))
    ob = lpm.finish(spec["id"], parts, palette, budget=6000, center=False)
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


def build_metro_station(spec, out_dir):
    """A Metro station filling its 2x1 cell, as a street stair entrance: a low stone curb around an open stairwell, six steps going down to a dark floor with a yellow nosing each, black iron railings (posts, rails and balusters) along both sides and the back of the opening, the front left open, and a pole at each front corner carrying a round sign with a "METRO" bar and, on the left pole, an "ENTRANCE" plate."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    cfg = STYLES[style]
    index = PALETTE_NAMES.index
    mint, dark, slab, frame, white, navy, sun, wood = (index(n) for n in ("uroof", "udark", "uslab", "uframe", "white", "navy", "sun", "uwood"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    parts = []
    pad_h = 0.05
    pad_d, cy = 0.96, 0.0
    hole_w, hole_d, hole_cy = 1.0, 0.6, 0.06
    hx0, hx1 = -hole_w / 2, hole_w / 2
    hy0, hy1 = hole_cy - hole_d / 2, hole_cy + hole_d / 2
    py0, py1 = cy - pad_d / 2, cy + pad_d / 2
    curb_w = 0.07
    ring = [("left", hx0 - curb_w, hx0, hy0 - curb_w, hy1 + curb_w), ("right", hx1, hx1 + curb_w, hy0 - curb_w, hy1 + curb_w), ("front", hx0, hx1, hy0 - curb_w, hy0), ("back", hx0, hx1, hy1, hy1 + curb_w)]
    for name, x0, x1, y0, y1 in ring:
        parts.append(lpm.box(f"curb_{name}", (x1 - x0, y1 - y0, pad_h), at=((x0 + x1) / 2, (y0 + y1) / 2, 0.0), color=slab))
    parts.append(lpm.box("floor", (hole_w, hole_d, 0.006), at=(0, hole_cy, 0.0), color=dark))
    steps, run = 6, hole_d / 7
    for number in range(steps):
        top = pad_h - 0.006 - 0.0075 * number
        y = hy0 + number * run
        parts.append(lpm.box(f"step_{number}", (hole_w - 0.02, run, top), at=(0, y + run / 2, 0.0), color=slab))
        parts.append(lpm.box(f"nosing_{number}", (hole_w - 0.02, 0.014, 0.006), at=(0, y + 0.007, top), color=sun))
    rail_h, post = 0.17, 0.02
    top_z = pad_h
    def railing(name, x0, y0, x1, y1):
        length = math.hypot(x1 - x0, y1 - y0)
        along_x = abs(x1 - x0) >= abs(y1 - y0)
        count = max(2, round(length / 0.22) + 1)
        for number in range(count):
            t = number / (count - 1)
            px, py = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            parts.append(lpm.box(f"{name}_post_{number}", (post, post, rail_h + 0.02), at=(px, py, top_z), color=dark))
        mid_x, mid_y = (x0 + x1) / 2, (y0 + y1) / 2
        size = (length, 0.014, 0.014) if along_x else (0.014, length, 0.014)
        parts.append(lpm.box(f"{name}_rail_top", size, at=(mid_x, mid_y, top_z + rail_h), color=dark))
        parts.append(lpm.box(f"{name}_rail_bottom", size, at=(mid_x, mid_y, top_z + 0.03), color=dark))
        bars = max(1, round(length / 0.05))
        for number in range(bars):
            t = (number + 0.5) / bars
            bx, by = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            parts.append(lpm.box(f"{name}_bar_{number}", (0.006, 0.006, rail_h - 0.03), at=(bx, by, top_z + 0.03), color=dark))
    inset = 0.02
    railing("rail_left", hx0 - inset, hy0, hx0 - inset, hy1 + inset)
    railing("rail_right", hx1 + inset, hy0, hx1 + inset, hy1 + inset)
    railing("rail_back", hx0 - inset, hy1 + inset, hx1 + inset, hy1 + inset)
    board_x, board_y = hx0 - inset - 0.02, hy0 + 0.1
    parts.append(lpm.box("board", (0.014, 0.16, 0.2), at=(board_x, board_y, top_z + 0.02), color=wood))
    for number, side in enumerate((-1, 1)):
        pole_x, pole_y = side * (hole_w / 2 + 0.3), py0 + 0.04
        parts.append(lpm.prism(f"pole_{number}", 8, 0.014, 0.58 + pad_h, at=(pole_x, pole_y, 0.0), color=dark))
        radius = 0.115
        sign_z = top_z + 0.5
        parts.append(disc(f"roundel_{number}", pole_x, pole_y - 0.025, sign_z, radius, 0.012, mint))
        parts.append(disc(f"roundel_{number}_face", pole_x, pole_y - 0.033, sign_z, radius - 0.03, 0.006, white))
        parts.append(lpm.box(f"bar_{number}", (0.34, 0.012, 0.05), at=(pole_x, pole_y - 0.04, sign_z - 0.025), color=navy))
        parts.append(glyph_decal({"cfg": cfg}, f"bar_{number}_text", "front", "METRO", pole_x, sign_z - 0.025 + 0.0075, 0.035, white, -(pole_y - 0.04 - 0.006) + 0.003))
    plate_x, plate_y = -(hole_w / 2 + 0.3), py0 + 0.04
    parts.append(lpm.box("plate", (0.3, 0.012, 0.07), at=(plate_x, plate_y - 0.03, top_z + 0.3), color=dark))
    parts.append(glyph_decal({"cfg": cfg}, "plate_text", "front", "ENTRANCE", plate_x, top_z + 0.3 + 0.0175, 0.035, white, -(plate_y - 0.03 - 0.006) + 0.003))
    ob = lpm.finish(spec["id"], parts, palette, budget=4000, center=False)
    return export_model(ob, spec, out_dir)


def build_stair_entrance(spec, out_dir):
    """A Pedestrian access filling its 1x1 cell: a low stone curb around a small open stairwell, five steps going down to a dark floor with a yellow nosing each, black iron railings on both sides and the back, the front open, and a pole at the front right corner carrying a round sign with a "WALK" bar."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    cfg = STYLES[style]
    index = PALETTE_NAMES.index
    mint, dark, slab, white, navy, sun = (index(n) for n in ("uroof", "udark", "uslab", "white", "navy", "sun"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    parts = []
    curb_h, curb_w = 0.05, 0.06
    hole_w, hole_d, hole_cy = 0.5, 0.5, 0.08
    hx0, hx1 = -hole_w / 2, hole_w / 2
    hy0, hy1 = hole_cy - hole_d / 2, hole_cy + hole_d / 2
    ring = [("left", hx0 - curb_w, hx0, hy0 - curb_w, hy1 + curb_w), ("right", hx1, hx1 + curb_w, hy0 - curb_w, hy1 + curb_w), ("front", hx0, hx1, hy0 - curb_w, hy0), ("back", hx0, hx1, hy1, hy1 + curb_w)]
    for name, x0, x1, y0, y1 in ring:
        parts.append(lpm.box(f"curb_{name}", (x1 - x0, y1 - y0, curb_h), at=((x0 + x1) / 2, (y0 + y1) / 2, 0.0), color=slab))
    parts.append(lpm.box("floor", (hole_w, hole_d, 0.006), at=(0, hole_cy, 0.0), color=dark))
    steps, run = 5, hole_d / 6
    for number in range(steps):
        top = curb_h - 0.006 - 0.008 * number
        y = hy0 + number * run
        parts.append(lpm.box(f"step_{number}", (hole_w - 0.02, run, top), at=(0, y + run / 2, 0.0), color=slab))
        parts.append(lpm.box(f"nosing_{number}", (hole_w - 0.02, 0.012, 0.006), at=(0, y + 0.006, top), color=sun))
    rail_h, post = 0.15, 0.018
    def railing(name, x0, y0, x1, y1):
        length = math.hypot(x1 - x0, y1 - y0)
        along_x = abs(x1 - x0) >= abs(y1 - y0)
        count = max(2, round(length / 0.2) + 1)
        for number in range(count):
            t = number / (count - 1)
            parts.append(lpm.box(f"{name}_post_{number}", (post, post, rail_h + 0.02), at=(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, curb_h), color=dark))
        size = (length, 0.012, 0.012) if along_x else (0.012, length, 0.012)
        mid = ((x0 + x1) / 2, (y0 + y1) / 2)
        parts.append(lpm.box(f"{name}_rail_top", size, at=(mid[0], mid[1], curb_h + rail_h), color=dark))
        parts.append(lpm.box(f"{name}_rail_bottom", size, at=(mid[0], mid[1], curb_h + 0.03), color=dark))
        bars = max(1, round(length / 0.05))
        for number in range(bars):
            t = (number + 0.5) / bars
            parts.append(lpm.box(f"{name}_bar_{number}", (0.006, 0.006, rail_h - 0.03), at=(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, curb_h + 0.03), color=dark))
    inset = 0.02
    railing("rail_left", hx0 - inset, hy0, hx0 - inset, hy1 + inset)
    railing("rail_right", hx1 + inset, hy0, hx1 + inset, hy1 + inset)
    railing("rail_back", hx0 - inset, hy1 + inset, hx1 + inset, hy1 + inset)
    pole_x, pole_y, sign_z = 0.38, -0.42, 0.42
    parts.append(lpm.prism("pole", 8, 0.012, 0.46, at=(pole_x, pole_y, 0.0), color=dark))
    radius = 0.09
    parts.append(disc("roundel", pole_x, pole_y - 0.02, sign_z, radius, 0.01, mint))
    parts.append(disc("roundel_face", pole_x, pole_y - 0.027, sign_z, radius - 0.024, 0.005, white))
    parts.append(lpm.box("bar", (0.26, 0.01, 0.04), at=(pole_x, pole_y - 0.032, sign_z - 0.02), color=navy))
    parts.append(glyph_decal({"cfg": cfg}, "bar_text", "front", "WALK", pole_x, sign_z - 0.02 + 0.006, 0.028, white, -(pole_y - 0.032 - 0.005) + 0.002))
    ob = lpm.finish(spec["id"], parts, palette, budget=2500, center=False)
    return export_model(ob, spec, out_dir)


WALKWAY_PIECES = {"square": (), "end": ("E",), "straight": ("W", "E"), "bend": ("W", "S"), "intersection": ("W", "E", "S"), "crossroad": ("N", "E", "S", "W")}


def build_walkway_piece(spec, out_dir):
    """An Underground walkway tile filling its 1x1 cell edge to edge, seen from above with the ceiling cut away: a pale tiled floor with a mint runner towards each open side (`piece` names the sides, as the road pieces do: square, end, straight, bend, intersection, crossroad; the base exits are E, W-E, W-S, W-E-S and all four), a low wall with a mint cap on every closed side, a post at each corner next to a wall and a lamp on the middle of each wall. Game sides map to the model as E +X, W -X, N +Y, S -Y."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    mint, dark, slab, trim, white = (index(n) for n in ("uroof", "udark", "uslab", "utrim", "white"))
    floor_color = index("uwall")
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    exits = WALKWAY_PIECES[spec["piece"]]
    vectors = {"E": (1, 0), "W": (-1, 0), "N": (0, 1), "S": (0, -1)}
    half, wall_t, wall_h, floor_h = 0.5, 0.06, 0.16, 0.04
    parts = [lpm.box("floor", (1.0, 1.0, floor_h), at=(0, 0, 0.0), color=floor_color)]
    for number in (-1, 1):
        parts.append(lpm.box(f"floor_line_x_{number}", (1.0, 0.012, 0.006), at=(0, number * 0.25, floor_h), color=slab))
        parts.append(lpm.box(f"floor_line_y_{number}", (0.012, 1.0, 0.006), at=(number * 0.25, 0, floor_h), color=slab))
    runner = 0.2
    parts.append(lpm.box("runner_center", (runner, runner, 0.008), at=(0, 0, floor_h), color=mint))
    for side in exits:
        vx, vy = vectors[side]
        length = half - runner / 2
        parts.append(lpm.box(f"runner_{side}", (length if vx else runner, length if vy else runner, 0.008), at=(vx * (runner / 2 + length / 2), vy * (runner / 2 + length / 2), floor_h), color=mint))
    closed = [side for side in vectors if side not in exits]
    for side in closed:
        vx, vy = vectors[side]
        wx, wy = vx * (half - wall_t / 2), vy * (half - wall_t / 2)
        size = (wall_t, 1.0, wall_h) if vx else (1.0, wall_t, wall_h)
        parts.append(lpm.box(f"wall_{side}", size, at=(wx, wy, floor_h), color=trim))
        cap = (wall_t, 1.0, 0.014) if vx else (1.0, wall_t, 0.014)
        parts.append(lpm.box(f"wall_{side}_cap", cap, at=(wx, wy, floor_h + wall_h), color=mint))
        lamp = (0.016, 0.1, 0.02) if vx else (0.1, 0.016, 0.02)
        parts.append(lpm.box(f"lamp_{side}", lamp, at=(vx * (half - wall_t - 0.01), vy * (half - wall_t - 0.01), floor_h + wall_h * 0.55), color=white))
    for sx in (-1, 1):
        for sy in (-1, 1):
            beside = [side for side in closed if (vectors[side][0] == sx) or (vectors[side][1] == sy)]
            if not beside:
                continue
            parts.append(lpm.box(f"post_{sx}_{sy}", (0.08, 0.08, wall_h + 0.03), at=(sx * (half - 0.04), sy * (half - 0.04), floor_h), color=dark))
    ob = lpm.finish(spec["id"], parts, palette, budget=900, center=False)
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


def extrude_y(name, outline, y0, y1, color):
    """Extrude a closed (x, z) outline along Y from y0 to y1."""
    count = len(outline)
    verts = [(x, y0, z) for x, z in outline] + [(x, y1, z) for x, z in outline]
    faces = [(i, (i + 1) % count, count + (i + 1) % count, count + i) for i in range(count)]
    faces.append(tuple(reversed(range(count))))
    faces.append(tuple(range(count, 2 * count)))
    return lpm._object(name, _bm(verts, faces), color)


def build_barn(spec, out_dir):
    """A farm barn filling its 2x2 cell: red walls with white corner posts and battens under a khaki gambrel roof whose gable faces the front, a big sliding door with a white cross brace and a hayloft door above it, three plain windows per side, a ridge cupola and two hay bales by the door, no slab."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    red, dark_red, dark, glass, white, hay = (index(n) for n in ("vtone1", "vtone2", "udark", "glass_blue", "white", "usand"))
    roof = index("vtone3")
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    width, depth, wall_height = 1.9, 1.78, 0.42
    half = width / 2
    cy = 0.06
    front, back = cy - depth / 2, cy + depth / 2
    knee, ridge = 0.75, 0.62
    parts = [rounded_block("body", width, depth, wall_height, red, 0.03 / depth, at=(0, cy, 0))]
    gable = [(-half, wall_height), (-knee, wall_height + ridge * 0.55 - 0.02), (0, wall_height + ridge - 0.04), (knee, wall_height + ridge * 0.55 - 0.02), (half, wall_height)]
    parts.append(extrude_y("gable", gable, front + 0.01, back - 0.01, red))
    slope = [(-half - 0.02, wall_height), (-knee, wall_height + ridge * 0.6), (0, wall_height + ridge), (knee, wall_height + ridge * 0.6), (half + 0.02, wall_height)]
    shell = slope + list(reversed(offset_path(slope, -0.035)))
    parts.append(extrude_y("roof", shell, front - 0.04, back + 0.04, roof))
    parts.append(extrude_y("roof_edge", [(x, z - 0.012) for x, z in slope] + [(x, z - 0.03) for x, z in reversed(slope)], front - 0.045, front - 0.03, dark))

    def gable_height(x):
        for (x0, z0), (x1, z1) in zip(gable, gable[1:]):
            if x0 <= x <= x1:
                return z0 + (z1 - z0) * (x - x0) / (x1 - x0)
        return wall_height

    post = 0.035
    for face_y, direction in ((front, -1), (back, 1)):
        for x in (-half + post / 2, -0.62, 0.62, half - post / 2):
            parts.append(lpm.box(f"post_{direction}_{x:.2f}", (post, 0.012, gable_height(x) - 0.01), at=(x, face_y + direction * 0.004, 0.0), color=white))
    for side in (-1, 1):
        for y in (front + post / 2, cy - 0.275, cy + 0.275, cy + 0.825, back - post / 2):
            parts.append(lpm.box(f"batten_{side}_{y:.2f}", (0.012, post, wall_height - 0.01), at=(side * (half + 0.004), y, 0.0), color=white))

    door_w, door_h = 0.8, 0.38
    parts.append(lpm.box("door", (door_w, 0.014, door_h), at=(0, front - 0.004, 0.0), color=dark_red))
    door_frame(parts, "door", 0, front, 0.0, door_w, door_h, white, 0.02)
    def cross_brace(name, cx, bottom, width, height, thickness):
        """Two white planks crossing corner to corner on a panel of `width` x `height` centred on `cx`."""
        length = math.hypot(width, height) - 0.03
        angle = math.degrees(math.atan2(width, height))
        for sign in (-1, 1):
            plank = lpm.box(f"{name}_{sign}", (thickness, 0.01, length), at=(0, 0, -length / 2), color=white)
            lpm.rotate(plank, sign * angle, "Y")
            lpm.move(plank, cx, front - 0.012, bottom + height / 2)
            parts.append(plank)

    for half_x in (-1, 1):
        cross_brace(f"brace_{half_x}", half_x * door_w / 4, 0.0, door_w / 2 - 0.02, door_h - 0.01, 0.022)
    parts.append(lpm.box("door_split", (0.014, 0.01, door_h), at=(0, front - 0.012, 0.0), color=white))

    loft_w, loft_h, loft_z = 0.26, 0.2, wall_height + 0.06
    parts.append(lpm.box("loft_door", (loft_w, 0.014, loft_h), at=(0, front - 0.004, loft_z), color=dark_red))
    door_frame(parts, "loft", 0, front, loft_z, loft_w, loft_h, white, 0.016)
    cross_brace("loft_brace", 0, loft_z, loft_w - 0.01, loft_h - 0.01, 0.016)
    parts.append(lpm.box("hoist", (0.03, 0.1, 0.03), at=(0, front - 0.05, wall_height + ridge - 0.08), color=dark))

    for side in (-1, 1):
        wall_x = side * half
        for number, y in enumerate((cy - 0.55, cy, cy + 0.55)):
            parts.append(lpm.box(f"window_{side}_{number}", (0.016, 0.19, 0.19), at=(wall_x + side * 0.003, y, 0.13), color=glass))

    cupola_z = wall_height + ridge - 0.02
    parts.append(lpm.box("cupola", (0.2, 0.2, 0.12), at=(0, cy, cupola_z), color=red))
    parts.append(extrude_x("cupola_roof", [(cy - 0.125, cupola_z + 0.12), (cy, cupola_z + 0.2), (cy + 0.125, cupola_z + 0.12)], -0.125, 0.125, roof))
    parts.append(lpm.box("cupola_vent", (0.12, 0.01, 0.06), at=(0, cy - 0.101, cupola_z + 0.03), color=dark))

    for number, (x, y, lift) in enumerate(((-0.72, front - 0.095, 0.0), (-0.5, front - 0.095, 0.0), (-0.61, front - 0.095, 0.12))):
        parts.append(lpm.box(f"bale_{number}", (0.2, 0.16, 0.12), at=(x, y, lift), color=hay))
        parts.append(lpm.box(f"bale_{number}_strap", (0.204, 0.02, 0.122), at=(x, y, lift), color=dark))
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


def build_livestock(spec, out_dir):
    """A livestock farm filling its 2x2 cell: a low red stable with white corner posts and a khaki two-pitch roof at the back (sliding door, two windows, hay bales), and in front a row of up to five fenced pens, one more per Tier, filled from the left left empty: the game puts an animal in a pen for each production running or waiting to be collected (animal models in `assets/managed-models/animals`), no slab."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    red, dark_red, roof, dark, glass, white, hay, trim = (index(n) for n in ("vtone1", "vtone2", "vtone3", "udark", "glass_blue", "white", "usand", "uframe"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    width, depth, wall_height = 1.92, 0.6, 0.28
    half = width / 2
    front = 0.35
    back = front + depth
    cy = (front + back) / 2
    ridge = 0.17
    parts = [rounded_block("body", width, depth, wall_height, red, 0.03 / depth, at=(0, cy, 0))]
    gable = [(front + 0.01, wall_height), (cy, wall_height + ridge - 0.03), (back - 0.01, wall_height)]
    parts.append(extrude_x("gable", gable, -half + 0.005, half - 0.005, red))
    slope = [(front - 0.05, wall_height), (cy, wall_height + ridge), (back + 0.05, wall_height)]
    shell = slope + list(reversed(offset_path(slope, -0.035)))
    parts.append(extrude_x("roof", shell, -half - 0.02, half + 0.02, roof))
    parts.append(extrude_x("roof_edge", [(y, z - 0.012) for y, z in slope] + [(y, z - 0.03) for y, z in reversed(slope)], -half - 0.025, -half - 0.015, dark))
    parts.append(extrude_x("roof_edge_right", [(y, z - 0.012) for y, z in slope] + [(y, z - 0.03) for y, z in reversed(slope)], half + 0.015, half + 0.025, dark))

    post = 0.035
    for x in (-half + post / 2, half - post / 2, -0.4, 0.4):
        parts.append(lpm.box(f"post_{x:.2f}", (post, 0.012, wall_height - 0.01), at=(x, front - 0.004, 0.0), color=white))

    door_w, door_h = 0.46, 0.22
    parts.append(lpm.box("door", (door_w, 0.014, door_h), at=(0, front - 0.004, 0.0), color=dark_red))
    door_frame(parts, "door", 0, front, 0.0, door_w, door_h, white, 0.02)
    brace = math.hypot(door_w / 2, door_h) - 0.03
    angle = math.degrees(math.atan2(door_w / 2, door_h))
    for half_x in (-1, 1):
        for sign in (-1, 1):
            plank = lpm.box(f"brace_{half_x}_{sign}", (0.018, 0.01, brace), at=(0, 0, -brace / 2), color=white)
            lpm.rotate(plank, sign * angle, "Y")
            lpm.move(plank, half_x * door_w / 4, front - 0.012, door_h / 2)
            parts.append(plank)
    parts.append(lpm.box("door_split", (0.014, 0.01, door_h), at=(0, front - 0.012, 0.0), color=white))
    for x in (-0.68, 0.68):
        parts.append(lpm.box(f"window_{x}", (0.18, 0.012, 0.12), at=(x, front - 0.003, 0.1), color=glass))
        window_frame(parts, f"window_{x}", x, front, 0.1, 0.18, 0.12, white, 0.012)
    for side in (-1, 1):
        parts.append(lpm.box(f"side_window_{side}", (0.012, 0.18, 0.12), at=(side * (half + 0.003), cy, 0.1), color=glass))

    parts.append(lpm.box("vent", (0.3, 0.1, 0.05), at=(0.4, cy, wall_height + ridge - 0.01), color=red))
    parts.append(extrude_x("vent_roof", [(cy - 0.065, wall_height + ridge + 0.04), (cy, wall_height + ridge + 0.09), (cy + 0.065, wall_height + ridge + 0.04)], 0.24, 0.56, roof))

    for number, (x, lift) in enumerate(((0.45, 0.0), (0.45, 0.12))):
        parts.append(lpm.box(f"bale_{number}", (0.2, 0.16, 0.12), at=(x, front - 0.09, lift), color=hay))
        parts.append(lpm.box(f"bale_{number}_strap", (0.204, 0.02, 0.122), at=(x, front - 0.09, lift), color=dark))

    pen_w, pen_d = 0.6, 0.52
    slots = ((-0.64, -0.7), (0.0, -0.7), (0.64, -0.7), (-0.64, -0.1), (0.64, -0.1))
    tier = min(5, spec["count"])
    for number, (cx, pen_cy) in enumerate(slots[:tier]):
        pen_front, pen_back = pen_cy - pen_d / 2, pen_cy + pen_d / 2
        parts.append(lpm.box(f"pen_{number}_floor", (pen_w, pen_d, 0.01), at=(cx, pen_cy, 0.0), color=hay))
        for px in (cx - pen_w / 2 + 0.01, cx + pen_w / 2 - 0.01):
            for py in (pen_front + 0.01, pen_back - 0.01):
                parts.append(lpm.box(f"pen_{number}_post_{px:.2f}_{py:.2f}", (0.02, 0.02, 0.12), at=(px, py, 0.0), color=trim))
        for z in (0.04, 0.09):
            parts.append(lpm.box(f"pen_{number}_front_rail_{z}", (pen_w - 0.02, 0.012, 0.014), at=(cx, pen_front + 0.01, z), color=trim))
            parts.append(lpm.box(f"pen_{number}_back_rail_{z}", (pen_w - 0.02, 0.012, 0.014), at=(cx, pen_back - 0.01, z), color=trim))
            for px in (cx - pen_w / 2 + 0.01, cx + pen_w / 2 - 0.01):
                parts.append(lpm.box(f"pen_{number}_side_rail_{px:.2f}_{z}", (0.012, pen_d - 0.02, 0.014), at=(px, pen_cy, z), color=trim))
        parts.append(lpm.box(f"pen_{number}_trough", (0.2, 0.05, 0.04), at=(cx, pen_back - 0.08, 0.01), color=dark_red))
    ob = lpm.finish(spec["id"], parts, palette, budget=9000, center=False)
    return export_model(ob, spec, out_dir)


HIVE_LAYOUTS = {
    1: ((0.0, 0.05),),
    2: ((-0.22, 0.05), (0.22, 0.05)),
    3: ((-0.24, 0.18), (0.24, 0.18), (0.0, -0.14)),
    4: ((-0.24, 0.2), (0.24, 0.2), (-0.24, -0.12), (0.24, -0.12)),
    5: ((-0.27, 0.22), (0.27, 0.22), (0.0, 0.02), (-0.27, -0.16), (0.27, -0.16)),
}
HIVE_SCALES = {1: 1.55, 2: 1.35, 3: 1.2, 4: 1.05, 5: 0.95}


def build_hive(spec, out_dir):
    """An apiary on its 1x1 cell: `count` straw skeps (one more per Tier) made of five stepped rings with a dark arched entrance and a few bees at each door, standing on the ground among scattered flowers (seeded, kept clear of the skeps), no slab."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    wood, straw, ring, dark, sun, leaf = (index(n) for n in ("uwood", "usand", "sun", "udark", "sun", "lime"))
    petals = [index(n) for n in ("coral", "pink", "sky", "white", "violet", "tangerine")]
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    tier = min(5, spec["count"])
    k = HIVE_SCALES[tier]
    parts = []
    radii = (0.15, 0.15, 0.125, 0.095, 0.06, 0.025)
    ring_height = 0.04
    for number, (x, y) in enumerate(HIVE_LAYOUTS[tier]):
        for step in range(5):
            parts.append(lpm.prism(f"skep_{number}_ring_{step}", 12, radii[step] * k, ring_height * k, at=(x, y, step * ring_height * k), color=straw if step % 2 == 0 else ring, radius_top=radii[step + 1] * k))
        parts.append(lpm.prism(f"skep_{number}_knob", 8, 0.03 * k, 0.03 * k, at=(x, y, 5 * ring_height * k), color=wood))
        front = y - radii[0] * k
        parts.append(lpm.box(f"skep_{number}_door", (0.06 * k, 0.03 * k, 0.05 * k), at=(x, front - 0.005, 0.0), color=dark))
        parts.append(lpm.box(f"skep_{number}_door_top", (0.04 * k, 0.03 * k, 0.02 * k), at=(x, front - 0.005, 0.05 * k), color=dark))
        for bee, (dx, dz) in enumerate(((-0.06, 0.08), (0.07, 0.05))):
            parts.append(lpm.box(f"skep_{number}_bee_{bee}", (0.028, 0.034, 0.026), at=(x + dx * k, front - 0.05 * k, dz * k), color=sun))
            parts.append(lpm.box(f"skep_{number}_bee_{bee}_stripe", (0.03, 0.012, 0.028), at=(x + dx * k, front - 0.05 * k, dz * k), color=dark))
    rng = random.Random(f"hive-flowers-{tier}")
    corners = [(-0.47, -0.47), (0.47, -0.47), (-0.47, 0.47), (0.47, 0.47)]
    spots = list(corners)
    for _ in range(400):
        if len(spots) >= 22:
            break
        x, y = rng.uniform(-0.47, 0.47), rng.uniform(-0.47, 0.47)
        if any(math.hypot(x - sx, y - sy) < radii[0] * k + 0.05 for sx, sy in HIVE_LAYOUTS[tier]):
            continue
        if any(math.hypot(x - ox, y - oy) < 0.1 for ox, oy in spots):
            continue
        spots.append((x, y))
    for number, (x, y) in enumerate(spots):
        height = rng.uniform(0.05, 0.1)
        size = rng.uniform(0.035, 0.05)
        parts.append(lpm.box(f"stem_{number}", (0.012, 0.012, height), at=(x, y, 0.0), color=leaf))
        parts.append(lpm.box(f"flower_{number}", (size, size, 0.03), at=(x, y, height), color=rng.choice(petals)))
        parts.append(lpm.box(f"flower_{number}_heart", (0.016, 0.016, 0.034), at=(x, y, height + 0.005), color=sun))
    ob = lpm.finish(spec["id"], parts, palette, budget=9000, center=False)
    return export_model(ob, spec, out_dir)


DAIRY_TANK_YS = (-0.66, -0.3, 0.06, 0.42, 0.78)


def build_dairy(spec, out_dir):
    """A dairy on a 2x2 cell: a low cream hall with a butter-yellow band spotted like a cow, a shop window under a striped awning and a "DAIRY" plate on the front, a roller door on the back, vents on the back half of the roof (the front half stays free for the Solar panel), milk cans in front of the door, and along the right wall `count` steel tanks with a domed top and an accent ring (one more per Tier, from the front), no slab."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    cfg = STYLES[style]
    index = PALETTE_NAMES.index
    accent, accent_dark, wall, slab, dark, frame, glass, white = (index(n) for n in ("vtone1", "vtone2", "vtone3", "uslab", "udark", "uframe", "glass_blue", "white"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    hall_x0, hall_x1, hall_y0, hall_y1, hall_h = -0.95, 0.56, -0.6, 0.95, 0.34
    width, depth = hall_x1 - hall_x0, hall_y1 - hall_y0
    cx, cy = (hall_x0 + hall_x1) / 2, (hall_y0 + hall_y1) / 2
    front = hall_y0
    parts = [rounded_block("hall", width, depth, hall_h, wall, 0.03 / depth, at=(cx, cy, 0))]
    parts.append(rounded_block("band", width + 0.012, depth + 0.012, 0.07, accent, 0.03 / depth, at=(cx, cy, hall_h - 0.1)))
    parts.append(lpm.box("roof_slab", (width + 0.04, depth + 0.04, 0.03), at=(cx, cy, hall_h), color=slab))
    for number, x in enumerate((-0.82, -0.52, 0.14, 0.44)):
        parts.append(lpm.box(f"spot_{number}", (0.09 + 0.03 * (number % 2), 0.008, 0.045), at=(x, front - 0.006, hall_h - 0.085 + 0.01 * (number % 3)), color=dark))
    door_x = -0.7
    parts.append(lpm.box("door", (0.2, 0.014, 0.21), at=(door_x, front - 0.004, 0.0), color=dark))
    door_frame(parts, "door", door_x, front, 0.0, 0.2, 0.21, frame, 0.012)
    window_x, window_w = 0.02, 0.62
    parts.append(lpm.box("shop_window", (window_w, 0.012, 0.14), at=(window_x, front - 0.003, 0.08), color=glass))
    window_frame(parts, "shop_window", window_x, front, 0.08, window_w, 0.14, frame, 0.012)
    parts.append(lpm.box("counter", (window_w + 0.04, 0.06, 0.07), at=(window_x, front - 0.04, 0.0), color=accent))
    stripes = 6
    awning_w = window_w + 0.1
    for number in range(stripes):
        stripe_x = window_x - awning_w / 2 + (number + 0.5) * awning_w / stripes
        awning = lpm.box(f"awning_{number}", (awning_w / stripes, 0.14, 0.018), at=(0, 0, 0), color=accent if number % 2 == 0 else white)
        lpm.rotate(awning, -18, "X")
        lpm.move(awning, stripe_x, front - 0.07, 0.235)
        parts.append(awning)
    plate_x = door_x + 0.02
    parts.append(lpm.box("plate", (0.3, 0.014, 0.06), at=(plate_x, front - 0.004, 0.255), color=accent_dark))
    parts.append(glyph_decal({"cfg": cfg}, "sign_text", "front", "DAIRY", plate_x, 0.255 + 0.012, 0.036, white, -front + 0.012))
    back = hall_y1
    parts.append(lpm.box("roller_door", (0.5, 0.014, 0.25), at=(-0.35, back + 0.004, 0.0), color=dark))
    door_frame(parts, "roller_door_back", -0.35, back, 0.0, 0.5, 0.25, frame, 0.014)
    for rib in range(5):
        parts.append(lpm.box(f"roller_rib_{rib}", (0.48, 0.006, 0.01), at=(-0.35, back + 0.012, 0.03 + rib * 0.045), color=frame))
    for side_y in (-0.2, 0.45):
        parts.append(lpm.box(f"window_left_{side_y}", (0.012, 0.22, 0.12), at=(hall_x0 - 0.003, side_y, 0.1), color=glass))
    for number, x in enumerate((-0.6, -0.15, 0.3)):
        parts.append(lpm.prism(f"vent_{number}", 8, 0.05, 0.05, at=(x, 0.7, hall_h + 0.03), color=frame))
        parts.append(lpm.prism(f"vent_cap_{number}", 8, 0.07, 0.015, at=(x, 0.7, hall_h + 0.08), color=slab))
    for number, (x, y) in enumerate(((-0.3, -0.95), (-0.2, -0.92), (-0.38, -0.9))):
        parts.append(lpm.prism(f"can_{number}", 8, 0.045, 0.1, at=(x, y, 0.0), color=white, radius_top=0.036))
        parts.append(lpm.prism(f"can_{number}_band", 8, 0.044, 0.025, at=(x, y, 0.035), color=accent))
        parts.append(lpm.prism(f"can_{number}_lid", 8, 0.04, 0.02, at=(x, y, 0.1), color=dark))
    tier = min(5, spec["count"])
    tank_x, radius, tank_h = 0.84, 0.15, 0.5
    for number, y in enumerate(DAIRY_TANK_YS[:tier]):
        parts.append(lpm.prism(f"tank_{number}_foot", 12, radius + 0.015, 0.04, at=(tank_x, y, 0.0), color=slab))
        parts.append(lpm.prism(f"tank_{number}", 12, radius, tank_h, at=(tank_x, y, 0.04), color=white))
        parts.append(lpm.prism(f"tank_{number}_ring", 12, radius + 0.008, 0.045, at=(tank_x, y, 0.04 + tank_h * 0.55), color=accent))
        dome = [(radius * math.cos(math.radians(a)), radius * 0.7 * math.sin(math.radians(a))) for a in (0, 20, 40, 60, 80, 90)]
        parts.append(lpm.lathe(f"tank_{number}_dome", dome, segments=12, at=(tank_x, y, 0.04 + tank_h), color=slab))
        parts.append(lpm.prism(f"tank_{number}_hatch", 8, 0.03, 0.03, at=(tank_x, y, 0.04 + tank_h + radius * 0.7 - 0.01), color=dark))
        parts.append(lpm.box(f"tank_{number}_pipe", (tank_x - hall_x1 - radius + 0.02, 0.035, 0.035), at=((hall_x1 + tank_x - radius) / 2 + 0.01, y, 0.12), color=frame))
        parts.append(lpm.box(f"tank_{number}_ladder", (0.03, 0.012, tank_h - 0.05), at=(tank_x - 0.06, y - radius - 0.003, 0.06), color=frame))
    ob = lpm.finish(spec["id"], parts, palette, budget=9000, center=False)
    return export_model(ob, spec, out_dir)


TEXTILE_SPOOL_XS = (-0.8, -0.52, -0.24, 0.04, 0.32)
TEXTILE_SPOOL_COLORS = ("violet", "pink", "sky", "sun", "tangerine")


def build_textile_mill(spec, out_dir):
    """A textile mill on a 2x2 cell: a brick hall with a cream band, a two-pitch dark roof, a tall chimney, a door, windows and a "TEXTILE" plate; in the yard `count` giant thread spools (one more per Tier, left to right) and two wool bales, no slab."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    cfg = STYLES[style]
    index = PALETTE_NAMES.index
    brick, brick_dark, cream, dark, glass, frame, slab, wood, white, water = (index(n) for n in ("vtone1", "vtone2", "vtone3", "udark", "glass_blue", "uframe", "uslab", "uwood", "white", "aqua"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    x0, x1, y0, y1, wall_h = -0.95, 0.95, 0.05, 0.95, 0.32
    width, depth = x1 - x0, y1 - y0
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    ridge = 0.2
    parts = [rounded_block("hall", width, depth, wall_h, brick, 0.03 / depth, at=(cx, cy, 0))]
    parts.append(rounded_block("band", width + 0.012, depth + 0.012, 0.045, cream, 0.03 / depth, at=(cx, cy, wall_h - 0.075)))
    gable = [(y0 + 0.01, wall_h), (cy, wall_h + ridge - 0.03), (y1 - 0.01, wall_h)]
    parts.append(extrude_x("gable", gable, x0 + 0.005, x1 - 0.005, brick))
    slope = [(y0 - 0.05, wall_h), (cy, wall_h + ridge), (y1 + 0.05, wall_h)]
    shell = slope + list(reversed(offset_path(slope, -0.035)))
    parts.append(extrude_x("roof", shell, x0 - 0.03, x1 + 0.03, brick_dark))
    front = y0
    door_x = -0.7
    parts.append(lpm.box("door", (0.2, 0.014, 0.21), at=(door_x, front - 0.004, 0.0), color=dark))
    door_frame(parts, "door", door_x, front, 0.0, 0.2, 0.21, cream, 0.014)
    for number, x in enumerate((-0.35, 0.0, 0.35, 0.7)):
        parts.append(lpm.box(f"window_{number}", (0.2, 0.012, 0.13), at=(x, front - 0.003, 0.09), color=glass))
        window_frame(parts, f"window_{number}", x, front, 0.09, 0.2, 0.13, cream, 0.012)
    plate_x = door_x
    parts.append(lpm.box("plate", (0.4, 0.014, 0.06), at=(plate_x, front - 0.004, 0.235), color=cream))
    parts.append(glyph_decal({"cfg": cfg}, "sign_text", "front", "TEXTILE", plate_x, 0.235 + 0.012, 0.036, dark, -front + 0.012))
    parts.append(lpm.box("back_door", (0.3, 0.014, 0.22), at=(-0.4, y1 + 0.004, 0.0), color=dark))
    door_frame(parts, "back_door", -0.4, y1, 0.0, 0.3, 0.22, cream, 0.014)
    for side in (-1, 1):
        parts.append(lpm.box(f"side_window_{side}", (0.012, 0.22, 0.12), at=(side * (x1 + 0.003), cy, 0.1), color=glass))
    parts.append(lpm.prism("chimney", 8, 0.06, 0.58, at=(-0.78, 0.8, 0.0), color=brick_dark, radius_top=0.045))
    parts.append(lpm.prism("chimney_cap", 8, 0.06, 0.03, at=(-0.78, 0.8, 0.58), color=dark))
    parts.append(lpm.prism("chimney_band", 8, 0.052, 0.025, at=(-0.78, 0.8, 0.5), color=cream))

    tier = min(5, spec["count"])
    spool_y = -0.84
    for number in range(tier):
        x = TEXTILE_SPOOL_XS[number]
        thread = index(TEXTILE_SPOOL_COLORS[number])
        parts.append(lpm.prism(f"spool_{number}_foot", 12, 0.14, 0.03, at=(x, spool_y, 0.0), color=white))
        parts.append(lpm.prism(f"spool_{number}_thread", 12, 0.1, 0.2, at=(x, spool_y, 0.03), color=thread))
        parts.append(lpm.prism(f"spool_{number}_top", 12, 0.14, 0.03, at=(x, spool_y, 0.23), color=white))
        parts.append(lpm.prism(f"spool_{number}_core", 8, 0.03, 0.05, at=(x, spool_y, 0.26), color=slab))
        parts.append(lpm.box(f"spool_{number}_end", (0.04, 0.06, 0.015), at=(x + 0.1, spool_y - 0.07, 0.2), color=thread))
    for number, (x, y, lift) in enumerate(((0.62, -0.4, 0.0), (0.86, -0.4, 0.0), (0.74, -0.4, 0.12))):
        parts.append(lpm.box(f"bale_{number}", (0.22, 0.18, 0.12), at=(x, y, lift), color=white))
        parts.append(lpm.box(f"bale_{number}_strap", (0.224, 0.02, 0.122), at=(x, y, lift), color=slab))
    ob = lpm.finish(spec["id"], parts, palette, budget=9000, center=False)
    return export_model(ob, spec, out_dir)


KNIT_BALL_XS = (-0.8, -0.58, -0.36, -0.14, 0.08)
KNIT_BALL_COLORS = ("pink", "sky", "sun", "violet", "tangerine")


def yarn_ball(parts, name, x, y, z, radius, color, needle_color, wrap_color):
    """A ball of yarn centred at (x, y, z): a faceted sphere, two bands of a second color and two knitting needles stuck in it."""
    profile = [(radius * math.cos(math.radians(a)), radius * math.sin(math.radians(a))) for a in (-90, -60, -30, 0, 30, 60, 90)]
    parts.append(lpm.lathe(f"{name}_ball", profile, segments=8, at=(x, y, z), color=color))
    for number, dz in enumerate((-0.35, 0.35)):
        ring = radius * math.cos(math.asin(dz))
        parts.append(lpm.prism(f"{name}_wrap_{number}", 8, ring * 1.03, radius * 0.18, at=(x, y, z + dz * radius - radius * 0.09), color=wrap_color))
    for number, tilt in enumerate((32, -32)):
        needle = lpm.prism(f"{name}_needle_{number}", 4, radius * 0.07, radius * 2.6, at=(0, 0, -radius * 1.0), color=needle_color)
        lpm.rotate(needle, tilt, "Y")
        lpm.move(needle, x, y, z)
        parts.append(needle)


def build_knitwear(spec, out_dir):
    """A knitwear factory on a 2x2 cell: a cream shop block on the left (pink band with a "KNITWEAR" plate, door, big shop window under a striped awning, three mannequins in jumpers in front) and a lower workshop wing on the right with a glazed sawtooth roof; on the back half of the shop roof `count` giant balls of yarn with knitting needles (one more per Tier, left to right, the front half stays free for the Solar panel), and two yarn carts at the front, no slab."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    cfg = STYLES[style]
    index = PALETTE_NAMES.index
    accent, accent_dark, wall, slab, dark, frame, glass, white, wood = (index(n) for n in ("vtone1", "vtone2", "vtone3", "uslab", "udark", "uframe", "glass_blue", "white", "uwood"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    y0, y1 = -0.2, 0.97
    depth = y1 - y0
    cy = (y0 + y1) / 2
    shop_x0, shop_x1, shop_h = -0.96, 0.15, 0.34
    shop_w = shop_x1 - shop_x0
    shop_cx = (shop_x0 + shop_x1) / 2
    wing_x0, wing_x1, wing_h = 0.15, 0.98, 0.26
    wing_w = wing_x1 - wing_x0
    wing_cx = (wing_x0 + wing_x1) / 2
    front = y0
    parts = [rounded_block("shop", shop_w, depth, shop_h, wall, 0.03 / depth, at=(shop_cx, cy, 0))]
    parts.append(lpm.box("shop_roof", (shop_w + 0.04, depth + 0.04, 0.03), at=(shop_cx, cy, shop_h), color=slab))
    parts.append(lpm.box("band", (shop_w + 0.012, 0.012, 0.075), at=(shop_cx, front - 0.004, shop_h - 0.085), color=accent))
    parts.append(glyph_decal({"cfg": cfg}, "sign_text", "front", "KNITWEAR", shop_cx, shop_h - 0.075, 0.04, white, -front + 0.012))
    parts.append(rounded_block("wing", wing_w, depth, wing_h, wall, 0.03 / depth, at=(wing_cx, cy, 0)))
    teeth = (y0, y0 + 0.38, y0 + 0.76)
    outline = [(y0, wing_h - 0.01)]
    for start in teeth:
        outline += [(start, wing_h + 0.13), (start + 0.38, wing_h + 0.01)]
        if start != teeth[-1]:
            outline.append((start + 0.38, wing_h + 0.13))
    outline += [(y1, wing_h + 0.01), (y1, wing_h - 0.01)]
    parts.append(extrude_x("sawtooth", [(y, z) for y, z in outline], wing_x0, wing_x1, slab))
    for number, start in enumerate(teeth):
        parts.append(lpm.box(f"saw_glass_{number}", (wing_w - 0.1, 0.01, 0.09), at=(wing_cx, start - 0.004, wing_h + 0.03), color=glass))
    for number, x in enumerate((0.35, 0.58, 0.8)):
        parts.append(lpm.box(f"wing_window_{number}", (0.16, 0.012, 0.11), at=(x, front - 0.003, 0.09), color=glass))
        window_frame(parts, f"wing_window_{number}", x, front, 0.09, 0.16, 0.11, white, 0.01)
    door_x = -0.78
    parts.append(lpm.box("door", (0.18, 0.014, 0.2), at=(door_x, front - 0.004, 0.0), color=dark))
    door_frame(parts, "door", door_x, front, 0.0, 0.18, 0.2, white, 0.012)
    window_x, window_w = -0.3, 0.5
    parts.append(lpm.box("shop_window", (window_w, 0.012, 0.15), at=(window_x, front - 0.003, 0.05), color=glass))
    window_frame(parts, "shop_window", window_x, front, 0.05, window_w, 0.15, white, 0.012)
    stripes = 6
    awning_w = window_w + 0.08
    for number in range(stripes):
        stripe_x = window_x - awning_w / 2 + (number + 0.5) * awning_w / stripes
        awning = lpm.box(f"awning_{number}", (awning_w / stripes, 0.14, 0.018), at=(0, 0, 0), color=accent if number % 2 == 0 else white)
        lpm.rotate(awning, -18, "X")
        lpm.move(awning, stripe_x, front - 0.07, 0.205)
        parts.append(awning)
    for number, (x, jumper, sleeve) in enumerate(((-0.55, "pink", "white"), (-0.02, "sky", "white"), (0.45, "violet", "white"))):
        y = -0.52
        parts.append(lpm.prism(f"mannequin_{number}_base", 10, 0.07, 0.015, at=(x, y, 0.0), color=dark))
        parts.append(lpm.prism(f"mannequin_{number}_pole", 6, 0.01, 0.1, at=(x, y, 0.015), color=frame))
        parts.append(lpm.box(f"mannequin_{number}_torso", (0.11, 0.06, 0.13), at=(x, y, 0.115), color=index(jumper)))
        parts.append(lpm.box(f"mannequin_{number}_hem", (0.115, 0.065, 0.025), at=(x, y, 0.115), color=index(sleeve)))
        for side in (-1, 1):
            parts.append(lpm.box(f"mannequin_{number}_arm_{side}", (0.03, 0.04, 0.1), at=(x + side * 0.07, y, 0.14), color=index(jumper)))
        parts.append(lpm.prism(f"mannequin_{number}_neck", 6, 0.015, 0.025, at=(x, y, 0.245), color=white))
        parts.append(lpm.prism(f"mannequin_{number}_head", 8, 0.035, 0.06, at=(x, y, 0.265), color=white, radius_top=0.025))
    tier = min(5, spec["count"])
    for number in range(tier):
        yarn_ball(parts, f"yarn_{number}", KNIT_BALL_XS[number], 0.62, shop_h + 0.015 + 0.1, 0.1, index(KNIT_BALL_COLORS[number]), wood, white)
    cart_y = -0.875
    for cart, (cart_x, ball_colors) in enumerate(((0.55, ("pink", "sun", "sky")), (-0.4, ("violet", "tangerine", "white")))):
        parts.append(lpm.box(f"cart_{cart}_tray", (0.34, 0.2, 0.07), at=(cart_x, cart_y, 0.07), color=wood))
        parts.append(lpm.box(f"cart_{cart}_tray_inner", (0.3, 0.16, 0.02), at=(cart_x, cart_y, 0.125), color=dark))
        for side in (-1, 1):
            wheel = lpm.prism(f"cart_{cart}_wheel_{side}", 10, 0.06, 0.02, at=(0, 0, 0), color=dark)
            lpm.rotate(wheel, 90, "Y")
            lpm.move(wheel, cart_x + side * 0.18, cart_y, 0.06)
            parts.append(wheel)
            parts.append(lpm.box(f"cart_{cart}_handle_{side}", (0.015, 0.1, 0.015), at=(cart_x + side * 0.15, cart_y + 0.15, 0.12), color=wood))
        for number, (dx, color) in enumerate(zip((-0.09, 0.02, 0.11), ball_colors)):
            parts.append(lpm.lathe(f"cart_{cart}_ball_{number}", [(0.06 * math.cos(math.radians(a)), 0.06 * math.sin(math.radians(a))) for a in (-90, -45, 0, 45, 90)], segments=8, at=(cart_x + dx, cart_y, 0.19), color=index(color)))
    ob = lpm.finish(spec["id"], parts, palette, budget=9000, center=False)
    return export_model(ob, spec, out_dir)


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


def net_run(parts, name, start, end, height, base, frame, net, post_gap=0.5, gaps=()):
    """A straight ball-stop net on posts with a top rail, from `start` to `end` (axis-aligned). `gaps` are (from, to) distances along the run left open."""
    (x0, y0), (x1, y1) = start, end
    length = abs(x1 - x0) + abs(y1 - y0)
    along_x = abs(x1 - x0) > 0
    posts = max(2, math.ceil(length / post_gap) + 1)
    step = length / (posts - 1)

    def at(distance):
        return (x0 + (x1 - x0) * distance / length, y0 + (y1 - y0) * distance / length)

    def open_at(distance):
        return any(a - 1e-6 < distance < b + 1e-6 for a, b in gaps)

    edges = sorted({0.0, length, *[v for gap in gaps for v in gap]})
    for number in range(posts):
        distance = number * step
        if any(a + 1e-6 < distance < b - 1e-6 for a, b in gaps):
            continue
        x, y = at(distance)
        parts.append(lpm.box(f"{name}_post_{number}", (0.014, 0.014, height), at=(x, y, base), color=frame))
    for number, (a, b) in enumerate(zip(edges, edges[1:])):
        if open_at((a + b) / 2):
            continue
        x, y = at((a + b) / 2)
        rail = (b - a, 0.012, 0.008) if along_x else (0.012, b - a, 0.008)
        parts.append(lpm.box(f"{name}_rail_{number}", rail, at=(x, y, base + height - 0.008), color=frame))
        for level, fraction in enumerate((0.0, 0.33, 0.66)):
            thread = (b - a, 0.004, 0.004) if along_x else (0.004, b - a, 0.004)
            parts.append(lpm.box(f"{name}_thread_{number}_{level}", thread, at=(x, y, base + 0.01 + (height - 0.03) * fraction), color=net))
        strands = max(1, round((b - a) / 0.08))
        for strand in range(strands + 1):
            sx, sy = at(a + (b - a) * strand / strands)
            parts.append(lpm.box(f"{name}_strand_{number}_{strand}", (0.004, 0.004, height - 0.016), at=(sx, sy, base + 0.01), color=net))


def arc_line(parts, name, center, radius, start, stop, z, color, width=0.014, step=15.0):
    """A painted arc from `start` to `stop` degrees (0 = +X, counter-clockwise) made of short flat boxes."""
    count = max(1, round(abs(stop - start) / step))
    for number in range(count):
        a0 = math.radians(start + (stop - start) * number / count)
        a1 = math.radians(start + (stop - start) * (number + 1) / count)
        p0 = (radius * math.cos(a0), radius * math.sin(a0))
        p1 = (radius * math.cos(a1), radius * math.sin(a1))
        length = math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + width * 0.5
        piece = lpm.box(f"{name}_{number}", (length, width, 0.004), at=(0, 0, 0), color=color)
        lpm.rotate(piece, math.degrees(math.atan2(p1[1] - p0[1], p1[0] - p0[0])), "Z")
        lpm.move(piece, center[0] + (p0[0] + p1[0]) / 2, center[1] + (p0[1] + p1[1]) / 2, z)
        parts.append(piece)


def build_basketball_court(spec, out_dir):
    """A small street basketball court filling 2x3: an orange surface with white lines, blue keys and a center circle on a grey apron, a hoop on a pole at each end, and ball-stop nets on posts around the court (taller behind the hoops, with a gap on one side)."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    apron, court, white, key, frame, net, rim = (index(n) for n in ("uslab", "tangerine", "white", "cobalt", "graphite", "utrim", "brick"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    parts = []
    base, half_x, half_y = 0.02, 0.9, 1.4
    parts.append(lpm.box("apron", (1.98, 2.98, base), at=(0, 0, 0), color=apron))
    parts.append(lpm.box("surface", (2 * half_x, 2 * half_y, 0.006), at=(0, 0, base), color=court))
    top = base + 0.006
    line = 0.014
    hoop_y = 1.27
    for end in (-1, 1):
        parts.append(lpm.box(f"key_{end}", (0.42, 0.62, 0.002), at=(0, end * (half_y - 0.31), top), color=key))
        parts.append(lpm.box(f"free_throw_{end}", (0.42 + line, line, 0.004), at=(0, end * (half_y - 0.62), top), color=white))
        for side in (-1, 1):
            parts.append(lpm.box(f"key_side_{end}_{side}", (line, 0.62, 0.004), at=(side * 0.21, end * (half_y - 0.31), top), color=white))
        parts.append(lpm.box(f"end_line_{end}", (2 * half_x - 0.02, line, 0.004), at=(0, end * (half_y - line / 2), top), color=white))
        arc_line(parts, f"free_throw_circle_{end}", (0, end * (half_y - 0.62)), 0.2, *((180, 360) if end == 1 else (0, 180)), top, white)
        arc_line(parts, f"three_point_{end}", (0, end * hoop_y), 0.7, *((180, 360) if end == 1 else (0, 180)), top, white)
        for side in (-1, 1):
            parts.append(lpm.box(f"three_point_side_{end}_{side}", (line, half_y - hoop_y, 0.004), at=(side * 0.7, end * (hoop_y + (half_y - hoop_y) / 2), top), color=white))
    for side in (-1, 1):
        parts.append(lpm.box(f"side_line_{side}", (line, 2 * half_y, 0.004), at=(side * (half_x - line / 2), 0, top), color=white))
    parts.append(lpm.box("half_line", (2 * half_x, line, 0.004), at=(0, 0, top), color=white))
    arc_line(parts, "center_circle", (0, 0), 0.2, 0, 360, top, white, step=20.0)
    arc_line(parts, "center_dot", (0, 0), 0.04, 0, 360, top, white, width=0.04, step=45.0)

    pole_y, board_y, rim_y = 1.46, 1.34, 1.27
    for end in (-1, 1):
        parts.append(lpm.prism(f"pole_{end}", 6, 0.016, 0.34, at=(0, end * pole_y, base), color=frame))
        parts.append(lpm.box(f"arm_{end}", (0.02, 0.14, 0.02), at=(0, end * (pole_y - 0.07), base + 0.3), color=frame))
        parts.append(lpm.box(f"board_{end}", (0.22, 0.008, 0.13), at=(0, end * board_y, base + 0.24), color=white))
        parts.append(lpm.box(f"board_mark_{end}", (0.08, 0.009, 0.05), at=(0, end * (board_y - end * 0.001), base + 0.265), color=frame))
        parts.append(lpm.lathe(f"rim_{end}", [(0.04, 0.0), (0.04, 0.006), (0.052, 0.006), (0.052, 0.0)], segments=10, at=(0, end * rim_y, base + 0.255), color=rim))
        parts.append(lpm.prism(f"hoop_net_{end}", 8, 0.046, 0.05, at=(0, end * rim_y, base + 0.205), color=white, radius_top=0.026))

    fence_x, fence_y = 0.97, 1.47
    for end in (-1, 1):
        net_run(parts, f"back_{end}", (-fence_x, end * fence_y), (fence_x, end * fence_y), 0.5, base, frame, net)
    for side in (-1, 1):
        gaps = ((1.2, 1.8),) if side == 1 else ()
        net_run(parts, f"side_{side}", (side * fence_x, -fence_y), (side * fence_x, fence_y), 0.24, base, frame, net, gaps=gaps)
    ob = lpm.finish(spec["id"], parts, palette, budget=6000, center=False)
    return export_model(ob, spec, out_dir)


def build_football_pitch(spec, out_dir):
    """A small five-a-side football pitch filling 2x4: a two-tone striped lawn with white lines, a center circle and two small penalty areas on a grey apron, a goal with a net at each end, corner flags, and ball-stop nets on posts around the pitch (taller behind the goals, low on the sides, with a gap on one side)."""
    style = spec.get("style", "urbtopia")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    apron, grass_a, grass_b, white, frame, net, flag = (index(n) for n in ("uslab", "softgreen", "bush", "white", "graphite", "utrim", "sun"))
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    parts = []
    base, half_x, half_y = 0.02, 0.9, 1.9
    parts.append(lpm.box("apron", (1.98, 3.98, base), at=(0, 0, 0), color=apron))
    stripes = 8
    stripe = 2 * half_y / stripes
    for number in range(stripes):
        parts.append(lpm.box(f"stripe_{number}", (2 * half_x, stripe, 0.006), at=(0, -half_y + stripe * (number + 0.5), base), color=grass_a if number % 2 == 0 else grass_b))
    top = base + 0.006
    line = 0.014
    for end in (-1, 1):
        parts.append(lpm.box(f"goal_line_{end}", (2 * half_x - 0.02, line, 0.004), at=(0, end * (half_y - line / 2), top), color=white))
        area_depth = 0.42
        parts.append(lpm.box(f"area_front_{end}", (0.96 + line, line, 0.004), at=(0, end * (half_y - area_depth), top), color=white))
        for side in (-1, 1):
            parts.append(lpm.box(f"area_side_{end}_{side}", (line, area_depth, 0.004), at=(side * 0.48, end * (half_y - area_depth / 2), top), color=white))
        parts.append(lpm.box(f"penalty_spot_{end}", (0.03, 0.03, 0.004), at=(0, end * (half_y - 0.62), top), color=white))
        arc_line(parts, f"area_arc_{end}", (0, end * (half_y - 0.62)), 0.26, *((180, 360) if end == 1 else (0, 180)), top, white, step=20.0)
    for side in (-1, 1):
        parts.append(lpm.box(f"touch_line_{side}", (line, 2 * half_y, 0.004), at=(side * (half_x - line / 2), 0, top), color=white))
    parts.append(lpm.box("half_line", (2 * half_x, line, 0.004), at=(0, 0, top), color=white))
    arc_line(parts, "center_circle", (0, 0), 0.27, 0, 360, top, white, step=20.0)
    arc_line(parts, "center_dot", (0, 0), 0.04, 0, 360, top, white, width=0.04, step=45.0)

    goal_half, goal_height, goal_depth = 0.2, 0.13, 0.08
    for end in (-1, 1):
        mouth = end * (half_y - 0.02)
        back = end * (half_y - 0.02 + goal_depth)
        for side in (-1, 1):
            parts.append(lpm.box(f"goal_post_{end}_{side}", (0.014, 0.014, goal_height), at=(side * goal_half, mouth, top), color=white))
            parts.append(lpm.box(f"goal_back_post_{end}_{side}", (0.01, 0.01, goal_height * 0.8), at=(side * goal_half, back, top), color=white))
            parts.append(lpm.box(f"goal_side_net_{end}_{side}", (0.005, goal_depth, goal_height * 0.9), at=(side * goal_half, (mouth + back) / 2, top), color=net))
        parts.append(lpm.box(f"goal_bar_{end}", (2 * goal_half + 0.014, 0.014, 0.014), at=(0, mouth, top + goal_height - 0.014), color=white))
        parts.append(lpm.box(f"goal_back_net_{end}", (2 * goal_half, 0.005, goal_height * 0.8), at=(0, back, top), color=net))
        parts.append(lpm.box(f"goal_roof_net_{end}", (2 * goal_half, goal_depth, 0.005), at=(0, (mouth + back) / 2, top + goal_height * 0.85), color=net))
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(lpm.box(f"flag_pole_{sx}_{sy}", (0.006, 0.006, 0.07), at=(sx * (half_x - 0.01), sy * (half_y - 0.01), top), color=white))
            parts.append(lpm.box(f"flag_{sx}_{sy}", (0.03, 0.004, 0.02), at=(sx * (half_x - 0.01) - sx * 0.012, sy * (half_y - 0.01), top + 0.05), color=flag))

    fence_x, fence_y = 0.97, 1.97
    for end in (-1, 1):
        net_run(parts, f"back_{end}", (-fence_x, end * fence_y), (fence_x, end * fence_y), 0.5, base, frame, net)
    for side in (-1, 1):
        gaps = ((1.6, 2.2),) if side == 1 else ()
        net_run(parts, f"side_{side}", (side * fence_x, -fence_y), (side * fence_x, fence_y), 0.24, base, frame, net, gaps=gaps)
    ob = lpm.finish(spec["id"], parts, palette, budget=7000, center=False)
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


def extrude_z(name, outline, z0, z1, color):
    """Extrude a closed (x, y) outline, counter-clockwise seen from above, along Z from z0 to z1."""
    count = len(outline)
    verts = [(x, y, z0) for x, y in outline] + [(x, y, z1) for x, y in outline]
    faces = [(i, (i + 1) % count, count + (i + 1) % count, count + i) for i in range(count)]
    faces.append(tuple(reversed(range(count))))
    faces.append(tuple(range(count, 2 * count)))
    return lpm._object(name, _bm(verts, faces), color)


BROWNSTONE_WALLS = {"front": -0.80, "back": 0.94, "left": -0.46, "right": 0.46}


def face_box(parts, name, face, wall, u, along, height, z, thickness, color, embed=0.004):
    """A box on a wall plane: centred at `u` along the face, `along` wide, standing out `thickness` minus `embed`."""
    sign = -1 if face in ("front", "left") else 1
    offset = sign * (thickness / 2 - embed)
    if face in ("front", "back"):
        parts.append(lpm.box(name, (along, thickness, height), at=(u, wall + offset, z), color=color))
    else:
        parts.append(lpm.box(name, (thickness, along, height), at=(wall + offset, u, z), color=color))


def brownstone_window(parts, tag, face, u, bottom, width, height, c, wall=None, framed=True):
    """A window with a lintel and a sill in the trim color; framed windows get a dark frame and a glazing bar."""
    wall = BROWNSTONE_WALLS[face] if wall is None else wall
    face_box(parts, f"{tag}_glass", face, wall, u, width, height, bottom, 0.012, c["glass"])
    face_box(parts, f"{tag}_sill", face, wall, u, width + 0.04, 0.012, bottom - 0.012, 0.03, c["trim"])
    face_box(parts, f"{tag}_lintel", face, wall, u, width + 0.05, 0.02, bottom + height, 0.026, c["trim"])
    if not framed:
        return
    for side in (-1, 1):
        face_box(parts, f"{tag}_frame_{side}", face, wall, u + side * (width / 2 + 0.005), 0.01, height, bottom, 0.016, c["frame"])
    face_box(parts, f"{tag}_bar", face, wall, u, width, 0.006, bottom + height / 2, 0.016, c["frame"])


def stair_rail(parts, name, x, y_bottom, z_bottom, y_top, z_top, height, color, thick=0.012):
    """An iron rail along a stair that rises with Y: a bar parallel to the slope and 3 vertical posts (foot, middle, head) standing on the steps."""
    rise, run = z_top - z_bottom, y_top - y_bottom
    length = math.hypot(run, rise)
    centre = ((y_bottom + y_top) / 2, (z_bottom + z_top) / 2 + height)
    bar = lpm.box(f"{name}_bar", (thick, length, thick), at=(x, centre[0], centre[1]), color=color)
    lpm.rotate(bar, math.degrees(math.atan2(rise, run)), axis="X", about=(x, centre[0], centre[1]))
    parts.append(bar)
    for number, t in enumerate((0.0, 0.5, 1.0)):
        parts.append(lpm.box(f"{name}_post_{number}", (thick, thick, height + thick), at=(x, y_bottom + t * run, z_bottom + t * rise), color=color))


def build_brownstone(spec, out_dir):
    """A brownstone row house on a 1x2 cell, front facing -Y. The Tier is the floor count (1 to 5) and each Tier has its own silhouette:
    1 a low house with a pediment over the door, 2 a taller one with a door hood and cornice brackets, 3 the raised ground floor with a high stoop, railings and a transom,
    4 a two-floor bay window and a fire escape at the back, 5 a set-back top floor with a terrace and a roof water tank. The stoop reaches the front of the cell and the cornice its sides."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("dark", "vtone2"), ("trim", "vtone3"), ("glass", "glass_blue"), ("frame", "graphite"),
                                              ("door", "slate_dark"), ("roof", "uslab"), ("wood", "uwood"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    floors = spec["floors"]
    plinth = 0.12
    fh = 0.26
    levels = min(floors, 4)
    z0 = plinth
    top = z0 + levels * fh
    width = 0.92
    y0, y1 = BROWNSTONE_WALLS["front"], BROWNSTONE_WALLS["back"]
    depth = y1 - y0
    cy = (y0 + y1) / 2
    door_x = -0.2
    parts = [lpm.box("plinth", (width + 0.02, depth + 0.02, plinth), at=(0, cy, 0), color=c["dark"]),
             lpm.box("walls", (width, depth, levels * fh), at=(0, cy, z0), color=c["wall"]),
             lpm.box("cornice", (width + 0.08, depth + 0.08, 0.035), at=(0, cy, top), color=c["trim"])]
    if floors > 1:
        for number in range(6):
            parts.append(lpm.box(f"bracket_{number}", (0.05, 0.04, 0.045), at=(-0.4 + 0.16 * number, y0 - 0.02, top - 0.045), color=c["trim"]))
    rim, rim_height, rim_z = 0.03, 0.05, top + 0.035
    parts.append(lpm.box("parapet_front", (width + 0.06, rim, rim_height), at=(0, y0 - 0.025, rim_z), color=c["wall"]))
    parts.append(lpm.box("parapet_back", (width + 0.06, rim, rim_height), at=(0, y1 + 0.025, rim_z), color=c["wall"]))
    for side in (-1, 1):
        parts.append(lpm.box(f"parapet_{side}", (rim, depth + 0.06, rim_height), at=(side * 0.475, cy, rim_z), color=c["wall"]))
    parts.append(lpm.box("deck", (width - 0.04, depth + 0.02, 0.006), at=(0, cy, rim_z), color=c["roof"]))

    bay = floors >= 4
    for level in range(levels):
        raised = level == 1 and floors >= 3
        bottom = z0 + level * fh + (0.03 if raised else 0.05)
        height = 0.2 if raised else 0.16
        for x in (-0.2, 0.2):
            if level == 0 and x == door_x:
                continue
            if bay and level in (1, 2) and x == 0.2:
                continue
            brownstone_window(parts, f"front_{level}_{x}", "front", x, bottom, 0.17, height, c)
        for x in (-0.2, 0.2):
            brownstone_window(parts, f"back_{level}_{x}", "back", x, bottom, 0.17, 0.16, c)
        for face in ("left", "right"):
            for number, y in enumerate((-0.42, 0.05, 0.52)):
                brownstone_window(parts, f"{face}_{level}_{number}", face, y, bottom, 0.12, 0.16, c, framed=False)

    brownstone_window(parts, "basement", "front", 0.2, 0.03, 0.15, 0.06, c, wall=y0 - 0.01, framed=False)

    door_height = 0.2
    face_box(parts, "door", "front", y0, door_x, 0.17, door_height, z0, 0.014, c["door"])
    parts.append(lpm.box("door_knob", (0.014, 0.014, 0.014), at=(door_x + 0.05, y0 - 0.014, z0 + 0.1), color=c["trim"]))
    door_frame(parts, "door", door_x, y0, z0, 0.17, door_height, c["trim"], thick=0.014)
    if floors == 1:
        peak = z0 + door_height + 0.016
        parts.append(extrude_y("pediment", [(door_x - 0.13, peak), (door_x + 0.13, peak), (door_x, peak + 0.05)], y0 - 0.025, y0 + 0.004, c["trim"]))
    elif floors == 2:
        parts.append(lpm.box("door_hood", (0.25, 0.06, 0.016), at=(door_x, y0 - 0.026, z0 + door_height + 0.014), color=c["trim"]))
        for side in (-1, 1):
            parts.append(lpm.box(f"door_hood_bracket_{side}", (0.016, 0.04, 0.03), at=(door_x + side * 0.1, y0 - 0.02, z0 + door_height - 0.016), color=c["trim"]))
    else:
        face_box(parts, "transom", "front", y0, door_x, 0.17, 0.035, z0 + door_height + 0.014, 0.012, c["glass"])

    steps = {1: 3, 2: 3}.get(floors, 5)
    landing, run = 0.06, 0.14 / (steps - 1)
    stoop_x = door_x
    parts.append(lpm.box("stoop_landing", (0.32, landing + 0.004, plinth), at=(stoop_x, y0 - landing / 2 + 0.002, 0), color=c["dark"]))
    for step in range(1, steps):
        step_height = plinth * (steps - step) / steps
        parts.append(lpm.box(f"stoop_step_{step}", (0.32, run, step_height), at=(stoop_x, y0 - landing - run * (step - 0.5), 0), color=c["dark"]))
    low_top = plinth / steps
    rail_z = 0.08
    for side in (-1, 1):
        x = stoop_x + side * 0.15
        stair_rail(parts, f"rail_{side}", x, y0 - landing - 0.13, low_top, y0 - landing, plinth, rail_z, c["frame"])
        parts.append(lpm.box(f"rail_flat_{side}", (0.012, landing, 0.012), at=(x, y0 - landing / 2, plinth + rail_z), color=c["frame"]))

    if bay:
        bay_x, bay_front, bay_wall = 0.2, y0 - 0.10, y0 + 0.01
        bottom, ceiling = z0 + fh, z0 + 3 * fh
        parts.append(extrude_z("bay", [(bay_x - 0.14, bay_front), (bay_x + 0.14, bay_front), (bay_x + 0.2, bay_wall), (bay_x - 0.2, bay_wall)], bottom, ceiling, c["wall"]))
        wide = [(bay_x - 0.16, bay_front - 0.025), (bay_x + 0.16, bay_front - 0.025), (bay_x + 0.23, bay_wall), (bay_x - 0.23, bay_wall)]
        parts.append(extrude_z("bay_base", wide, bottom - 0.025, bottom, c["trim"]))
        parts.append(extrude_z("bay_cap", wide, ceiling, ceiling + 0.025, c["trim"]))
        for level in (1, 2):
            brownstone_window(parts, f"bay_{level}", "front", bay_x, z0 + level * fh + (0.03 if level == 1 and floors >= 3 else 0.05), 0.22, 0.17, c, wall=bay_front)
        for level in range(1, levels):
            platform_z = z0 + level * fh
            parts.append(lpm.box(f"escape_platform_{level}", (0.56, 0.06, 0.012), at=(0, y1 + 0.03, platform_z), color=c["frame"]))
            parts.append(lpm.box(f"escape_rail_{level}", (0.56, 0.008, 0.07), at=(0, y1 + 0.056, platform_z + 0.012), color=c["frame"]))
            for side in (-1, 1):
                parts.append(lpm.box(f"escape_rail_{level}_{side}", (0.008, 0.06, 0.07), at=(side * 0.276, y1 + 0.03, platform_z + 0.012), color=c["frame"]))
            lower_z = z0 if level == 1 else z0 + (level - 1) * fh
            drop = platform_z - lower_z
            tilt = math.degrees(math.atan2(drop, 0.05)) * (1 if level % 2 else -1)
            for side in (-1, 1):
                x = (0.2 if level % 2 else -0.2) + side * 0.04
                ladder = lpm.box(f"escape_ladder_{level}_{side}", (0.012, math.hypot(drop, 0.05), 0.012), at=(x, y1 + 0.03, (platform_z + lower_z) / 2), color=c["frame"])
                lpm.rotate(ladder, tilt, axis="X", about=(x, y1 + 0.03, (platform_z + lower_z) / 2))
                parts.append(ladder)

    if floors == 5:
        top_z = top + 0.035
        front, back = -0.46, 0.86
        centre = (front + back) / 2
        parts.append(lpm.box("top_floor", (0.80, back - front, fh), at=(0, centre, top_z), color=c["wall"]))
        parts.append(lpm.box("top_cornice", (0.88, back - front + 0.08, 0.03), at=(0, centre, top_z + fh), color=c["trim"]))
        parts.append(lpm.box("top_deck", (0.82, back - front + 0.04, 0.006), at=(0, centre, top_z + fh + 0.03), color=c["roof"]))
        face_box(parts, "terrace_glass", "front", front, 0.0, 0.62, 0.17, top_z + 0.045, 0.012, c["glass"])
        for side in (-1, 1):
            face_box(parts, f"terrace_frame_{side}", "front", front, side * 0.31, 0.012, 0.17, top_z + 0.045, 0.016, c["frame"])
            face_box(parts, f"terrace_mullion_{side}", "front", front, side * 0.1, 0.008, 0.17, top_z + 0.045, 0.016, c["frame"])
        face_box(parts, "terrace_head", "front", front, 0.0, 0.66, 0.012, top_z + 0.215, 0.016, c["frame"])
        for face, wall in (("left", -0.40), ("right", 0.40)):
            for number, y in enumerate((-0.15, 0.3)):
                brownstone_window(parts, f"top_{face}_{number}", face, y, top_z + 0.05, 0.12, 0.16, c, wall=wall, framed=False)
        for x in (-0.2, 0.2):
            brownstone_window(parts, f"top_back_{x}", "back", x, top_z + 0.05, 0.17, 0.16, c, wall=back)

    roof_z = top_z + fh + 0.036 if floors == 5 else rim_z + 0.006
    parts.append(lpm.box("roof_hatch", (0.16, 0.16, 0.05), at=(-0.2, 0.45, roof_z), color=c["trim"]))
    if spec.get("solar"):
        for column in range(3):
            for row in range(2):
                parts.append(lpm.box(f"solar_panel_{column}_{row}", (0.2, 0.24, 0.012), at=(-0.23 + column * 0.23, -0.3 + row * 0.29, roof_z), color=c["solar"]))
    tank_x, tank_y, tank_z = 0.2, 0.5, roof_z
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(lpm.box(f"tank_leg_{sx}_{sy}", (0.014, 0.014, 0.1), at=(tank_x + sx * 0.07, tank_y + sy * 0.07, tank_z), color=c["frame"]))
    parts.append(lpm.box("tank_floor", (0.18, 0.18, 0.012), at=(tank_x, tank_y, tank_z + 0.1), color=c["frame"]))
    parts.append(lpm.prism("tank", 10, 0.095, 0.15, at=(tank_x, tank_y, tank_z + 0.112), color=c["wood"]))
    for number, hoop_z in enumerate((0.15, 0.22)):
        parts.append(lpm.prism(f"tank_hoop_{number}", 10, 0.1, 0.014, at=(tank_x, tank_y, tank_z + hoop_z), color=c["frame"]))
    parts.append(lpm.prism("tank_roof", 10, 0.115, 0.06, at=(tank_x, tank_y, tank_z + 0.262), color=c["door"], radius_top=0.01))

    ob = lpm.finish(spec["id"], parts, palette, budget=2500 + 2600 * floors, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = list(spec["footprint"])
    return report


DUTCH_GABLES = {
    "low_step": [(0.46, 0.0), (0.46, 0.1), (0.34, 0.1), (0.34, 0.17), (0.2, 0.17), (0.2, 0.23), (0.0, 0.23)],
    "step": [(0.46, 0.0), (0.46, 0.08), (0.36, 0.08), (0.36, 0.15), (0.26, 0.15), (0.26, 0.22), (0.16, 0.22), (0.16, 0.29), (0.0, 0.29)],
    "neck": [(0.46, 0.0), (0.46, 0.05), (0.34, 0.05), (0.34, 0.09), (0.24, 0.12), (0.2, 0.16), (0.2, 0.31), (0.0, 0.31)],
    "bell": [(0.46, 0.0), (0.46, 0.04), (0.4, 0.06), (0.33, 0.09), (0.27, 0.14), (0.23, 0.2), (0.21, 0.27), (0.18, 0.33), (0.1, 0.36), (0.0, 0.36)],
    "grand_bell": [(0.46, 0.0), (0.46, 0.05), (0.42, 0.07), (0.37, 0.07), (0.33, 0.11), (0.3, 0.16), (0.26, 0.2), (0.24, 0.26), (0.2, 0.31), (0.16, 0.35), (0.1, 0.38), (0.0, 0.4)],
}
DUTCH_ROOF_RISE = 0.2
DUTCH_GABLE_HEIGHT = 0.8  # scale of the stepped, neck and bell profiles
DUTCH_GABLE_BY_FLOORS = {1: "low_step", 2: "step", 3: "neck", 4: "bell", 5: "grand_bell"}


def dutch_gable(parts, c, kind, base_z, front):
    """A gable wall on the front: the (x, z) profile mirrored, trim caps on its horizontal ledges."""
    stretch = 1.0 if kind == "low_step" else DUTCH_GABLE_HEIGHT
    half = [(x, z * stretch) for x, z in DUTCH_GABLES[kind]]
    outline = half + [(-x, z) for x, z in reversed(half[:-1])]
    parts.append(extrude_y("gable", [(x, base_z + z) for x, z in outline], front - 0.02, front + 0.1, c["wall"]))
    for number, ((xa, za), (xb, zb)) in enumerate(zip(half, half[1:])):
        if za != zb or xa - xb < 0.03:
            continue
        width = (xa - xb) + 0.02
        centre = (xa + xb) / 2
        for side in ((1, -1) if centre else (1,)):
            parts.append(lpm.box(f"gable_cap_{number}_{side}", (width if centre else 2 * xa + 0.02, 0.14, 0.014), at=(side * centre, front + 0.03, base_z + za), color=c["trim"]))
    return half[-1][1]


def build_dutch(spec, out_dir):
    """A Dutch canal house on a 1x1 or 1x2 cell, front facing -Y: a brick body with white-framed windows, a gable on the front and a pitched slate roof behind it.
    The Tier is the floor count (1 to 5) and sets the gable: 1 a low stepped gable, 2 a taller stepped one, 3 neck with a hoisting beam, 4 bell, 5 grand bell with scrolls and a pinnacle. Shutters from Tier 2."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("dark", "vtone2"), ("trim", "vtone3"), ("glass", "glass_blue"), ("frame", "graphite"),
                                              ("green", "shutter_green"), ("roof", "uslab"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    floors, d = spec["floors"], spec["footprint"][1]
    plinth, fh = 0.12, 0.26
    z0 = plinth
    top = z0 + floors * fh
    width = 0.92
    y0, y1 = -d / 2 + 0.2, d / 2 - 0.045
    depth = y1 - y0
    cy = (y0 + y1) / 2
    door_x = -0.2
    parts = [lpm.box("plinth", (width + 0.02, depth + 0.02, plinth), at=(0, cy, 0), color=c["dark"]),
             lpm.box("walls", (width, depth, floors * fh), at=(0, cy, z0), color=c["wall"]),
             lpm.box("cornice", (width + 0.08, depth + 0.08, 0.03), at=(0, cy, top), color=c["trim"])]
    base_z = top + 0.03
    gable_top = dutch_gable(parts, c, DUTCH_GABLE_BY_FLOORS[floors], base_z, y0)
    parts.append(extrude_y("roof", [(-0.5, base_z), (0.5, base_z), (0, base_z + DUTCH_ROOF_RISE)], y0 + 0.1, y1 + 0.04, c["roof"]))
    parts.append(lpm.box("ridge", (0.03, depth - 0.06, 0.02), at=(0, cy + 0.03, base_z + DUTCH_ROOF_RISE - 0.004), color=c["trim"]))
    for number, x in enumerate((-0.3, 0.3) if floors == 5 else (-0.3,)):
        parts.append(lpm.box(f"chimney_{number}", (0.1, 0.1, 0.3), at=(x, cy + 0.2, base_z), color=c["wall"]))
        parts.append(lpm.box(f"chimney_cap_{number}", (0.13, 0.13, 0.02), at=(x, cy + 0.2, base_z + 0.3), color=c["trim"]))

    ys = (cy,) if d == 1 else (-0.42, 0.05, 0.52)
    for level in range(floors):
        tall = level < 2
        bottom = z0 + level * fh + (0.03 if level == 1 else 0.05)
        height = 0.2 if tall else 0.17
        for x in (-0.2, 0.2):
            if level == 0 and x == door_x:
                continue
            brownstone_window(parts, f"front_{level}_{x}", "front", x, bottom, 0.17, height, c, wall=y0)
            if floors >= 2:
                for side in (-1, 1):
                    face_box(parts, f"shutter_{level}_{x}_{side}", "front", y0, x + side * 0.12, 0.05, height, bottom, 0.016, c["green"])
        for x in (-0.2, 0.2):
            brownstone_window(parts, f"back_{level}_{x}", "back", x, bottom, 0.17, 0.16, c, wall=y1)
        for face, wall in (("left", -0.46), ("right", 0.46)):
            for number, y in enumerate(ys):
                brownstone_window(parts, f"{face}_{level}_{number}", face, y, bottom, 0.12, 0.16, c, wall=wall, framed=False)
                face_box(parts, f"{face}_{level}_{number}_bar", face, wall, y, 0.12, 0.006, bottom + 0.077, 0.016, c["frame"])
    brownstone_window(parts, "basement", "front", 0.2, 0.03, 0.15, 0.06, c, wall=y0 - 0.01, framed=False)

    door_height = 0.2
    face_box(parts, "door", "front", y0, door_x, 0.17, door_height, z0, 0.014, c["green"])
    parts.append(lpm.box("door_knob", (0.014, 0.014, 0.014), at=(door_x + 0.05, y0 - 0.014, z0 + 0.1), color=c["trim"]))
    door_frame(parts, "door", door_x, y0, z0, 0.17, door_height, c["trim"], thick=0.014)
    if floors >= 3:
        face_box(parts, "transom", "front", y0, door_x, 0.17, 0.035, z0 + door_height + 0.014, 0.012, c["glass"])
    else:
        parts.append(lpm.box("door_hood", (0.25, 0.06, 0.016), at=(door_x, y0 - 0.026, z0 + door_height + 0.014), color=c["trim"]))

    steps = {1: 3, 2: 3}.get(floors, 5)
    landing, run = 0.06, 0.14 / (steps - 1)
    parts.append(lpm.box("stoop_landing", (0.32, landing + 0.004, plinth), at=(door_x, y0 - landing / 2 + 0.002, 0), color=c["dark"]))
    for step in range(1, steps):
        step_height = plinth * (steps - step) / steps
        parts.append(lpm.box(f"stoop_step_{step}", (0.32, run, step_height), at=(door_x, y0 - landing - run * (step - 0.5), 0), color=c["dark"]))
    low_top = plinth / steps
    rail_z = 0.08
    for side in (-1, 1):
        x = door_x + side * 0.15
        stair_rail(parts, f"rail_{side}", x, y0 - landing - 0.13, low_top, y0 - landing, plinth, rail_z, c["frame"])
        parts.append(lpm.box(f"rail_flat_{side}", (0.012, landing, 0.012), at=(x, y0 - landing / 2, plinth + rail_z), color=c["frame"]))

    if floors >= 3:
        beam_z = base_z + gable_top
        parts.append(lpm.box("hoist_beam", (0.03, 0.16, 0.03), at=(0, y0 - 0.06, beam_z - 0.01), color=c["frame"]))
        parts.append(lpm.box("hoist_hook", (0.008, 0.008, 0.08), at=(0, y0 - 0.125, beam_z - 0.09), color=c["frame"]))
        parts.append(lpm.box("hoist_block", (0.03, 0.03, 0.02), at=(0, y0 - 0.125, beam_z - 0.11), color=c["frame"]))
    if floors == 5:
        for side in (-1, 1):
            parts.append(lpm.box(f"scroll_{side}", (0.05, 0.14, 0.05), at=(side * 0.4, y0 + 0.03, base_z + 0.11), color=c["trim"]))
        parts.append(lpm.prism("pinnacle", 8, 0.05, 0.06, at=(0, y0 + 0.03, base_z + gable_top), color=c["trim"], radius_top=0.012))

    if spec.get("solar"):
        pitch = math.degrees(math.atan2(DUTCH_ROOF_RISE, 0.5))
        count = 2 if d == 1 else 4
        span = depth - 0.3
        for row in range(count):
            y = y0 + 0.2 + span * (row + 0.5) / count
            for column, x in enumerate((0.15, 0.36)):
                surface = base_z + DUTCH_ROOF_RISE * (1 - x / 0.5) + 0.01
                panel = lpm.box(f"solar_panel_{row}_{column}", (0.19, span / count - 0.03, 0.01), at=(x, y, surface), color=c["solar"])
                lpm.rotate(panel, -pitch, axis="Y", about=(x, y, surface))
                parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=2500 + 2600 * floors, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = list(spec["footprint"])
    return report


def haussmann_dormer(parts, c, tag, u, z, yaw, pediment):
    """A dormer window on the steep mansard slope of the front face (-Y); other faces are this one turned by `yaw` degrees about the vertical axis."""
    group = [lpm.box(f"{tag}_body", (0.17, 0.12, 0.14), at=(u, -0.88, z), color=c["wall"]),
             lpm.box(f"{tag}_glass", (0.11, 0.012, 0.1), at=(u, -0.946, z + 0.02), color=c["glass"]),
             lpm.box(f"{tag}_sill", (0.15, 0.03, 0.012), at=(u, -0.95, z + 0.008), color=c["trim"]),
             lpm.box(f"{tag}_mullion", (0.008, 0.016, 0.1), at=(u, -0.95, z + 0.02), color=c["frame"]),
             lpm.box(f"{tag}_bar", (0.11, 0.016, 0.008), at=(u, -0.95, z + 0.066), color=c["frame"]),
             extrude_y(f"{tag}_roof", [(u - 0.1, z + 0.14), (u + 0.1, z + 0.14), (u, z + 0.22 if pediment else z + 0.2)], -0.95, -0.82, c["roof"])]
    if pediment:
        group.append(extrude_y(f"{tag}_pediment", [(u - 0.075, z + 0.12), (u + 0.075, z + 0.12), (u, z + 0.17)], -0.955, -0.94, c["trim"]))
    for part in group:
        if yaw:
            lpm.rotate(part, yaw, axis="Z")
        parts.append(part)


def build_haussmann(spec, out_dir):
    """A Haussmannian apartment block on a 2x2 cell, front facing -Y: a cream stone body with five bays of tall windows, string courses between floors, a ground floor with a central double door,
    a zinc mansard roof with dormers, chimney stacks and a flat deck. The Tier is the floor count (1 to 5): 1 the ground floor under the roof, 2 the continuous iron balcony of the noble floor,
    3 balconies on the next floor, 4 corner quoins and a door pediment, 5 a second continuous balcony on the top floor, pedimented dormers and four chimney stacks."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("dark", "vtone2"), ("trim", "vtone3"), ("glass", "glass_blue"), ("frame", "graphite"),
                                              ("door", "slate_dark"), ("roof", "slate_dark"), ("deck", "uslab"), ("solar", "solar"), ("chimney", "slate"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    floors = spec["floors"]
    half = 0.96
    ground, fh = 0.3, 0.26
    plinth = 0.06
    z0 = plinth
    top = z0 + ground + (floors - 1) * fh
    bays = (-0.76, -0.38, 0.0, 0.38, 0.76)
    parts = [lpm.box("plinth", (2 * half + 0.04, 2 * half + 0.04, plinth), at=(0, 0, 0), color=c["dark"]),
             lpm.box("walls", (2 * half, 2 * half, top - z0), at=(0, 0, z0), color=c["wall"]),
             lpm.box("cornice", (2.0, 2.0, 0.04), at=(0, 0, top), color=c["trim"]),
             lpm.box("cornice_top", (1.96, 1.96, 0.03), at=(0, 0, top + 0.04), color=c["wall"])]
    for level in range(floors):
        line = z0 + ground + (level - 1) * fh if level else z0 + ground
        if level >= 1:
            parts.append(lpm.box(f"course_{level}", (1.98, 1.98, 0.014), at=(0, 0, z0 + ground + (level - 1) * fh - 0.007), color=c["trim"]))
    parts.append(lpm.box("course_ground", (1.98, 1.98, 0.014), at=(0, 0, z0 + ground - 0.007), color=c["trim"]))

    def floor_bottom(level):
        return z0 if level == 0 else z0 + ground + (level - 1) * fh

    faces = (("front", -half), ("back", half), ("left", -half), ("right", half))
    for level in range(floors):
        base = floor_bottom(level)
        bottom = base + (0.08 if level == 0 else 0.03)
        height = 0.17 if level == 0 else 0.21
        for face, wall in faces:
            for x in bays:
                if face == "front" and level == 0 and x == 0.0:
                    continue
                brownstone_window(parts, f"{face}_{level}_{x}", face, x, bottom, 0.2, height, c, wall=wall)
                face_box(parts, f"{face}_{level}_{x}_mullion", face, wall, x, 0.008, height, bottom, 0.016, c["frame"])

    door_h = 0.24
    face_box(parts, "door", "front", -half, 0.0, 0.3, door_h, z0, 0.014, c["door"])
    face_box(parts, "door_bar", "front", -half, 0.0, 0.012, door_h, z0, 0.02, c["frame"])
    door_frame(parts, "door", 0.0, -half, z0, 0.3, door_h, c["trim"], thick=0.02)
    face_box(parts, "door_fanlight", "front", -half, 0.0, 0.3, 0.04, z0 + door_h + 0.02, 0.012, c["glass"])
    for side in (-1, 1):
        parts.append(lpm.box(f"door_step_{side}", (0.14, 0.04, 0.03), at=(side * 0.08, -half - 0.02, 0), color=c["dark"]))

    def balcony(face_x0, level, continuous):
        zb = floor_bottom(level) + 0.012
        spans = [(-0.95, 0.95)] if continuous else [(x - 0.14, x + 0.14) for x in bays]
        for number, (a, b) in enumerate(spans):
            width = b - a
            mid = (a + b) / 2
            parts.append(lpm.box(f"balcony_slab_{level}_{number}", (width, 0.07, 0.016), at=(mid, -half - 0.035, zb), color=c["trim"]))
            parts.append(lpm.box(f"balcony_rail_{level}_{number}", (width, 0.008, 0.012), at=(mid, -half - 0.066, zb + 0.07), color=c["frame"]))
            parts.append(lpm.box(f"balcony_low_{level}_{number}", (width, 0.008, 0.008), at=(mid, -half - 0.066, zb + 0.018), color=c["frame"]))
            posts = max(2, int(width / 0.1) + 1)
            for post in range(posts):
                x = a + width * post / (posts - 1)
                parts.append(lpm.box(f"balcony_post_{level}_{number}_{post}", (0.008, 0.008, 0.066), at=(x, -half - 0.066, zb + 0.018), color=c["frame"]))

    if floors >= 2:
        balcony(None, 1, True)
    if floors >= 3:
        balcony(None, 2, False)
    if floors >= 4:
        balcony(None, 3, False)
    if floors == 5:
        balcony(None, 4, True)
    if floors >= 4:
        for sx in (-1, 1):
            for sy in (-1, 1):
                parts.append(lpm.box(f"quoin_x_{sx}_{sy}", (0.1, 0.03, top - z0), at=(sx * 0.91, sy * (half + 0.01), z0), color=c["trim"]))
                parts.append(lpm.box(f"quoin_y_{sx}_{sy}", (0.03, 0.1, top - z0), at=(sx * (half + 0.01), sy * 0.91, z0), color=c["trim"]))
        parts.append(extrude_y("door_pediment", [(-0.2, z0 + door_h + 0.07), (0.2, z0 + door_h + 0.07), (0.0, z0 + door_h + 0.15)], -half - 0.03, -half + 0.01, c["trim"]))
        parts.append(lpm.box("door_entablature", (0.42, 0.04, 0.03), at=(0, -half - 0.01, z0 + door_h + 0.04), color=c["trim"]))

    roof_z = top + 0.07
    steep, shallow, rim = 0.22, 0.05, 0.98
    root2 = math.sqrt(2)
    parts.append(lpm.prism("mansard", 4, rim * root2, steep, at=(0, 0, roof_z), color=c["roof"], radius_top=0.78 * root2, rotate=45))
    parts.append(lpm.prism("mansard_top", 4, 0.78 * root2, shallow, at=(0, 0, roof_z + steep), color=c["roof"], radius_top=0.56 * root2, rotate=45))
    deck_z = roof_z + steep + shallow
    parts.append(lpm.box("deck", (1.12, 1.12, 0.012), at=(0, 0, deck_z), color=c["deck"]))
    dormer_xs = bays if floors >= 5 else bays[1:4] if floors >= 3 else (-0.38, 0.38)
    for yaw in (0, 90, 180, 270):
        for number, u in enumerate(dormer_xs):
            haussmann_dormer(parts, c, f"dormer_{yaw}_{number}", u, roof_z + 0.03, yaw, floors == 5)
    stacks = [(-0.4, 0.3), (0.4, 0.3), (-0.4, -0.3), (0.4, -0.3)] if floors == 5 else [(-0.35, 0.25), (0.35, 0.25)]
    for number, (x, y) in enumerate(stacks):
        parts.append(lpm.box(f"stack_{number}", (0.12, 0.12, 0.26), at=(x, y, deck_z), color=c["chimney"]))
        parts.append(lpm.box(f"stack_cap_{number}", (0.15, 0.15, 0.02), at=(x, y, deck_z + 0.26), color=c["chimney"]))
        parts.append(lpm.box(f"stack_pot_{number}", (0.05, 0.05, 0.05), at=(x, y, deck_z + 0.28), color=c["roof"]))
    if spec.get("solar"):
        for column in range(2):
            for row in range(2):
                parts.append(lpm.box(f"solar_panel_{column}_{row}", (0.3, 0.2, 0.012), at=(-0.17 + column * 0.34, -0.2 + row * 0.26, deck_z + 0.012), color=c["solar"]))

    ob = lpm.finish(spec["id"], parts, palette, budget=4000 + 3000 * floors, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = list(spec["footprint"])
    return report


def extrude_x(name, outline, x0, x1, color):
    """Extrude a closed (y, z) outline along X from x0 to x1."""
    count = len(outline)
    verts = [(x0, y, z) for y, z in outline] + [(x1, y, z) for y, z in outline]
    faces = [(i, (i + 1) % count, count + (i + 1) % count, count + i) for i in range(count)]
    faces.append(tuple(reversed(range(count))))
    faces.append(tuple(range(count, 2 * count)))
    return lpm._object(name, _bm(verts, faces), color)


TUDOR_FLOOR = 0.28
TUDOR_GABLES = {3: (0.45,), 4: (-0.5, 0.5), 5: (-0.5, 0.5), 6: (-0.5, 0.5), 7: (-0.5, 0.5), 8: (-0.55, 0.55)}


def tudor_window(parts, tag, face, wall, u, bottom, width, height, c):
    """A leaded window in a timber frame, with a vertical mullion and a transom."""
    face_box(parts, f"{tag}_glass", face, wall, u, width, height, bottom, 0.012, c["glass"])
    for side in (-1, 1):
        face_box(parts, f"{tag}_frame_{side}", face, wall, u + side * (width / 2 + 0.006), 0.014, height + 0.02, bottom - 0.01, 0.02, c["timber"])
    face_box(parts, f"{tag}_sill", face, wall, u, width + 0.03, 0.014, bottom - 0.014, 0.024, c["timber"])
    face_box(parts, f"{tag}_head", face, wall, u, width + 0.03, 0.014, bottom + height, 0.024, c["timber"])
    face_box(parts, f"{tag}_mullion", face, wall, u, 0.008, height, bottom, 0.018, c["timber"])
    face_box(parts, f"{tag}_transom", face, wall, u, width, 0.008, bottom + height * 0.6, 0.018, c["timber"])


def tudor_brace(parts, tag, face, wall, u, width, z, height, flip, c):
    """A diagonal timber brace across a panel."""
    length = math.hypot(width, height)
    angle = math.degrees(math.atan2(height, width)) * flip
    sign = -1 if face in ("front", "left") else 1
    thick = 0.02
    if face in ("front", "back"):
        brace = lpm.box(tag, (length, thick, 0.022), at=(u, wall + sign * (thick / 2 - 0.004), z + height / 2 - 0.011), color=c["timber"])
        lpm.rotate(brace, -angle, axis="Y", about=(u, wall, z + height / 2))
    else:
        brace = lpm.box(tag, (thick, length, 0.022), at=(wall + sign * (thick / 2 - 0.004), u, z + height / 2 - 0.011), color=c["timber"])
        lpm.rotate(brace, angle, axis="X", about=(wall, u, z + height / 2))
    parts.append(brace)


def build_tudor(spec, out_dir):
    """A Tudor half-timbered house, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    Plaster panels in a dark timber frame (rails, studs, braces) with leaded windows, upper floors jettied by 0.03, a steep tiled roof along X with gable ends, front cross gables from Tier 3,
    brick chimneys and, at Tier 8, a corner turret."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("timber", "vtone2"), ("roof", "vtone3"), ("glass", "glass_blue"), ("stone", "grey"),
                                              ("brick", "brick"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors, tier = spec["floors"], spec["tier"]
    fh, plinth = TUDOR_FLOOR, 0.05
    inset = {0: 0.04 if floors == 1 else 0.06}
    half = lambda level: (w / 2 - inset.get(level, 0.03 if floors > 1 else 0.04), d / 2 - inset.get(level, 0.03 if floors > 1 else 0.04))
    parts = [lpm.box("plinth", (2 * half(0)[0] + 0.02, 2 * half(0)[1] + 0.02, plinth), at=(0, 0, 0), color=c["stone"])]
    door_x = 0.0
    for level in range(floors):
        hx, hy = half(level)
        z = plinth + level * fh
        parts.append(lpm.box(f"floor_{level}", (2 * hx, 2 * hy, fh), at=(0, 0, z), color=c["wall"]))
        if level:
            parts.append(lpm.box(f"jetty_{level}", (2 * hx + 0.02, 2 * hy + 0.02, 0.035), at=(0, 0, z - 0.012), color=c["timber"]))
        for face, wall, length in (("front", -hy, 2 * hx), ("back", hy, 2 * hx), ("left", -hx, 2 * hy), ("right", hx, 2 * hy)):
            count = max(2, round(length / 0.36))
            panel = length / count
            origin = -length / 2
            face_box(parts, f"{face}_{level}_rail_low", face, wall, 0, length, 0.03, z, 0.022, c["timber"])
            face_box(parts, f"{face}_{level}_rail_high", face, wall, 0, length, 0.03, z + fh - 0.03, 0.022, c["timber"])
            for stud in range(count + 1):
                u = origin + stud * panel
                end = stud in (0, count)
                face_box(parts, f"{face}_{level}_stud_{stud}", face, wall, u + (0.012 if stud == 0 else -0.012 if stud == count else 0), 0.04 if end else 0.022, fh, z, 0.024, c["timber"])
            door_panel = count // 2
            for panel_index in range(count):
                u = origin + (panel_index + 0.5) * panel
                if face == "front" and level == 0 and panel_index == door_panel:
                    door_x = u
                    continue
                if (panel_index + level) % 2 == 0:
                    tudor_window(parts, f"{face}_{level}_{panel_index}", face, wall, u, z + 0.09, min(panel * 0.5, 0.2), 0.14, c)
                else:
                    tudor_brace(parts, f"{face}_{level}_{panel_index}_brace", face, wall, u, panel - 0.05, z + 0.03, fh - 0.06, 1 if panel_index % 4 == 1 else -1, c)

    hx0, hy0 = half(0)
    door_h = 0.24
    face_box(parts, "door", "front", -hy0, door_x, 0.17, door_h, plinth, 0.016, c["timber"])
    face_box(parts, "door_head", "front", -hy0, door_x, 0.24, 0.025, plinth + door_h, 0.026, c["timber"])
    parts.append(lpm.box("door_step", (0.26, 0.06, 0.03), at=(door_x, -hy0 - 0.03, 0), color=c["stone"]))

    hx, hy = half(floors - 1)
    top = plinth + floors * fh
    s = d / 2
    rise = 0.45 if d == 1 else 0.8
    pitch = rise / s
    parts.append(extrude_x("roof", [(-s, top), (s, top), (0, top + rise)], -hx, hx, c["roof"]))
    parts.append(lpm.box("ridge", (2 * hx + 0.02, 0.05, 0.03), at=(0, 0, top + rise - 0.012), color=c["timber"]))
    for side in (-1, 1):
        x_in, x_out = (hx - 0.01, w / 2 - 0.02) if side == 1 else (-w / 2 + 0.02, -hx + 0.01)
        parts.append(extrude_x(f"gable_end_{side}", [(-hy, top), (hy, top), (0, top + pitch * hy)], x_in, x_out, c["wall"]))
        outer = w / 2 - 0.02 if side == 1 else -w / 2 + 0.02
        parts.append(lpm.box(f"gable_stud_{side}", (0.022, 0.025, pitch * hy), at=(outer + side * 0.009, 0, top), color=c["timber"]))
        parts.append(lpm.box(f"gable_rail_{side}", (0.022, 2 * hy, 0.025), at=(outer + side * 0.009, 0, top), color=c["timber"]))
        parts.append(lpm.box(f"gable_collar_{side}", (0.022, hy, 0.022), at=(outer + side * 0.009, 0, top + pitch * hy * 0.45), color=c["timber"]))

    gable_xs = TUDOR_GABLES.get(tier, ())
    g = 0.3
    front_y = -hy
    for number, gx in enumerate(gable_xs):
        gh = pitch * (g + 0.03)
        parts.append(extrude_y(f"cross_roof_{number}", [(gx - g - 0.03, top), (gx + g + 0.03, top), (gx, top + gh)], front_y - 0.03, 0.0, c["roof"]))
        parts.append(extrude_y(f"cross_wall_{number}", [(gx - g, top), (gx + g, top), (gx, top + pitch * g)], front_y - 0.03, front_y + 0.03, c["wall"]))
        face_box(parts, f"cross_rail_{number}", "front", front_y - 0.015, gx, 2 * g, 0.025, top, 0.024, c["timber"])
        face_box(parts, f"cross_stud_{number}", "front", front_y - 0.015, gx, 0.025, pitch * g, top, 0.024, c["timber"])
        tudor_window(parts, f"cross_window_{number}", "front", front_y - 0.015, gx, top + 0.05, 0.12, 0.1, c)

    stacks = (-hx + 0.28, hx - 0.28) if w >= 2 else (hx - 0.2,)
    for number, x in enumerate(stacks):
        parts.append(lpm.box(f"chimney_{number}", (0.13, 0.13, rise + 0.2), at=(x, 0, top), color=c["brick"]))
        parts.append(lpm.box(f"chimney_cap_{number}", (0.17, 0.17, 0.03), at=(x, 0, top + rise + 0.2), color=c["stone"]))
        for pot in (-1, 1):
            parts.append(lpm.box(f"chimney_pot_{number}_{pot}", (0.04, 0.04, 0.06), at=(x + pot * 0.03, 0, top + rise + 0.23), color=c["brick"]))

    if tier == 8:
        tx, ty, radius = -(w / 2 - 0.2), -(d / 2 - 0.2), 0.2
        parts.append(lpm.prism("turret", 8, radius, floors * fh + plinth + 0.3, at=(tx, ty, 0), color=c["wall"]))
        parts.append(lpm.prism("turret_roof", 8, radius + 0.03, 0.4, at=(tx, ty, top + 0.3), color=c["roof"], radius_top=0.01))
        parts.append(lpm.prism("turret_band", 8, radius + 0.012, 0.025, at=(tx, ty, top + 0.3 - 0.02), color=c["timber"]))

    if spec.get("solar"):
        slope = math.degrees(math.atan2(rise, s))
        blocked = [(gx - g - 0.15, gx + g + 0.15) for gx in gable_xs]
        panels = 0
        x = -hx + 0.25
        while x <= hx - 0.25 and panels < 4:
            if not any(a <= x <= b for a, b in blocked):
                y = -s * 0.5
                zc = top + rise * (1 - 0.5) + 0.008
                panel = lpm.box(f"solar_panel_{panels}", (0.22, 0.2, 0.01), at=(x, y, zc), color=c["solar"])
                lpm.rotate(panel, slope, axis="X", about=(x, y, zc))
                parts.append(panel)
                panels += 1
            x += 0.3

    ob = lpm.finish(spec["id"], parts, palette, budget=6000 + 5000 * floors * max(1, w * d // 2), center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


def arch_outline(u, bottom, width, height, steps=6):
    """The (along, z) outline of an arched opening: a rectangle topped by a half circle."""
    radius = width / 2
    spring = bottom + height - radius
    arc = [(u + radius * math.cos(math.pi * k / steps), spring + radius * math.sin(math.pi * k / steps)) for k in range(steps + 1)]
    return [(u - radius, bottom), (u + radius, bottom)] + arc


def arch_part(parts, name, face, wall, outline, inner, outer, color):
    """An arched slab on a wall plane, from `inner` to `outer` out of the wall."""
    sign = -1 if face in ("front", "left") else 1
    a, b = sorted((wall + sign * -0.004, wall + sign * outer))
    if face in ("front", "back"):
        parts.append(extrude_y(name, outline, a, b, color))
    else:
        parts.append(extrude_x(name, outline, a, b, color))


def tuscan_window(parts, tag, face, wall, u, bottom, width, height, c, glass, shutters=True):
    arch_part(parts, f"{tag}_surround", face, wall, arch_outline(u, bottom - 0.012, width + 0.05, height + 0.04), 0, 0.012, c["stone"])
    arch_part(parts, f"{tag}_glass", face, wall, arch_outline(u, bottom, width, height), 0, 0.018, glass)
    face_box(parts, f"{tag}_bar", face, wall, u, 0.008, height - width / 2, bottom, 0.022, c["timber"])
    for fraction in (0.3, 0.6):
        face_box(parts, f"{tag}_rail_{fraction}", face, wall, u, width, 0.008, bottom + (height - width / 2) * fraction, 0.022, c["timber"])
    face_box(parts, f"{tag}_sill", face, wall, u, width + 0.06, 0.014, bottom - 0.02, 0.03, c["stone"])
    if shutters:
        for side in (-1, 1):
            face_box(parts, f"{tag}_shutter_{side}", face, wall, u + side * (width / 2 + 0.04), 0.055, height - 0.02, bottom, 0.02, c["shutter"])


def hip_roof(name, bx, by, z, rise, color, cx=0.0, cy=0.0):
    """A hipped roof over the rectangle (±bx, ±by): a ridge along X, or a pyramid when the plan is square."""
    rx = bx - by
    base = [(cx - bx, cy - by, z), (cx + bx, cy - by, z), (cx + bx, cy + by, z), (cx - bx, cy + by, z)]
    if rx < 0.01:
        verts = base + [(cx, cy, z + rise)]
        faces = [(0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4), (0, 3, 2, 1)]
    else:
        verts = base + [(cx - rx, cy, z + rise), (cx + rx, cy, z + rise)]
        faces = [(0, 1, 5, 4), (1, 2, 5), (2, 3, 4, 5), (3, 0, 4), (0, 3, 2, 1)]
    return lpm._object(name, _bm(verts, faces), color)


def tuscan_tower(parts, c, tag, x, y, size, z, height, flag=False):
    """A square tower rising out of the roof, an arched opening on each face, a cornice and a small hip roof."""
    parts.append(lpm.box(f"{tag}_body", (size, size, height), at=(x, y, z), color=c["wall"]))
    parts.append(lpm.box(f"{tag}_cornice", (size + 0.06, size + 0.06, 0.03), at=(x, y, z + height), color=c["stone"]))
    parts.append(hip_roof(f"{tag}_roof", (size + 0.06) / 2, (size + 0.06) / 2, z + height + 0.03, 0.14, c["roof"], cx=x, cy=y))
    opening = size * 0.38
    bottom = z + height - opening - 0.1
    for face, wall in (("front", y - size / 2), ("back", y + size / 2)):
        arch_part(parts, f"{tag}_{face}_hole", face, wall, arch_outline(x, bottom, opening, opening + 0.06), 0, 0.012, c["frame"])
    for face, wall in (("left", x - size / 2), ("right", x + size / 2)):
        arch_part(parts, f"{tag}_{face}_hole", face, wall, arch_outline(y, bottom, opening, opening + 0.06), 0, 0.012, c["frame"])
    if flag:
        top = z + height + 0.17
        parts.append(lpm.box(f"{tag}_pole", (0.012, 0.012, 0.18), at=(x, y, top), color=c["frame"]))
        parts.append(lpm.box(f"{tag}_flag", (0.1, 0.01, 0.06), at=(x + 0.05, y, top + 0.11), color=c["roof"]))


def build_tuscan(spec, out_dir):
    """A Tuscan villa, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    Ochre stucco walls with stone quoins, arched windows with green shutters, an arched door and a bracketed cornice under a low hipped terracotta roof.
    Tier 3 adds an iron balcony, Tier 4 a dovecote tower, Tiers 5 to 8 a tower that grows with the floors."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("stone", "vtone2"), ("roof", "vtone3"), ("glass", "glass_blue"), ("timber", "timber"),
                                              ("shutter", "shutter_green"), ("frame", "graphite"), ("bush", "bush"), ("solar", "solar"), ("cypress", "softgreen"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors, tier = spec["floors"], spec["tier"]
    fh, plinth = 0.28, 0.05
    hx, hy = w / 2 - 0.05, d / 2 - 0.05
    top = plinth + floors * fh
    parts = [lpm.box("plinth", (2 * hx + 0.02, 2 * hy + 0.02, plinth), at=(0, 0, 0), color=c["stone"]),
             lpm.box("walls", (2 * hx, 2 * hy, floors * fh), at=(0, 0, plinth), color=c["wall"]),
             lpm.box("cornice", (2 * hx + 0.06, 2 * hy + 0.06, 0.03), at=(0, 0, top), color=c["stone"])]
    for number in range(int((2 * hx) / 0.12)):
        x = -hx + 0.06 + number * 0.12
        parts.append(lpm.box(f"bracket_front_{number}", (0.05, 0.03, 0.04), at=(x, -hy - 0.025, top - 0.04), color=c["timber"]))
    for corner_x in (-1, 1):
        for corner_y in (-1, 1):
            for block in range(floors * 3):
                z = plinth + block * fh / 3
                long_ = 0.085 if block % 2 == 0 else 0.055
                parts.append(lpm.box(f"quoin_x_{corner_x}_{corner_y}_{block}", (long_, 0.016, fh / 3 - 0.012), at=(corner_x * (hx - long_ / 2 + 0.004), corner_y * (hy + 0.006), z + 0.006), color=c["stone"]))
                parts.append(lpm.box(f"quoin_y_{corner_x}_{corner_y}_{block}", (0.016, 0.085 + 0.055 - long_, fh / 3 - 0.012), at=(corner_x * (hx + 0.006), corner_y * (hy - (0.14 - long_) / 2 + 0.004), z + 0.006), color=c["stone"]))

    door_x = 0.0
    for level in range(floors):
        z = plinth + level * fh
        for face, wall, length in (("front", -hy, 2 * hx), ("back", hy, 2 * hx), ("left", -hx, 2 * hy), ("right", hx, 2 * hy)):
            count = max(2, round(length / 0.42))
            panel = length / count
            origin = -length / 2
            for panel_index in range(count):
                u = origin + (panel_index + 0.5) * panel
                if face == "front" and level == 0 and panel_index == count // 2:
                    door_x = u
                    continue
                tuscan_window(parts, f"{face}_{level}_{panel_index}", face, wall, u, z + 0.07, min(0.15, panel * 0.4), 0.17, c, c["glass"])
        if level:
            parts.append(lpm.box(f"string_{level}", (2 * hx + 0.02, 2 * hy + 0.02, 0.014), at=(0, 0, z - 0.007), color=c["stone"]))

    arch_part(parts, "door_surround", "front", -hy, arch_outline(door_x, plinth - 0.01, 0.23, 0.31), 0, 0.016, c["stone"])
    arch_part(parts, "door", "front", -hy, arch_outline(door_x, plinth, 0.17, 0.26), 0, 0.022, c["timber"])
    parts.append(lpm.box("door_step", (0.26, 0.05, 0.025), at=(door_x, -hy - 0.025, 0), color=c["stone"]))
    if tier >= 3:
        slab_z = plinth + fh + 0.012
        parts.append(lpm.box("balcony_slab", (0.36, 0.045, 0.016), at=(door_x, -hy - 0.0225, slab_z), color=c["stone"]))
        parts.append(lpm.box("balcony_rail", (0.36, 0.008, 0.012), at=(door_x, -hy - 0.04, slab_z + 0.07), color=c["frame"]))
        for post in range(7):
            parts.append(lpm.box(f"balcony_post_{post}", (0.008, 0.008, 0.066), at=(door_x - 0.18 + post * 0.06, -hy - 0.04, slab_z + 0.018), color=c["frame"]))

    over = 0.04
    rise = 0.3 * (hy + over) + 0.08
    parts.append(hip_roof("roof", hx + over, hy + over, top + 0.03, rise, c["roof"]))
    ridge_len = max(hx - hy, 0)
    chimney_x = hx * 0.5 if w > 1 else 0.0
    parts.append(lpm.box("chimney", (0.12, 0.12, rise + 0.1), at=(chimney_x, 0.12, top + 0.03), color=c["wall"]))
    parts.append(lpm.box("chimney_cap", (0.16, 0.16, 0.025), at=(chimney_x, 0.12, top + 0.03 + rise + 0.1), color=c["stone"]))

    if tier == 4:
        tuscan_tower(parts, c, "dovecote", hx - 0.3, 0.0, 0.26, top + 0.03, 0.32)
    if tier >= 5:
        tuscan_tower(parts, c, "tower", -hx + 0.34, hy - 0.34, 0.42, top + 0.03, 0.3 + 0.07 * (tier - 5), flag=tier == 8)

    if spec.get("solar"):
        slope = math.degrees(math.atan2(rise, hy + over))
        y = -(hy + over) * 0.5
        zc = top + 0.03 + rise * 0.5 + 0.01
        reach = ridge_len + (hy + over) * 0.5
        panels = 0
        x = -reach + 0.14
        while x <= reach - 0.14 and panels < 4:
            panel = lpm.box(f"solar_panel_{panels}", (0.22, 0.2, 0.01), at=(x, y, zc), color=c["solar"])
            lpm.rotate(panel, slope, axis="X", about=(x, y, zc))
            parts.append(panel)
            panels += 1
            x += 0.28

    ob = lpm.finish(spec["id"], parts, palette, budget=8000 + 6000 * floors * max(1, w * d // 2), center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


def chalet_window(parts, tag, face, wall, u, bottom, width, height, c):
    """A white-framed window with a cross of bars and red shutters."""
    face_box(parts, f"{tag}_glass", face, wall, u, width, height, bottom, 0.012, c["glass"])
    for side in (-1, 1):
        face_box(parts, f"{tag}_frame_{side}", face, wall, u + side * (width / 2 + 0.006), 0.014, height + 0.02, bottom - 0.01, 0.018, c["white"])
        face_box(parts, f"{tag}_shutter_{side}", face, wall, u + side * (width / 2 + 0.04), 0.05, height, bottom, 0.02, c["shutter"])
    face_box(parts, f"{tag}_sill", face, wall, u, width + 0.03, 0.014, bottom - 0.014, 0.022, c["white"])
    face_box(parts, f"{tag}_head", face, wall, u, width + 0.03, 0.014, bottom + height, 0.022, c["white"])
    face_box(parts, f"{tag}_bar_v", face, wall, u, 0.008, height, bottom, 0.016, c["white"])
    face_box(parts, f"{tag}_bar_h", face, wall, u, width, 0.008, bottom + height / 2, 0.016, c["white"])


def chalet_slope(parts, name, cx, z, length, depth, angle, color, thick=0.03):
    """A roof slope: a slab `length` long across the slope and `depth` along Y, tilted by `angle` degrees about its centre."""
    slab = lpm.box(name, (length, depth, thick), at=(cx, 0, z), color=color)
    lpm.rotate(slab, angle, axis="Y", about=(cx, 0, z + thick / 2))
    parts.append(slab)


def build_chalet(spec, out_dir):
    """An Alpine chalet, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    A stone base under log walls, one front-gabled shingle roof per metre of width (a thin shell on a gable wall, so the gable stays visible), red-shuttered windows,
    carved balconies on every upper floor from Tier 3, a stone chimney from Tier 4 and a ridge cupola at Tier 8."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("stone", "vtone2"), ("roof", "vtone3"), ("glass", "glass_blue"), ("white", "white"), ("shutter", "brick"),
                                              ("timber", "timber"), ("frame", "graphite"), ("bush", "bush"), ("solar", "solar"), ("log", "darkwood"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors, tier = spec["floors"], spec["tier"]
    fh, plinth = 0.28, 0.1
    hx, hy = w / 2 - 0.06, d / 2 - 0.07
    top = plinth + floors * fh
    parts = [lpm.box("plinth", (2 * hx + 0.03, 2 * hy + 0.03, plinth), at=(0, 0, 0), color=c["stone"]),
             lpm.box("walls", (2 * hx, 2 * hy, floors * fh), at=(0, 0, plinth), color=c["wall"]),
             lpm.box("eave_beam", (2 * hx + 0.02, 2 * hy + 0.02, 0.03), at=(0, 0, top - 0.03), color=c["timber"])]
    for line in range(floors * 4):
        parts.append(lpm.box(f"log_{line}", (2 * hx + 0.012, 2 * hy + 0.012, 0.008), at=(0, 0, plinth + 0.07 * (line + 1) - 0.004), color=c["log"]))

    door_x = 0.0
    for level in range(floors):
        z = plinth + level * fh
        for face, wall, length in (("front", -hy, 2 * hx), ("back", hy, 2 * hx), ("left", -hx, 2 * hy), ("right", hx, 2 * hy)):
            count = max(2, round(length / 0.45))
            panel = length / count
            origin = -length / 2
            for panel_index in range(count):
                u = origin + (panel_index + 0.5) * panel
                if face == "front" and level == 0 and panel_index == count // 2:
                    door_x = u
                    continue
                chalet_window(parts, f"{face}_{level}_{panel_index}", face, wall, u, z + 0.08, 0.13, 0.13, c)
    face_box(parts, "door", "front", -hy, door_x, 0.17, 0.24, plinth, 0.016, c["timber"])
    face_box(parts, "door_frame_top", "front", -hy, door_x, 0.23, 0.025, plinth + 0.24, 0.024, c["white"])
    parts.append(lpm.box("door_step", (0.28, 0.05, 0.04), at=(door_x, -hy - 0.025, 0), color=c["stone"]))

    rise, span = 0.28, 0.5
    angle = math.degrees(math.atan2(rise, span))
    length = math.hypot(span, rise)
    centers = [-w / 2 + 0.5 + bay for bay in range(w)]
    for bay, cx in enumerate(centers):
        chalet_slope(parts, f"slope_left_{bay}", cx - span / 2, top + rise / 2 - 0.012, length - 0.01, d, -angle, c["roof"])
        chalet_slope(parts, f"slope_right_{bay}", cx + span / 2, top + rise / 2 - 0.012, length - 0.01, d, angle, c["roof"])
        parts.append(lpm.box(f"ridge_{bay}", (0.05, d, 0.03), at=(cx, 0, top + rise - 0.002), color=c["timber"]))
        for face_y, wall in ((-hy, -hy), (hy, hy)):
            sign = -1 if face_y < 0 else 1
            parts.append(extrude_y(f"gable_{bay}_{sign}", [(cx - span + 0.03, top - 0.03), (cx + span - 0.03, top - 0.03), (cx, top + rise - 0.025)], min(wall, wall + sign * 0.03), max(wall, wall + sign * 0.03), c["wall"]))
        parts.append(lpm.box(f"gable_window_post_{bay}", (0.01, 0.014, 0.1), at=(cx, -hy - 0.007, top - 0.02), color=c["white"]))
        face_box(parts, f"gable_window_{bay}", "front", -hy + 0.03, cx, 0.1, 0.1, top - 0.02, 0.014, c["glass"])
    for bay, cx in enumerate(centers):
        for side in (-1, 1):
            barge_z = top + rise / 2 - 0.012
            barge = lpm.box(f"barge_{bay}_{side}", (length - 0.01, 0.03, 0.04), at=(cx + side * span / 2, -d / 2 + 0.015, barge_z), color=c["timber"])
            lpm.rotate(barge, angle * side, axis="Y", about=(cx + side * span / 2, -d / 2 + 0.015, barge_z + 0.02))
            parts.append(barge)

    if tier >= 3:
        for level in range(1, floors):
            zb = plinth + level * fh
            parts.append(lpm.box(f"balcony_slab_{level}", (2 * hx - 0.02, 0.065, 0.02), at=(0, -hy - 0.0325, zb), color=c["timber"]))
            parts.append(lpm.box(f"balcony_rail_{level}", (2 * hx - 0.02, 0.014, 0.014), at=(0, -hy - 0.058, zb + 0.09), color=c["timber"]))
            posts = int((2 * hx - 0.02) / 0.07)
            for post in range(posts):
                parts.append(lpm.box(f"balcony_post_{level}_{post}", (0.014, 0.014, 0.08), at=(-hx + 0.03 + post * (2 * hx - 0.06) / (posts - 1), -hy - 0.058, zb + 0.014), color=c["timber"]))
    else:
        for window in (-1, 1):
            if abs(door_x + window * 0.3) > hx - 0.1:
                continue
            parts.append(lpm.box(f"planter_{window}", (0.16, 0.04, 0.04), at=(door_x + window * 0.3, -hy - 0.02, plinth + 0.05), color=c["timber"]))
            parts.append(lpm.box(f"planter_bush_{window}", (0.14, 0.03, 0.03), at=(door_x + window * 0.3, -hy - 0.02, plinth + 0.09), color=c["bush"]))

    chimney_x = centers[-1] + 0.2
    if tier >= 4:
        parts.append(lpm.box("chimney", (0.14, 0.14, rise + 0.16), at=(chimney_x, 0.1, top), color=c["stone"]))
        parts.append(lpm.box("chimney_cap", (0.18, 0.18, 0.025), at=(chimney_x, 0.1, top + rise + 0.16), color=c["timber"]))
    else:
        parts.append(lpm.box("stovepipe", (0.05, 0.05, rise + 0.14), at=(chimney_x, 0.1, top), color=c["frame"]))
    if tier == 8:
        cx = centers[0]
        parts.append(lpm.box("cupola", (0.18, 0.18, 0.18), at=(cx, 0, top + rise - 0.002), color=c["wall"]))
        for face_name, wall_pos in (("front", -0.09), ("back", 0.09)):
            face_box(parts, f"cupola_{face_name}", face_name, wall_pos, cx, 0.09, 0.1, top + rise + 0.03, 0.014, c["glass"])
        parts.append(hip_roof("cupola_roof", 0.12, 0.12, top + rise + 0.178, 0.12, c["roof"], cx=cx, cy=0))
        parts.append(lpm.box("vane", (0.01, 0.01, 0.1), at=(cx, 0, top + rise + 0.298), color=c["frame"]))

    if spec.get("solar"):
        cx = centers[-1] + span / 2
        zc = top + rise / 2 + 0.014
        count = 2 if d == 1 else 4
        for row in range(count):
            y = -d / 2 + 0.2 + (d - 0.4) * (row + 0.5) / count
            panel = lpm.box(f"solar_panel_{row}", (0.3, (d - 0.4) / count - 0.04, 0.01), at=(cx, y, zc), color=c["solar"])
            lpm.rotate(panel, angle, axis="Y", about=(cx, y, zc))
            parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=8000 + 6000 * floors * max(1, w * d // 2), center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


STUGA_DORMERS = {3: (0.0,), 4: (-0.5, 0.5), 5: (-0.5, 0.5), 6: (-0.5, 0.5), 7: (-0.6, 0.0, 0.6), 8: (-0.6, 0.0, 0.6)}


def stuga_window(parts, tag, face, wall, u, bottom, width, height, c):
    """A white-framed window with one vertical and two horizontal bars."""
    face_box(parts, f"{tag}_glass", face, wall, u, width, height, bottom, 0.012, c["glass"])
    for side in (-1, 1):
        face_box(parts, f"{tag}_frame_{side}", face, wall, u + side * (width / 2 + 0.008), 0.016, height + 0.03, bottom - 0.015, 0.02, c["trim"])
    face_box(parts, f"{tag}_sill", face, wall, u, width + 0.04, 0.016, bottom - 0.016, 0.026, c["trim"])
    face_box(parts, f"{tag}_head", face, wall, u, width + 0.04, 0.016, bottom + height, 0.024, c["trim"])
    face_box(parts, f"{tag}_bar_v", face, wall, u, 0.008, height, bottom, 0.017, c["trim"])
    for fraction in (0.33, 0.66):
        face_box(parts, f"{tag}_bar_h_{fraction}", face, wall, u, width, 0.008, bottom + height * fraction, 0.017, c["trim"])


def build_stuga(spec, out_dir):
    """A Scandinavian stuga, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    Painted board walls with white corner boards, belts and window frames, a dark gabled roof along X (one ridge per metre of depth) with red gable ends,
    a door hood on two posts, a white chimney, front dormers from Tier 3 and a ridge cupola at Tier 8."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("trim", "vtone2"), ("roof", "vtone3"), ("glass", "glass_blue"), ("stone", "grey"),
                                              ("door", "darkwood"), ("frame", "graphite"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors, tier = spec["floors"], spec["tier"]
    fh, plinth = 0.28, 0.06
    hx, hy = w / 2 - 0.04, d / 2 - 0.06
    top = plinth + floors * fh
    parts = [lpm.box("plinth", (2 * hx + 0.02, 2 * hy + 0.02, plinth), at=(0, 0, 0), color=c["stone"]),
             lpm.box("walls", (2 * hx, 2 * hy, floors * fh), at=(0, 0, plinth), color=c["wall"]),
             lpm.box("eave_board", (2 * hx + 0.02, 2 * hy + 0.02, 0.03), at=(0, 0, top - 0.03), color=c["trim"])]
    for level in range(1, floors):
        parts.append(lpm.box(f"belt_{level}", (2 * hx + 0.016, 2 * hy + 0.016, 0.02), at=(0, 0, plinth + level * fh - 0.01), color=c["trim"]))
    for corner_x in (-1, 1):
        for corner_y in (-1, 1):
            parts.append(lpm.box(f"corner_{corner_x}_{corner_y}", (0.05, 0.05, floors * fh), at=(corner_x * (hx - 0.02), corner_y * (hy - 0.02), plinth), color=c["trim"]))

    door_x = 0.0
    for level in range(floors):
        z = plinth + level * fh
        for face, wall, length in (("front", -hy, 2 * hx), ("back", hy, 2 * hx), ("left", -hx, 2 * hy), ("right", hx, 2 * hy)):
            count = max(2, round(length / 0.45))
            panel = length / count
            origin = -length / 2
            for panel_index in range(count):
                u = origin + (panel_index + 0.5) * panel
                if face == "front" and level == 0 and panel_index == count // 2:
                    door_x = u
                    continue
                stuga_window(parts, f"{face}_{level}_{panel_index}", face, wall, u, z + 0.08, 0.14, 0.15, c)
    face_box(parts, "door", "front", -hy, door_x, 0.17, 0.24, plinth, 0.016, c["door"])
    door_frame(parts, "door", door_x, -hy, plinth, 0.17, 0.24, c["trim"], thick=0.02)
    parts.append(lpm.box("door_step", (0.28, 0.05, 0.03), at=(door_x, -hy - 0.025, 0), color=c["stone"]))
    hood_z = plinth + 0.27
    parts.append(extrude_y("door_hood", [(door_x - 0.19, hood_z), (door_x + 0.19, hood_z), (door_x, hood_z + 0.09)], -hy - 0.07, -hy + 0.01, c["roof"]))
    for side in (-1, 1):
        parts.append(lpm.box(f"door_post_{side}", (0.025, 0.025, 0.27), at=(door_x + side * 0.16, -hy - 0.055, plinth - 0.002), color=c["trim"]))

    span, rise = 0.5, 0.29
    bays = [0.0] if d == 1 else [-0.5, 0.5]
    for number, cy in enumerate(bays):
        parts.append(extrude_x(f"roof_{number}", [(cy - span, top), (cy + span, top), (cy, top + rise)], -hx, hx, c["roof"]))
        parts.append(lpm.box(f"ridge_{number}", (2 * hx + 0.02, 0.04, 0.025), at=(0, cy, top + rise - 0.012), color=c["trim"]))
        for side in (-1, 1):
            x_a, x_b = (hx - 0.01, w / 2 - 0.02) if side == 1 else (-w / 2 + 0.02, -hx + 0.01)
            parts.append(extrude_x(f"gable_{number}_{side}", [(cy - span, top), (cy + span, top), (cy, top + rise)], x_a, x_b, c["wall"]))
            stuga_window(parts, f"gable_window_{number}_{side}", "right" if side == 1 else "left", side * (w / 2 - 0.02), cy, top + 0.04, 0.1, 0.1, c)

    front_cy = bays[0]
    for number, x in enumerate(STUGA_DORMERS.get(tier, ())):
        y_front = front_cy - 0.2
        z_base = top + rise * 0.6 - 0.03
        parts.append(lpm.box(f"dormer_{number}", (0.2, 0.2, 0.15), at=(x, front_cy - 0.1, z_base), color=c["wall"]))
        parts.append(extrude_y(f"dormer_roof_{number}", [(x - 0.13, z_base + 0.15), (x + 0.13, z_base + 0.15), (x, z_base + 0.25)], y_front - 0.03, front_cy + 0.05, c["roof"]))
        stuga_window(parts, f"dormer_window_{number}", "front", y_front, x, z_base + 0.03, 0.09, 0.09, c)

    for number, x in enumerate((hx * 0.55, -hx * 0.55) if w >= 2 and tier >= 5 else (hx * 0.55 if w >= 2 else 0.0,)):
        parts.append(lpm.box(f"chimney_{number}", (0.12, 0.12, rise + 0.16), at=(x, front_cy + 0.1, top), color=c["trim"]))
        parts.append(lpm.box(f"chimney_cap_{number}", (0.15, 0.15, 0.025), at=(x, front_cy + 0.1, top + rise + 0.16), color=c["frame"]))

    if tier == 8:
        cx, cy = 0.0, bays[-1]
        parts.append(lpm.box("cupola", (0.18, 0.18, 0.16), at=(cx, cy, top + rise - 0.004), color=c["wall"]))
        for face_name, wall_pos in (("front", cy - 0.09), ("back", cy + 0.09)):
            face_box(parts, f"cupola_{face_name}", face_name, wall_pos, cx, 0.08, 0.09, top + rise + 0.03, 0.014, c["glass"])
        parts.append(hip_roof("cupola_roof", 0.12, 0.12, top + rise + 0.156, 0.11, c["roof"], cx=cx, cy=cy))
        parts.append(lpm.box("vane", (0.01, 0.01, 0.1), at=(cx, cy, top + rise + 0.266), color=c["frame"]))

    if spec.get("solar"):
        slope = math.degrees(math.atan2(rise, span))
        blocked = [x for x in STUGA_DORMERS.get(tier, ())]
        panels = 0
        x = -hx + 0.25
        while x <= hx - 0.25 and panels < 4:
            if not any(abs(x - b) < 0.24 for b in blocked):
                y = front_cy - span / 2
                zc = top + rise / 2 + 0.01
                panel = lpm.box(f"solar_panel_{panels}", (0.22, 0.2, 0.01), at=(x, y, zc), color=c["solar"])
                lpm.rotate(panel, slope, axis="X", about=(x, y, zc))
                parts.append(panel)
                panels += 1
            x += 0.3

    ob = lpm.finish(spec["id"], parts, palette, budget=8000 + 6000 * floors * max(1, w * d // 2), center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


def build_turf(spec, out_dir):
    """An Icelandic turf house, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    Low earth-and-stone walls, a tarred wooden gable front per metre of width with small white-framed windows, steep sod roofs along Y with an earth edge and grass tufts,
    a wooden porch from Tier 3, a stone chimney from Tier 4 and a ridge cupola at Tier 8."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("stone", "vtone2"), ("roof", "vtone3"), ("glass", "glass_blue"), ("trim", "white"), ("door", "timber"),
                                              ("frame", "graphite"), ("bush", "bush"), ("solar", "solar"), ("rock", "grey"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors, tier = spec["floors"], spec["tier"]
    fh, plinth = 0.28, 0.06
    hx, hy = w / 2 - 0.06, d / 2 - 0.07
    top = plinth + floors * fh
    parts = [lpm.box("plinth", (2 * hx + 0.03, 2 * hy + 0.03, plinth), at=(0, 0, 0), color=c["rock"]),
             lpm.box("walls_low", (2 * hx, 2 * hy, fh), at=(0, 0, plinth), color=c["stone"])]
    if floors > 1:
        parts.append(lpm.box("walls_up", (2 * hx, 2 * hy, (floors - 1) * fh), at=(0, 0, plinth + fh), color=c["wall"]))
    parts.append(lpm.box("eave_edge", (2 * hx + 0.02, 2 * hy + 0.02, 0.025), at=(0, 0, top - 0.025), color=c["stone"]))
    centers = [-w / 2 + 0.5 + bay for bay in range(w)]
    for bay, cx in enumerate(centers):
        parts.append(lpm.box(f"front_board_{bay}", (0.9, 0.016, floors * fh), at=(cx, -hy - 0.006, plinth), color=c["wall"]))
        for line in range(floors * 3):
            parts.append(lpm.box(f"board_line_{bay}_{line}", (0.9, 0.018, 0.006), at=(cx, -hy - 0.006, plinth + 0.09 * (line + 1)), color=c["door"]))

    door_x = centers[len(centers) // 2 if w > 1 else 0] if w == 1 else centers[0]
    face_box(parts, "door", "front", -hy - 0.014, door_x, 0.14, 0.2, plinth, 0.016, c["door"])
    face_box(parts, "door_head", "front", -hy - 0.014, door_x, 0.2, 0.02, plinth + 0.2, 0.022, c["trim"])
    parts.append(lpm.box("door_step", (0.24, 0.05, 0.03), at=(door_x, -hy - 0.04, 0), color=c["rock"]))
    for level in range(floors):
        z = plinth + level * fh
        for bay, cx in enumerate(centers):
            for u in (cx - 0.25, cx + 0.25):
                if level == 0 and abs(u - door_x) < 0.2:
                    continue
                stuga_window(parts, f"front_{level}_{bay}_{u:.2f}", "front", -hy - 0.014, u, z + 0.09, 0.1, 0.12, c)
        for face, wall, length in (("back", hy, 2 * hx), ("left", -hx, 2 * hy), ("right", hx, 2 * hy)):
            count = max(1, round(length / 0.6))
            panel = length / count
            for panel_index in range(count):
                stuga_window(parts, f"{face}_{level}_{panel_index}", face, wall, -length / 2 + (panel_index + 0.5) * panel, z + 0.09, 0.1, 0.12, c)

    span, rise = 0.5, 0.36
    angle = math.degrees(math.atan2(rise, span))
    length = math.hypot(span, rise)
    for bay, cx in enumerate(centers):
        chalet_slope(parts, f"sod_left_{bay}", cx - span / 2, top + rise / 2 - 0.012, length - 0.04, d, -angle, c["roof"], thick=0.06)
        chalet_slope(parts, f"sod_right_{bay}", cx + span / 2, top + rise / 2 - 0.012, length - 0.04, d, angle, c["roof"], thick=0.06)
        parts.append(lpm.box(f"ridge_{bay}", (0.07, d, 0.04), at=(cx, 0, top + rise - 0.004), color=c["stone"]))
        parts.append(extrude_y(f"gable_{bay}", [(cx - span + 0.03, top - 0.025), (cx + span - 0.03, top - 0.025), (cx, top + rise - 0.03)], -hy - 0.014, -hy + 0.03, c["wall"]))
        stuga_window(parts, f"gable_window_{bay}", "front", -hy - 0.014, cx, top + 0.04, 0.09, 0.09, c)
        parts.append(extrude_y(f"gable_back_{bay}", [(cx - span + 0.03, top - 0.025), (cx + span - 0.03, top - 0.025), (cx, top + rise - 0.03)], hy - 0.03, hy + 0.014, c["wall"]))
        stuga_window(parts, f"gable_window_back_{bay}", "back", hy + 0.014, cx, top + 0.04, 0.09, 0.09, c)
        for side in (-1, 1):
            edge = lpm.box(f"sod_edge_{bay}_{side}", (length - 0.04, 0.03, 0.05), at=(cx + side * span / 2, -d / 2 + 0.015, top + rise / 2 - 0.012), color=c["stone"])
            lpm.rotate(edge, angle * side, axis="Y", about=(cx + side * span / 2, -d / 2 + 0.015, top + rise / 2 + 0.013))
            parts.append(edge)
        for tuft in range(3 + tier // 3):
            y = -d / 2 + 0.2 + (d - 0.4) * tuft / (2 + tier // 3)
            parts.append(lpm.prism(f"tuft_{bay}_{tuft}", 6, 0.035, 0.05, at=(cx, y, top + rise + 0.03), color=c["bush"], radius_top=0.005))

    if tier >= 3:
        door_bay = centers[0]
        parts.append(extrude_y("porch_roof", [(door_x - 0.2, plinth + 0.27), (door_x + 0.2, plinth + 0.27), (door_x, plinth + 0.37)], -hy - 0.075, -hy - 0.014, c["door"]))
        for side in (-1, 1):
            parts.append(lpm.box(f"porch_post_{side}", (0.025, 0.025, 0.27), at=(door_x + side * 0.17, -hy - 0.06, plinth - 0.002), color=c["door"]))
    chimney_x = centers[-1] + 0.2
    if tier >= 4:
        parts.append(lpm.box("chimney", (0.13, 0.13, rise + 0.16), at=(chimney_x, 0.1, top), color=c["rock"]))
        parts.append(lpm.box("chimney_cap", (0.17, 0.17, 0.025), at=(chimney_x, 0.1, top + rise + 0.16), color=c["door"]))
    else:
        parts.append(lpm.box("stovepipe", (0.05, 0.05, rise + 0.12), at=(chimney_x, 0.1, top), color=c["frame"]))
    if tier == 8:
        cx = centers[0]
        parts.append(lpm.box("cupola", (0.18, 0.18, 0.16), at=(cx, 0, top + rise - 0.004), color=c["wall"]))
        for face_name, wall_pos in (("front", -0.09), ("back", 0.09)):
            face_box(parts, f"cupola_{face_name}", face_name, wall_pos, cx, 0.08, 0.09, top + rise + 0.03, 0.014, c["glass"])
        parts.append(hip_roof("cupola_roof", 0.12, 0.12, top + rise + 0.156, 0.11, c["roof"], cx=cx, cy=0))
        parts.append(lpm.box("vane", (0.01, 0.01, 0.1), at=(cx, 0, top + rise + 0.266), color=c["frame"]))

    if spec.get("solar"):
        cx = centers[-1] + span / 2
        zc = top + rise / 2 + 0.045
        count = 2 if d == 1 else 4
        for row in range(count):
            y = -d / 2 + 0.2 + (d - 0.4) * (row + 0.5) / count
            panel = lpm.box(f"solar_panel_{row}", (0.3, (d - 0.4) / count - 0.04, 0.01), at=(cx, y, zc), color=c["solar"])
            lpm.rotate(panel, angle, axis="Y", about=(cx, y, zc))
            parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=8000 + 6000 * floors * max(1, w * d // 2), center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


def aegean_window(parts, tag, face, wall, u, bottom, width, height, c):
    """A small square window in an accent-colored frame with two shutters."""
    face_box(parts, f"{tag}_glass", face, wall, u, width, height, bottom, 0.012, c["glass"])
    for side in (-1, 1):
        face_box(parts, f"{tag}_shutter_{side}", face, wall, u + side * (width / 2 + 0.03), 0.05, height, bottom, 0.018, c["accent"])
    face_box(parts, f"{tag}_head", face, wall, u, width + 0.02, 0.012, bottom + height, 0.02, c["accent"])
    face_box(parts, f"{tag}_bar", face, wall, u, 0.008, height, bottom, 0.016, c["accent"])


def aegean_parapet(parts, tag, x0, x1, y0, y1, z, c):
    """A low parapet along the four edges of a flat roof."""
    parts.append(lpm.box(f"{tag}_front", (x1 - x0, 0.035, 0.05), at=((x0 + x1) / 2, y0 + 0.0175, z), color=c["wall"]))
    parts.append(lpm.box(f"{tag}_back", (x1 - x0, 0.035, 0.05), at=((x0 + x1) / 2, y1 - 0.0175, z), color=c["wall"]))
    parts.append(lpm.box(f"{tag}_left", (0.035, y1 - y0, 0.05), at=(x0 + 0.0175, (y0 + y1) / 2, z), color=c["wall"]))
    parts.append(lpm.box(f"{tag}_right", (0.035, y1 - y0, 0.05), at=(x1 - 0.0175, (y0 + y1) / 2, z), color=c["wall"]))


def aegean_dome(parts, c, tag, x, y, z, size):
    """A domed whitewashed chapel: a cube, a ring, a hemisphere and a small cross."""
    parts.append(lpm.box(f"{tag}_cube", (size, size, size * 0.75), at=(x, y, z), color=c["wall"]))
    aegean_arch = arch_outline(x, z + 0.02, size * 0.3, size * 0.5)
    arch_part(parts, f"{tag}_door", "front", y - size / 2, aegean_arch, 0, 0.012, c["accent"])
    ring = size * 0.5
    parts.append(lpm.prism(f"{tag}_ring", 12, ring, 0.025, at=(x, y, z + size * 0.75), color=c["wall"]))
    profile = [(0.0, 0.0), (ring * 0.98, 0.0)] + [(ring * 0.98 * math.cos(math.radians(a)), ring * 0.98 * math.sin(math.radians(a)) * 0.9) for a in range(15, 91, 15)]
    parts.append(lpm.lathe(f"{tag}_dome", profile, segments=12, at=(x, y, z + size * 0.75 + 0.025), color=c["dome"]))


def aegean_bougainvillea(parts, c, tag, x, y, z, wall_y):
    """A leafy mound dotted with pink blooms, and a vine of leaves and blooms hanging down the wall below it."""
    parts.append(lpm.prism(f"{tag}_mound", 8, 0.085, 0.07, at=(x, y, z), color=c["leaf"], radius_top=0.05))
    for number, (dx, dy, dz) in enumerate(((0.06, 0.0, 0.03), (-0.05, 0.04, 0.04), (0.02, -0.06, 0.05), (-0.03, -0.03, 0.075), (0.05, 0.05, 0.05), (0.0, 0.02, 0.085), (-0.07, -0.01, 0.02))):
        parts.append(lpm.box(f"{tag}_bloom_{number}", (0.03, 0.03, 0.03), at=(x + dx, y + dy, z + dz), color=c["flower"]))
    parts.append(lpm.box(f"{tag}_vine", (0.1, 0.02, 0.2), at=(x, wall_y - 0.012, z - 0.14), color=c["leaf"]))
    for number, (dx, dz) in enumerate(((-0.03, -0.02), (0.03, -0.06), (-0.02, -0.1), (0.03, -0.14), (0.0, -0.18))):
        parts.append(lpm.box(f"{tag}_vine_bloom_{number}", (0.03, 0.025, 0.03), at=(x + dx, wall_y - 0.02, z + dz), color=c["flower"]))


def build_aegean(spec, out_dir):
    """A whitewashed Aegean house, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    Stacked flat-roofed cubes that shrink floor after floor, flush at the back and on the stair side (each floor is set back from the front and from the left side) so each floor leaves a parapeted terrace, blue doors, shutters and arches, an outside stair from Tier 3,
    a pergola from Tier 2 on one side of the top roof, bougainvillea, and a blue dome on the other side from Tier 4 (a chapel from Tier 5)."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("accent", "vtone2"), ("dome", "vtone3"), ("glass", "glass_blue"), ("floor", "usand"),
                                              ("flower", "pink"), ("leaf", "bush"), ("frame", "graphite"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors, tier = spec["floors"], spec["tier"]
    fh, plinth = 0.28, 0.04
    x0, x1 = -w / 2 + 0.015, w / 2 - 0.015
    y0, y1 = -d / 2 + 0.05, d / 2 - 0.015
    stair = tier >= 3
    if stair:
        x1 = w / 2 - 0.17
    parts = [lpm.box("plinth", (x1 - x0 + 0.02, y1 - y0 + 0.02, plinth), at=((x0 + x1) / 2, (y0 + y1) / 2, 0), color=c["floor"])]
    plans = []
    for level in range(floors):
        front = y0 + 0.2 * level
        left, right = x0 + 0.08 * w * level, x1
        plans.append((left, right, front, y1))
        z = plinth + level * fh
        parts.append(lpm.box(f"cube_{level}", (right - left, y1 - front, fh), at=((left + right) / 2, (front + y1) / 2, z), color=c["wall"]))
        parts.append(lpm.box(f"cube_cap_{level}", (right - left + 0.03, y1 - front + 0.03, 0.02), at=((left + right) / 2, (front + y1) / 2, z + fh - 0.02), color=c["wall"]))
        aegean_parapet(parts, f"parapet_{level}", left - 0.015, right + 0.015, front - 0.015, y1 + 0.015, z + fh, c)
        for face, wall, a0, a1 in (("front", front, left, right), ("back", y1, left, right), ("left", left, front, y1), ("right", right, front, y1)):
            length = a1 - a0
            count = max(1, round(length / 0.42))
            panel = length / count
            for panel_index in range(count):
                u = a0 + (panel_index + 0.5) * panel
                if face == "front" and level == 0 and panel_index == count // 2:
                    continue
                aegean_window(parts, f"{face}_{level}_{panel_index}", face, wall, u, z + 0.1, 0.1, 0.12, c)

    left0, right0, front0, back0 = plans[0]
    door_x = (left0 + right0) / 2
    arch_part(parts, "door_surround", "front", front0, arch_outline(door_x, plinth - 0.005, 0.22, 0.27), 0, 0.014, c["wall"])
    arch_part(parts, "door", "front", front0, arch_outline(door_x, plinth, 0.16, 0.24), 0, 0.02, c["accent"])
    parts.append(lpm.box("door_step", (0.26, 0.05, 0.025), at=(door_x, front0 - 0.025, 0), color=c["wall"]))

    if stair:
        steps = 6
        for step in range(steps):
            height = (step + 1) * fh / steps
            parts.append(lpm.box(f"stair_{step}", (0.14, 0.13, height), at=(w / 2 - 0.085, y0 + 0.1 + step * 0.13, plinth), color=c["wall"]))
        stair_rail(parts, "stair_rail", w / 2 - 0.02, y0 + 0.1, plinth + fh / steps, y0 + 0.1 + 0.13 * (steps - 1), plinth + fh, 0.08, c["accent"])

    top_left, top_right, top_front, top_back = plans[-1]
    roof_z = plinth + floors * fh
    if tier >= 2:
        px, pz = top_left + 0.12, roof_z
        for corner_x in (top_left + 0.1, top_left + 0.1 + 0.3):
            for corner_y in (top_back - 0.4, top_back - 0.1):
                parts.append(lpm.box(f"pergola_post_{corner_x:.2f}_{corner_y:.2f}", (0.02, 0.02, 0.2), at=(corner_x, corner_y, pz + 0.05), color=c["accent"]))
        for slat in range(5):
            parts.append(lpm.box(f"pergola_slat_{slat}", (0.34, 0.02, 0.016), at=(top_left + 0.25, top_back - 0.4 + slat * 0.075, pz + 0.25), color=c["accent"]))
        for beam_x in (top_left + 0.1, top_left + 0.4):
            parts.append(lpm.box(f"pergola_beam_{beam_x:.2f}", (0.02, 0.4, 0.02), at=(beam_x, top_back - 0.25, pz + 0.23), color=c["accent"]))
        for brace_y in (top_back - 0.4, top_back - 0.1):
            parts.append(lpm.box(f"pergola_brace_{brace_y:.2f}", (0.32, 0.016, 0.016), at=(top_left + 0.25, brace_y, pz + 0.14), color=c["accent"]))
    if tier >= 3:
        for number, (fx, fy) in enumerate(((top_right - 0.12, top_front + 0.1), (top_left + 0.1, top_front + 0.1))):
            aegean_bougainvillea(parts, c, f"bougainvillea_{number}", fx, fy, roof_z, top_front)
    if tier == 4:
        aegean_dome(parts, c, "tiny_dome", top_right - 0.2, top_back - 0.2, roof_z + 0.05, 0.2)
    if tier >= 5:
        aegean_dome(parts, c, "chapel", top_right - 0.25, top_back - 0.25, roof_z + 0.05, 0.3)

    if spec.get("solar"):
        for row in range(2):
            for column in range(2):
                parts.append(lpm.box(f"solar_panel_{row}_{column}", (0.2, 0.14, 0.012), at=((top_left + top_right) / 2 - 0.1 + column * 0.24 + 0.1, top_front + 0.28 + row * 0.18, roof_z + 0.05), color=c["solar"]))

    ob = lpm.finish(spec["id"], parts, palette, budget=8000 + 6000 * floors * max(1, w * d // 2), center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


def riad_screen(parts, tag, face, wall, u, bottom, width, height, c):
    """A small window behind a wooden lattice: a dark opening, a frame and vertical bars."""
    face_box(parts, f"{tag}_glass", face, wall, u, width, height, bottom, 0.012, c["frame"])
    face_box(parts, f"{tag}_frame_top", face, wall, u, width + 0.03, 0.014, bottom + height, 0.02, c["wood"])
    face_box(parts, f"{tag}_frame_bottom", face, wall, u, width + 0.03, 0.014, bottom - 0.014, 0.02, c["wood"])
    for number in range(3):
        face_box(parts, f"{tag}_bar_{number}", face, wall, u + (number - 1) * width / 3, 0.012, height, bottom, 0.02, c["wood"])
    face_box(parts, f"{tag}_bar_h", face, wall, u, width, 0.01, bottom + height / 2, 0.02, c["wood"])


def riad_palm(parts, c, tag, x, y, z, height):
    """A palm: a slim trunk and a crown of six fronds."""
    parts.append(lpm.prism(f"{tag}_trunk", 6, 0.022, height, at=(x, y, z), color=c["wood"], radius_top=0.014))
    for number in range(6):
        angle = number * 60
        frond = lpm.box(f"{tag}_frond_{number}", (0.2, 0.035, 0.012), at=(x + 0.09, y, z + height - 0.02), color=c["palm"])
        lpm.rotate(frond, -22, axis="Y", about=(x, y, z + height - 0.02))
        lpm.rotate(frond, angle, axis="Z", about=(x, y, z + height - 0.02))
        parts.append(frond)


def riad_shrub(parts, c, tag, x, y, z, radius):
    """A shrub in a small stone planter."""
    parts.append(lpm.box(f"{tag}_planter", (2 * radius, 2 * radius, 0.035), at=(x, y, z), color=c["stone"]))
    parts.append(lpm.prism(f"{tag}_leaves", 6, radius * 0.95, radius * 1.6, at=(x, y, z + 0.035), color=c["palm"], radius_top=radius * 0.45))


def riad_orange_tree(parts, c, tag, x, y, z, height):
    """A small orange tree: a trunk in a planter under a round crown."""
    parts.append(lpm.box(f"{tag}_planter", (0.1, 0.1, 0.035), at=(x, y, z), color=c["stone"]))
    parts.append(lpm.prism(f"{tag}_trunk", 5, 0.012, height * 0.5, at=(x, y, z + 0.035), color=c["wood"]))
    parts.append(lpm.prism(f"{tag}_crown", 6, height * 0.26, height * 0.5, at=(x, y, z + 0.035 + height * 0.4), color=c["palm"], radius_top=height * 0.12))


def riad_windcatcher(parts, c, tag, x, y, z, size, height):
    """A badgir: a square tower with vertical slots between pale fins and a projecting cornice."""
    parts.append(lpm.box(f"{tag}_base", (size + 0.04, size + 0.04, 0.03), at=(x, y, z), color=c["trim"]))
    z += 0.03
    parts.append(lpm.box(f"{tag}_body", (size, size, height), at=(x, y, z), color=c["wall"]))
    parts.append(lpm.box(f"{tag}_cornice", (size + 0.05, size + 0.05, 0.03), at=(x, y, z + height), color=c["trim"]))
    parts.append(lpm.box(f"{tag}_cap", (size + 0.02, size + 0.02, 0.02), at=(x, y, z + height + 0.03), color=c["wall"]))
    pitch = size / 4.5
    slot_bottom, slot_height = z + height * 0.3, height * 0.6
    for face, wall, centre in (("front", y - size / 2, x), ("back", y + size / 2, x), ("left", x - size / 2, y), ("right", x + size / 2, y)):
        for number in range(4):
            u = centre + (number - 1.5) * pitch
            face_box(parts, f"{tag}_{face}_slot_{number}", face, wall, u, pitch * 0.55, slot_height, slot_bottom, 0.012, c["frame"])
        for number in range(3):
            u = centre + (number - 1) * pitch
            face_box(parts, f"{tag}_{face}_fin_{number}", face, wall, u, pitch * 0.2, slot_height, slot_bottom, 0.02, c["trim"])
        face_box(parts, f"{tag}_{face}_band", face, wall, centre, size * 0.95, 0.02, z + height * 0.22, 0.02, c["accent"])


def build_riad(spec, out_dir):
    """A Moroccan riad, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    A ring of clay-colored walls around an open courtyard with a tiled floor, a fountain and an arcade, a horseshoe-arched door framed in zellige, small lattice windows,
    battlements on the roof, galleries on the courtyard from Tier 3, a palm from Tier 4 and a corner tower with a green-tiled roof from Tier 5."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("accent", "vtone2"), ("tile", "vtone3"), ("glass", "glass_blue"), ("trim", "cream"),
                                              ("wood", "darkwood"), ("frame", "graphite"), ("stone", "offwhite"), ("palm", "bush"), ("solar", "solar"), ("water", "aqua"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors, tier = spec["floors"], spec["tier"]
    fh, plinth, thick = 0.28, 0.05, 0.3
    hx, hy = w / 2 - 0.025, d / 2 - 0.025
    cwx, cwy = hx - thick, hy - thick
    height = floors * fh
    top = plinth + height
    parts = [lpm.box("plinth", (2 * hx + 0.02, 2 * hy + 0.02, plinth), at=(0, 0, 0), color=c["stone"]),
             lpm.box("ring_front", (2 * hx, thick, height), at=(0, -hy + thick / 2, plinth), color=c["wall"]),
             lpm.box("ring_back", (2 * hx, thick, height), at=(0, hy - thick / 2, plinth), color=c["wall"]),
             lpm.box("ring_left", (thick, 2 * hy - 2 * thick, height), at=(-hx + thick / 2, 0, plinth), color=c["wall"]),
             lpm.box("ring_right", (thick, 2 * hy - 2 * thick, height), at=(hx - thick / 2, 0, plinth), color=c["wall"]),
             lpm.box("courtyard_floor", (2 * cwx, 2 * cwy, 0.012), at=(0, 0, plinth), color=c["accent"]),
             lpm.box("courtyard_rug", (2 * cwx - 0.1, 2 * cwy - 0.1, 0.004), at=(0, 0, plinth + 0.012), color=c["palm"])]
    for strip, (sx, sy, lx, ly) in enumerate(((0, -hy + thick / 2, 2 * hx + 0.03, thick + 0.03), (0, hy - thick / 2, 2 * hx + 0.03, thick + 0.03),
                                              (-hx + thick / 2, 0, thick + 0.03, 2 * hy - 2 * thick), (hx - thick / 2, 0, thick + 0.03, 2 * hy - 2 * thick))):
        parts.append(lpm.box(f"cornice_{strip}", (lx, ly, 0.03), at=(sx, sy, top), color=c["trim"]))
    for number in range(int(2 * hx / 0.12)):
        x = -hx + 0.06 + number * 0.12
        for sign in (-1, 1):
            parts.append(lpm.box(f"merlon_x_{number}_{sign}", (0.06, 0.05, 0.06), at=(x, sign * (hy - 0.025), top + 0.03), color=c["wall"]))
    for number in range(int((2 * hy - 0.1) / 0.12)):
        y = -hy + 0.17 + number * 0.12
        for sign in (-1, 1):
            parts.append(lpm.box(f"merlon_y_{number}_{sign}", (0.05, 0.06, 0.06), at=(sign * (hx - 0.025), y, top + 0.03), color=c["wall"]))

    door_h = 0.3
    arch_part(parts, "door_zellige", "front", -hy, arch_outline(0.0, plinth - 0.005, 0.32, door_h + 0.06), 0, 0.018, c["accent"])
    arch_part(parts, "door_trim", "front", -hy, arch_outline(0.0, plinth, 0.26, door_h), 0, 0.022, c["trim"])
    arch_part(parts, "door", "front", -hy, arch_outline(0.0, plinth, 0.22, door_h - 0.04), 0, 0.028, c["wood"])
    for number, (dx, dz) in enumerate(((-0.05, 0.1), (0.05, 0.1), (-0.05, 0.18), (0.05, 0.18))):
        parts.append(lpm.box(f"door_stud_{number}", (0.02, 0.02, 0.02), at=(dx, -hy - 0.03, plinth + dz), color=c["trim"]))

    for level in range(floors):
        z = plinth + level * fh
        for face, wall, length in (("front", -hy, 2 * hx), ("back", hy, 2 * hx), ("left", -hx, 2 * hy), ("right", hx, 2 * hy)):
            count = max(1, round(length / 0.55))
            panel = length / count
            for panel_index in range(count):
                u = -length / 2 + (panel_index + 0.5) * panel
                if face == "front" and level == 0 and abs(u) < 0.25:
                    continue
                if level == 0:
                    riad_screen(parts, f"{face}_{level}_{panel_index}", face, wall, u, z + 0.16, 0.08, 0.09, c)
                else:
                    riad_screen(parts, f"{face}_{level}_{panel_index}", face, wall, u, z + 0.08, 0.1, 0.13, c)

    inner = (("back", -cwy, 2 * cwx, "x"), ("front", cwy, 2 * cwx, "x"), ("right", -cwx, 2 * cwy, "y"), ("left", cwx, 2 * cwy, "y"))
    for level in range(floors):
        z = plinth + level * fh
        if level and tier < 3:
            break
        for face, wall, length, _axis in inner:
            count = max(1, round(length / 0.36))
            panel = length / count
            for panel_index in range(count):
                u = -length / 2 + (panel_index + 0.5) * panel
                arch_part(parts, f"arcade_{face}_{level}_{panel_index}_surround", face, wall, arch_outline(u, z + 0.01, 0.17, 0.24), 0, 0.012, c["accent"])
                arch_part(parts, f"arcade_{face}_{level}_{panel_index}", face, wall, arch_outline(u, z + 0.02, 0.13, 0.21), 0, 0.016, c["frame"])
        if level:
            ledge = 0.09
            for side, (lx, ly, sx_, sy_) in enumerate(((0, -cwy + ledge / 2, 2 * cwx, ledge), (0, cwy - ledge / 2, 2 * cwx, ledge),
                                                       (-cwx + ledge / 2, 0, ledge, 2 * cwy - 2 * ledge), (cwx - ledge / 2, 0, ledge, 2 * cwy - 2 * ledge))):
                parts.append(lpm.box(f"terrace_{level}_{side}", (sx_, sy_, 0.02), at=(lx, ly, z - 0.02), color=c["stone"]))
                spots = max(1, int((sx_ if side < 2 else sy_) / 0.22))
                for spot in range(spots):
                    offset = -(sx_ if side < 2 else sy_) / 2 + ((sx_ if side < 2 else sy_) / spots) * (spot + 0.5)
                    px, py = (offset, ly) if side < 2 else (lx, offset)
                    riad_shrub(parts, c, f"terrace_{level}_{side}_{spot}", px, py, z, 0.035)

    parts.append(lpm.prism("fountain_basin", 8, 0.1, 0.045, at=(0, 0, plinth + 0.012), color=c["stone"]))
    parts.append(lpm.prism("fountain_water", 8, 0.085, 0.046, at=(0, 0, plinth + 0.012), color=c["water"]))
    parts.append(lpm.prism("fountain_column", 8, 0.018, 0.12, at=(0, 0, plinth + 0.012), color=c["stone"]))
    parts.append(lpm.prism("fountain_bowl", 8, 0.045, 0.02, at=(0, 0, plinth + 0.1), color=c["stone"], radius_top=0.055))
    garden_z = plinth + 0.012
    palm_corners = []
    if tier >= 4:
        palm_corners.append((1, 1))
        riad_palm(parts, c, "palm", cwx - 0.12, cwy - 0.12, garden_z, 0.4)
    if tier >= 6:
        palm_corners.append((-1, -1))
        riad_palm(parts, c, "palm_2", -(cwx - 0.12), -(cwy - 0.12), garden_z, 0.45)
    for sx, sy in ((-1, -1), (-1, 1), (1, -1), (1, 1)):
        if (sx, sy) in palm_corners:
            continue
        riad_shrub(parts, c, f"shrub_{sx}_{sy}", sx * (cwx - 0.06), sy * (cwy - 0.06), garden_z, 0.05)
    if tier >= 2:
        tree_spots = [(sx * cwx * 0.62, 0) for sx in (-1, 1)]
        if cwy > 0.4:
            tree_spots += [(0, sy * cwy * 0.62) for sy in (-1, 1)]
        for number, (tx_, ty_) in enumerate(tree_spots):
            riad_orange_tree(parts, c, f"orange_{number}", tx_, ty_, garden_z, 0.3 + 0.1 * min(floors, 3))
    if tier >= 3:
        hedge_length = 2 * cwx - 0.4
        for sy in (-1, 1):
            parts.append(lpm.box(f"hedge_{sy}", (hedge_length, 0.05, 0.05), at=(0, sy * (cwy - 0.04), garden_z), color=c["palm"]))
    if tier >= 6:
        for sx in (-1, 1):
            parts.append(lpm.box(f"hedge_side_{sx}", (0.05, 2 * cwy - 0.4, 0.05), at=(sx * (cwx - 0.04), 0, garden_z), color=c["palm"]))

    catcher_size = 0.16 if w == 1 else 0.2
    catcher_h = 0.2 + 0.03 * floors
    riad_windcatcher(parts, c, "windcatcher_1", hx - thick / 2, 0, top + 0.03, catcher_size, catcher_h)
    if tier >= 5:
        riad_windcatcher(parts, c, "windcatcher_2", -hx + thick / 2, 0.3, top + 0.03, catcher_size, catcher_h)
    if tier >= 7:
        riad_windcatcher(parts, c, "windcatcher_3", hx - thick / 2, hy * 0.7, top + 0.03, catcher_size, catcher_h)

    if tier >= 5:
        tx, ty, size = -hx + thick / 2 + 0.02, -hy + thick / 2 + 0.02, 0.26
        tower_h = 0.28 + 0.05 * (tier - 5)
        parts.append(lpm.box("tower", (size, size, tower_h), at=(tx, ty, top + 0.03), color=c["wall"]))
        parts.append(lpm.box("tower_band", (size + 0.03, size + 0.03, 0.02), at=(tx, ty, top + 0.03 + tower_h * 0.6), color=c["accent"]))
        parts.append(lpm.box("tower_cornice", (size + 0.05, size + 0.05, 0.025), at=(tx, ty, top + 0.03 + tower_h), color=c["trim"]))
        parts.append(hip_roof("tower_roof", (size + 0.05) / 2, (size + 0.05) / 2, top + 0.055 + tower_h, 0.15, c["tile"], cx=tx, cy=ty))
        for face, wall in (("front", ty - size / 2), ("back", ty + size / 2)):
            arch_part(parts, f"tower_{face}", face, wall, arch_outline(tx, top + 0.03 + tower_h * 0.7 - 0.04, 0.08, 0.12), 0, 0.012, c["frame"])
        for face, wall in (("left", tx - size / 2), ("right", tx + size / 2)):
            arch_part(parts, f"tower_{face}", face, wall, arch_outline(ty, top + 0.03 + tower_h * 0.7 - 0.04, 0.08, 0.12), 0, 0.012, c["frame"])

    if spec.get("solar"):
        for number in range(4):
            x = -0.6 + number * 0.4 if w >= 2 else -0.1 + number * 0.2
            if abs(x) > hx - 0.2:
                continue
            parts.append(lpm.box(f"solar_panel_{number}", (0.2, 0.16, 0.012), at=(x, hy - thick / 2, top + 0.03), color=c["solar"]))

    ob = lpm.finish(spec["id"], parts, palette, budget=9000 + 7000 * floors * max(1, w * d // 2), center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


def machiya_window(parts, tag, face, wall, u, bottom, width, height, c):
    """A mushiko window: a dark opening behind a row of vertical wooden bars with a rail above and below."""
    face_box(parts, f"{tag}_glass", face, wall, u, width, height, bottom, 0.012, c["frame"])
    face_box(parts, f"{tag}_rail_top", face, wall, u, width + 0.03, 0.014, bottom + height, 0.026, c["wood"])
    face_box(parts, f"{tag}_rail_bottom", face, wall, u, width + 0.03, 0.014, bottom - 0.014, 0.026, c["wood"])
    for number in range(5):
        face_box(parts, f"{tag}_bar_{number}", face, wall, u + (number - 2) * width / 4, 0.012, height, bottom, 0.022, c["wood"])


def build_machiya(spec, out_dir):
    """A Kyoto machiya on a 1x2 cell, front facing -Y: a narrow deep townhouse of timber and plaster with a lattice front, a noren curtain at the entrance, a bamboo fence,
    a short tiled skirt roof (hisashi) over the ground floor only, and a tiled gable roof whose eave ends curve up like a pagoda, with ridge ornaments. The Tier is the floor count (1 to 5): 1 a single floor, 2 mushiko windows on the second floor,
    3 a third floor and a hanging sign, 4 paper lanterns under the ground eave, 5 a third lantern."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("plaster", "vtone2"), ("tile", "vtone3"), ("frame", "graphite"), ("wood", "timber"), ("stone", "offwhite"),
                                              ("noren", "navy"), ("bamboo", "bamboo"), ("lantern", "falured"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    floors = spec["floors"]
    z0, ground, fh = 0.08, 0.3, 0.26
    y0, y1 = BROWNSTONE_WALLS["front"], BROWNSTONE_WALLS["back"]
    depth = y1 - y0
    cy = (y0 + y1) / 2
    top = z0 + ground + (floors - 1) * fh
    parts = [lpm.box("plinth", (0.94, depth + 0.02, z0), at=(0, cy, 0), color=c["stone"]),
             lpm.box("walls_ground", (0.92, depth, ground), at=(0, cy, z0), color=c["wall"])]
    for level in range(1, floors):
        base = z0 + ground + (level - 1) * fh
        parts.append(lpm.box(f"walls_{level}", (0.92, depth, fh), at=(0, cy, base), color=c["plaster"]))
        parts.append(lpm.box(f"band_{level}", (0.94, depth + 0.02, 0.014), at=(0, cy, base - 0.007), color=c["wood"]))

    eaves = range(1)
    for level in eaves:
        zt = z0 + ground + level * fh
        parts.append(extrude_x(f"hisashi_{level}", [(y0 - 0.12, zt - 0.07), (y0, zt - 0.015), (y0, zt + 0.015), (y0 - 0.12, zt - 0.05)], -0.5, 0.5, c["tile"]))

    door_x = -0.28
    face_box(parts, "door_opening", "front", y0, door_x, 0.2, 0.2, z0, 0.012, c["frame"])
    for side in (-1, 1):
        face_box(parts, f"door_post_{side}", "front", y0, door_x + side * 0.11, 0.02, 0.22, z0, 0.026, c["wood"])
        face_box(parts, f"noren_{side}", "front", y0, door_x + side * 0.046, 0.085, 0.1, z0 + 0.1, 0.03, c["noren"])
    face_box(parts, "door_lintel", "front", y0, door_x, 0.24, 0.02, z0 + 0.2, 0.026, c["wood"])
    parts.append(lpm.box("entry_step", (0.26, 0.1, 0.03), at=(door_x, y0 - 0.05, 0), color=c["stone"]))

    lattice_x, lattice_bottom, lattice_height = 0.17, z0 + 0.04, 0.17
    face_box(parts, "koshi_back", "front", y0, lattice_x, 0.5, lattice_height, lattice_bottom, 0.012, c["frame"])
    for number in range(13):
        face_box(parts, f"koshi_bar_{number}", "front", y0, lattice_x - 0.24 + number * 0.04, 0.012, lattice_height, lattice_bottom, 0.03, c["wood"])
    for name, bottom in (("koshi_top", lattice_bottom + lattice_height), ("koshi_bottom", lattice_bottom - 0.014)):
        face_box(parts, name, "front", y0, lattice_x, 0.52, 0.014, bottom, 0.034, c["wood"])
    for number in range(7):
        parts.append(lpm.box(f"fence_post_{number}", (0.022, 0.022, 0.14), at=(-0.04 + number * 0.08, y0 - 0.1, 0), color=c["bamboo"]))
    for number, rail_z in enumerate((0.04, 0.1)):
        parts.append(lpm.box(f"fence_rail_{number}", (0.5, 0.016, 0.014), at=(0.2, y0 - 0.1, rail_z), color=c["bamboo"]))

    for level in range(1, floors):
        base = z0 + ground + (level - 1) * fh
        for x in (-0.2, 0.2):
            machiya_window(parts, f"front_{level}_{x}", "front", y0, x, base + 0.07, 0.24, 0.1, c)
        for x in (-0.2, 0.2):
            machiya_window(parts, f"back_{level}_{x}", "back", y1, x, base + 0.07, 0.24, 0.1, c)
        for face, wall in (("left", -0.46), ("right", 0.46)):
            for number, y in enumerate((-0.3, 0.3)):
                machiya_window(parts, f"{face}_{level}_{number}", face, wall, y, base + 0.07, 0.24, 0.1, c)
    for face, wall in (("left", -0.46), ("right", 0.46)):
        for number, y in enumerate((-0.3, 0.3)):
            machiya_window(parts, f"{face}_0_{number}", face, wall, y, z0 + 0.1, 0.24, 0.1, c)
    for x in (-0.2, 0.2):
        machiya_window(parts, f"back_0_{x}", "back", y1, x, z0 + 0.1, 0.24, 0.1, c)

    half, rise, tip = 0.46, 0.28, 0.505
    front_edge, back_edge = y0 - 0.18, y1 + 0.05
    parts.append(extrude_y("gable_wall", [(-half, top), (half, top), (0, top + rise)], y0, y1, c["plaster"]))
    for side in (-1, 1):
        outline = [(side * tip, top + 0.04), (side * half, top), (0, top + rise), (0, top + rise + 0.035), (side * half, top + 0.035), (side * tip, top + 0.08)]
        parts.append(extrude_y(f"roof_slope_{side}", outline, front_edge, back_edge, c["tile"]))
    parts.append(lpm.box("ridge", (0.06, back_edge - front_edge, 0.03), at=(0, (front_edge + back_edge) / 2, top + rise + 0.03), color=c["tile"]))
    for name, y in (("front", front_edge + 0.03), ("back", back_edge - 0.03)):
        parts.append(lpm.box(f"onigawara_{name}", (0.07, 0.05, 0.08 + 0.01 * floors), at=(0, y, top + rise + 0.03), color=c["tile"]))
    machiya_window(parts, "attic", "front", y0, 0.0, top + 0.05, 0.14, 0.08, c)

    if floors >= 3:
        parts.append(lpm.box("sign_arm", (0.02, 0.1, 0.014), at=(0.42, y0 - 0.05, z0 + 0.25), color=c["wood"]))
        parts.append(lpm.box("sign", (0.016, 0.07, 0.14), at=(0.42, y0 - 0.1, z0 + 0.11), color=c["plaster"]))
    if floors >= 4:
        zt = z0 + ground
        for x in (-0.12, 0.38) + ((0.12,) if floors >= 5 else ()):
            parts.append(lpm.prism(f"lantern_{x}", 8, 0.03, 0.06, at=(x, y0 - 0.1, zt - 0.13), color=c["lantern"]))

    if spec.get("solar"):
        slope = math.degrees(math.atan2(rise, half))
        for row in range(5):
            y = -0.55 + row * 0.3
            px = 0.23
            pz = top + rise * (1 - px / half) + 0.035 + 0.008
            panel = lpm.box(f"solar_panel_{row}", (0.2, 0.26, 0.012), at=(px, y, pz), color=c["solar"])
            lpm.rotate(panel, slope, axis="Y", about=(px, y, pz))
            parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=4000 + 3500 * floors, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = list(spec["footprint"])
    return report

def gassho_shoji(parts, tag, face, wall, u, bottom, width, height, c):
    """A paper screen window: a pale pane in a timber grid of two posts, a middle bar and two rails."""
    face_box(parts, f"{tag}_paper", face, wall, u, width, height, bottom, 0.012, c["paper"])
    for number, side in enumerate((-1, 1)):
        face_box(parts, f"{tag}_post_{number}", face, wall, u + side * width / 2, 0.016, height + 0.016, bottom - 0.008, 0.02, c["wood"])
    face_box(parts, f"{tag}_rail_top", face, wall, u, width, 0.014, bottom + height, 0.02, c["wood"])
    face_box(parts, f"{tag}_rail_bottom", face, wall, u, width, 0.014, bottom - 0.014, 0.02, c["wood"])
    face_box(parts, f"{tag}_mid_v", face, wall, u, 0.01, height, bottom, 0.02, c["wood"])
    face_box(parts, f"{tag}_mid_h", face, wall, u, width, 0.01, bottom + height / 2, 0.02, c["wood"])


def gassho_dormer(parts, tag, x, sign, zc, hr, zw, rise, c):
    """A small dormer on a roof slope: a timber box with a paper window under a thatched pyramid."""
    y = sign * hr * (1 - (zc - zw) / rise)
    parts.append(lpm.box(f"{tag}_box", (0.16, 0.16, 0.14), at=(x, y, zc - 0.07), color=c["wall"]))
    gassho_shoji(parts, f"{tag}_window", "back" if sign > 0 else "front", y + sign * 0.08, x, zc - 0.05, 0.1, 0.08, c)
    parts.append(hip_roof(f"{tag}_roof", 0.11, 0.11, zc + 0.07, 0.1, c["thatch"], cx=x, cy=y))


def build_gassho(spec, out_dir):
    """A Shirakawa-go gassho-zukuri farmhouse, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 9, the ladder skips 2) picks the look.
    A timber house under a very steep thatched A-frame roof with the ridge along Y, so that the timber-framed gables with paper windows face front and back, and the wide dark entrance centered on the front gable wall, under a balcony from Tier 3. It is modeled with the ridge along X and the cell swapped, then turned 90 degrees. Tier 2 adds a smoke vent on the ridge,
    3 a second wall floor with a balcony, 4 attic windows and a dormer, 5 two dormers on the 2x2 cell, 6 dormers on both slopes and a woodpile, 7 a porch hood, 8 larger gable windows and dormers."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("thatch", "vtone1"), ("wall", "vtone2"), ("infill", "vtone3"), ("paper", "offwhite"), ("wood", "timber"), ("stone", "greywood"),
                                              ("frame", "graphite"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    footprint_w, footprint_d = spec["footprint"]
    w, d = footprint_d, footprint_w
    floors, tier = spec["floors"], spec["tier"]
    plinth, fh = 0.06, 0.26
    walls = 1 if tier <= 2 else 2
    hxw, hyw = w / 2 - 0.07, d / 2 - 0.1
    hr, x_end = d / 2 - 0.005, w / 2 - 0.02
    zw = plinth + walls * fh
    rise = hr * (1.2 if w >= d else 0.9)
    parts = [lpm.box("plinth", (2 * hxw + 0.04, 2 * hyw + 0.04, plinth), at=(0, 0, 0), color=c["stone"]),
             lpm.box("walls", (2 * hxw, 2 * hyw, walls * fh), at=(0, 0, plinth), color=c["wall"]),
             extrude_x("thatch", [(-hr, zw - 0.04), (hr, zw - 0.04), (0, zw + rise)], -x_end, x_end, c["thatch"]),
             lpm.box("ridge", (2 * x_end, 0.06, 0.04), at=(0, 0, zw + rise - 0.02), color=c["thatch"])]

    base_z, apex_z, half = zw + 0.02, zw + rise - 0.13, hr - 0.12
    half_at = lambda z: half * (1 - (z - base_z) / (apex_z - base_z))
    for sign, face in ((-1, "left"), (1, "right")):
        plane = sign * (x_end + 0.015)
        x0, x1 = sorted((sign * (x_end - 0.003), plane))
        parts.append(extrude_x(f"gable_{face}", [(-half, base_z), (half, base_z), (0, apex_z)], x0, x1, c["infill"]))
        rows = {4: [0.1], 5: [0.12], 6: [0.12, 0.42], 7: [0.12, 0.42, 0.72], 8: [0.12, 0.42, 0.72, 0.98], 9: [0.12, 0.42, 0.72, 1.02, 1.32]}.get(tier, [])
        for number, offset in enumerate(rows):
            z = zw + offset
            width = min(0.2 if tier < 8 else 0.26, half_at(z + 0.12) * 1.5)
            count = 2 if offset < 0.2 and d >= 2 else 1
            for slot in range(count):
                gassho_shoji(parts, f"gable_{face}_win_{number}_{slot}", face, plane - sign * 0.006, (slot - (count - 1) / 2) * 0.5, z, width, 0.12, c)
        for boards in (-1, 1):
            board = lpm.box(f"chigi_{face}_{boards}", (0.014, 0.02, 0.2), at=(sign * (x_end - 0.01), 0, zw + rise - 0.02), color=c["wood"])
            lpm.rotate(board, boards * 38, axis="X", about=(sign * (x_end - 0.01), 0, zw + rise - 0.02))
            parts.append(board)

    face_box(parts, "door", "left", -hxw, 0.0, 0.28, 0.22, plinth, 0.014, c["frame"])
    for side in (-1, 1):
        face_box(parts, f"door_post_{side}", "left", -hxw, side * 0.15, 0.025, 0.24, plinth, 0.026, c["wood"])
    face_box(parts, "door_lintel", "left", -hxw, 0.0, 0.33, 0.025, plinth + 0.22, 0.026, c["wood"])
    count = max(1, round(2 * hxw / 0.5))
    pitch = 2 * hxw / count
    for level in range(walls):
        bottom = plinth + level * fh + 0.06
        for number in range(count):
            u = -hxw + (number + 0.5) * pitch
            for face, wall in (("front", -hyw), ("back", hyw)):
                gassho_shoji(parts, f"{face}_{level}_{number}", face, wall, u, bottom, min(0.26, pitch - 0.16), 0.14, c)
        for face, wall in (("left", -hxw), ("right", hxw)):
            for number, y in enumerate((-hyw * 0.5, hyw * 0.5) if d >= 2 else (0.0,)):
                if face == "left" and level == 0 and abs(y) < 0.3:
                    continue
                gassho_shoji(parts, f"{face}_{level}_{number}", face, wall, y, bottom, 0.2, 0.14, c)

    if walls == 2:
        deck_z = plinth + fh - 0.015
        parts.append(lpm.box("balcony", (0.06, 2 * hyw, 0.02), at=(-hxw - 0.03, 0, deck_z), color=c["wood"]))
        parts.append(lpm.box("balcony_rail", (0.012, 2 * hyw, 0.012), at=(-hxw - 0.055, 0, deck_z + 0.1), color=c["wood"]))
        posts = int(2 * hyw / 0.3)
        for number in range(posts + 1):
            parts.append(lpm.box(f"balcony_post_{number}", (0.014, 0.014, 0.1), at=(-hxw - 0.055, -hyw + 0.01 + number * (2 * hyw - 0.02) / posts, deck_z + 0.02), color=c["wood"]))

    if tier >= 2:
        parts.append(lpm.box("smoke_vent", (0.1, 0.1, 0.08), at=(0, 0, zw + rise - 0.1), color=c["wall"]))
        parts.append(hip_roof("smoke_vent_roof", 0.07, 0.07, zw + rise - 0.02, 0.07, c["thatch"], cx=0.0, cy=0.0))
    front_dormers = {4: [0.0], 5: [-0.5, 0.5], 6: [-0.5, 0.5], 7: [-0.6, 0.0, 0.6], 8: [-0.6, 0.0, 0.6], 9: [-1.0, 0.0, 1.0]}.get(tier, [])
    back_dormers = {6: [-0.5, 0.5], 7: [-0.5, 0.5], 8: [-0.6, 0.0, 0.6], 9: [-1.0, 0.0, 1.0]}.get(tier, [])
    for number, x in enumerate(front_dormers):
        gassho_dormer(parts, f"dormer_front_{number}", x, -1, zw + 0.28 * min(1, rise / 0.6), hr, zw, rise, c)
    for number, x in enumerate(back_dormers):
        gassho_dormer(parts, f"dormer_back_{number}", x, 1, zw + 0.28 * min(1, rise / 0.6), hr, zw, rise, c)
    if tier >= 6:
        parts.append(lpm.box("woodpile", (0.34, 0.09, 0.15), at=(hxw - 0.3, -hyw - 0.055, plinth), color=c["wood"]))
        parts.append(lpm.box("woodpile_top", (0.3, 0.07, 0.04), at=(hxw - 0.3, -hyw - 0.055, plinth + 0.15), color=c["stone"]))
    if tier >= 7:
        for side in (-1, 1):
            parts.append(lpm.box(f"porch_post_{side}", (0.016, 0.016, 0.2), at=(-hxw - 0.05, side * 0.18, plinth), color=c["wood"]))
        parts.append(lpm.box("porch_hood", (0.06, 0.4, 0.03), at=(-hxw - 0.03, 0, plinth + 0.24), color=c["thatch"]))

    if spec.get("solar"):
        angle = math.degrees(math.atan2(rise, hr))
        sine, cosine = math.sin(math.radians(angle)), math.cos(math.radians(angle))
        count_x = max(1, int((2 * hxw - 0.2) / 0.24))
        for row, fraction in enumerate((0.45,) if d < 2 else (0.55, 0.8)):
            for number in range(count_x):
                px = (number - (count_x - 1) / 2) * 0.24
                py, pz = hr * (1 - fraction) + 0.015 * sine, zw + fraction * rise + 0.015 * cosine
                panel = lpm.box(f"solar_panel_{row}_{number}", (0.2, 0.26, 0.012), at=(px, py, pz), color=c["solar"])
                lpm.rotate(panel, -angle, axis="X", about=(px, py, pz))
                parts.append(panel)

    for part in parts:
        lpm.rotate(part, 90, axis="Z", about=(0, 0, 0))
    ob = lpm.finish(spec["id"], parts, palette, budget=8000 + 6000 * floors, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [footprint_w, footprint_d]
    return report

def build_siheyuan(spec, out_dir):
    """A Beijing siheyuan on a 2x2 cell, front facing -Y: four grey-brick halls with grey-tiled gable roofs around a paved courtyard, a red lacquered gate with studs and a spirit wall behind it,
    red columns and lattice windows on the courtyard side. The Tier is the floor count (1 to 5) and the compound grows with it: the main hall at the back rises 1 to 4 floors, the side halls and the front range follow,
    a tree grows in the courtyard from Tier 2, shrubs from Tier 3, a second tree from Tier 4 and a pavilion on the main hall from Tier 5."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("wood", "vtone2"), ("tile", "vtone3"), ("frame", "graphite"), ("stone", "offwhite"), ("gold", "honey"),
                                              ("palm", "bush"), ("trunk", "darkwood"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    tier = spec["floors"]
    plinth, fh, thick = 0.06, 0.26, 0.4
    outer = 0.925
    inner = outer - thick
    rise, half_roof = 0.2, 0.265
    back_floors = min(tier, 4)
    side_floors = (1, 1, 2, 2, 3)[tier - 1]
    front_floors = 1 if tier <= 3 else 2
    parts = [lpm.box("plinth", (2 * outer + 0.04, 2 * outer + 0.04, plinth), at=(0, 0, 0), color=c["stone"]),
             lpm.box("courtyard_floor", (2 * inner, 2 * inner, 0.012), at=(0, 0, plinth), color=c["stone"])]

    def roof_height(floors):
        return plinth + floors * fh

    wings = (("back", 0.0, (inner + outer) / 2, 2 * outer, thick, back_floors, "x"),
             ("front", 0.0, -(inner + outer) / 2, 2 * outer, thick, front_floors, "x"),
             ("left", -(inner + outer) / 2, 0.0, 2 * inner, thick, side_floors, "y"),
             ("right", (inner + outer) / 2, 0.0, 2 * inner, thick, side_floors, "y"))
    for name, cx, cy, length, depth, floors, axis in wings:
        zt = roof_height(floors)
        size = (length, depth, floors * fh) if axis == "x" else (depth, length, floors * fh)
        parts.append(lpm.box(f"{name}_walls", size, at=(cx, cy, plinth), color=c["wall"]))
        if axis == "x":
            outline = [(cy - half_roof, zt - 0.02), (cy + half_roof, zt - 0.02), (cy, zt + rise)]
            parts.append(extrude_x(f"{name}_roof", outline, -length / 2 - 0.065, length / 2 + 0.065, c["tile"]))
            parts.append(lpm.box(f"{name}_ridge", (length + 0.13, 0.05, 0.03), at=(0, cy, zt + rise - 0.01), color=c["tile"]))
        else:
            outline = [(cx - half_roof, zt - 0.02), (cx + half_roof, zt - 0.02), (cx, zt + rise)]
            parts.append(extrude_y(f"{name}_roof", outline, -length / 2, length / 2, c["tile"]))
            parts.append(lpm.box(f"{name}_ridge", (0.05, length, 0.03), at=(cx, 0, zt + rise - 0.01), color=c["tile"]))

    inner_faces = (("back", "front", -inner, 2 * outer, "x", back_floors), ("front", "back", inner, 2 * outer, "x", front_floors),
                   ("left", "right", -inner, 2 * inner, "y", side_floors), ("right", "left", inner, 2 * inner, "y", side_floors))
    for _wing, face, plane, length, _axis, floors in inner_faces:
        main_hall = _wing == "back"
        count = max(2, round(length / (0.36 if main_hall else 0.4)))
        if count % 2 == 0:
            count += 1
        pitch = length / count
        for level in range(floors):
            base = plinth + level * fh
            for number in range(count):
                u = -length / 2 + (number + 0.5) * pitch
                if main_hall and (abs(u) > 0.01 or level != floors - 1 or level == 0):
                    continue
                if not main_hall and abs(u) > 0.01 and abs(u) > pitch * 0.6:
                    continue
                if main_hall:
                    machiya_window(parts, f"{face}_{_wing}_{level}_{number}", face, plane, u, base + 0.1, 0.3, 0.15, c)
                else:
                    machiya_window(parts, f"{face}_{_wing}_{level}_{number}", face, plane, u, base + (0.1 if level else 0.07), min(0.2, pitch - 0.12), 0.12, c)
            if level == 0:
                for number in range(count + 1):
                    u = -length / 2 + number * pitch
                    face_box(parts, f"{face}_{_wing}_column_{number}", face, plane, u, 0.03, fh - 0.02, base, 0.05, c["wood"])
                face_box(parts, f"{face}_{_wing}_beam", face, plane, 0.0, length, 0.025, base + fh - 0.045, 0.05, c["wood"])
                if main_hall:
                    face_box(parts, "hall_door", face, plane, 0.0, 0.2, 0.22, base, 0.03, c["frame"])
                    face_box(parts, "hall_door_frame", face, plane, 0.0, 0.24, 0.02, base + 0.22, 0.04, c["wood"])
            elif level == floors - 1 or (not main_hall and tier >= 3):
                balcony_width = (0.3 if main_hall else min(0.2, pitch - 0.12)) + 0.1
                sign = -1 if face in ("front", "left") else 1
                place = lambda along, depth: (along, plane + sign * depth) if face in ("front", "back") else (plane + sign * depth, along)
                size = lambda across, deep: (across, deep) if face in ("front", "back") else (deep, across)
                px, py = place(0.0, 0.04)
                parts.append(lpm.box(f"{face}_{_wing}_{level}_slab", (*size(balcony_width, 0.08), 0.02), at=(px, py, base - 0.01), color=c["wood"]))
                for side in (-1, 1):
                    px, py = place(side * (balcony_width / 2 - 0.02), 0.07)
                    parts.append(lpm.box(f"{face}_{_wing}_{level}_support_{side}", (0.016, 0.016, 0.1), at=(px, py, base - 0.11), color=c["wood"]))
                if tier >= 3:
                    px, py = place(0.0, 0.075)
                    parts.append(lpm.box(f"{face}_{_wing}_{level}_rail", (*size(balcony_width, 0.012), 0.012), at=(px, py, base + 0.095), color=c["wood"]))
                    for number in range(5):
                        px, py = place((number - 2) * balcony_width / 4 * 0.98, 0.075)
                        parts.append(lpm.box(f"{face}_{_wing}_{level}_baluster_{number}", (0.012, 0.012, 0.09), at=(px, py, base + 0.01), color=c["wood"]))
                    for side in (-1, 1):
                        px, py = place(side * balcony_width / 2 * 0.98, 0.04)
                        parts.append(lpm.box(f"{face}_{_wing}_{level}_side_rail_{side}", (*size(0.012, 0.075), 0.012), at=(px, py, base + 0.095), color=c["wood"]))
    for _wing, face, plane, floors in (("back", "back", outer, back_floors), ("left", "left", -outer, side_floors), ("right", "right", outer, side_floors)):
        machiya_window(parts, f"outer_{_wing}", face, plane, 0.0, plinth + (floors - 1) * fh + 0.08, 0.12, 0.12, c)

    gate_y = -outer
    face_box(parts, "gate_frame", "front", gate_y, 0.0, 0.4, 0.28, plinth, 0.03, c["stone"])
    for side in (-1, 1):
        face_box(parts, f"gate_door_{side}", "front", gate_y, side * 0.088, 0.17, 0.24, plinth, 0.04, c["wood"])
        for row in range(3):
            for column in range(3):
                face_box(parts, f"gate_stud_{side}_{row}_{column}", "front", gate_y, side * 0.088 + (column - 1) * 0.045, 0.016, 0.016, plinth + 0.04 + row * 0.07, 0.055, c["gold"])
        parts.append(lpm.box(f"gate_drum_{side}", (0.09, 0.07, 0.14), at=(side * 0.27, gate_y - 0.04, plinth), color=c["stone"]))
    parts.append(extrude_y("gate_hood", [(-0.3, plinth + 0.3), (0.3, plinth + 0.3), (0.0, plinth + 0.46)], gate_y - 0.06, gate_y + 0.08, c["tile"]))
    parts.append(lpm.box("spirit_wall", (0.4, 0.04, 0.2), at=(0.0, -inner + 0.14, plinth + 0.012), color=c["wall"]))
    parts.append(lpm.box("spirit_wall_cap", (0.44, 0.06, 0.03), at=(0.0, -inner + 0.14, plinth + 0.212), color=c["tile"]))

    garden = plinth + 0.012
    if tier >= 2:
        riad_orange_tree(parts, c, "tree_1", 0.28, 0.12, garden, 0.42)
    if tier >= 3:
        for number, (x, y) in enumerate(((-0.4, 0.4), (0.4, 0.4), (-0.4, -0.15))):
            riad_shrub(parts, c, f"shrub_{number}", x, y, garden, 0.05)
    if tier >= 4:
        riad_orange_tree(parts, c, "tree_2", -0.28, 0.2, garden, 0.46)
    if tier >= 5:
        zt = roof_height(back_floors)
        parts.append(lpm.box("pavilion", (0.5, 0.36, 0.22), at=(0, (inner + outer) / 2, zt + rise - 0.02), color=c["wall"]))
        for side in (-1, 1):
            face_box(parts, f"pavilion_column_{side}", "front", (inner + outer) / 2 - 0.18, side * 0.2, 0.03, 0.2, zt + rise - 0.02, 0.04, c["wood"])
        machiya_window(parts, "pavilion_window", "front", (inner + outer) / 2 - 0.18, 0.0, zt + rise + 0.03, 0.22, 0.12, c)
        parts.append(hip_roof("pavilion_roof", 0.3, 0.22, zt + rise + 0.2, 0.16, c["tile"], cx=0.0, cy=(inner + outer) / 2))

    if spec.get("solar"):
        angle = math.degrees(math.atan2(rise, half_roof))
        sine, cosine = math.sin(math.radians(angle)), math.cos(math.radians(angle))
        zt = roof_height(back_floors)
        for number, x in enumerate((-0.8, -0.55, 0.55, 0.8)):
            py, pz = (inner + outer) / 2 - half_roof / 2 - 0.015 * sine, zt - 0.02 + rise / 2 + 0.015 * cosine
            panel = lpm.box(f"solar_panel_{number}", (0.2, 0.22, 0.012), at=(x, py, pz), color=c["solar"])
            lpm.rotate(panel, angle, axis="X", about=(x, py, pz))
            parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=16000 + 4000 * tier, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = list(spec["footprint"])
    return report


def stilt_window(parts, tag, face, wall, u, bottom, width, height, c):
    """A small dark opening with a head board, a sill and an open shutter on each side."""
    face_box(parts, f"{tag}_glass", face, wall, u, width, height, bottom, 0.012, c["glass"])
    face_box(parts, f"{tag}_head", face, wall, u, width + 0.04, 0.014, bottom + height, 0.02, c["trim"])
    face_box(parts, f"{tag}_sill", face, wall, u, width + 0.03, 0.012, bottom - 0.012, 0.024, c["trim"])
    for side in (-1, 1):
        face_box(parts, f"{tag}_shutter_{side}", face, wall, u + side * (width / 2 + 0.03), 0.045, height, bottom, 0.018, c["trim"])


def stilt_planter(parts, c, tag, x, y, z):
    """A terracotta pot on a rail with a bushy clump of leaves, a random handful of blooms in pink, white or honey, and often a vine hanging down the front; size and layout vary per pot."""
    rng = random.Random(tag)
    scale = rng.uniform(0.85, 1.25)
    x += rng.uniform(-0.05, 0.05)
    parts.append(lpm.prism(f"{tag}_pot", 8, 0.03 * scale, 0.04 * scale, at=(x, y, z), color=c["pot"], radius_top=0.036 * scale))
    parts.append(lpm.prism(f"{tag}_clump", 6, 0.04 * scale, rng.uniform(0.04, 0.07), at=(x, y, z + 0.04 * scale), color=c["palm"], radius_top=0.02))
    top = z + 0.075 * scale
    for number in range(rng.randint(4, 7)):
        leaf = lpm.box(f"{tag}_leaf_{number}", (rng.uniform(0.04, 0.065), 0.016, 0.01), at=(x + 0.03, y, top + rng.uniform(-0.01, 0.015)), color=c["palm"])
        lpm.rotate(leaf, rng.uniform(10, 45), axis="Y", about=(x, y, top))
        lpm.rotate(leaf, rng.uniform(0, 360), axis="Z", about=(x, y, top))
        parts.append(leaf)
    for number in range(rng.randint(1, 5)):
        angle, reach = rng.uniform(0, 2 * math.pi), rng.uniform(0.0, 0.035)
        size = rng.uniform(0.012, 0.02)
        parts.append(lpm.box(f"{tag}_bloom_{number}", (size, size, size), at=(x + reach * math.cos(angle), y + reach * math.sin(angle), top + rng.uniform(0.0, 0.035)),
                             color=c[rng.choice(("flower", "flower", "flower_white", "flower_honey"))]))
    if rng.random() < 0.7:
        length = rng.uniform(0.05, 0.13)
        parts.append(lpm.box(f"{tag}_vine", (rng.uniform(0.02, 0.035), 0.01, length), at=(x + rng.uniform(-0.015, 0.015), y - 0.034, z - length / 2 - 0.01), color=c["palm"]))
        if rng.random() < 0.6:
            parts.append(lpm.box(f"{tag}_vine_bloom", (0.014, 0.012, 0.014), at=(x, y - 0.04, z - length), color=c[rng.choice(("flower", "flower_white", "flower_honey"))]))


def stilt_palm(parts, c, tag, x, y, height):
    """A coconut palm: a slim trunk and a crown of six drooping fronds."""
    parts.append(lpm.prism(f"{tag}_trunk", 6, 0.02, height, at=(x, y, 0), color=c["trunk"], radius_top=0.013))
    for number in range(6):
        frond = lpm.box(f"{tag}_frond_{number}", (0.13, 0.03, 0.012), at=(x + 0.06, y, height - 0.02), color=c["palm"])
        lpm.rotate(frond, -22, axis="Y", about=(x, y, height - 0.02))
        lpm.rotate(frond, number * 60, axis="Z", about=(x, y, height - 0.02))
        parts.append(frond)


def stilt_longboat(parts, c, tag, x, y, length, canopy):
    """A narrow longboat pulled up along Y, with a small thatched canopy on two posts when asked."""
    half, tip = length / 2, 0.08
    outline = [(x, y - half), (x + 0.04, y - half + tip), (x + 0.04, y + half - tip), (x, y + half), (x - 0.04, y + half - tip), (x - 0.04, y - half + tip)]
    parts.append(extrude_z(f"{tag}_hull", outline, 0.0, 0.05, c["trim"]))
    if not canopy:
        return
    for number, offset in enumerate((-0.08, 0.08)):
        parts.append(lpm.box(f"{tag}_post_{number}", (0.012, 0.012, 0.1), at=(x, y + offset, 0.05), color=c["trim"]))
    parts.append(lpm.box(f"{tag}_canopy", (0.1, 0.24, 0.02), at=(x, y, 0.15), color=c["roof"]))


def build_stilt(spec, out_dir):
    """A Southeast Asian stilt house, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    A plank house on a grid of piles under a steep thatched gable roof with the ridge along X and crossed ridge boards, a front veranda with posts, a steep side stair to a small landing beside the veranda and a door,
    from Tier 2 a veranda rail with plants, 3 a gable window and a balcony per upper floor, 4 a longboat on the ground, 5 a palm, 6 a second palm, 7 a water tank on legs, 8 a second boat under a canopy."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("roof", "vtone1"), ("wall", "vtone2"), ("trim", "vtone3"), ("pile", "timber"), ("glass", "udark"), ("door", "graphite"),
                                              ("palm", "bush"), ("pot", "tile"), ("flower", "pink"), ("flower_white", "offwhite"), ("flower_honey", "honey"), ("trunk", "pine"), ("tank", "greywood"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors, tier = spec["floors"], spec["tier"]
    pile_h, fh = 0.2, 0.26
    bx_d, bx = w / 2 - 0.18, w / 2 - 0.2
    deck_y0, deck_y1 = -d / 2 + 0.04, d / 2 - 0.06
    y_f, y_b = -d / 2 + 0.32, d / 2 - 0.08
    z0 = pile_h + 0.03
    z_w = z0 + floors * fh
    hr, x_end = d / 2 - 0.005, w / 2 - 0.005
    rise = min(0.62, 0.7 * hr)
    parts = [lpm.box("deck", (2 * bx_d, deck_y1 - deck_y0, 0.03), at=(0, (deck_y0 + deck_y1) / 2, pile_h), color=c["trim"]),
             lpm.box("walls", (2 * bx, y_b - y_f, floors * fh), at=(0, (y_f + y_b) / 2, z0), color=c["wall"]),
             extrude_x("roof", [(-hr, z_w - 0.02), (hr, z_w - 0.02), (0, z_w + rise)], -x_end, x_end, c["roof"]),
             lpm.box("ridge", (2 * x_end, 0.06, 0.04), at=(0, 0, z_w + rise - 0.02), color=c["roof"])]

    pile_xs = [-bx_d + 0.03 + number * (2 * bx_d - 0.06) / max(1, round((2 * bx_d - 0.06) / 0.45)) for number in range(max(1, round((2 * bx_d - 0.06) / 0.45)) + 1)]
    pile_ys = [deck_y0 + 0.04, deck_y1 - 0.04] if d < 1.5 else [deck_y0 + 0.04, (deck_y0 + deck_y1) / 2, deck_y1 - 0.04]
    for row, y in enumerate(pile_ys):
        for number, x in enumerate(pile_xs):
            parts.append(lpm.box(f"pile_{row}_{number}", (0.04, 0.04, pile_h), at=(x, y, 0), color=c["pile"]))
        parts.append(lpm.box(f"pile_beam_{row}", (2 * bx_d - 0.04, 0.025, 0.025), at=(0, y, pile_h - 0.03), color=c["pile"]))
        parts.append(lpm.box(f"pile_brace_{row}", (2 * bx_d - 0.04, 0.02, 0.02), at=(0, y, 0.07), color=c["pile"]))

    for sign, face in ((-1, "left"), (1, "right")):
        plane = sign * (x_end + 0.012)
        x0, x1 = sorted((sign * (x_end - 0.003), plane))
        parts.append(extrude_x(f"gable_{face}", [(-hr + 0.12, z_w - 0.01), (hr - 0.12, z_w - 0.01), (0, z_w + rise - 0.13)], x0, x1, c["wall"]))
        if tier >= 3:
            face_box(parts, f"gable_{face}_window", face, plane - sign * 0.006, 0.0, 0.14, 0.12, z_w + 0.05, 0.012, c["glass"])
        for boards in (-1, 1):
            board = lpm.box(f"kalae_{face}_{boards}", (0.014, 0.02, 0.2), at=(sign * (x_end - 0.01), 0, z_w + rise - 0.02), color=c["trim"])
            lpm.rotate(board, boards * 38, axis="X", about=(sign * (x_end - 0.01), 0, z_w + rise - 0.02))
            parts.append(board)

    post_count = max(2, round(2 * bx_d / 0.6) + 1)
    post_xs = [-bx_d + 0.03 + number * (2 * bx_d - 0.06) / (post_count - 1) for number in range(post_count)]
    for number, x in enumerate(post_xs):
        parts.append(lpm.box(f"veranda_post_{number}", (0.03, 0.03, floors * fh), at=(x, deck_y0 + 0.03, z0), color=c["trim"]))
    for level in range(floors):
        if level > 0:
            parts.append(lpm.box(f"balcony_{level}", (2 * bx_d, y_f - deck_y0, 0.025), at=(0, (deck_y0 + y_f) / 2, z0 + level * fh - 0.025), color=c["trim"]))
        if tier >= 2 or level > 0:
            parts.append(lpm.box(f"rail_{level}", (2 * bx_d - 0.06, 0.014, 0.014), at=(0, deck_y0 + 0.03, z0 + level * fh + 0.1), color=c["trim"]))
            parts.append(lpm.box(f"rail_low_{level}", (2 * bx_d - 0.06, 0.012, 0.012), at=(0, deck_y0 + 0.03, z0 + level * fh + 0.04), color=c["trim"]))
        if tier >= 2:
            for number in range(post_count - 1):
                stilt_planter(parts, c, f"plant_{level}_{number}", (post_xs[number] + post_xs[number + 1]) / 2, deck_y0 + 0.03, z0 + level * fh + 0.107)
        base = z0 + level * fh + 0.07
        pitch = 0.45
        count = max(1, round(2 * bx / pitch))
        for number in range(count):
            u = -bx + (number + 0.5) * 2 * bx / count
            if not (level == 0 and abs(u - 0.12) < 0.18):
                stilt_window(parts, f"front_{level}_{number}", "front", y_f, u, base, 0.12, 0.14, c)
            stilt_window(parts, f"back_{level}_{number}", "back", y_b, u, base, 0.12, 0.14, c)
        side_count = max(1, round((y_b - y_f) / pitch))
        for number in range(side_count):
            y = y_f + (number + 0.5) * (y_b - y_f) / side_count
            for face, wall in (("left", -bx), ("right", bx)):
                stilt_window(parts, f"{face}_{level}_{number}", face, wall, y, base, 0.12, 0.14, c)

    face_box(parts, "door", "front", y_f, 0.12, 0.16, 0.22, z0, 0.016, c["door"])
    face_box(parts, "door_lintel", "front", y_f, 0.12, 0.22, 0.02, z0 + 0.22, 0.024, c["trim"])
    steps, stair_x = 4, -bx_d - 0.08
    stair_y0 = deck_y0 + 0.04
    for step in range(steps):
        parts.append(lpm.box(f"ladder_step_{step}", (0.14, 0.05, (step + 1) * z0 / (steps + 1)), at=(stair_x, stair_y0 + step * 0.05, 0), color=c["trim"]))
    stair_rail(parts, "ladder_rail", stair_x - 0.07, stair_y0, z0 / (steps + 1), stair_y0 + 0.05 * (steps - 1), z0 * steps / (steps + 1), 0.08, c["trim"])
    landing_y0, landing_y1 = stair_y0 + steps * 0.05 - 0.025, y_f + 0.1
    landing_y = (landing_y0 + landing_y1) / 2
    parts.append(lpm.box("landing", (0.15, landing_y1 - landing_y0, 0.03), at=(-bx_d - 0.075, landing_y, pile_h), color=c["trim"]))
    parts.append(lpm.box("landing_post", (0.03, 0.03, pile_h), at=(-bx_d - 0.135, landing_y1 - 0.02, 0), color=c["pile"]))
    parts.append(lpm.box("landing_rail_side", (0.012, landing_y1 - landing_y0, 0.012), at=(-bx_d - 0.144, landing_y, z0 + 0.09), color=c["trim"]))
    parts.append(lpm.box("landing_rail_end", (0.15, 0.012, 0.012), at=(-bx_d - 0.075, landing_y1 - 0.006, z0 + 0.09), color=c["trim"]))
    for number, (px, py) in enumerate(((-bx_d - 0.144, landing_y0 + 0.01), (-bx_d - 0.144, landing_y1 - 0.01), (-bx_d - 0.01, landing_y1 - 0.01))):
        parts.append(lpm.box(f"landing_rail_post_{number}", (0.016, 0.016, 0.1), at=(px, py, z0), color=c["trim"]))

    right_free = bx_d + 0.09
    if tier >= 4:
        stilt_longboat(parts, c, "boat", right_free, -d / 2 + 0.35, 0.4, False)
    if tier >= 5:
        stilt_palm(parts, c, "palm_0", right_free - 0.04, d / 2 - 0.15, 0.5)
    if tier >= 6:
        stilt_palm(parts, c, "palm_1", -right_free + 0.04, d / 2 - 0.15, 0.42)
    if tier >= 7:
        for number, (lx, ly) in enumerate(((-0.04, -0.04), (0.04, -0.04), (-0.04, 0.04), (0.04, 0.04))):
            parts.append(lpm.box(f"tank_leg_{number}", (0.014, 0.014, 0.12), at=(right_free + lx, 0.1 + ly, 0), color=c["pile"]))
        parts.append(lpm.prism("tank", 8, 0.06, 0.1, at=(right_free, 0.1, 0.12), color=c["tank"]))
    if tier >= 8:
        stilt_longboat(parts, c, "boat_1", right_free, -d / 2 + 0.95, 0.4, True)

    if spec.get("solar"):
        angle = math.degrees(math.atan2(rise, hr))
        sine, cosine = math.sin(math.radians(angle)), math.cos(math.radians(angle))
        count_x = max(1, int((2 * bx - 0.1) / 0.24))
        for row, fraction in enumerate((0.45,) if d < 2 else (0.35, 0.65)):
            for number in range(count_x):
                px = (number - (count_x - 1) / 2) * 0.24
                py, pz = hr * (1 - fraction) + 0.015 * sine, z_w + fraction * rise + 0.015 * cosine
                panel = lpm.box(f"solar_panel_{row}_{number}", (0.2, 0.26, 0.012), at=(px, py, pz), color=c["solar"])
                lpm.rotate(panel, -angle, axis="X", about=(px, py, pz))
                parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=10000 + 8000 * floors, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


TULOU_SEGMENTS = 24
TULOU_PHASE = math.radians(7.5)


def ring_solid(name, profile, color, z=0.0):
    """A solid of revolution from a closed (radius, z) profile, counter-clockwise seen with the radius to the right, with its vertices offset by half a facet so that a facet is centred on every multiple of 15 degrees."""
    count = len(profile)
    verts = [((r * math.cos(TULOU_PHASE + 2 * math.pi * i / TULOU_SEGMENTS)), (r * math.sin(TULOU_PHASE + 2 * math.pi * i / TULOU_SEGMENTS)), z + zz)
             for r, zz in profile for i in range(TULOU_SEGMENTS)]
    faces = []
    for p in range(count):
        a, b = p * TULOU_SEGMENTS, ((p + 1) % count) * TULOU_SEGMENTS
        faces += [(a + i, a + (i + 1) % TULOU_SEGMENTS, b + (i + 1) % TULOU_SEGMENTS, b + i) for i in range(TULOU_SEGMENTS)]
    return lpm._object(name, _bm(verts, faces), color)


def polar_box(parts, name, theta, radius, size, z, color, shift=0.0):
    """A box standing at `radius` on the direction `theta` (degrees, 0 = +X), moved `shift` along the tangent, its X side radial and its Y side tangent."""
    part = lpm.box(name, size, at=(radius, shift, z), color=color)
    lpm.rotate(part, theta, axis="Z", about=(0, 0, 0))
    parts.append(part)


def build_tulou(spec, out_dir):
    """A Fujian tulou, a round earthen enclosure on a 2x2 cell with `floors` floors (the Tier): a thick tapered earth ring with a tiled roof sloping to the outside and to the courtyard, no window on the ground floor, one gate facing -Y under a small hood,
    wooden galleries along the courtyard on every upper floor, and a central ancestral hall from Tier 2, rails, lanterns and two trees at 3, shrubs at 4, an inner low ring around the hall at 5."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("roof", "vtone2"), ("wood", "vtone3"), ("stone", "greywood"), ("dark", "udark"), ("door", "graphite"),
                                              ("lantern", "lacquer"), ("leaf", "bush"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    floors = spec["floors"]
    tier = floors
    fh, plinth = 0.26, 0.05
    r_out, r_in = 0.9, 0.58
    height = floors * fh
    z_top = plinth + height
    taper = 0.03
    outer_at = lambda z: r_out - taper * (z - plinth) / height
    r_eave, r_ridge, r_inner_eave, rise = 1.0, 0.72, 0.5, 0.2
    z_eave = z_top - 0.02
    facet = math.cos(TULOU_PHASE)

    parts = [ring_solid("plinth", [(r_out + 0.03, 0.0), (r_out + 0.03, plinth), (r_in - 0.03, plinth), (r_in - 0.03, 0.0)], c["stone"]),
             ring_solid("walls", [(r_out, plinth), (r_out - taper, z_top), (r_in, z_top), (r_in, plinth)], c["wall"]),
             ring_solid("roof", [(r_eave, z_eave), (r_ridge, z_eave + rise), (r_inner_eave, z_eave)], c["roof"]),
             ring_solid("roof_ridge", [(r_ridge + 0.03, z_eave + rise - 0.01), (r_ridge + 0.015, z_eave + rise + 0.02), (r_ridge - 0.015, z_eave + rise + 0.02), (r_ridge - 0.03, z_eave + rise - 0.01)], c["wood"]),
             lpm.prism("courtyard", TULOU_SEGMENTS, r_in - 0.01, plinth - 0.005, at=(0, 0, 0), color=c["stone"])]

    gate = -90
    for level in range(1, floors):
        z = plinth + level * fh + 0.07
        for k in range(24):
            theta = 15 * k
            if abs((theta - gate + 180) % 360 - 180) < 20:
                continue
            r = outer_at(z) * facet
            polar_box(parts, f"window_{level}_{k}", theta, r - 0.004, (0.014, 0.07, 0.1), z, c["dark"])
            polar_box(parts, f"window_sill_{level}_{k}", theta, r, (0.024, 0.09, 0.012), z - 0.012, c["wood"])
    for level in range(floors):
        z = plinth + level * fh + 0.08
        for k in range(24):
            polar_box(parts, f"inner_door_{level}_{k}", 15 * k, r_in * facet - 0.002, (0.012, 0.08, 0.14 if level == 0 else 0.12), z - (0.03 if level == 0 else 0.0), c["dark"])

    gate_parts = []
    r_gate = outer_at(plinth) * facet
    for number, (u, along, tall) in enumerate(((0.0, 0.2, 0.3), )):
        polar_box(gate_parts, "door", 0, r_gate - 0.004, (0.02, along, tall), plinth, c["door"])
    for side in (-1, 1):
        polar_box(gate_parts, f"door_post_{side}", 0, r_gate, (0.034, 0.03, 0.33), plinth, c["wood"], shift=side * 0.12)
    polar_box(gate_parts, "door_lintel", 0, r_gate + 0.005, (0.04, 0.3, 0.03), plinth + 0.3, c["wood"])
    polar_box(gate_parts, "gate_hood", 0, r_gate + 0.04, (0.12, 0.36, 0.025), plinth + 0.34, c["roof"])
    polar_box(gate_parts, "gate_hood_ridge", 0, r_gate + 0.03, (0.04, 0.38, 0.03), plinth + 0.365, c["roof"])
    if tier >= 3:
        for side in (-1, 1):
            polar_box(gate_parts, f"lantern_{side}", 0, r_gate + 0.05, (0.04, 0.04, 0.06), plinth + 0.27, c["lantern"], shift=side * 0.17)
    for part in gate_parts:
        lpm.rotate(part, gate, axis="Z", about=(0, 0, 0))
    parts += gate_parts

    r_gallery = r_in - 0.075
    for level in range(floors):
        z = plinth + level * fh
        for k in range(12):
            angle = TULOU_PHASE + math.radians(30 * k)
            post = lpm.box(f"gallery_post_{level}_{k}", (0.014, 0.014, fh), at=(r_gallery * math.cos(angle), r_gallery * math.sin(angle), z), color=c["wood"])
            parts.append(post)
        if level == 0:
            continue
        zs = z - 0.02
        parts.append(ring_solid(f"gallery_{level}", [(r_in, zs), (r_in, zs + 0.02), (r_gallery, zs + 0.02), (r_gallery, zs)], c["wood"]))
        if tier >= 3:
            for rail, up in ((0, 0.11), (1, 0.06)):
                parts.append(ring_solid(f"gallery_rail_{level}_{rail}", [(r_gallery + 0.006, z + up), (r_gallery + 0.006, z + up + 0.012), (r_gallery - 0.006, z + up + 0.012), (r_gallery - 0.006, z + up)], c["wood"]))

    if tier >= 2:
        hall = 0.3 if tier < 5 else 0.26
        hall_h = 0.2 if tier < 4 else 0.3
        parts.append(lpm.box("hall", (hall, hall, hall_h), at=(0, 0, plinth - 0.005), color=c["wall"]))
        parts.append(hip_roof("hall_roof", hall / 2 + 0.05, hall / 2 + 0.05, plinth - 0.005 + hall_h, 0.1, c["roof"]))
        parts.append(lpm.box("hall_door", (0.1, 0.012, 0.14), at=(0, -hall / 2, plinth - 0.005), color=c["door"]))
        if tier >= 4:
            parts.append(hip_roof("hall_roof_low", hall / 2 + 0.08, hall / 2 + 0.08, plinth + 0.13, 0.05, c["roof"]))
    if tier == 3:
        for number, sign in enumerate((-1, 1)):
            parts.append(lpm.prism(f"tree_{number}_trunk", 5, 0.014, 0.12, at=(sign * 0.4, 0.0, plinth - 0.005), color=c["wood"]))
            parts.append(lpm.prism(f"tree_{number}_crown", 6, 0.07, 0.1, at=(sign * 0.4, 0.0, plinth + 0.1), color=c["leaf"], radius_top=0.03))
    if tier == 4:
        for number, angle in enumerate((45, 135, 225, 315)):
            x, y = 0.44 * math.cos(math.radians(angle)), 0.44 * math.sin(math.radians(angle))
            parts.append(lpm.prism(f"shrub_{number}", 6, 0.06, 0.07, at=(x, y, plinth - 0.005), color=c["leaf"], radius_top=0.03))
    if tier >= 5:
        r_a, r_b = 0.46, 0.38
        parts.append(ring_solid("inner_ring", [(r_a, plinth - 0.005), (r_a, plinth + fh), (r_b, plinth + fh), (r_b, plinth - 0.005)], c["wall"]))
        parts.append(ring_solid("inner_ring_roof", [(r_a + 0.04, plinth + fh - 0.02), (r_a - 0.04, plinth + fh + 0.08), (r_b - 0.02, plinth + fh - 0.02)], c["roof"]))

    if spec.get("solar"):
        angle = math.degrees(math.atan2(rise, r_eave - r_ridge))
        t = 0.5
        r_panel = r_eave - t * (r_eave - r_ridge)
        z_panel = z_eave + t * rise
        sine, cosine = math.sin(math.radians(angle)), math.cos(math.radians(angle))
        for number, theta in enumerate((-120, -105, -90, -75, -60)):
            panel = lpm.box(f"solar_panel_{number}", (0.2, 0.16, 0.012), at=(r_panel + 0.015 * sine, 0, z_panel + 0.015 * cosine), color=c["solar"])
            lpm.rotate(panel, angle, axis="Y", about=(r_panel + 0.015 * sine, 0, z_panel + 0.015 * cosine))
            lpm.rotate(panel, theta, axis="Z", about=(0, 0, 0))
            parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=30000 + 12000 * floors, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = list(spec["footprint"])
    return report


def build_brutalist(spec, out_dir):
    """A brutalist concrete tower on a 1x1 cell with `floors` floors (4, 6 or 8, the Tier 1 to 3 of the Home building), front facing -Y.
    A board-formed concrete slab block on a pilotis ground floor with four columns and a glazed lobby, a taller stair core behind with slit windows and a colored stripe, a front facade of ribbon windows behind a concrete egg-crate of fins and sunshades with a few colored panels,
    roof slabs with a lift overrun, from Tier 2 the two top floors cantilevered over the front, an entrance canopy and a water tank, at 3 a roof pergola."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("conc", "vtone1"), ("panel", "vtone2"), ("glass", "glass_blue"), ("dark", "udark"), ("tank", "greywood"), ("leaf", "bush"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    floors = spec["floors"]
    tier = {4: 1, 6: 2, 8: 3}[floors]
    rng = random.Random(spec["id"])
    plaza, ground, fh = 0.03, 0.32, 0.285
    levels = floors - 1
    z_b = plaza + ground
    z_roof = z_b + levels * fh
    half, y_back, y_flat, bays = 0.47, 0.18, -0.30, 6
    front_of = lambda level: -0.38 if tier >= 2 and level >= levels - 2 else y_flat
    core_x0, core_top = 0.19, z_roof + 0.16
    parts = [lpm.box("plaza", (0.99, 0.99, plaza), at=(0, 0, 0), color=c["conc"]),
             lpm.box("core", (0.49 - core_x0, 0.49 - y_back, core_top - plaza), at=((core_x0 + 0.49) / 2, (y_back + 0.49) / 2, plaza), color=c["conc"]),
             lpm.box("core_roof", (0.49 - core_x0 + 0.02, 0.49 - y_back + 0.02, 0.03), at=((core_x0 + 0.49) / 2, (y_back + 0.49) / 2, core_top), color=c["conc"]),
             lpm.box("lift_overrun", (0.16, 0.16, 0.12), at=(0.34, 0.33, core_top + 0.03), color=c["conc"]),
             lpm.box("core_stripe", (0.012, 0.28, core_top - plaza - 0.02), at=(core_x0 - 0.006, (y_back + 0.49) / 2, plaza + 0.01), color=c["panel"])]

    for number, (cx, cy) in enumerate(((-0.36, -0.2), (0.36, -0.2), (-0.36, 0.08), (0.12, 0.08))):
        parts.append(lpm.box(f"pilotis_{number}", (0.12, 0.12, ground), at=(cx, cy, plaza), color=c["conc"]))
    parts.append(lpm.box("lobby", (0.4, 0.2, ground - 0.08), at=(-0.1, -0.12, plaza), color=c["glass"]))
    parts.append(lpm.box("lobby_door", (0.1, 0.012, 0.2), at=(-0.1, -0.226, plaza), color=c["panel"]))

    rows = []
    for level in range(levels):
        z = z_b + level * fh
        front = front_of(level)
        depth = y_back - front
        parts.append(lpm.box(f"block_{level}", (2 * half, depth, fh - 0.03), at=(0, (front + y_back) / 2, z), color=c["conc"]))
        parts.append(lpm.box(f"slab_{level}", (2 * half + 0.03, depth + 0.03, 0.04), at=(0, (front + y_back) / 2, z + fh - 0.04), color=c["conc"]))
        pitch = 2 * half / bays
        accent = rng.randrange(bays) if rng.random() < 0.6 else -1
        for bay in range(bays):
            u = -half + (bay + 0.5) * pitch
            face_box(parts, f"front_{level}_{bay}", "front", front, u, 0.105, 0.15, z + 0.06, 0.012, c["panel"] if bay == accent else c["glass"])
            parts.append(lpm.box(f"sunshade_{level}_{bay}", (pitch, 0.07, 0.022), at=(u, front - 0.035, z + fh - 0.065), color=c["conc"]))
        for fin in range(bays + 1):
            fx = -half + fin * pitch
            parts.append(lpm.box(f"fin_{level}_{fin}", (0.026, 0.07, fh - 0.06), at=(fx, front - 0.035, z + 0.02), color=c["conc"]))
        for number, x in enumerate((-0.35, -0.1, 0.1)):
            face_box(parts, f"back_{level}_{number}", "back", y_back, x, 0.12, 0.1, z + 0.08, 0.012, c["glass"])
        for face, wall in (("left", -half), ("right", half)):
            for number, y in enumerate((front + 0.12, (front + y_back) / 2 + 0.04)):
                face_box(parts, f"{face}_{level}_{number}", face, wall, y, 0.04, 0.14, z + 0.07, 0.012, c["dark"])
        face_box(parts, f"core_slit_right_{level}", "right", 0.49, 0.33, 0.05, 0.14, z + 0.07, 0.012, c["dark"])
        face_box(parts, f"core_slit_back_{level}", "back", 0.49, 0.34, 0.05, 0.14, z + 0.07, 0.012, c["dark"])

    top_front = front_of(levels - 1)
    parts.append(lpm.box("roof_slab", (2 * half + 0.05, y_back - top_front + 0.05, 0.04), at=(0, (top_front + y_back) / 2, z_roof - 0.005), color=c["conc"]))
    if tier >= 2:
        parts.append(lpm.box("canopy", (0.5, 0.2, 0.03), at=(-0.1, -0.32, z_b - 0.05), color=c["conc"]))
        for number, (lx, ly) in enumerate(((-0.02, 0.04), (0.02, 0.04), (-0.02, -0.04), (0.02, -0.04))):
            parts.append(lpm.box(f"tank_leg_{number}", (0.014, 0.014, 0.1), at=(0.36 + lx * 1.5, 0.42 + ly, core_top + 0.045), color=c["conc"]))
    if tier >= 2:
        parts.append(lpm.prism("water_tank", 8, 0.055, 0.1, at=(0.36, 0.42, core_top + 0.145), color=c["tank"]))
    if tier >= 3:
        for number, (px, py) in enumerate(((-0.4, -0.1), (0.1, -0.1), (-0.4, 0.12), (0.1, 0.12))):
            parts.append(lpm.box(f"pergola_post_{number}", (0.022, 0.022, 0.16), at=(px, py, z_roof + 0.035), color=c["conc"]))
        parts.append(lpm.box("pergola_roof", (0.56, 0.3, 0.025), at=(-0.15, 0.01, z_roof + 0.195), color=c["conc"]))
        for number, x in enumerate((-0.3, -0.15, 0.0)):
            parts.append(lpm.prism(f"roof_plant_{number}", 6, 0.04, 0.05, at=(x, 0.01, z_roof + 0.035), color=c["leaf"], radius_top=0.02))

    if spec.get("solar"):
        base = z_roof + 0.035
        for row, py in enumerate((-0.12, 0.06)):
            if tier >= 3:
                py += 0.0
            for number in range(3):
                px = -0.38 + number * 0.24 if tier < 3 else -0.38 + number * 0.24
                if tier >= 3 and row == 1:
                    continue
                panel = lpm.box(f"solar_panel_{row}_{number}", (0.2, 0.16, 0.012), at=(px, py + (0.17 if tier >= 3 else 0.0), base + 0.05), color=c["solar"])
                lpm.rotate(panel, 20, axis="X", about=(px, py + (0.17 if tier >= 3 else 0.0), base + 0.05))
                parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=30000 + 8000 * floors, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = list(spec["footprint"])
    return report


RONDAVEL_HUTS = {  # per Tier: (x, y, wall radius, floors) of each round hut, the first one is the main hut; the cell is the Tier footprint
    1: [(0.0, 0.05, 0.30, 1)],
    2: [(-0.4, 0.02, 0.30, 1), (0.45, 0.1, 0.22, 1)],
    3: [(-0.4, 0.02, 0.30, 2), (0.45, 0.1, 0.22, 1)],
    4: [(-0.55, 0.0, 0.27, 2), (0.05, 0.05, 0.22, 1), (0.55, 0.0, 0.2, 1)],
    5: [(0.0, 0.1, 0.38, 2), (-0.6, -0.4, 0.25, 1), (0.6, -0.4, 0.25, 1), (-0.6, 0.6, 0.22, 1)],
    6: [(0.0, 0.1, 0.4, 3), (-0.6, -0.4, 0.25, 1), (0.6, -0.4, 0.25, 1), (-0.6, 0.6, 0.22, 1)],
    7: [(0.0, 0.1, 0.42, 4), (-0.6, -0.4, 0.25, 1), (0.6, -0.4, 0.25, 1), (-0.6, 0.6, 0.22, 1), (0.65, 0.6, 0.22, 1)],
    8: [(0.0, 0.1, 0.44, 5), (-0.6, -0.4, 0.25, 1), (0.6, -0.4, 0.25, 1), (-0.6, 0.6, 0.22, 1), (0.65, 0.6, 0.22, 1)],
}


def rondavel_hut(parts, c, tag, x, y, radius, floors, window):
    """A round hut: painted cylinder walls, a dark door facing -Y, and one thatched cone per floor, each narrower than the one below; returns the top of the hut and the cone of its roof."""
    z, r = 0.04, radius
    for level in range(floors):
        parts.append(lpm.prism(f"{tag}_wall_{level}", 16, r, 0.26, at=(x, y, z), color=c["wall"], radius_top=r * 0.97))
        parts.append(lpm.prism(f"{tag}_top_band_{level}", 16, r * 0.97 + 0.006, 0.035, at=(x, y, z + 0.215), color=c["paint"], radius_top=r * 0.97 + 0.006))
        if level == 0:
            parts.append(lpm.prism(f"{tag}_band", 16, r + 0.008, 0.07, at=(x, y, z), color=c["paint"], radius_top=r + 0.008))
            parts.append(lpm.box(f"{tag}_door", (0.13, 0.03, 0.19), at=(x, y - r + 0.005, z), color=c["door"]))
            parts.append(lpm.box(f"{tag}_door_lintel", (0.17, 0.034, 0.03), at=(x, y - r + 0.005, z + 0.19), color=c["paint"]))
        elif window:
            parts.append(lpm.box(f"{tag}_window_{level}", (0.08, 0.03, 0.09), at=(x, y - r * 0.97 + 0.005, z + 0.1), color=c["door"]))
            parts.append(lpm.box(f"{tag}_window_sill_{level}", (0.11, 0.036, 0.016), at=(x, y - r * 0.97 + 0.005, z + 0.085), color=c["paint"]))
        z += 0.26
        if level < floors - 1:
            parts.append(lpm.lathe(f"{tag}_skirt_{level}", [(r + 0.035, z - 0.02), (r - 0.025, z + 0.03)], segments=16, at=(x, y, 0), color=c["roof"]))
            z += 0.03
            r -= 0.035
    eave = r + 0.05
    rise = 0.95 * eave + 0.08
    parts.append(lpm.lathe(f"{tag}_roof", [(eave, z - 0.02), (eave * 0.55, z + rise * 0.55), (0.0, z + rise)], segments=16, at=(x, y, 0), color=c["roof"]))
    parts.append(lpm.lathe(f"{tag}_roof_eave", [(eave + 0.015, z - 0.03), (eave * 0.8, z + 0.01)], segments=16, at=(x, y, 0), color=c["roof"]))
    parts.append(lpm.box(f"{tag}_finial", (0.012, 0.012, 0.07), at=(x, y, z + rise - 0.01), color=c["pole"]))
    return z, eave, rise


def build_rondavel(spec, out_dir):
    """A southern African rondavel homestead, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    Round painted huts under steep thatched cones, a low yard wall with a gate on the front, the main hut growing in stacked floors with a thatch skirt between them (one to five), more huts around it Tier after Tier, from Tier 3 a granary on poles,
    from 4 an acacia, from 6 a cattle kraal of stakes with a few cows."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("roof", "vtone2"), ("paint", "vtone3"), ("door", "graphite"), ("stone", "earth"), ("grass", "turfgreen"), ("pole", "timber"),
                                              ("leaf", "bush"), ("cow", "darkwood"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    tier = spec["tier"]
    x0, x1, y0, y1 = -w / 2 + 0.005, w / 2 - 0.005, -d / 2 + 0.005, d / 2 - 0.005
    t, h = 0.04, 0.09
    gate = 0.16
    parts = [lpm.box("yard_back", (x1 - x0, t, h), at=(0, y1 - t / 2, 0), color=c["stone"]),
             lpm.box("yard_left", (t, y1 - y0, h), at=(x0 + t / 2, (y0 + y1) / 2, 0), color=c["stone"]),
             lpm.box("yard_right", (t, y1 - y0, h), at=(x1 - t / 2, (y0 + y1) / 2, 0), color=c["stone"]),
             lpm.box("yard_front_left", (x1 - x0 - gate - 0.0, t, h), at=((x0 - gate) / 2 + 0.0, y0 + t / 2, 0), color=c["stone"]) if False else lpm.box("yard_front_left", ((x1 - x0) / 2 - gate, t, h), at=(x0 + ((x1 - x0) / 2 - gate) / 2, y0 + t / 2, 0), color=c["stone"]),
             lpm.box("yard_front_right", ((x1 - x0) / 2 - gate, t, h), at=(x1 - ((x1 - x0) / 2 - gate) / 2, y0 + t / 2, 0), color=c["stone"]),
             lpm.box("yard_floor", (x1 - x0, y1 - y0, 0.03), at=(0, (y0 + y1) / 2, 0), color=c["grass"])]
    for side in (-1, 1):
        parts.append(lpm.box(f"gate_post_{side}", (0.035, 0.05, 0.16), at=(side * gate, y0 + t / 2, 0), color=c["pole"]))

    main = None
    for number, (hx, hy, radius, floors) in enumerate(RONDAVEL_HUTS[tier]):
        top, eave, rise = rondavel_hut(parts, c, f"hut_{number}", hx, hy, radius, floors, tier >= 3)
        if number == 0:
            main = (hx, hy, top, eave, rise)

    if tier >= 3:
        gx, gy = (0.7, -0.2) if w >= 2 and d < 2 else ((0.75, 0.2) if w >= 2 else (0.0, 0.0))
        gx, gy = (0.78, -0.1) if d < 2 else (0.0, -0.78)
        for number, (lx, ly) in enumerate(((-0.05, -0.05), (0.05, -0.05), (-0.05, 0.05), (0.05, 0.05))):
            parts.append(lpm.box(f"granary_leg_{number}", (0.014, 0.014, 0.1), at=(gx + lx, gy + ly, 0.03), color=c["pole"]))
        parts.append(lpm.prism("granary", 10, 0.085, 0.1, at=(gx, gy, 0.13), color=c["wall"], radius_top=0.08))
        parts.append(lpm.lathe("granary_roof", [(0.11, 0.23), (0.0, 0.33)], segments=10, at=(gx, gy, 0), color=c["roof"]))
    if tier >= 4:
        ax, ay = (0.82, 0.3) if d < 2 else (0.75, 0.75)
        parts.append(lpm.prism("acacia_trunk", 5, 0.02, 0.22, at=(ax, ay, 0.03), color=c["pole"], radius_top=0.014))
        parts.append(lpm.prism("acacia_crown", 8, 0.16, 0.05, at=(ax, ay, 0.25), color=c["leaf"], radius_top=0.13))
    if tier >= 6:
        kx, ky = 0.55, -0.15 if False else 0.15
        for number in range(12):
            angle = math.radians(number * 30)
            parts.append(lpm.box(f"kraal_stake_{number}", (0.016, 0.016, 0.1), at=(kx + 0.17 * math.cos(angle), ky + 0.17 * math.sin(angle), 0.03), color=c["pole"]))
        for number, (dx, dy) in enumerate(((-0.05, 0.02), (0.06, -0.04))):
            parts.append(lpm.box(f"cow_{number}", (0.09, 0.05, 0.05), at=(kx + dx, ky + dy, 0.05), color=c["cow"]))

    if spec.get("solar"):
        hx, hy, top, eave, rise = main
        angle = math.degrees(math.atan2(rise, eave))
        fraction = 0.35
        pz = top - 0.02 + fraction * rise
        py = hy - eave * (1 - fraction) * 0.55 - 0.0
        py = hy - eave * 0.55 * (1 - fraction)
        for number, px in enumerate((hx - 0.1, hx + 0.1) if main[3] > 0.4 else (hx,)):
            panel = lpm.box(f"solar_panel_{number}", (0.18, 0.2, 0.012), at=(px, py - 0.03, pz + 0.04), color=c["solar"])
            lpm.rotate(panel, angle * 0.8, axis="X", about=(px, py - 0.03, pz + 0.04))
            parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=20000 + 8000 * spec["floors"] * max(1, w * d // 2), center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


def banco_pinnacle(parts, c, tag, x, y, z, size):
    """A banco pinnacle: a small cone on a short drum, as on the pilasters of Djenne."""
    parts.append(lpm.prism(f"{tag}_drum", 6, size * 0.55, size * 0.35, at=(x, y, z), color=c["wall"], radius_top=size * 0.45))
    parts.append(lpm.lathe(f"{tag}_cone", [(size * 0.5, z + size * 0.35), (0.0, z + size * 1.4)], segments=6, at=(x, y, 0), color=c["wall"]))


def build_banco(spec, out_dir):
    """A Sahelian banco (mud-brick) house in the style of Djenne, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    A massive earthen block with vertical pilasters topped by pinnacles on every face, a pointed-arch door, small windows with colored shutters, flat roofs with a parapet, and the upper floors set back in steps from the fourth floor;
    from Tier 3 rows of protruding toron beams, 4 roof pots and a ladder, 5 a roof tower under a pinnacle, 7 a taller tower, 8 an acacia."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("beam", "vtone2"), ("door", "vtone3"), ("dark", "udark"), ("plinth", "darkwood"), ("leaf", "bush"), ("pot", "tile"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors, tier = spec["floors"], spec["tier"]
    fh, plinth = 0.27, 0.03
    bx, by = w / 2 - 0.06, d / 2 - 0.06
    parts = [lpm.box("plinth", (2 * bx + 0.04, 2 * by + 0.04, plinth), at=(0, 0, 0), color=c["plinth"])]

    inset = lambda level: 0.0 if level < 3 else 0.07 * (level - 2)
    tops = []
    for level in range(floors):
        i = inset(level)
        z = plinth + level * fh
        half_x, half_y = bx - i, by - i
        parts.append(lpm.box(f"block_{level}", (2 * half_x, 2 * half_y, fh), at=(0, 0, z), color=c["wall"]))
        parts.append(lpm.box(f"parapet_front_{level}", (2 * half_x, 0.03, 0.05), at=(0, -half_y + 0.015, z + fh), color=c["wall"]))
        parts.append(lpm.box(f"parapet_back_{level}", (2 * half_x, 0.03, 0.05), at=(0, half_y - 0.015, z + fh), color=c["wall"]))
        parts.append(lpm.box(f"parapet_left_{level}", (0.03, 2 * half_y, 0.05), at=(-half_x + 0.015, 0, z + fh), color=c["wall"]))
        parts.append(lpm.box(f"parapet_right_{level}", (0.03, 2 * half_y, 0.05), at=(half_x - 0.015, 0, z + fh), color=c["wall"]))
        tops.append((half_x, half_y, z + fh))

    px_count = max(3, 2 * round(w) + 1) + 1
    py_count = max(2, round(d / 0.5) + 1)
    px = [-bx + 0.0 + k * 2 * bx / (px_count - 1) for k in range(px_count)]
    py = [-by + k * 2 * by / (py_count - 1) for k in range(py_count)]
    low = min(floors, 3)
    pil_h = low * fh + 0.1
    spots = [(x, sign * by) for x in px for sign in (-1, 1)] + [(sign * bx, y) for y in py[1:-1] for sign in (-1, 1)]
    for number, (x, y) in enumerate(spots):
        sx = 0.08 if abs(y) == by else 0.07
        sy = 0.07 if abs(y) == by else 0.1
        out_x, out_y = (0.0, 0.015 * (1 if y > 0 else -1)) if abs(y) == by else (0.015 * (1 if x > 0 else -1), 0.0)
        parts.append(lpm.box(f"pilaster_{number}", (sx, sy, pil_h), at=(x + out_x, y + out_y, plinth), color=c["wall"]))
        banco_pinnacle(parts, c, f"pilaster_{number}_top", x + out_x, y + out_y, plinth + pil_h, 0.075)

    door_x = 0.0
    for level in range(floors):
        z = plinth + level * fh
        i = inset(level)
        half_y = by - i
        for bay in range(px_count - 1):
            u = (px[bay] + px[bay + 1]) / 2
            if level > 2 or abs(u) > bx - 0.1 - i:
                continue
            for face, wall in (("front", -half_y), ("back", half_y)):
                if face == "front" and level == 0 and abs(u - door_x) < 0.12:
                    continue
                face_box(parts, f"{face}_{level}_{bay}", face, wall, u, 0.09, 0.12, z + 0.1, 0.014, c["dark"])
                for side in (-1, 1):
                    face_box(parts, f"{face}_{level}_{bay}_shutter_{side}", face, wall, u + side * 0.065, 0.04, 0.12, z + 0.1, 0.018, c["door"])
        if level <= 2:
            for bay in range(py_count - 1):
                u = (py[bay] + py[bay + 1]) / 2
                for face, wall in (("left", -(bx - i)), ("right", bx - i)):
                    face_box(parts, f"{face}_{level}_{bay}", face, wall, u, 0.09, 0.12, z + 0.1, 0.014, c["dark"])
        if tier >= 3 and level <= 2:
            for face, wall, count, limit in (("front", -by, px_count, bx), ("back", by, px_count, bx)):
                for bay in range(px_count - 1):
                    for k in range(3):
                        u = px[bay] + (k + 1) * (px[bay + 1] - px[bay]) / 4
                        face_box(parts, f"toron_{face}_{level}_{bay}_{k}", face, wall, u, 0.014, 0.014, z + fh - 0.05, 0.07, c["beam"])

    arch_part(parts, "door_frame", "front", -by, arch_outline(door_x, plinth - 0.005, 0.2, 0.3), 0, 0.016, c["wall"])
    arch_part(parts, "door", "front", -by, arch_outline(door_x, plinth, 0.15, 0.26), 0, 0.024, c["door"])

    top_x, top_y, top_z = tops[-1]
    if floors > 3:
        for number, (cx, cy) in enumerate(((-1, -1), (1, -1), (-1, 1), (1, 1))):
            banco_pinnacle(parts, c, f"roof_pinnacle_{number}", cx * (top_x - 0.05), cy * (top_y - 0.05), top_z + 0.05, 0.08)
    if tier >= 4:
        for number, (dx, dy) in enumerate(((-0.3, 0.12), (-0.15, 0.17))):
            parts.append(lpm.prism(f"roof_pot_{number}", 8, 0.03, 0.05, at=(dx * min(1, top_x), dy, top_z), color=c["pot"], radius_top=0.022))
        parts.append(lpm.box("ladder", (0.05, 0.012, 0.24), at=(top_x - 0.2, -top_y - 0.012, plinth + (floors - 1) * fh - 0.05), color=c["beam"]))
    if tier >= 5:
        size = 0.26 if tier < 7 else 0.32
        height = 0.2 if tier < 7 else 0.38
        parts.append(lpm.box("roof_tower", (size, size, height), at=(-0.05 if w >= 2 else 0.0, 0.0, top_z + 0.01), color=c["wall"]))
        for number, (cx, cy) in enumerate(((-1, -1), (1, -1), (-1, 1), (1, 1))):
            banco_pinnacle(parts, c, f"tower_pinnacle_{number}", (-0.05 if w >= 2 else 0.0) + cx * (size / 2 - 0.02), cy * (size / 2 - 0.02), top_z + 0.01 + height, 0.07)
        face_box(parts, "tower_window", "front", -size / 2, -0.05 if w >= 2 else 0.0, 0.08, 0.1, top_z + 0.01 + height * 0.35, 0.014, c["dark"])
    if tier >= 8:
        parts.append(lpm.prism("acacia_trunk", 5, 0.02, 0.2, at=(bx + 0.02 if False else -w / 2 + 0.12, -d / 2 + 0.12, 0), color=c["beam"], radius_top=0.014))
        parts.append(lpm.prism("acacia_crown", 8, 0.13, 0.05, at=(-w / 2 + 0.12, -d / 2 + 0.12, 0.2), color=c["leaf"], radius_top=0.1))

    if spec.get("solar"):
        count_x = max(1, int((2 * top_x - 0.3) / 0.26))
        rows = (0.1,) if d < 2 else (-0.05, 0.25)
        z_panel = top_z + 0.06
        for row, y in enumerate(rows):
            for number in range(count_x):
                x = (number - (count_x - 1) / 2) * 0.26 + (0.0 if tier < 5 else -0.2 if w >= 2 else 0.0)
                if tier >= 5 and abs(x + (0.05 if w >= 2 else 0.0)) < 0.2 and abs(y) < 0.2:
                    continue
                panel = lpm.box(f"solar_panel_{row}_{number}", (0.22, 0.17, 0.012), at=(x, y, z_panel), color=c["solar"])
                lpm.rotate(panel, 20, axis="X", about=(x, y, z_panel))
                parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=20000 + 9000 * floors * max(1, w * d // 2), center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


def tata_turret(parts, c, tag, x, y, radius, height, cone):
    """A round earthen turret under a thatched cone, with a dark slit window and a mud band at the top."""
    parts.append(lpm.prism(f"{tag}_wall", 12, radius, height, at=(x, y, 0.0), color=c["wall"], radius_top=radius * 0.94))
    parts.append(lpm.prism(f"{tag}_band", 12, radius * 0.94 + 0.01, 0.03, at=(x, y, height - 0.06), color=c["wall"], radius_top=radius * 0.94 + 0.01))
    parts.append(lpm.box(f"{tag}_slit", (0.03, 0.03, 0.09), at=(x, y - radius * 0.95, height * 0.55), color=c["dark"]))
    eave = radius + 0.05
    parts.append(lpm.lathe(f"{tag}_roof", [(eave, height - 0.02), (eave * 0.5, height + cone * 0.5), (0.0, height + cone)], segments=12, at=(x, y, 0), color=c["roof"]))
    parts.append(lpm.box(f"{tag}_finial", (0.012, 0.012, 0.06), at=(x, y, height + cone - 0.01), color=c["beam"]))


def build_tata(spec, out_dir):
    """A Tata Somba of Togo and Benin, front facing -Y, on a 2x2 cell with `floors` floors (the Tier): a square earthen fortress house whose flat terrace is ringed by round turrets with thatched cones, a small door under a hood,
    slit windows and a ladder on the side; a granary on the terrace from Tier 2, four middle turrets at 3, two taller turrets flanking the door at 4, a second granary and clay pots at 5."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("roof", "vtone2"), ("beam", "vtone3"), ("dark", "udark"), ("door", "graphite"), ("pot", "tile"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    floors = spec["floors"]
    tier = floors
    fh = 0.27
    half = 0.9
    height = floors * fh
    parts = [lpm.box("block", (2 * half, 2 * half, height), at=(0, 0, 0), color=c["wall"])]
    for number, (name, size, at) in enumerate((("front", (2 * half, 0.04, 0.06), (0, -half + 0.02)), ("back", (2 * half, 0.04, 0.06), (0, half - 0.02)),
                                               ("left", (0.04, 2 * half, 0.06), (-half + 0.02, 0)), ("right", (0.04, 2 * half, 0.06), (half - 0.02, 0)))):
        parts.append(lpm.box(f"parapet_{name}", size, at=(at[0], at[1], height), color=c["wall"]))

    corner = 0.67
    for number, (cx, cy) in enumerate(((-1, -1), (1, -1), (-1, 1), (1, 1))):
        tata_turret(parts, c, f"corner_{number}", cx * corner, cy * corner, 0.27, height + 0.12, 0.3)
    if tier >= 3:
        for number, (cx, cy) in enumerate(((-0.76, 0.0), (0.76, 0.0), (0.0, 0.76))):
            tata_turret(parts, c, f"middle_{number}", cx, cy, 0.18, height + 0.06, 0.22)
    if tier >= 4:
        for number, cx in enumerate((-0.4, 0.4)):
            tata_turret(parts, c, f"gate_turret_{number}", cx, -0.74, 0.2, height + 0.2, 0.25)

    door_y = -half
    face_box(parts, "door", "front", door_y, 0.0, 0.16, 0.22, 0.0, 0.02, c["door"])
    face_box(parts, "door_lintel", "front", door_y, 0.0, 0.24, 0.03, 0.22, 0.04, c["beam"])
    parts.append(lpm.box("door_hood", (0.3, 0.08, 0.025), at=(0.0, door_y - 0.04, 0.28), color=c["roof"]))
    for level in range(floors):
        z = level * fh + 0.12
        for number, u in enumerate((-0.45, 0.45)):
            face_box(parts, f"front_slit_{level}_{number}", "front", door_y, u, 0.04, 0.1, z + 0.05, 0.014, c["dark"])
            face_box(parts, f"back_slit_{level}_{number}", "back", half, u, 0.04, 0.1, z + 0.05, 0.014, c["dark"])
            face_box(parts, f"left_slit_{level}_{number}", "left", -half, u, 0.04, 0.1, z + 0.05, 0.014, c["dark"])
            face_box(parts, f"right_slit_{level}_{number}", "right", half, u, 0.04, 0.1, z + 0.05, 0.014, c["dark"])
    parts.append(lpm.box("ladder", (0.014, 0.07, height * 0.9), at=(half + 0.007, -0.2, 0.0), color=c["beam"]))
    for number in range(int(height * 0.9 / 0.1)):
        parts.append(lpm.box(f"ladder_rung_{number}", (0.03, 0.09, 0.012), at=(half + 0.015, -0.2, 0.06 + number * 0.1), color=c["beam"]))

    if tier >= 2:
        parts.append(lpm.prism("granary", 10, 0.12, 0.16, at=(0.38, 0.32, height), color=c["wall"], radius_top=0.11))
        parts.append(lpm.lathe("granary_roof", [(0.16, height + 0.15), (0.0, height + 0.3)], segments=10, at=(0.38, 0.32, 0), color=c["roof"]))
    if tier >= 5:
        parts.append(lpm.prism("granary_2", 10, 0.1, 0.14, at=(-0.4, 0.32, height), color=c["wall"], radius_top=0.09))
        parts.append(lpm.lathe("granary_2_roof", [(0.14, height + 0.13), (0.0, height + 0.26)], segments=10, at=(-0.4, 0.32, 0), color=c["roof"]))
        for number, (px, py) in enumerate(((-0.2, -0.3), (0.0, -0.4), (0.2, -0.3))):
            parts.append(lpm.prism(f"pot_{number}", 8, 0.04, 0.06, at=(px, py, height), color=c["pot"], radius_top=0.03))

    if spec.get("solar"):
        z_panel = height + 0.05
        for row, y in enumerate((-0.15, -0.45) if tier < 4 else (-0.05, -0.3)):
            for number, x in enumerate((-0.35, 0.0, 0.35) if row == 0 else (-0.35, 0.0)):
                if tier >= 3 and abs(x) > 0.4:
                    continue
                panel = lpm.box(f"solar_panel_{row}_{number}", (0.22, 0.17, 0.012), at=(x - (0.1 if row else 0.0), y, z_panel), color=c["solar"])
                lpm.rotate(panel, 20, axis="X", about=(x - (0.1 if row else 0.0), y, z_panel))
                parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=20000 + 9000 * floors, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = list(spec["footprint"])
    return report


def ndebele_motif(parts, tag, face, wall, u, z, size, kind, c, first, second):
    """A big painted Ndebele motif on a wall: a stepped crest, a cross or a stepped pyramid made of colored rectangles, each outlined in white then black, with a small inner panel."""
    s = size
    if kind == 0:
        rects = [(0.0, 0.0, s, 0.4 * s, first), (0.0, 0.4 * s, 0.66 * s, 0.3 * s, first), (0.0, 0.7 * s, 0.34 * s, 0.3 * s, first)]
        inner = (0.0, 0.05 * s, 0.4 * s, 0.22 * s, second)
    elif kind == 1:
        rects = [(0.0, 0.34 * s, s, 0.3 * s, first), (0.0, 0.0, 0.3 * s, s, first)]
        inner = (0.0, 0.41 * s, 0.2 * s, 0.16 * s, second)
    else:
        rects = [(0.0, 0.0, s, 0.28 * s, first), (0.0, 0.28 * s, 0.66 * s, 0.28 * s, first), (0.0, 0.56 * s, 0.33 * s, 0.28 * s, first)]
        inner = (0.0, 0.07 * s, 0.34 * s, 0.14 * s, second)
    for layer, (pad, color, thick) in enumerate(((0.014, "black", 0.008), (0.007, "white", 0.01), (0.0, None, 0.012))):
        for number, (du, dz, a, h, col) in enumerate(rects):
            face_box(parts, f"{tag}_{layer}_{number}", face, wall, u + du, a + 2 * pad, h + 2 * pad, z + dz - pad, thick, c[color] if color else col)
    du, dz, a, h, col = inner
    face_box(parts, f"{tag}_inner", face, wall, u + du, a, h, z + dz, 0.014, col)


def ndebele_window(parts, tag, face, wall, u, bottom, c):
    """A small dark window in a painted surround: black, white, then a colored frame."""
    face_box(parts, f"{tag}_black", face, wall, u, 0.17, 0.19, bottom - 0.03, 0.008, c["black"])
    face_box(parts, f"{tag}_white", face, wall, u, 0.15, 0.17, bottom - 0.02, 0.01, c["white"])
    face_box(parts, f"{tag}_frame", face, wall, u, 0.125, 0.145, bottom - 0.008, 0.012, c["accent"])
    face_box(parts, f"{tag}_glass", face, wall, u, 0.09, 0.11, bottom + 0.01, 0.016, c["dark"])


def ndebele_triangles(parts, tag, face, wall, x_from, x_to, z, c):
    """A band of colored triangles on a low wall seen from the front or the back, on a black stripe, in pink, blue, yellow and the accent colors."""
    sign = -1 if face == "front" else 1
    colors = (c["pink"], c["accent"], c["trim"])
    count = max(1, round((x_to - x_from) / 0.11))
    pitch = (x_to - x_from) / count
    y0, y1 = sorted((wall - sign * 0.004, wall + sign * 0.006))
    for number in range(count):
        centre = x_from + (number + 0.5) * pitch
        up = number % 2 == 0
        outline = [(centre - pitch / 2 + 0.006, z), (centre + pitch / 2 - 0.006, z), (centre, z + 0.05)] if up else [(centre - pitch / 2 + 0.006, z + 0.05), (centre, z), (centre + pitch / 2 - 0.006, z + 0.05)]
        parts.append(extrude_y(f"{tag}_tri_{number}", outline if face == "front" else outline[::-1], y0, y1, colors[number % 3]))


def build_ndebele(spec, out_dir):
    """A South African Ndebele homestead, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    A low house under a shallow gable tin roof, its walls painted with bold geometric motifs (stepped triangles, zigzags, checkers) between colored bands and corner stripes, an arched door and windows in thick painted surrounds, inside a painted low yard wall with a gate and a grass yard;
    from Tier 2 a porch roof on two posts, 5 an acacia, 6 a water tank on legs, 7 painted gate pillars, 8 a second yard motif row."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("accent", "vtone2"), ("trim", "vtone3"), ("roof", "greythatch"), ("dark", "udark"), ("door", "graphite"), ("grass", "turfgreen"), ("white", "whitewash"), ("black", "graphite"), ("pink", "pink"),
                                              ("pole", "timber"), ("leaf", "bush"), ("tank", "greywood"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors, tier = spec["floors"], spec["tier"]
    fh, z0 = 0.26, 0.03
    x0, x1, y0, y1 = -w / 2 + 0.005, w / 2 - 0.005, -d / 2 + 0.005, d / 2 - 0.005
    t, h, gate = 0.04, 0.1, 0.16
    side = (x1 - x0) / 2 - gate
    parts = [lpm.box("yard_floor", (x1 - x0, y1 - y0, z0), at=(0, (y0 + y1) / 2, 0), color=c["grass"]),
             lpm.box("yard_back", (x1 - x0, t, h), at=(0, y1 - t / 2, 0), color=c["white"]),
             lpm.box("yard_left", (t, y1 - y0, h), at=(x0 + t / 2, (y0 + y1) / 2, 0), color=c["white"]),
             lpm.box("yard_right", (t, y1 - y0, h), at=(x1 - t / 2, (y0 + y1) / 2, 0), color=c["white"]),
             lpm.box("yard_front_left", (side, t, h), at=(x0 + side / 2, y0 + t / 2, 0), color=c["white"]),
             lpm.box("yard_front_right", (side, t, h), at=(x1 - side / 2, y0 + t / 2, 0), color=c["white"])]
    parts.append(lpm.box("yard_stripe_front_left", (side, t + 0.004, 0.025), at=(x0 + side / 2, y0 + t / 2, 0.0), color=c["black"]))
    parts.append(lpm.box("yard_stripe_front_right", (side, t + 0.004, 0.025), at=(x1 - side / 2, y0 + t / 2, 0.0), color=c["black"]))
    parts.append(lpm.box("yard_stripe_back", (x1 - x0, t + 0.004, 0.025), at=(0, y1 - t / 2, 0.0), color=c["black"]))
    ndebele_triangles(parts, "yard_front_left", "front", y0, x0 + 0.02, x0 + side - 0.02, 0.035, c)
    ndebele_triangles(parts, "yard_front_right", "front", y0, x1 - side + 0.02, x1 - 0.02, 0.035, c)
    ndebele_triangles(parts, "yard_back", "back", y1, x0 + 0.04, x1 - 0.04, 0.035, c)
    for number, (bx_, by_, lx, ly) in enumerate(((0, y1 - t / 2, x1 - x0, t), (x0 + t / 2, (y0 + y1) / 2, t, y1 - y0), (x1 - t / 2, (y0 + y1) / 2, t, y1 - y0),
                                                  (x0 + side / 2, y0 + t / 2, side, t), (x1 - side / 2, y0 + t / 2, side, t))):
        parts.append(lpm.box(f"yard_cap_{number}", (lx + 0.004, ly + 0.004, 0.015), at=(bx_, by_, h), color=c["black"]))
    for sign in (-1, 1):
        parts.append(lpm.box(f"gate_post_{sign}", (0.05, 0.06, 0.16 if tier < 7 else 0.2), at=(sign * gate, y0 + t / 2, 0), color=c["white"]))

    bx, yb0, yb1 = w / 2 - 0.13, -d / 2 + 0.16, d / 2 - 0.08
    height = floors * fh
    z_w = z0 + height
    cy = (yb0 + yb1) / 2
    hr = (yb1 - yb0) / 2 + 0.05
    rise = min(0.3, hr * 0.55)
    parts.append(lpm.box("walls", (2 * bx, yb1 - yb0, height), at=(0, cy, z0), color=c["wall"]))
    parts.append(extrude_x("roof", [(cy - hr, z_w - 0.01), (cy + hr, z_w - 0.01), (cy, z_w + rise)], -bx - 0.05, bx + 0.05, c["roof"]))
    for sign in (-1, 1):
        parts.append(extrude_x(f"gable_{sign}", [(cy - hr + 0.07, z_w - 0.005), (cy + hr - 0.07, z_w - 0.005), (cy, z_w + rise - 0.08)], *sorted((sign * (bx + 0.045), sign * (bx + 0.056))), c["trim"]))

    faces = (("front", yb0, 2 * bx), ("back", yb1, 2 * bx), ("left", -bx, yb1 - yb0), ("right", bx, yb1 - yb0))
    for face, wall, length in faces:
        centre = 0.0 if face in ("front", "back") else cy
        for level in range(floors):
            z = z0 + level * fh
            face_box(parts, f"{face}_stripe_top_{level}", face, wall, centre, length, 0.04, z + fh - 0.05, 0.01, c["white"])
            face_box(parts, f"{face}_stripe_low_{level}", face, wall, centre, length, 0.03, z, 0.01, c["black"])
        for sign in (-1, 1):
            face_box(parts, f"{face}_corner_{sign}", face, wall, centre + sign * (length / 2 - 0.035), 0.07, height, z0, 0.012, c["white"])
            for step in range(int(height / 0.09)):
                face_box(parts, f"{face}_corner_{sign}_dot_{step}", face, wall, centre + sign * (length / 2 - 0.035), 0.04, 0.05, z0 + 0.04 + step * 0.09, 0.016, (c["accent"], c["trim"], c["pink"])[step % 3])
        count = max(1, round(length / 0.5))
        pitch = length / count
        for level in range(floors):
            z = z0 + level * fh
            for bay in range(count):
                u = centre - length / 2 + (bay + 0.5) * pitch
                if face == "front" and level == 0 and abs(u) < 0.2:
                    continue
                if (bay + level) % 2 == 0:
                    ndebele_window(parts, f"{face}_{level}_{bay}_win", face, wall, u, z + 0.1, c)
                else:
                    ndebele_motif(parts, f"{face}_{level}_{bay}_motif", face, wall, u, z + 0.05, min(0.17, pitch - 0.14), (bay + level + len(face)) % 3, c, (c["accent"], c["trim"], c["pink"])[(bay + 2 * level) % 3], (c["trim"], c["pink"], c["accent"])[(bay + level) % 3])
        if face == "front" and count % 2 == 1 and count > 1:
            pass
    arch_part(parts, "door_surround", "front", yb0, arch_outline(0.0, z0 - 0.005, 0.24, 0.3), 0, 0.014, c["accent"])
    arch_part(parts, "door", "front", yb0, arch_outline(0.0, z0, 0.17, 0.26), 0, 0.022, c["door"])
    for step in range(3):
        parts.append(lpm.box(f"door_step_{step}", (0.34, 0.04, (3 - step) * 0.015), at=(0.0, yb0 - 0.02 - step * 0.04, z0), color=c["white"]))
    if tier >= 2:
        for sign in (-1, 1):
            parts.append(lpm.box(f"porch_post_{sign}", (0.02, 0.02, 0.28), at=(sign * 0.17, yb0 - 0.09, z0), color=c["trim"]))
        parts.append(lpm.box("porch_roof", (0.44, 0.13, 0.025), at=(0.0, yb0 - 0.06, z0 + 0.3), color=c["roof"]))
    if tier >= 5:
        parts.append(lpm.prism("acacia_trunk", 5, 0.02, 0.2, at=(x1 - 0.14, y0 + 0.16, z0), color=c["pole"], radius_top=0.014))
        parts.append(lpm.prism("acacia_crown", 8, 0.13, 0.05, at=(x1 - 0.14, y0 + 0.16, z0 + 0.2), color=c["leaf"], radius_top=0.1))
    if tier >= 6:
        tx, ty = x0 + 0.14, y1 - 0.14
        for number, (lx, ly) in enumerate(((-0.04, -0.04), (0.04, -0.04), (-0.04, 0.04), (0.04, 0.04))):
            parts.append(lpm.box(f"tank_leg_{number}", (0.014, 0.014, 0.12), at=(tx + lx, ty + ly, z0), color=c["pole"]))
        parts.append(lpm.prism("tank", 8, 0.06, 0.1, at=(tx, ty, z0 + 0.12), color=c["tank"]))
    if tier >= 8:
        for number, u in enumerate((-0.6 * (x1 - x0) / 2, 0.6 * (x1 - x0) / 2)):
            ndebele_motif(parts, f"yard_motif_{number}", "back", y1, u, 0.03, 0.06, number % 3, c, c["accent"], c["trim"])

    if spec.get("solar"):
        angle = math.degrees(math.atan2(rise, hr))
        sine, cosine = math.sin(math.radians(angle)), math.cos(math.radians(angle))
        count_x = max(1, int((2 * bx - 0.2) / 0.24))
        for row, fraction in enumerate((0.45,) if d < 2 else (0.35, 0.65)):
            for number in range(count_x):
                px = (number - (count_x - 1) / 2) * 0.24
                py, pz = cy + hr * (1 - fraction) + 0.015 * sine, z_w + fraction * rise + 0.015 * cosine
                panel = lpm.box(f"solar_panel_{row}_{number}", (0.2, 0.26, 0.012), at=(px, py, pz), color=c["solar"])
                lpm.rotate(panel, -angle, axis="X", about=(px, py, pz))
                parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=30000 + 12000 * floors * max(1, w * d // 2), center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


def fale_hut(parts, c, tag, x, y, z, radius, rails=False):
    """A Samoan fale: an open round house on a ring of posts under a domed thatched roof, with rolled-up woven blinds between some posts."""
    parts.append(lpm.prism(f"{tag}_floor", 16, radius + 0.03, 0.025, at=(x, y, z), color=c["stone"]))
    z += 0.025
    for number in range(12):
        angle = math.radians(number * 30)
        parts.append(lpm.box(f"{tag}_post_{number}", (0.03, 0.03, 0.27), at=(x + radius * math.cos(angle), y + radius * math.sin(angle), z), color=c["wood"]))
    parts.append(lpm.box(f"{tag}_centre_post", (0.035, 0.035, 0.45), at=(x, y, z), color=c["wood"]))
    if rails:
        fale_rails(parts, c, tag, z - 0.025, radius)
    else:
        for number in range(6):
            blind = lpm.box(f"{tag}_blind_{number}", (0.012, 0.15, 0.05), at=(x + radius, y, z + 0.19), color=c["blind"])
            lpm.rotate(blind, 15 + number * 60, axis="Z", about=(x, y, 0))
            parts.append(blind)
    parts.append(lpm.prism(f"{tag}_beam", 16, radius + 0.015, 0.025, at=(x, y, z + 0.27), color=c["wood"]))
    profile = [(radius + 0.1, z + 0.25), (radius + 0.03, z + 0.32), (radius * 0.72, z + 0.45), (radius * 0.42, z + 0.56), (0.0, z + 0.64)]
    parts.append(lpm.lathe(f"{tag}_roof", profile, segments=16, at=(x, y, 0), color=c["roof"]))
    parts.append(lpm.lathe(f"{tag}_roof_eave", [(radius + 0.115, z + 0.24), (radius + 0.04, z + 0.31)], segments=16, at=(x, y, 0), color=c["roof"]))
    parts.append(lpm.box(f"{tag}_finial", (0.014, 0.014, 0.06), at=(x, y, z + 0.62), color=c["wood"]))


def fale_palm(parts, c, tag, x, y, z, height):
    parts.append(lpm.prism(f"{tag}_trunk", 6, 0.02, height, at=(x, y, z), color=c["trunk"], radius_top=0.013))
    for number in range(6):
        frond = lpm.box(f"{tag}_frond_{number}", (0.09, 0.03, 0.012), at=(x + 0.045, y, z + height - 0.02), color=c["palm"])
        lpm.rotate(frond, -22, axis="Y", about=(x, y, z + height - 0.02))
        lpm.rotate(frond, number * 60, axis="Z", about=(x, y, z + height - 0.02))
        parts.append(frond)


def fale_oblong(parts, c, tag, z, radius, length):
    """An oblong fale tele centred on the origin along X: two rounded ends and straight sides on posts, under a thatched barrel roof closed by two half domes, with rolled-up blinds on the long sides."""
    half = length / 2
    parts.append(lpm.box(f"{tag}_floor", (length, 2 * radius + 0.06, 0.025), at=(0, 0, z), color=c["stone"]))
    for sign in (-1, 1):
        parts.append(lpm.prism(f"{tag}_floor_end_{sign}", 16, radius + 0.03, 0.025, at=(sign * half, 0, z), color=c["stone"]))
    z += 0.025
    count = max(2, round(length / 0.2))
    for sign in (-1, 1):
        for number in range(count + 1):
            parts.append(lpm.box(f"{tag}_side_post_{sign}_{number}", (0.03, 0.03, 0.27), at=(-half + number * length / count, sign * radius, z), color=c["wood"]))
        for number in range(1, 6):
            angle = math.radians(-90 + number * 30)
            parts.append(lpm.box(f"{tag}_end_post_{sign}_{number}", (0.03, 0.03, 0.27), at=(sign * (half + radius * math.cos(angle)), radius * math.sin(angle), z), color=c["wood"]))
        for number in range(1, count, 2):
            parts.append(lpm.box(f"{tag}_blind_{sign}_{number}", (0.17, 0.012, 0.05), at=(-half + (number + 0.5) * length / count, sign * radius, z + 0.19), color=c["blind"]))
    for number in range(3):
        parts.append(lpm.box(f"{tag}_centre_post_{number}", (0.035, 0.035, 0.42), at=(-half * 0.6 + number * half * 0.6, 0, z), color=c["wood"]))
    parts.append(lpm.box(f"{tag}_beam", (length, 2 * radius, 0.025), at=(0, 0, z + 0.27), color=c["wood"]))
    for sign in (-1, 1):
        parts.append(lpm.prism(f"{tag}_beam_end_{sign}", 16, radius + 0.015, 0.025, at=(sign * half, 0, z + 0.27), color=c["wood"]))
    zb = z + 0.25
    section = [(-radius - 0.1, zb), (-radius - 0.03, zb + 0.07), (-radius * 0.72, zb + 0.2), (-radius * 0.42, zb + 0.31), (0.0, zb + 0.39),
               (radius * 0.42, zb + 0.31), (radius * 0.72, zb + 0.2), (radius + 0.03, zb + 0.07), (radius + 0.1, zb)]
    parts.append(extrude_x(f"{tag}_roof", section, -half, half, c["roof"]))
    profile = [(radius + 0.1, zb), (radius + 0.03, zb + 0.07), (radius * 0.72, zb + 0.2), (radius * 0.42, zb + 0.31), (0.0, zb + 0.39)]
    for sign in (-1, 1):
        parts.append(lpm.lathe(f"{tag}_roof_end_{sign}", profile, segments=16, at=(sign * half, 0, 0), color=c["roof"]))


def fale_rails(parts, c, tag, z, radius, door=False):
    """A half-openwork railing between the twelve posts of a round floor: sections alternate between a solid panel and an open one with three balusters; with `door`, the two sections at the front and the front post are replaced by a doorway."""
    chord = 2 * radius * math.sin(math.radians(15))
    rail_r = (radius + 0.004) * math.cos(math.radians(15))
    for number in range(12):
        if door and number in (8, 9):
            continue
        theta = 15 + number * 30
        pieces = [(f"{tag}_rail_{number}", (0.016, chord - 0.03, 0.016), 0.125, c["wood"])]
        if number % 2 == 0:
            pieces.append((f"{tag}_panel_{number}", (0.012, chord - 0.03, 0.09), 0.04, c["blind"]))
        else:
            for baluster in range(3):
                pieces.append((f"{tag}_baluster_{number}_{baluster}", (0.012, 0.012, 0.09), 0.04, c["wood"]))
        for name, size, height, color in pieces:
            along = 0.0 if "baluster" not in name else (int(name.rsplit("_", 1)[1]) - 1) * chord * 0.3
            part = lpm.box(name, size, at=(rail_r, along, z + 0.025 + height), color=color)
            lpm.rotate(part, theta, axis="Z", about=(0, 0, 0))
            parts.append(part)
    if door:
        for name, size, height, color, along in (("door", (0.02, 0.2, 0.2), 0.0, c["door"], 0.0), ("door_lintel", (0.03, 0.26, 0.03), 0.2, c["wood"], 0.0),
                                                 ("door_post_a", (0.03, 0.03, 0.23), 0.0, c["wood"], -0.115), ("door_post_b", (0.03, 0.03, 0.23), 0.0, c["wood"], 0.115)):
            part = lpm.box(f"{tag}_{name}", size, at=(radius * 0.995, along, z + 0.025 + height), color=color)
            lpm.rotate(part, -90, axis="Z", about=(0, 0, 0))
            parts.append(part)


def fale_level(parts, c, tag, z, radius, door=False):
    """An intermediate open floor of a tall fale: a round floor on twelve posts under a ring of thatch; returns the height of the next floor."""
    parts.append(lpm.prism(f"{tag}_floor", 16, radius + 0.03, 0.025, at=(0, 0, z), color=c["stone"]))
    for number in range(12):
        if door and number == 9:
            continue
        angle = math.radians(number * 30)
        parts.append(lpm.box(f"{tag}_post_{number}", (0.03, 0.03, 0.24), at=(radius * math.cos(angle), radius * math.sin(angle), z + 0.025), color=c["wood"]))
    parts.append(lpm.prism(f"{tag}_beam", 16, radius + 0.015, 0.025, at=(0, 0, z + 0.265), color=c["wood"]))
    fale_rails(parts, c, tag, z, radius, door)
    parts.append(lpm.lathe(f"{tag}_skirt", [(radius + 0.1, z + 0.255), (radius + 0.03, z + 0.33)], segments=16, at=(0, 0, 0), color=c["roof"]))
    return z + 0.3


def build_fale(spec, out_dir):
    """A Samoan fale on a thin grassy mound, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    A thin grass mound with a stone course, and on it an open fale under a domed thatched roof: a round one at Tier 1, a longer oblong fale tele at Tiers 2 to 4, and from Tier 5 a round fale with intermediate open floors under thatch rings, one more per Tier, without raising the mound;
    coconut palms from Tier 2 (one more at 3, 5 and 7), and small round fales in the front corners from Tier 6 and in all four corners at 8."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("roof", "vtone1"), ("wood", "vtone2"), ("blind", "vtone3"), ("stone", "greywood"), ("grass", "turfgreen"), ("palm", "bush"), ("trunk", "pine"), ("door", "graphite"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors, tier = spec["floors"], spec["tier"]
    parts = [lpm.box("ground", (w - 0.01, d - 0.01, 0.02), at=(0, 0, 0), color=c["grass"]),
             lpm.box("mound_course", (w - 0.09, d - 0.09, 0.015), at=(0, 0, 0.02), color=c["stone"]),
             lpm.box("mound", (w - 0.1, d - 0.1, 0.03), at=(0, 0, 0.02), color=c["grass"])]
    z_m = 0.05
    main_radius = 0.3
    if tier == 1:
        fale_hut(parts, c, "fale", 0.0, 0.0, z_m, 0.33)
        main_radius = 0.33
    elif tier <= 4:
        main_radius, length = {2: (0.2, 0.8), 3: (0.24, 1.0), 4: (0.28, 1.2)}[tier]
        fale_oblong(parts, c, "fale", z_m, main_radius, length)
    else:
        radius, z = 0.62, z_m
        for level in range(floors - 1):
            z = fale_level(parts, c, f"level_{level}", z, radius, door=level == 0)
            radius -= 0.05
        fale_hut(parts, c, "fale", 0.0, 0.0, z, radius, rails=True)
        main_radius = radius
        if tier >= 6:
            for number, sx in enumerate((-1, 1)):
                fale_hut(parts, c, f"corner_front_{number}", sx * 0.72, -0.72, z_m, 0.14)
        if tier >= 8:
            for number, sx in enumerate((-1, 1)):
                fale_hut(parts, c, f"corner_back_{number}", sx * 0.72, 0.72, z_m, 0.14)

    count = sum(tier >= minimum for minimum in (2, 3, 5, 7))
    spots = ((-1, 1), (1, 1), (-1, -1), (1, -1)) if tier < 6 else ((-1, 0.0), (1, 0.0), (-1, 0.3), (1, 0.3))
    for number in range(count):
        sx, sy = spots[number]
        px, py = (sx * (w / 2 - 0.12), sy * (d / 2 - 0.12)) if tier < 6 else (sx * (w / 2 - 0.1), sy * (d / 2 - 0.12) * 1.0)
        fale_palm(parts, c, f"palm_{number}", px, py, z_m, 0.45 + 0.05 * number)

    if spec.get("solar"):
        z_base = z_m if tier <= 4 else z
        for number, px in enumerate((-0.12, 0.12)):
            py = -main_radius * 0.5
            panel = lpm.box(f"solar_panel_{number}", (0.16, 0.12, 0.012), at=(px, py, z_base + 0.025 + 0.53), color=c["solar"])
            lpm.rotate(panel, 40, axis="X", about=(px, py, z_base + 0.025 + 0.53))
            parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=30000 + 8000 * floors, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


def whare_post(parts, c, tag, x, y, z, height):
    """A carved porch post: a red post with white dots and a small head."""
    parts.append(lpm.box(f"{tag}_post", (0.045, 0.045, height), at=(x, y, z), color=c["red"]))
    for number in range(int(height / 0.08)):
        parts.append(lpm.box(f"{tag}_dot_{number}", (0.018, 0.012, 0.018), at=(x + (0.01 if number % 2 else -0.01), y - 0.024, z + 0.04 + number * 0.08), color=c["white"]))
    parts.append(lpm.box(f"{tag}_head", (0.06, 0.05, 0.05), at=(x, y, z + height), color=c["red"]))


def whare_window(parts, tag, face, wall, u, bottom, c):
    """A dark window in a thick red surround (chambranle) that stands out of the wall more than the glass."""
    face_box(parts, f"{tag}_glass", face, wall, u, 0.11, 0.13, bottom + 0.005, 0.01, c["dark"])
    face_box(parts, f"{tag}_frame_top", face, wall, u, 0.19, 0.035, bottom + 0.135, 0.024, c["red"])
    face_box(parts, f"{tag}_frame_bottom", face, wall, u, 0.19, 0.035, bottom - 0.04, 0.024, c["red"])
    for side in (-1, 1):
        face_box(parts, f"{tag}_frame_{side}", face, wall, u + side * 0.0775, 0.035, 0.17, bottom - 0.02, 0.024, c["red"])


def build_whare(spec, out_dir):
    """A Maori whare, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    A timber meeting house with the gable on the front: red carved bargeboards with white dots, a koruru head at the apex, a porch with carved red posts, a door and a window on the front, dark windows around, on a grassy plot;
    from Tier 4 a storehouse on poles (pataka) at the left, 5 a palisade at the front, 6 a second pataka, 7 a flagpole, 8 a carved canoe."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("red", "vtone2"), ("white", "whitewash"), ("black", "graphite"), ("dark", "udark"), ("roof", "shingle"), ("grass", "turfgreen"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors, tier = spec["floors"], spec["tier"]
    fh, z0 = 0.26, 0.02
    bx, yb0, yb1 = w / 2 - 0.12, -d / 2 + 0.2, d / 2 - 0.06
    height = floors * fh
    z_w = z0 + height
    reach = bx + 0.07
    rise = min(0.42, reach * 0.65)
    y0r, y1r = -d / 2 + 0.05, d / 2 - 0.01
    parts = [lpm.box("ground", (w - 0.01, d - 0.01, z0), at=(0, 0, 0), color=c["grass"]),
             lpm.box("walls", (2 * bx, yb1 - yb0, height), at=(0, (yb0 + yb1) / 2, z0), color=c["wall"]),
             extrude_y("roof", [(-reach, z_w - 0.01), (reach, z_w - 0.01), (0, z_w + rise)], y0r, y1r, c["roof"]),
             extrude_y("gable_front", [(-reach + 0.07, z_w), (reach - 0.07, z_w), (0, z_w + rise - 0.1)], y0r - 0.012, y0r, c["wall"])]
    for sign in (-1, 1):
        parts.append(extrude_y(f"maihi_{sign}", [(sign * reach, z_w - 0.01), (0, z_w + rise), (0, z_w + rise - 0.085), (sign * reach, z_w - 0.09)], y0r - 0.03, y0r - 0.005, c["red"]))
        for number in range(6):
            t = 0.12 + number * 0.15
            parts.append(lpm.box(f"maihi_{sign}_dot_{number}", (0.02, 0.012, 0.02), at=(sign * reach * (1 - t), y0r - 0.034, z_w - 0.05 + (rise + 0.01) * t - 0.01), color=c["white"]))
    parts.append(lpm.box("koruru", (0.09, 0.03, 0.11), at=(0, y0r - 0.03, z_w + rise - 0.2), color=c["red"]))
    for sign in (-1, 1):
        parts.append(lpm.box(f"koruru_eye_{sign}", (0.025, 0.012, 0.025), at=(sign * 0.022, y0r - 0.042, z_w + rise - 0.15), color=c["white"]))
    parts.append(lpm.box("koruru_mouth", (0.05, 0.012, 0.012), at=(0, y0r - 0.042, z_w + rise - 0.19), color=c["black"]))

    for sign in (-1, 1):
        whare_post(parts, c, f"porch_{sign}", sign * (bx - 0.05), y0r + 0.05, z0, height - 0.05)
    parts.append(lpm.box("porch_beam", (2 * bx, 0.05, 0.05), at=(0, y0r + 0.05, z_w - 0.05), color=c["red"]))
    face_box(parts, "door", "front", yb0, -bx * 0.4, 0.15, 0.22, z0, 0.016, c["dark"])
    face_box(parts, "door_lintel", "front", yb0, -bx * 0.4, 0.2, 0.03, z0 + 0.22, 0.022, c["red"])
    for level in range(floors):
        z = z0 + level * fh + 0.08
        if level > 0:
            whare_window(parts, f"front_window_left_{level}", "front", yb0, -bx * 0.4, z, c)
        whare_window(parts, f"front_window_{level}", "front", yb0, bx * 0.4, z, c)
        for number, y in enumerate((yb0 + 0.25, (yb0 + yb1) / 2 + 0.1)):
            if y < yb1 - 0.1:
                for face, wall in (("left", -bx), ("right", bx)):
                    whare_window(parts, f"{face}_{level}_{number}", face, wall, y, z, c)

    if tier >= 4:
        for number, (px, py) in enumerate((((-(w / 2 - 0.07)), -d / 2 + 0.12), ((w / 2 - 0.07), -d / 2 + 0.12))[: 1 if tier < 6 else 2]):
            for lx, ly in ((-0.03, -0.03), (0.03, -0.03), (-0.03, 0.03), (0.03, 0.03)):
                parts.append(lpm.box(f"pataka_{number}_leg_{lx}_{ly}", (0.012, 0.012, 0.1), at=(px + lx, py + ly, z0), color=c["wall"]))
            parts.append(lpm.box(f"pataka_{number}", (0.09, 0.09, 0.08), at=(px, py, z0 + 0.1), color=c["red"]))
            parts.append(extrude_y(f"pataka_{number}_roof", [(px - 0.07, z0 + 0.18), (px + 0.07, z0 + 0.18), (px, z0 + 0.26)], py - 0.06, py + 0.06, c["roof"]))
    if tier >= 5:
        count = int((w - 0.2) / 0.1)
        for number in range(count):
            x = -(w - 0.2) / 2 + number * (w - 0.2) / (count - 1)
            if abs(x + bx * 0.4) > 0.2:
                parts.append(lpm.box(f"palisade_{number}", (0.03, 0.03, 0.12), at=(x, -d / 2 + 0.02, z0), color=c["red"]))
    if tier >= 7:
        fx = w / 2 - 0.05
        parts.append(lpm.box("flagpole", (0.012, 0.012, 0.55), at=(fx, -d / 2 + 0.07, z0), color=c["white"]))
        parts.append(lpm.box("flag", (0.008, 0.1, 0.06), at=(fx, -d / 2 + 0.12, z0 + 0.48), color=c["red"]))
    if tier >= 8:
        length, cx = 0.5, -(w / 2 - 0.06)
        outline = [(cx, -length / 2 + 0.2 * 0), (cx + 0.035, -length / 2 + 0.08), (cx + 0.035, length / 2 - 0.08), (cx, length / 2), (cx - 0.035, length / 2 - 0.08), (cx - 0.035, -length / 2 + 0.08)]
        parts.append(extrude_z("waka", [(x, y + 0.05) for x, y in outline], z0, z0 + 0.04, c["red"]))

    if spec.get("solar"):
        angle = math.degrees(math.atan2(rise, reach))
        count_y = max(1, int((y1r - y0r - 0.3) / 0.24))
        for number in range(count_y):
            py = (y0r + y1r) / 2 + 0.05 + (number - (count_y - 1) / 2) * 0.24
            fraction = 0.45
            px, pz = reach * (1 - fraction) + 0.015, z_w - 0.01 + fraction * (rise + 0.01) + 0.015
            panel = lpm.box(f"solar_panel_{number}", (0.26, 0.2, 0.012), at=(px, py, pz), color=c["solar"])
            lpm.rotate(panel, angle, axis="Y", about=(px, py, pz))
            parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=20000 + 8000 * floors, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


def build_queenslander(spec, out_dir):
    """A Queenslander, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    A weatherboard timber house raised on stumps with lattice between them, a veranda wrapped around the front and the sides on every floor with posts, rails and balusters, a front stair, tall windows, a fretwork valance under a corrugated hip roof, on a grassy plot;
    from Tier 2 a round water tank on a stand, 3 a palm, 4 a brick chimney, 5 a second palm, 7 a second tank, 8 a pergola over the stair."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("roof", "vtone2"), ("trim", "vtone3"), ("dark", "udark"), ("stump", "timber"), ("lattice", "darkwood"), ("grass", "turfgreen"),
                                              ("tank", "greywood"), ("brick", "brick_dark"), ("palm", "bush"), ("trunk", "pine"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors, tier = spec["floors"], spec["tier"]
    fh, stump, slab = 0.27, 0.15, 0.03
    deck_x, deck_y0, deck_y1 = w / 2 - 0.03, -d / 2 + 0.17, d / 2 - 0.18
    z_deck = 0.02 + stump
    z0 = z_deck + slab
    height = floors * fh
    z_top = z0 + height
    bx, yb0, yb1 = deck_x - 0.15, deck_y0 + 0.15, deck_y1 - 0.04
    cy_deck = (deck_y0 + deck_y1) / 2
    parts = [lpm.box("ground", (w - 0.01, d - 0.01, 0.02), at=(0, 0, 0), color=c["grass"]),
             lpm.box("deck", (2 * deck_x, deck_y1 - deck_y0, slab), at=(0, cy_deck, z_deck), color=c["trim"]),
             lpm.box("walls", (2 * bx, yb1 - yb0, height), at=(0, (yb0 + yb1) / 2, z0), color=c["wall"])]
    count_stump = max(2, round(2 * deck_x / 0.4) + 1)
    for row, y in enumerate((deck_y0 + 0.03, deck_y1 - 0.03)):
        for number in range(count_stump):
            parts.append(lpm.box(f"stump_{row}_{number}", (0.04, 0.04, stump), at=(-deck_x + 0.04 + number * (2 * deck_x - 0.08) / (count_stump - 1), y, 0.02), color=c["stump"]))
    parts.append(lpm.box("lattice_front_left", (deck_x - 0.18, 0.012, stump - 0.05), at=(-(deck_x + 0.18) / 2, deck_y0 + 0.005, 0.045), color=c["lattice"]))
    parts.append(lpm.box("lattice_front_right", (deck_x - 0.18, 0.012, stump - 0.05), at=((deck_x + 0.18) / 2, deck_y0 + 0.005, 0.045), color=c["lattice"]))
    parts.append(lpm.box("lattice_back", (2 * deck_x - 0.06, 0.012, stump - 0.05), at=(0, deck_y1 - 0.005, 0.045), color=c["lattice"]))
    for sign in (-1, 1):
        parts.append(lpm.box(f"lattice_side_{sign}", (0.012, deck_y1 - deck_y0 - 0.06, stump - 0.05), at=(sign * (deck_x - 0.005), cy_deck, 0.045), color=c["lattice"]))

    steps = 4
    for step in range(steps):
        parts.append(lpm.box(f"stair_{step}", (0.3, 0.04, (steps - step) * (stump + slab) / (steps + 1)), at=(0.0, deck_y0 - 0.02 - 0.04 * step, 0.02), color=c["trim"]))
    rise_step = (stump + slab) / (steps + 1)
    for sign in (-1, 1):
        stair_rail(parts, f"stair_rail_{sign}", sign * 0.16, deck_y0 - 0.02 - 0.04 * (steps - 1), 0.02 + rise_step, deck_y0 - 0.02, 0.02 + steps * rise_step, 0.09, c["trim"])

    post_count = max(3, round(2 * deck_x / 0.3) + 1)
    post_xs = [-deck_x + 0.025 + k * (2 * deck_x - 0.05) / (post_count - 1) for k in range(post_count)]
    side_count = max(2, round((yb1 - deck_y0) / 0.3) + 1)
    side_ys = [deck_y0 + 0.025 + k * (yb1 - deck_y0 - 0.025) / (side_count - 1) for k in range(side_count)]
    for number, x in enumerate(post_xs):
        parts.append(lpm.box(f"post_front_{number}", (0.025, 0.025, height), at=(x, deck_y0 + 0.025, z0), color=c["trim"]))
    for sign in (-1, 1):
        parts.append(lpm.box(f"post_back_{sign}", (0.025, 0.025, height), at=(sign * (deck_x - 0.025), deck_y1 - 0.025, z0), color=c["trim"]))
    for number, y in enumerate(side_ys):
        for sign in (-1, 1):
            parts.append(lpm.box(f"post_side_{sign}_{number}", (0.025, 0.025, height), at=(sign * (deck_x - 0.025), y, z0), color=c["trim"]))
    for level in range(floors):
        z = z0 + level * fh
        if level > 0:
            parts.append(lpm.box(f"deck_{level}", (2 * deck_x, yb1 - deck_y0, slab), at=(0, (deck_y0 + yb1) / 2, z - slab), color=c["trim"]))
        for rail, up in ((0, 0.1), (1, 0.035)):
            for sign, (x_from, x_to) in ((-1, (-deck_x, -0.17 if level == 0 else deck_x)), (1, (0.17 if level == 0 else -deck_x, deck_x))):
                if level > 0 and sign == 1:
                    continue
                parts.append(lpm.box(f"rail_front_{level}_{rail}_{sign}", (x_to - x_from - 0.04, 0.014, 0.014), at=((x_from + x_to) / 2, deck_y0 + 0.025, z + up), color=c["trim"]))
            y_end = deck_y1 if level == 0 else yb1
            for sign in (-1, 1):
                parts.append(lpm.box(f"rail_side_{level}_{rail}_{sign}", (0.014, y_end - deck_y0 - 0.04, 0.014), at=(sign * (deck_x - 0.025), (deck_y0 + y_end) / 2, z + up), color=c["trim"]))
            if level == 0:
                parts.append(lpm.box(f"rail_back_{rail}", (2 * deck_x - 0.06, 0.014, 0.014), at=(0, deck_y1 - 0.025, z + up), color=c["trim"]))
            else:
                for sign in (-1, 1):
                    parts.append(lpm.box(f"rail_end_{level}_{rail}_{sign}", (deck_x - bx, 0.014, 0.014), at=(sign * (bx + deck_x) / 2, yb1 - 0.02, z + up), color=c["trim"]))
        for number in range(int((2 * deck_x) / 0.09)):
            bxx = -deck_x + 0.05 + number * 0.09
            if level == 0 and abs(bxx) < 0.18:
                continue
            parts.append(lpm.box(f"baluster_{level}_{number}", (0.01, 0.01, 0.07), at=(bxx, deck_y0 + 0.025, z + 0.035), color=c["trim"]))
            if level == 0:
                parts.append(lpm.box(f"baluster_back_{number}", (0.01, 0.01, 0.07), at=(bxx, deck_y1 - 0.025, z + 0.035), color=c["trim"]))

    pitch = 0.42
    count = max(1, round(2 * bx / pitch))
    for level in range(floors):
        z = z0 + level * fh + 0.07
        for number in range(count):
            u = -bx + (number + 0.5) * 2 * bx / count
            if level == 0 and abs(u) < 0.12:
                continue
            face_box(parts, f"front_{level}_{number}_frame", "front", yb0, u, 0.12, 0.2, z - 0.01, 0.01, c["trim"])
            face_box(parts, f"front_{level}_{number}_glass", "front", yb0, u, 0.09, 0.17, z + 0.005, 0.014, c["dark"])
        for number in range(max(1, round((yb1 - yb0) / 0.45))):
            y = yb0 + (number + 0.5) * (yb1 - yb0) / max(1, round((yb1 - yb0) / 0.45))
            for face, wall in (("left", -bx), ("right", bx)):
                face_box(parts, f"{face}_{level}_{number}_frame", face, wall, y, 0.12, 0.2, z - 0.01, 0.01, c["trim"])
                face_box(parts, f"{face}_{level}_{number}_glass", face, wall, y, 0.09, 0.17, z + 0.005, 0.014, c["dark"])
    face_box(parts, "door_frame", "front", yb0, 0.0, 0.2, 0.28, z0, 0.012, c["trim"])
    face_box(parts, "door", "front", yb0, 0.0, 0.15, 0.25, z0, 0.018, c["dark"])

    roof_y0, roof_y1 = deck_y0 - 0.03, d / 2 - 0.01
    by_r, cy_r = (roof_y1 - roof_y0) / 2, (roof_y1 + roof_y0) / 2
    rise = 0.22
    parts.append(hip_roof("roof", w / 2 - 0.01, by_r, z_top, rise, c["roof"], cx=0.0, cy=cy_r))
    parts.append(lpm.box("fascia", (2 * (w / 2 - 0.01), 0.02, 0.03), at=(0, roof_y0, z_top - 0.01), color=c["trim"]))
    for number in range(int(2 * deck_x / 0.07)):
        parts.append(lpm.box(f"valance_{number}", (0.03, 0.012, 0.04), at=(-deck_x + 0.04 + number * 0.07, deck_y0 + 0.018, z_top - 0.05), color=c["trim"]))

    def tank(tag, x, y):
        for number, (lx, ly) in enumerate(((-0.04, -0.04), (0.04, -0.04), (-0.04, 0.04), (0.04, 0.04))):
            parts.append(lpm.box(f"{tag}_leg_{number}", (0.014, 0.014, 0.12), at=(x + lx, y + ly, 0.02), color=c["stump"]))
        parts.append(lpm.prism(tag, 10, 0.065, 0.14, at=(x, y, 0.14), color=c["tank"], radius_top=0.065))
        parts.append(lpm.prism(f"{tag}_lid", 10, 0.05, 0.03, at=(x, y, 0.28), color=c["tank"], radius_top=0.02))
    if tier >= 2:
        tank("tank", w / 2 - 0.1, d / 2 - 0.09)
    if tier >= 7:
        tank("tank_2", w / 2 - 0.26, d / 2 - 0.09)
    if tier >= 3:
        fale_palm(parts, c, "palm_0", -(w / 2 - 0.12), d / 2 - 0.1, 0.02, 0.5)
    if tier >= 5:
        fale_palm(parts, c, "palm_1", -(w / 2 - 0.3), d / 2 - 0.1, 0.02, 0.42)
    if tier >= 4:
        parts.append(lpm.box("chimney", (0.08, 0.08, 0.22), at=(-bx * 0.5, cy_r + 0.05, z_top + 0.05), color=c["brick"]))
        parts.append(lpm.box("chimney_cap", (0.1, 0.1, 0.02), at=(-bx * 0.5, cy_r + 0.05, z_top + 0.27), color=c["trim"]))
    if tier >= 8:
        for sign in (-1, 1):
            parts.append(lpm.box(f"pergola_post_{sign}", (0.02, 0.02, 0.2), at=(sign * 0.17, deck_y0 - 0.15, 0.02), color=c["trim"]))
        parts.append(lpm.box("pergola_roof", (0.4, 0.2, 0.02), at=(0.0, deck_y0 - 0.08, 0.22), color=c["roof"]))

    if spec.get("solar"):
        angle = math.degrees(math.atan2(rise, by_r))
        count_x = max(1, int((w - 0.4) / 0.24))
        for number in range(count_x):
            px = (number - (count_x - 1) / 2) * 0.24
            fraction = 0.35
            py, pz = cy_r + by_r * (1 - fraction) + 0.015, z_top + fraction * rise + 0.015
            panel = lpm.box(f"solar_panel_{number}", (0.2, 0.2, 0.012), at=(px, py, pz), color=c["solar"])
            lpm.rotate(panel, -angle, axis="X", about=(px, py, pz))
            parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=30000 + 10000 * floors, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


def andean_llama(parts, c, tag, x, y, color):
    """A llama seen as boxes: body on four legs, neck and head, facing -Y."""
    for number, (lx, ly) in enumerate(((-0.02, -0.04), (0.02, -0.04), (-0.02, 0.04), (0.02, 0.04))):
        parts.append(lpm.box(f"{tag}_leg_{number}", (0.012, 0.012, 0.05), at=(x + lx, y + ly, 0.02), color=color))
    parts.append(lpm.box(f"{tag}_body", (0.06, 0.12, 0.06), at=(x, y, 0.07), color=color))
    parts.append(lpm.box(f"{tag}_neck", (0.025, 0.03, 0.08), at=(x, y - 0.06, 0.11), color=color))
    parts.append(lpm.box(f"{tag}_head", (0.03, 0.04, 0.03), at=(x, y - 0.075, 0.19), color=color))


def build_andean(spec, out_dir):
    """An Andean adobe house of Cusco, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    Thick plastered adobe walls on an earth plinth under a gable red-tile roof with the ridge along X, a cross on the ridge, a big arched wooden door, windows with colored shutters, a wooden balcony over the door from two floors up, on a grassy plot with a front yard;
    from Tier 2 a chimney, 3 a pair of ceramic bulls on the ridge, 4 a low stone yard wall, 5 a second chimney, 6 two llamas in the yard, 8 a bell gable."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("shutter", "vtone2"), ("wood", "vtone3"), ("roof", "tile"), ("ridge", "brick_dark"), ("plinth", "earth"), ("dark", "udark"), ("white", "whitewash"),
                                              ("cross", "timber"), ("bull", "lacquer"), ("stone", "greywood"), ("grass", "turfgreen"), ("llama", "plaster"), ("llama2", "darkwood"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors, tier = spec["floors"], spec["tier"]
    fh = 0.27
    bx, yb0, yb1 = w / 2 - 0.08, -d / 2 + 0.2, d / 2 - 0.06
    z1 = 0.07
    height = floors * fh
    z_w = z1 + height
    cy = (yb0 + yb1) / 2
    hr = (yb1 - yb0) / 2 + 0.08
    rise = min(0.28, hr * 0.5)
    parts = [lpm.box("ground", (w - 0.01, d - 0.01, 0.02), at=(0, 0, 0), color=c["grass"]),
             lpm.box("plinth", (2 * bx + 0.03, yb1 - yb0 + 0.03, z1 - 0.02), at=(0, cy, 0.02), color=c["plinth"]),
             lpm.box("walls", (2 * bx, yb1 - yb0, height), at=(0, cy, z1), color=c["wall"]),
             extrude_x("roof", [(cy - hr, z_w - 0.01), (cy + hr, z_w - 0.01), (cy, z_w + rise)], -bx - 0.07, bx + 0.07, c["roof"]),
             lpm.box("ridge_cap", (2 * bx + 0.14, 0.05, 0.03), at=(0, cy, z_w + rise - 0.015), color=c["ridge"])]
    for sign in (-1, 1):
        parts.append(extrude_x(f"gable_{sign}", [(cy - hr + 0.08, z_w), (cy + hr - 0.08, z_w), (cy, z_w + rise - 0.06)], *sorted((sign * (bx + 0.065), sign * (bx + 0.075))), c["wall"]))
        face_box(parts, f"gable_window_{sign}", "right" if sign > 0 else "left", sign * (bx + 0.075), cy, 0.08, 0.08, z_w + 0.02, 0.012, c["dark"])
    parts.append(lpm.box("cross_post", (0.012, 0.012, 0.12), at=(0, cy, z_w + rise), color=c["cross"]))
    parts.append(lpm.box("cross_arm", (0.07, 0.012, 0.012), at=(0, cy, z_w + rise + 0.07), color=c["cross"]))

    arch_part(parts, "door_surround", "front", yb0, arch_outline(0.0, z1 - 0.005, 0.26, 0.36), 0, 0.016, c["white"])
    arch_part(parts, "door", "front", yb0, arch_outline(0.0, z1, 0.2, 0.32), 0, 0.024, c["wood"])
    for number in range(4):
        face_box(parts, f"door_stud_{number}", "front", yb0, (number - 1.5) * 0.04, 0.016, 0.016, z1 + 0.1 + (number % 2) * 0.08, 0.03, c["dark"])
    for level in range(floors):
        z = z1 + level * fh + 0.09
        for u in ((-bx * 0.62, bx * 0.62) if bx < 0.5 else (-bx * 0.75, -bx * 0.4, bx * 0.4, bx * 0.75)):
            if level == 0 and abs(u) < 0.2:
                continue
            face_box(parts, f"front_{level}_{u:.2f}_frame", "front", yb0, u, 0.15, 0.17, z - 0.015, 0.012, c["white"])
            face_box(parts, f"front_{level}_{u:.2f}_glass", "front", yb0, u, 0.1, 0.13, z + 0.005, 0.02, c["dark"])
            for side in (-1, 1):
                face_box(parts, f"front_{level}_{u:.2f}_shutter_{side}", "front", yb0, u + side * 0.065, 0.045, 0.13, z + 0.005, 0.024, c["shutter"])
        for number in range(max(1, round((yb1 - yb0) / 0.45))):
            y = yb0 + (number + 0.5) * (yb1 - yb0) / max(1, round((yb1 - yb0) / 0.45))
            for face, wall in (("left", -bx), ("right", bx)):
                face_box(parts, f"{face}_{level}_{number}_frame", face, wall, y, 0.15, 0.17, z - 0.015, 0.012, c["white"])
                face_box(parts, f"{face}_{level}_{number}_glass", face, wall, y, 0.1, 0.13, z + 0.005, 0.02, c["dark"])
    if floors >= 2:
        bw = min(2 * bx - 0.1, 0.9)
        zb = z1 + fh
        parts.append(lpm.box("balcony", (bw, 0.13, 0.025), at=(0, yb0 - 0.065, zb - 0.02), color=c["wood"]))
        for sign in (-1, 1):
            parts.append(lpm.box(f"balcony_bracket_{sign}", (0.03, 0.1, 0.04), at=(sign * (bw / 2 - 0.04), yb0 - 0.05, zb - 0.06), color=c["wood"]))
        parts.append(lpm.box("balcony_rail", (bw, 0.014, 0.014), at=(0, yb0 - 0.125, zb + 0.1), color=c["wood"]))
        for sign in (-1, 1):
            parts.append(lpm.box(f"balcony_rail_side_{sign}", (0.014, 0.12, 0.014), at=(sign * (bw / 2 - 0.007), yb0 - 0.065, zb + 0.1), color=c["wood"]))
        for number in range(int(bw / 0.07)):
            parts.append(lpm.box(f"balcony_baluster_{number}", (0.01, 0.01, 0.08), at=(-bw / 2 + 0.035 + number * 0.07, yb0 - 0.125, zb + 0.005), color=c["wood"]))
        parts.append(lpm.box("balcony_roof", (bw + 0.06, 0.15, 0.02), at=(0, yb0 - 0.075, zb + 0.2), color=c["roof"]))
        for sign in (-1, 1):
            parts.append(lpm.box(f"balcony_post_{sign}", (0.02, 0.02, 0.2), at=(sign * (bw / 2 - 0.01), yb0 - 0.12, zb), color=c["wood"]))

    if tier >= 2:
        parts.append(lpm.box("chimney", (0.09, 0.09, 0.25), at=(bx * 0.5, cy - 0.12, z_w), color=c["wall"]))
        parts.append(lpm.box("chimney_cap", (0.11, 0.11, 0.02), at=(bx * 0.5, cy - 0.12, z_w + 0.25), color=c["ridge"]))
    if tier >= 5:
        parts.append(lpm.box("chimney_2", (0.09, 0.09, 0.22), at=(-bx * 0.5, cy + 0.12, z_w), color=c["wall"]))
        parts.append(lpm.box("chimney_2_cap", (0.11, 0.11, 0.02), at=(-bx * 0.5, cy + 0.12, z_w + 0.22), color=c["ridge"]))
    if tier >= 3:
        for number, sign in enumerate((-1, 1)):
            x = sign * (bx - 0.1)
            parts.append(lpm.box(f"bull_{number}", (0.06, 0.025, 0.045), at=(x, cy, z_w + rise - 0.01), color=c["bull"]))
            parts.append(lpm.box(f"bull_{number}_horn", (0.012, 0.012, 0.03), at=(x + sign * 0.03, cy, z_w + rise + 0.035), color=c["bull"]))
    if tier >= 4:
        side = (w - 0.02) / 2 - 0.1
        for number, sign in enumerate((-1, 1)):
            parts.append(lpm.box(f"yard_wall_{number}", (side, 0.04, 0.1), at=(sign * (0.1 + side / 2 + 0.0), -d / 2 + 0.03, 0.02), color=c["stone"]))
    if tier >= 6:
        andean_llama(parts, c, "llama_0", -0.34 * min(1, w / 1.5), -d / 2 + 0.12, c["llama"])
        andean_llama(parts, c, "llama_1", 0.34 * min(1, w / 1.5), -d / 2 + 0.12, c["llama2"])
    if tier >= 8:
        x = bx - 0.25
        parts.append(lpm.box("bell_gable", (0.18, 0.05, 0.2), at=(x, yb0 - 0.01, z_w - 0.02), color=c["wall"]))
        parts.append(extrude_y("bell_gable_top", [(x - 0.09, z_w + 0.18), (x + 0.09, z_w + 0.18), (x, z_w + 0.26)], yb0 - 0.035, yb0 + 0.015, c["wall"]))
        face_box(parts, "bell_opening", "front", yb0 - 0.035, x, 0.07, 0.11, z_w + 0.05, 0.012, c["dark"])
        parts.append(lpm.box("bell_cross", (0.012, 0.012, 0.07), at=(x, yb0 - 0.01, z_w + 0.26), color=c["cross"]))

    if spec.get("solar"):
        angle = math.degrees(math.atan2(rise, hr))
        count_x = max(1, int((2 * bx - 0.3) / 0.24))
        for number in range(count_x):
            px = (number - (count_x - 1) / 2) * 0.24 + (0.0 if tier < 5 else 0.08)
            fraction = 0.45
            py, pz = cy + hr * (1 - fraction) + 0.015, z_w - 0.01 + fraction * rise + 0.015
            panel = lpm.box(f"solar_panel_{number}", (0.2, 0.26, 0.012), at=(px, py, pz), color=c["solar"])
            lpm.rotate(panel, -angle, axis="X", about=(px, py, pz))
            parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=30000 + 10000 * floors, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


def swahili_window(parts, tag, face, wall, u, bottom, c):
    """A small dark window with a wooden frame and two colored shutters."""
    face_box(parts, f"{tag}_glass", face, wall, u, 0.09, 0.13, bottom, 0.012, c["dark"])
    face_box(parts, f"{tag}_head", face, wall, u, 0.15, 0.025, bottom + 0.13, 0.02, c["wood"])
    face_box(parts, f"{tag}_sill", face, wall, u, 0.13, 0.02, bottom - 0.02, 0.026, c["wood"])
    for side in (-1, 1):
        face_box(parts, f"{tag}_shutter_{side}", face, wall, u + side * 0.065, 0.045, 0.13, bottom, 0.018, c["shutter"])


def build_swahili(spec, out_dir):
    """A Swahili stone house of Zanzibar, front facing -Y, on a 1x1 or 1x2 cell; the Tier is the floor count (1 to 5).
    A whitewashed coral-stone block with a flat roof behind a parapet and a cornice, a big carved wooden door with a studded leaf, posts and a carved lintel, small shuttered windows, and a wooden balcony over the door from two floors up;
    from Tier 2 stone benches (baraza) either side of the door, 3 a row of dentils under the cornice, 4 corner finials and a second balcony, 5 a roof pavilion."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("wood", "vtone2"), ("shutter", "vtone3"), ("dark", "udark"), ("stud", "honey"), ("stone", "greywood"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    d = spec["footprint"][1]
    floors = spec["floors"]
    tier = floors
    fh, plinth = 0.29, 0.04
    bx, y0, y1 = 0.47, -d / 2 + 0.12, d / 2 - 0.03
    height = floors * fh
    z_top = plinth + height
    cy = (y0 + y1) / 2
    parts = [lpm.box("plinth", (2 * bx + 0.02, y1 - y0 + 0.02, plinth), at=(0, cy, 0), color=c["stone"]),
             lpm.box("door_step", (0.56, 0.105, 0.025), at=(0, y0 - 0.0625, 0), color=c["stone"]),
             lpm.box("walls", (2 * bx, y1 - y0, height), at=(0, cy, plinth), color=c["wall"]),
             lpm.box("cornice", (2 * bx + 0.04, y1 - y0 + 0.04, 0.03), at=(0, cy, z_top - 0.03), color=c["wall"])]
    for name, size, at in (("front", (2 * bx, 0.03, 0.07), (0, y0 + 0.015)), ("back", (2 * bx, 0.03, 0.07), (0, y1 - 0.015)), ("left", (0.03, y1 - y0, 0.07), (-bx + 0.015, cy)), ("right", (0.03, y1 - y0, 0.07), (bx - 0.015, cy))):
        parts.append(lpm.box(f"parapet_{name}", size, at=(at[0], at[1], z_top), color=c["wall"]))

    door_w, door_h = 0.24, 0.17
    parts.append(lpm.box("door_leaf", (door_w, 0.02, door_h), at=(0, y0 - 0.008, plinth), color=c["wood"]))
    for side in (-1, 1):
        parts.append(lpm.box(f"door_post_{side}", (0.045, 0.04, door_h + 0.03), at=(side * (door_w / 2 + 0.0225), y0 - 0.015, plinth), color=c["wood"]))
    parts.append(lpm.box("door_lintel", (door_w + 0.14, 0.045, 0.05), at=(0, y0 - 0.017, plinth + door_h), color=c["wood"]))
    for number in range(5):
        parts.append(lpm.box(f"lintel_carving_{number}", (0.022, 0.012, 0.022), at=(-0.1 + number * 0.05, y0 - 0.043, plinth + door_h + 0.014), color=c["stud"]))
    for row in range(3):
        for col in range(3):
            parts.append(lpm.box(f"stud_{row}_{col}", (0.02, 0.012, 0.02), at=(-0.07 + col * 0.07, y0 - 0.02, plinth + 0.025 + row * 0.05), color=c["stud"]))

    for level in range(floors):
        z = plinth + level * fh + 0.09
        for u in (-0.33, 0.33):
            if level == 0 or level >= 1:
                swahili_window(parts, f"front_{level}_{u:.2f}", "front", y0, u, z, c)
        if level >= 1:
            swahili_window(parts, f"front_{level}_mid", "front", y0, 0.0, z, c)
        for number in range(max(1, round((y1 - y0) / 0.55))):
            y = y0 + (number + 0.5) * (y1 - y0) / max(1, round((y1 - y0) / 0.55))
            for face, wall in (("left", -bx), ("right", bx)):
                swahili_window(parts, f"{face}_{level}_{number}", face, wall, y, z, c)
        for u in (-0.25, 0.25):
            swahili_window(parts, f"back_{level}_{u:.2f}", "back", y1, u, z, c)

    def balcony(level):
        zb = plinth + level * fh
        width = 0.6
        parts.append(lpm.box(f"balcony_{level}", (width, 0.11, 0.025), at=(0, y0 - 0.055, zb - 0.01), color=c["wood"]))
        for sign in (-1, 1):
            parts.append(lpm.box(f"balcony_{level}_bracket_{sign}", (0.03, 0.09, 0.045), at=(sign * (width / 2 - 0.04), y0 - 0.045, zb - 0.055), color=c["wood"]))
            parts.append(lpm.box(f"balcony_{level}_rail_side_{sign}", (0.014, 0.1, 0.014), at=(sign * (width / 2 - 0.007), y0 - 0.055, zb + 0.1), color=c["wood"]))
        parts.append(lpm.box(f"balcony_{level}_rail", (width, 0.014, 0.014), at=(0, y0 - 0.108, zb + 0.1), color=c["wood"]))
        for number in range(int(width / 0.05)):
            parts.append(lpm.box(f"balcony_{level}_baluster_{number}", (0.01, 0.01, 0.1), at=(-width / 2 + 0.025 + number * 0.05, y0 - 0.108, zb + 0.015), color=c["wood"]))
    if floors >= 2:
        balcony(1)
    if floors >= 4:
        balcony(3)
    if tier >= 2:
        for number, sign in enumerate((-1, 1)):
            parts.append(lpm.box(f"baraza_{number}", (0.28, 0.07, 0.08), at=(sign * 0.33, y0 - 0.035, plinth), color=c["wall"]))
            parts.append(lpm.box(f"baraza_{number}_seat", (0.3, 0.09, 0.02), at=(sign * 0.33, y0 - 0.045, plinth + 0.08), color=c["stone"]))
    if tier >= 3:
        for number in range(int(2 * bx / 0.07)):
            parts.append(lpm.box(f"dentil_{number}", (0.03, 0.025, 0.025), at=(-bx + 0.04 + number * 0.07, y0 - 0.012, z_top - 0.055), color=c["wall"]))
    if tier >= 4:
        for number, (cx, cy_) in enumerate(((-1, y0), (1, y0), (-1, y1), (1, y1))):
            parts.append(lpm.box(f"finial_{number}", (0.05, 0.05, 0.07), at=(cx * (bx - 0.03), cy_ + (0.03 if cy_ == y0 else -0.03), z_top + 0.07), color=c["wall"]))
            parts.append(lpm.prism(f"finial_{number}_cap", 4, 0.03, 0.04, at=(cx * (bx - 0.03), cy_ + (0.03 if cy_ == y0 else -0.03), z_top + 0.14), color=c["wall"], radius_top=0.005))
    if tier >= 5:
        for number, (px, py) in enumerate(((-0.15, cy + 0.0), (0.15, cy + 0.0))):
            for sy in (-0.12, 0.12):
                parts.append(lpm.box(f"pavilion_post_{number}_{sy}", (0.025, 0.025, 0.2), at=(px, cy + sy, z_top + 0.07), color=c["wood"]))
        parts.append(lpm.box("pavilion_roof", (0.36, 0.3, 0.025), at=(0, cy, z_top + 0.27), color=c["wall"]))
        parts.append(lpm.box("pavilion_rail", (0.3, 0.012, 0.012), at=(0, cy - 0.12, z_top + 0.14), color=c["wood"]))

    if spec.get("solar"):
        base = z_top + 0.07
        for row, py in enumerate((y1 - 0.12,) if d < 2 else (y1 - 0.12, y1 - 0.34)):
            for number, px in enumerate((-0.2, 0.2) if tier < 5 or row == 0 else (-0.2, 0.2)):
                if tier >= 5 and abs(py - cy) < 0.2:
                    continue
                panel = lpm.box(f"solar_panel_{row}_{number}", (0.2, 0.16, 0.012), at=(px, py, base + 0.04), color=c["solar"])
                lpm.rotate(panel, 20, axis="X", about=(px, py, base + 0.04))
                parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=30000 + 8000 * floors * d, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = list(spec["footprint"])
    return report


def build_colonial(spec, out_dir):
    """A pastel colonial house of Cartagena, front facing -Y, on a 1x1 or 1x2 cell; the Tier is the floor count (1 to 5).
    A brightly painted block behind a parapet with a low red barrel-tile hip roof, a tall arched double door with a fanlight, tall shuttered windows, and a long wooden balcony with turned balusters on every upper floor, with flowers on the rail;
    from Tier 2 corbels under the balconies, 3 a cornice of dentils, 4 a carved door surround, 5 a roof lantern."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("wood", "vtone2"), ("shutter", "vtone3"), ("dark", "udark"), ("tile", "tile"), ("white", "whitewash"), ("leaf", "bush"), ("flower", "pink"),
                                              ("stone", "greywood"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    d = spec["footprint"][1]
    floors = spec["floors"]
    tier = floors
    fh, plinth = 0.29, 0.04
    bx, y0, y1 = 0.47, -d / 2 + 0.12, d / 2 - 0.03
    height = floors * fh
    z_top = plinth + height
    cy = (y0 + y1) / 2
    parts = [lpm.box("plinth", (2 * bx + 0.02, y1 - y0 + 0.02, plinth), at=(0, cy, 0), color=c["stone"]),
             lpm.box("door_step", (0.5, 0.105, 0.025), at=(0, y0 - 0.0625, 0), color=c["stone"]),
             lpm.box("walls", (2 * bx, y1 - y0, height), at=(0, cy, plinth), color=c["wall"]),
             lpm.box("cornice", (2 * bx + 0.04, y1 - y0 + 0.04, 0.035), at=(0, cy, z_top - 0.035), color=c["white"])]
    for name, size, at in (("front", (2 * bx, 0.03, 0.06), (0, y0 + 0.015)), ("back", (2 * bx, 0.03, 0.06), (0, y1 - 0.015)), ("left", (0.03, y1 - y0, 0.06), (-bx + 0.015, cy)), ("right", (0.03, y1 - y0, 0.06), (bx - 0.015, cy))):
        parts.append(lpm.box(f"parapet_{name}", size, at=(at[0], at[1], z_top), color=c["wall"]))
    parts.append(hip_roof("roof", bx - 0.03, (y1 - y0) / 2 - 0.03, z_top + 0.03, 0.14, c["tile"], cx=0.0, cy=cy))

    outline = arch_outline(0.0, plinth, 0.3, 0.27)
    arch_part(parts, "door_surround", "front", y0, arch_outline(0.0, plinth - 0.005, 0.37 if tier >= 4 else 0.34, 0.3), 0, 0.016, c["white"])
    arch_part(parts, "door", "front", y0, outline, 0, 0.024, c["wood"])
    parts.append(lpm.box("door_split", (0.012, 0.03, 0.2), at=(0.0, y0 - 0.026, plinth), color=c["dark"]))
    face_box(parts, "fanlight", "front", y0, 0.0, 0.14, 0.03, plinth + 0.27, 0.014, c["dark"])
    if tier >= 4:
        for side in (-1, 1):
            parts.append(lpm.box(f"door_pilaster_{side}", (0.035, 0.04, 0.34), at=(side * 0.2, y0 - 0.015, plinth), color=c["white"]))

    for level in range(floors):
        z = plinth + level * fh + 0.08
        for u in (-0.33, 0.33):
            face_box(parts, f"front_{level}_{u:.2f}_glass", "front", y0, u, 0.1, 0.17, z, 0.012, c["dark"])
            face_box(parts, f"front_{level}_{u:.2f}_frame", "front", y0, u, 0.15, 0.025, z + 0.17, 0.02, c["white"])
            for side in (-1, 1):
                face_box(parts, f"front_{level}_{u:.2f}_shutter_{side}", "front", y0, u + side * 0.075, 0.05, 0.17, z, 0.018, c["shutter"])
        if level >= 1:
            face_box(parts, f"front_{level}_mid_glass", "front", y0, 0.0, 0.1, 0.17, z, 0.012, c["dark"])
            for side in (-1, 1):
                face_box(parts, f"front_{level}_mid_shutter_{side}", "front", y0, side * 0.075, 0.05, 0.17, z, 0.018, c["shutter"])
        for number in range(max(1, round((y1 - y0) / 0.55))):
            y = y0 + (number + 0.5) * (y1 - y0) / max(1, round((y1 - y0) / 0.55))
            for face, wall in (("left", -bx), ("right", bx)):
                face_box(parts, f"{face}_{level}_{number}_glass", face, wall, y, 0.1, 0.17, z, 0.012, c["dark"])
                face_box(parts, f"{face}_{level}_{number}_frame", face, wall, y, 0.15, 0.025, z + 0.17, 0.02, c["white"])
        for u in (-0.25, 0.25):
            face_box(parts, f"back_{level}_{u:.2f}_glass", "back", y1, u, 0.1, 0.17, z, 0.012, c["dark"])

    width = 0.9
    for level in range(1, floors):
        zb = plinth + level * fh
        parts.append(lpm.box(f"balcony_{level}", (width, 0.11, 0.025), at=(0, y0 - 0.055, zb - 0.01), color=c["wood"]))
        parts.append(lpm.box(f"balcony_{level}_rail", (width, 0.014, 0.016), at=(0, y0 - 0.108, zb + 0.105), color=c["wood"]))
        parts.append(lpm.box(f"balcony_{level}_rail_low", (width, 0.014, 0.012), at=(0, y0 - 0.108, zb + 0.03), color=c["wood"]))
        for sign in (-1, 1):
            parts.append(lpm.box(f"balcony_{level}_rail_side_{sign}", (0.014, 0.1, 0.016), at=(sign * (width / 2 - 0.007), y0 - 0.055, zb + 0.105), color=c["wood"]))
            if tier >= 2:
                parts.append(lpm.box(f"balcony_{level}_corbel_{sign}", (0.03, 0.09, 0.05), at=(sign * (width / 2 - 0.05), y0 - 0.045, zb - 0.07), color=c["wood"]))
        for number in range(int(width / 0.045)):
            parts.append(lpm.box(f"balcony_{level}_baluster_{number}", (0.012, 0.012, 0.1), at=(-width / 2 + 0.025 + number * 0.045, y0 - 0.108, zb + 0.015), color=c["wood"]))
        for number, u in enumerate((-0.3, 0.0, 0.3)):
            parts.append(lpm.prism(f"balcony_{level}_pot_{number}", 6, 0.035, 0.045, at=(u, y0 - 0.108, zb + 0.115), color=c["leaf"], radius_top=0.02))
            parts.append(lpm.box(f"balcony_{level}_bloom_{number}", (0.02, 0.02, 0.02), at=(u + 0.01, y0 - 0.108, zb + 0.15), color=c["flower"]))
    if tier >= 3:
        for number in range(int(2 * bx / 0.07)):
            parts.append(lpm.box(f"dentil_{number}", (0.03, 0.025, 0.025), at=(-bx + 0.04 + number * 0.07, y0 - 0.012, z_top - 0.065), color=c["white"]))
    if tier >= 5:
        parts.append(lpm.box("lantern", (0.2, 0.2, 0.14), at=(0, cy, z_top + 0.1), color=c["wall"]))
        parts.append(hip_roof("lantern_roof", 0.13, 0.13, z_top + 0.24, 0.1, c["tile"], cx=0.0, cy=cy))
        for side in (-1, 1):
            face_box(parts, f"lantern_window_{side}", "front" if side < 0 else "back", cy + side * 0.1, 0.0, 0.08, 0.08, z_top + 0.13, 0.014, c["dark"])

    if spec.get("solar"):
        for number, px in enumerate((-0.2, 0.2)):
            panel = lpm.box(f"solar_panel_{number}", (0.2, 0.16, 0.012), at=(px, y1 - 0.2 if tier < 5 else y1 - 0.12, z_top + 0.09), color=c["solar"])
            lpm.rotate(panel, 20, axis="X", about=(px, y1 - 0.2 if tier < 5 else y1 - 0.12, z_top + 0.09))
            parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=30000 + 8000 * floors * d, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = list(spec["footprint"])
    return report


def victorian_window(parts, tag, face, wall, u, bottom, width, height, c):
    """A tall sash window: dark glass, a white frame, a mid bar and a head cap."""
    face_box(parts, f"{tag}_frame", face, wall, u, width + 0.04, height + 0.04, bottom - 0.02, 0.012, c["trim"])
    face_box(parts, f"{tag}_glass", face, wall, u, width, height, bottom, 0.016, c["dark"])
    face_box(parts, f"{tag}_bar", face, wall, u, width, 0.012, bottom + height / 2, 0.02, c["trim"])
    face_box(parts, f"{tag}_cap", face, wall, u, width + 0.07, 0.022, bottom + height + 0.02, 0.026, c["trim"])


def build_victorian(spec, out_dir):
    """A painted Victorian house of San Francisco, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    A tall timber house in one color with cream trim and a contrasting accent, one steep front gable per cell of width with an accent gable panel and cream bargeboards, polygonal bay windows, tall sash windows, a stoop with steps and a rail, on a grassy plot;
    from Tier 2 bays on the first floor, 3 eave brackets, 4 fish-scale shingles in the gable, 5 a round turret with a conical roof, 6 a chimney, 7 an iron ridge crest, 8 a second turret."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("trim", "vtone2"), ("accent", "vtone3"), ("dark", "udark"), ("roof", "shingle"), ("grass", "turfgreen"), ("stone", "greywood"),
                                              ("brick", "brick_dark"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors, tier = spec["floors"], spec["tier"]
    fh, z0 = 0.26, 0.02
    bx, yb0, yb1 = w / 2 - 0.1, -d / 2 + 0.3, d / 2 - 0.06
    height = floors * fh
    z_w = z0 + height
    cy = (yb0 + yb1) / 2
    reach = 0.5 - 0.03
    rise = 0.42
    y0r, y1r = yb0 - 0.04, d / 2 - 0.02
    parts = [lpm.box("ground", (w - 0.01, d - 0.01, z0), at=(0, 0, 0), color=c["grass"]),
             lpm.box("plinth", (2 * bx + 0.02, yb1 - yb0 + 0.02, 0.03), at=(0, cy, z0), color=c["stone"]),
             lpm.box("walls", (2 * bx, yb1 - yb0, height), at=(0, cy, z0 + 0.03 - 0.03), color=c["wall"])]
    for level in range(1, floors):
        parts.append(lpm.box(f"belt_{level}", (2 * bx + 0.02, yb1 - yb0 + 0.02, 0.02), at=(0, cy, z0 + level * fh - 0.01), color=c["trim"]))
    centres = [-w / 2 + 0.5 + m for m in range(w)]
    for m, xm in enumerate(centres):
        parts.append(extrude_y(f"roof_{m}", [(xm - reach, z_w - 0.01), (xm + reach, z_w - 0.01), (xm, z_w + rise)], y0r, y1r, c["roof"]))
        parts.append(extrude_y(f"gable_{m}", [(xm - reach + 0.08, z_w), (xm + reach - 0.08, z_w), (xm, z_w + rise - 0.12)], y0r - 0.014, y0r, c["accent"]))
        for sign in (-1, 1):
            parts.append(extrude_y(f"bargeboard_{m}_{sign}", [(xm + sign * reach, z_w - 0.01), (xm, z_w + rise), (xm, z_w + rise - 0.07), (xm + sign * reach, z_w - 0.08)], y0r - 0.03, y0r - 0.008, c["trim"]))
        victorian_window(parts, f"gable_window_{m}", "front", y0r - 0.014, xm, z_w + 0.08, 0.08, 0.1, c)
        if tier >= 4:
            for row in range(2):
                for number in range(5 - row * 2):
                    face_box(parts, f"scale_{m}_{row}_{number}", "front", y0r - 0.014, xm + (number - (4 - row * 2) / 2) * 0.055, 0.045, 0.03, z_w + 0.2 + row * 0.04, 0.01, c["trim"])
        if tier >= 7:
            parts.append(lpm.box(f"crest_{m}", (0.012, 0.012, 0.1), at=(xm, y0r + 0.02, z_w + rise - 0.02), color=c["dark"]))
            parts.append(lpm.prism(f"crest_{m}_tip", 4, 0.012, 0.03, at=(xm, y0r + 0.02, z_w + rise + 0.07), color=c["dark"], radius_top=0.002))

    def bay(tag, xm, level):
        zb = z0 + level * fh + 0.02
        height_b = fh - 0.05
        plan = [(xm - 0.19, yb0), (xm + 0.19, yb0), (xm + 0.11, yb0 - 0.1), (xm - 0.11, yb0 - 0.1)]
        parts.append(extrude_z(f"{tag}_bay", plan, zb, zb + height_b, c["wall"]))
        parts.append(extrude_z(f"{tag}_bay_roof", [(xm - 0.21, yb0 + 0.01), (xm + 0.21, yb0 + 0.01), (xm + 0.13, yb0 - 0.115), (xm - 0.13, yb0 - 0.115)], zb + height_b, zb + height_b + 0.025, c["trim"]))
        parts.append(extrude_z(f"{tag}_bay_base", [(xm - 0.2, yb0 + 0.01), (xm + 0.2, yb0 + 0.01), (xm + 0.12, yb0 - 0.108), (xm - 0.12, yb0 - 0.108)], zb - 0.015, zb + 0.02, c["trim"]))
        face_box(parts, f"{tag}_bay_glass", "front", yb0 - 0.1, xm, 0.13, 0.13, zb + 0.05, 0.014, c["dark"])
        face_box(parts, f"{tag}_bay_frame", "front", yb0 - 0.1, xm, 0.17, 0.17, zb + 0.03, 0.01, c["trim"])

    turret_side = ({w - 1: 1} if tier >= 5 else {})
    if tier >= 8:
        turret_side[0] = -1
    for level in range(floors):
        z = z0 + level * fh + 0.07
        for m, xm in enumerate(centres):
            shift = -0.1 * turret_side.get(m, 0)
            has_bay = (level == 0 and m > 0) or (level == 1 and tier >= 2)
            if has_bay:
                bay(f"bay_{level}_{m}", xm + shift, level)
            elif level == 0 and m == 0:
                pass
            else:
                for dx in ((-0.13, 0.13) if shift else (-0.17, 0.17)):
                    victorian_window(parts, f"front_{level}_{m}_{dx}", "front", yb0, xm + shift + dx, z, 0.08, 0.15, c)
        for number in range(max(1, round((yb1 - yb0) / 0.5))):
            y = yb0 + (number + 0.5) * (yb1 - yb0) / max(1, round((yb1 - yb0) / 0.5))
            for face, wall in (("left", -bx), ("right", bx)):
                victorian_window(parts, f"{face}_{level}_{number}", face, wall, y, z, 0.08, 0.15, c)
        for xm in centres:
            victorian_window(parts, f"back_{level}_{xm}", "back", yb1, xm, z, 0.09, 0.15, c)

    x0m = centres[0]
    face_box(parts, "door", "front", yb0, x0m, 0.17, 0.25, z0 + 0.04, 0.02, c["accent"])
    face_box(parts, "door_frame", "front", yb0, x0m, 0.23, 0.31, z0 + 0.01, 0.012, c["trim"])
    face_box(parts, "door_transom", "front", yb0, x0m, 0.17, 0.05, z0 + 0.3, 0.016, c["dark"])
    parts.append(lpm.box("stoop", (0.4, 0.13, 0.04), at=(x0m, yb0 - 0.065, z0), color=c["stone"]))
    for step in range(2):
        parts.append(lpm.box(f"step_{step}", (0.3, 0.04, 0.03 - step * 0.012), at=(x0m, yb0 - 0.15 - step * 0.04, z0), color=c["stone"]))
    for sign in (-1, 1):
        parts.append(lpm.box(f"stoop_post_{sign}", (0.02, 0.02, 0.11), at=(x0m + sign * 0.185, yb0 - 0.12, z0 + 0.04), color=c["trim"]))
    parts.append(lpm.box("stoop_rail_back", (0.36, 0.012, 0.012), at=(x0m, yb0 - 0.12, z0 + 0.13), color=c["trim"]))
    if tier >= 3:
        for number in range(int(2 * bx / 0.09)):
            parts.append(lpm.box(f"bracket_{number}", (0.03, 0.04, 0.045), at=(-bx + 0.05 + number * 0.09, yb0 - 0.02, z_w - 0.06), color=c["trim"]))
    if tier >= 5:
        radius = 0.14
        for tag, sx in (("turret", 1),) + ((("turret_2", -1),) if tier >= 8 else ()):
            tx, ty = sx * (bx - 0.1), yb0 - 0.05
            parts.append(lpm.prism(f"{tag}_body", 8, radius, height, at=(tx, ty, z0), color=c["wall"], radius_top=radius))
            parts.append(lpm.prism(f"{tag}_belt", 8, radius + 0.012, 0.025, at=(tx, ty, z0 + fh - 0.01), color=c["trim"], radius_top=radius + 0.012))
            for level in range(floors):
                face_box(parts, f"{tag}_window_{level}", "front", ty - radius * 0.93, tx, 0.07, 0.13, z0 + level * fh + 0.08, 0.014, c["dark"])
            parts.append(lpm.lathe(f"{tag}_roof", [(radius + 0.05, z_w - 0.03), (radius * 0.5, z_w + 0.12), (0.0, z_w + 0.4)], segments=8, at=(tx, ty, 0), color=c["roof"]))
            parts.append(lpm.box(f"{tag}_finial", (0.012, 0.012, 0.06), at=(tx, ty, z_w + 0.39), color=c["dark"]))
    if tier >= 6:
        parts.append(lpm.box("chimney", (0.09, 0.09, 0.22), at=(-bx + 0.2, cy + 0.12, z_w + 0.05), color=c["brick"]))
        parts.append(lpm.box("chimney_cap", (0.11, 0.11, 0.02), at=(-bx + 0.2, cy + 0.12, z_w + 0.27), color=c["trim"]))

    if spec.get("solar"):
        angle = math.degrees(math.atan2(rise, reach))
        for m, xm in enumerate(centres):
            if tier >= 5 and m == w - 1:
                continue
            fraction = 0.4
            px, pz = xm + reach * (1 - fraction) + 0.015, z_w - 0.01 + fraction * (rise + 0.01) + 0.015
            count_y = max(1, int((y1r - y0r - 0.3) / 0.24))
            for number in range(count_y):
                py = (y0r + y1r) / 2 + 0.05 + (number - (count_y - 1) / 2) * 0.24
                panel = lpm.box(f"solar_panel_{m}_{number}", (0.2, 0.2, 0.012), at=(px, py, pz), color=c["solar"])
                lpm.rotate(panel, angle, axis="Y", about=(px, py, pz))
                parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=30000 + 10000 * floors * w, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


def maloca_hut(parts, c, tag, x, y, radius):
    """A small round hut: palm posts, a dark door facing -Y and a thatched cone."""
    parts.append(lpm.prism(f"{tag}_wall", 10, radius, 0.14, at=(x, y, 0.02), color=c["post"], radius_top=radius))
    parts.append(lpm.box(f"{tag}_door", (0.07, 0.02, 0.1), at=(x, y - radius + 0.005, 0.02), color=c["dark"]))
    for side in (-1, 1):
        parts.append(lpm.box(f"{tag}_door_post_{side}", (0.02, 0.03, 0.115), at=(x + side * 0.045, y - radius + 0.002, 0.02), color=c["frame"]))
    parts.append(lpm.box(f"{tag}_door_lintel", (0.11, 0.03, 0.02), at=(x, y - radius + 0.002, 0.12), color=c["frame"]))
    parts.append(lpm.lathe(f"{tag}_roof", [(radius + 0.05, 0.14), (radius * 0.5, 0.2), (0.0, 0.3)], segments=10, at=(x, y, 0), color=c["roof"]))


def stadium_path(half, radius, steps=12):
    """The closed outline of an oblong plan: straight sides along X between -half and half, closed by two half circles of `radius`, counter-clockwise."""
    points = [(-half, -radius), (half, -radius)]
    points += [(half + radius * math.cos(math.radians(-90 + 180 * k / steps)), radius * math.sin(math.radians(-90 + 180 * k / steps))) for k in range(1, steps)]
    points += [(half, radius), (-half, radius)]
    points += [(-half - radius * math.cos(math.radians(-90 + 180 * k / steps)), -radius * math.sin(math.radians(-90 + 180 * k / steps))) for k in range(1, steps)]
    return points


def stadium_wall(name, half, r_out, r_in, z0, z1, color, steps=12):
    """A continuous low wall following an oblong plan: the straight sides and the rounded ends are one closed ring."""
    outer, inner = stadium_path(half, r_out, steps), stadium_path(half, r_in, steps)
    count = len(outer)
    verts = [(x, y, z0) for x, y in outer] + [(x, y, z1) for x, y in outer] + [(x, y, z0) for x, y in inner] + [(x, y, z1) for x, y in inner]
    faces = []
    for i in range(count):
        j = (i + 1) % count
        faces.append((i, j, count + j, count + i))
        faces.append((2 * count + j, 2 * count + i, 3 * count + i, 3 * count + j))
        faces.append((count + i, count + j, 3 * count + j, 3 * count + i))
    return lpm._object(name, _bm(verts, faces), color)


def build_maloca(spec, out_dir):
    """An Amazonian maloca on a 2x2 cell with `floors` floors (the Tier): a big oblong communal house under a palm-thatch roof that comes down almost to the ground, closed by two half domes, taller at every Tier, with a dark entrance in the front end and a pole screen,
    on a grassy plot; from Tier 2 coconut palms, 3 a crest of poles along the ridge and a small round hut, 4 a second hut and palms, 5 a third hut, a dugout canoe and a fire pit."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("roof", "vtone1"), ("post", "vtone2"), ("accent", "vtone3"), ("dark", "udark"), ("frame", "darkwood"), ("grass", "turfgreen"), ("stone", "greywood"), ("palm", "bush"), ("trunk", "pine"),
                                              ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors = spec["floors"]
    tier = floors
    radius, length = {1: (0.36, 0.9), 2: (0.4, 1.0), 3: (0.44, 0.9), 4: (0.48, 0.86), 5: (0.52, 0.8)}[tier]
    half, wide = length / 2, radius + 0.05
    wall_h = 0.16
    z_e = 0.02 + wall_h + 0.03
    roof_h = 0.45 + 0.22 * floors
    parts = [lpm.box("ground", (w - 0.01, d - 0.01, 0.02), at=(0, 0, 0), color=c["grass"])]
    section = [(-wide, z_e), (-wide * 0.8, z_e + 0.25 * roof_h), (-wide * 0.5, z_e + 0.58 * roof_h), (-wide * 0.2, z_e + 0.88 * roof_h), (0.0, z_e + roof_h),
               (wide * 0.2, z_e + 0.88 * roof_h), (wide * 0.5, z_e + 0.58 * roof_h), (wide * 0.8, z_e + 0.25 * roof_h), (wide, z_e)]
    parts.append(extrude_x("roof", section, -half, half, c["roof"]))
    profile = [(wide, z_e), (wide * 0.8, z_e + 0.25 * roof_h), (wide * 0.5, z_e + 0.58 * roof_h), (wide * 0.2, z_e + 0.88 * roof_h), (0.0, z_e + roof_h)]
    for sign in (-1, 1):
        parts.append(lpm.lathe(f"roof_end_{sign}", profile, segments=16, at=(sign * half, 0, 0), color=c["roof"]))
    for number in range(floors):
        z = z_e + (number + 1) * roof_h / (floors + 1)
        width_at = wide * (1 - (z - z_e) / roof_h) ** 0.9
        for sign in (-1, 1):
            parts.append(lpm.box(f"band_{number}_{sign}", (length, 0.012, 0.025), at=(0, sign * (width_at + 0.004), z), color=c["post"]))
    parts.append(stadium_wall("wall", half, radius, radius - 0.045, 0.02, 0.02 + wall_h, c["post"]))
    doors = {1: (0.0,), 2: (0.0,), 3: (-0.22, 0.22), 4: (-0.22, 0.22), 5: (-0.28, 0.0, 0.28)}[tier]
    for number, dx in enumerate(doors):
        parts.append(lpm.box(f"door_{number}", (0.15, 0.02, 0.13), at=(dx, -radius - 0.006, 0.02), color=c["dark"]))
        for side in (-1, 1):
            parts.append(lpm.box(f"door_post_{number}_{side}", (0.04, 0.045, 0.16), at=(dx + side * 0.095, -radius - 0.012, 0.02), color=c["frame"]))
        parts.append(lpm.box(f"door_lintel_{number}", (0.23, 0.045, 0.035), at=(dx, -radius - 0.012, 0.02 + 0.13), color=c["frame"]))
        parts.append(lpm.box(f"door_sill_{number}", (0.19, 0.05, 0.015), at=(dx, -radius - 0.014, 0.02), color=c["frame"]))

    if tier >= 2:
        for number, (px, py) in enumerate(((-0.86, 0.8), (0.86, 0.8), (-0.86, -0.8), (0.86, -0.8))[: 2 if tier < 4 else 4]):
            fale_palm(parts, c, f"palm_{number}", px, py, 0.02, 0.5 + 0.04 * number)
    if tier >= 3:
        for number in range(5):
            parts.append(lpm.box(f"crest_{number}", (0.012, 0.012, 0.1 + 0.02 * (number % 2)), at=(-half + number * length / 4, 0.0, z_e + roof_h - 0.02), color=c["accent"]))
        maloca_hut(parts, c, "hut_0", -0.55, -0.8, 0.12)
    if tier >= 4:
        maloca_hut(parts, c, "hut_1", 0.1, -0.8, 0.1)
    if tier >= 5:
        maloca_hut(parts, c, "hut_2", 0.55, -0.8, 0.12)
        outline = [(0.0, -0.18), (0.04, -0.1), (0.04, 0.1), (0.0, 0.18), (-0.04, 0.1), (-0.04, -0.1)]
        parts.append(extrude_z("canoe", [(x + 0.8, y + 0.7) for x, y in outline], 0.02, 0.07, c["post"]))
        for number in range(6):
            angle = math.radians(number * 60)
            parts.append(lpm.box(f"fire_stone_{number}", (0.03, 0.03, 0.03), at=(-0.75 + 0.06 * math.cos(angle), 0.78 + 0.06 * math.sin(angle), 0.02), color=c["stone"]))

    if spec.get("solar"):
        angle = math.degrees(math.atan2(0.3 * roof_h, 0.3 * wide))
        py, pz = -wide * 0.5, z_e + 0.58 * roof_h + 0.015
        for number, px in enumerate((-0.22, 0.0, 0.22)):
            panel = lpm.box(f"solar_panel_{number}", (0.18, 0.2, 0.012), at=(px, py, pz), color=c["solar"])
            lpm.rotate(panel, angle, axis="X", about=(px, py, pz))
            parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=30000 + 8000 * floors, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = list(spec["footprint"])
    return report


def palafito_boat(parts, c, tag, x, y, length):
    """A small rowing dory along Y: a pointed hull floating on the water with a plank seat."""
    half = length / 2
    outline = [(x, y - half), (x + 0.045, y - half + 0.08), (x + 0.045, y + half - 0.08), (x, y + half), (x - 0.045, y + half - 0.08), (x - 0.045, y - half + 0.08)]
    parts.append(extrude_z(f"{tag}_hull", outline, 0.02, 0.06, c["boat"]))
    parts.append(lpm.box(f"{tag}_seat", (0.09, 0.025, 0.012), at=(x, y, 0.06), color=c["plank"]))


def build_palafito(spec, out_dir):
    """A Chiloe palafito, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    A timber house clad in coloured wooden shingles on piles standing in the water, a gable corrugated roof with white-framed windows and a coloured door, on a deck on piles;
    from Tier 2 a brick chimney, 3 a balcony, 4 a boat tied alongside, 5 a roof dormer, 6 a second boat, 7 a net-drying rack on the deck, 8 a small jetty with a lantern."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("trim", "vtone2"), ("roofc", "vtone3"), ("dark", "udark"), ("water", "dalablue"), ("pile", "timber"), ("plank", "darkwood"),
                                              ("boat", "lacquer"), ("line", "tarwood"), ("brick", "brick_dark"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors, tier = spec["floors"], spec["tier"]
    fh, pile_h, deck_t = 0.26, 0.16, 0.03
    z_deck = 0.02 + pile_h
    z0 = z_deck + deck_t
    bx, yb0, yb1 = w / 2 - 0.12, -d / 2 + 0.22, d / 2 - 0.08
    deck_x, deck_y0, deck_y1 = bx + 0.05, yb0 - 0.17, yb1 + 0.03
    height = floors * fh
    z_w = z0 + height
    cy = (yb0 + yb1) / 2
    parts = [lpm.box("water", (w - 0.01, d - 0.01, 0.02), at=(0, 0, 0), color=c["water"]),
             lpm.box("deck", (2 * deck_x, deck_y1 - deck_y0, deck_t), at=(0, (deck_y0 + deck_y1) / 2, z_deck), color=c["plank"]),
             lpm.box("walls", (2 * bx, yb1 - yb0, height), at=(0, cy, z0), color=c["wall"])]
    count_x = max(2, round(2 * deck_x / 0.4) + 1)
    rows = (deck_y0 + 0.04, deck_y1 - 0.04) if d < 1.5 else (deck_y0 + 0.04, (deck_y0 + deck_y1) / 2, deck_y1 - 0.04)
    for row, y in enumerate(rows):
        for number in range(count_x):
            parts.append(lpm.box(f"pile_{row}_{number}", (0.04, 0.04, pile_h), at=(-deck_x + 0.04 + number * (2 * deck_x - 0.08) / (count_x - 1), y, 0.02), color=c["pile"]))
    hr = (yb1 - yb0) / 2 + 0.06
    rise = min(0.32, hr * 0.65)
    parts.append(extrude_x("roof", [(cy - hr, z_w - 0.01), (cy + hr, z_w - 0.01), (cy, z_w + rise)], -bx - 0.06, bx + 0.06, c["roofc"]))
    for sign in (-1, 1):
        parts.append(extrude_x(f"gable_{sign}", [(cy - hr + 0.08, z_w), (cy + hr - 0.08, z_w), (cy, z_w + rise - 0.09)], *sorted((sign * (bx + 0.056), sign * (bx + 0.066))), c["trim"]))

    faces = (("front", yb0, 2 * bx, 0.0), ("back", yb1, 2 * bx, 0.0), ("left", -bx, yb1 - yb0, cy), ("right", bx, yb1 - yb0, cy))
    for face, wall, length, centre in faces:
        for level in range(floors):
            for k in range(4):
                face_box(parts, f"{face}_line_{level}_{k}", face, wall, centre, length, 0.006, z0 + level * fh + 0.05 + k * 0.05, 0.006, c["line"])
    for level in range(floors):
        z = z0 + level * fh + 0.07
        for u in ((-0.3, 0.3) if w < 2 else (-0.75, -0.35, 0.35, 0.75)):
            if level == 0 and abs(u) < 0.2:
                continue
            victorian_window(parts, f"front_{level}_{u:.2f}", "front", yb0, u, z, 0.08, 0.14, c)
        if level >= 1:
            victorian_window(parts, f"front_{level}_mid", "front", yb0, 0.0, z, 0.08, 0.14, c)
        for number in range(max(1, round((yb1 - yb0) / 0.5))):
            y = yb0 + (number + 0.5) * (yb1 - yb0) / max(1, round((yb1 - yb0) / 0.5))
            for face, wall in (("left", -bx), ("right", bx)):
                victorian_window(parts, f"{face}_{level}_{number}", face, wall, y, z, 0.08, 0.14, c)
        for u in (-0.25, 0.25):
            victorian_window(parts, f"back_{level}_{u:.2f}", "back", yb1, u, z, 0.08, 0.14, c)
    face_box(parts, "door", "front", yb0, 0.0, 0.16, 0.24, z0, 0.02, c["roofc"])
    face_box(parts, "door_frame", "front", yb0, 0.0, 0.22, 0.3, z0 - 0.005, 0.012, c["trim"])

    if tier >= 2:
        parts.append(lpm.box("chimney", (0.08, 0.08, 0.2), at=(-bx * 0.5, cy + 0.08, z_w + 0.05), color=c["brick"]))
        parts.append(lpm.box("chimney_cap", (0.1, 0.1, 0.02), at=(-bx * 0.5, cy + 0.08, z_w + 0.25), color=c["trim"]))
    if tier >= 3 and floors >= 2:
        zb = z0 + fh
        parts.append(lpm.box("balcony", (0.5, 0.1, 0.02), at=(0, yb0 - 0.05, zb - 0.01), color=c["plank"]))
        parts.append(lpm.box("balcony_rail", (0.5, 0.012, 0.012), at=(0, yb0 - 0.095, zb + 0.09), color=c["trim"]))
        for number in range(9):
            parts.append(lpm.box(f"balcony_baluster_{number}", (0.01, 0.01, 0.09), at=(-0.22 + number * 0.055, yb0 - 0.095, zb + 0.01), color=c["trim"]))
        for sign in (-1, 1):
            parts.append(lpm.box(f"balcony_rail_side_{sign}", (0.012, 0.1, 0.012), at=(sign * 0.244, yb0 - 0.05, zb + 0.09), color=c["trim"]))
            for number in range(3):
                parts.append(lpm.box(f"balcony_baluster_side_{sign}_{number}", (0.01, 0.01, 0.09), at=(sign * 0.244, yb0 - 0.02 - number * 0.035, zb + 0.01), color=c["trim"]))
    if tier >= 4:
        palafito_boat(parts, c, "boat_0", -(w / 2 - 0.1), -d / 2 + 0.35, 0.34)
    if tier >= 5:
        parts.append(lpm.box("dormer", (0.2, 0.16, 0.14), at=(0.0, cy - hr * 0.55, z_w + 0.02), color=c["wall"]))
        parts.append(extrude_x("dormer_roof", [(cy - hr * 0.55 - 0.1, z_w + 0.16), (cy - hr * 0.55 + 0.1, z_w + 0.16), (cy - hr * 0.55, z_w + 0.26)], -0.12, 0.12, c["roofc"]))
        face_box(parts, "dormer_window", "front", cy - hr * 0.55 - 0.08, 0.0, 0.08, 0.08, z_w + 0.05, 0.012, c["dark"])
    if tier >= 6:
        palafito_boat(parts, c, "boat_1", w / 2 - 0.1, -d / 2 + 0.35, 0.3)
    if tier >= 7:
        for sign in (-1, 1):
            parts.append(lpm.box(f"rack_post_{sign}", (0.02, 0.02, 0.2), at=(sign * 0.2 + deck_x * 0.45, deck_y0 + 0.07, z0), color=c["pile"]))
        parts.append(lpm.box("rack_net", (0.38, 0.01, 0.12), at=(deck_x * 0.45, deck_y0 + 0.07, z0 + 0.07), color=c["line"]))
    if tier >= 8:
        parts.append(lpm.box("jetty", (0.14, 0.3, 0.025), at=(deck_x * 0.7, -d / 2 + 0.2, z_deck), color=c["plank"]))
        parts.append(lpm.box("jetty_post", (0.02, 0.02, 0.2), at=(deck_x * 0.7, -d / 2 + 0.06, z_deck), color=c["pile"]))
        parts.append(lpm.box("jetty_lantern", (0.04, 0.04, 0.05), at=(deck_x * 0.7, -d / 2 + 0.06, z_deck + 0.2), color=c["trim"]))

    if spec.get("solar"):
        angle = math.degrees(math.atan2(rise, hr))
        count_x_p = max(1, int((2 * bx - 0.2) / 0.24))
        for number in range(count_x_p):
            px = (number - (count_x_p - 1) / 2) * 0.24
            fraction = 0.4
            py, pz = cy + hr * (1 - fraction) + 0.015, z_w + fraction * rise + 0.015
            panel = lpm.box(f"solar_panel_{number}", (0.2, 0.24, 0.012), at=(px, py, pz), color=c["solar"])
            lpm.rotate(panel, -angle, axis="X", about=(px, py, pz))
            parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=30000 + 12000 * floors * max(1, w * d // 2), center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


TOTORA_LAYOUT = {  # per Tier: huts (x, y), tower (x, y, radius) or None, boats (x, y, length)
    1: ([(0.0, 0.05)], None, [(0.0, -0.4, 0.3)]),
    2: ([(-0.5, 0.05)], (0.45, 0.0, 0.2), [(0.0, -0.4, 0.36)]),
    3: ([(-0.55, 0.1), (-0.05, -0.05)], (0.5, 0.05, 0.2), [(-0.3, -0.41, 0.36)]),
    4: ([(-0.6, 0.1), (-0.1, 0.1), (0.05, -0.2)], (0.55, 0.05, 0.2), [(-0.35, -0.41, 0.36)]),
    5: ([(-0.6, 0.55), (-0.6, -0.1), (-0.05, -0.5)], (0.5, 0.45, 0.26), [(0.3, -0.9, 0.4)]),
    6: ([(-0.6, 0.55), (-0.6, -0.1), (-0.05, -0.5)], (0.5, 0.45, 0.28), [(0.3, -0.9, 0.4), (-0.4, -0.92, 0.36)]),
    7: ([(-0.6, 0.55), (-0.6, -0.1), (-0.05, -0.5), (0.55, -0.5)], (0.5, 0.45, 0.3), [(0.3, -0.92, 0.4), (-0.4, -0.92, 0.36)]),
    8: ([(-0.6, 0.55), (-0.6, -0.1), (-0.05, -0.5), (0.55, -0.5)], (0.5, 0.45, 0.32), [(0.3, -0.92, 0.4), (-0.4, -0.92, 0.36), (0.76, -0.5, 0.4)]),
}


def totora_hut(parts, c, tag, x, y):
    """A Uros reed hut: reed walls, a barrel reed roof, a door with a coloured frame and a window."""
    parts.append(lpm.box(f"{tag}_walls", (0.3, 0.22, 0.12), at=(x, y, 0.07), color=c["reed"]))
    section = [(y - 0.13, 0.19), (y - 0.12, 0.25), (y - 0.08, 0.3), (y, 0.33), (y + 0.08, 0.3), (y + 0.12, 0.25), (y + 0.13, 0.19)]
    parts.append(extrude_x(f"{tag}_roof", section, x - 0.17, x + 0.17, c["reed"]))
    parts.append(lpm.box(f"{tag}_door", (0.08, 0.02, 0.1), at=(x, y - 0.11, 0.07), color=c["dark"]))
    for side in (-1, 1):
        parts.append(lpm.box(f"{tag}_door_post_{side}", (0.02, 0.03, 0.11), at=(x + side * 0.05, y - 0.112, 0.07), color=c["accent"]))
    parts.append(lpm.box(f"{tag}_door_lintel", (0.12, 0.03, 0.02), at=(x, y - 0.112, 0.17), color=c["accent"]))
    parts.append(lpm.box(f"{tag}_window", (0.05, 0.02, 0.05), at=(x + 0.1, y - 0.11, 0.1), color=c["dark"]))


def totora_boat(parts, c, tag, x, y, length):
    """A totora reed boat along X: a rounded reed hull with two raised prows."""
    half = length / 2
    outline = [(x - half, y), (x - half + 0.06, y - 0.045), (x + half - 0.06, y - 0.045), (x + half, y), (x + half - 0.06, y + 0.045), (x - half + 0.06, y + 0.045)]
    parts.append(extrude_z(f"{tag}_hull", outline, 0.02, 0.06, c["reed"]))
    for sign in (-1, 1):
        prow = lpm.box(f"{tag}_prow_{sign}", (0.07, 0.05, 0.02), at=(x + sign * (half - 0.01), y, 0.06), color=c["reed"])
        lpm.rotate(prow, -sign * 28, axis="Y", about=(x + sign * (half - 0.01), y, 0.06))
        parts.append(prow)
    parts.append(lpm.box(f"{tag}_lash", (0.012, 0.09, 0.012), at=(x, y, 0.06), color=c["lash"]))


def build_totora(spec, out_dir):
    """A Titicaca Uros reed house, front facing -Y, on a (w, d) cell with `floors` floors; spec 'tier' (1 to 8) picks the ladder of the suburban Home.
    A floating reed island in the water carrying barrel-roofed reed huts with coloured door frames, reed boats with raised prows, and from Tier 2 a reed watchtower of stacked bundles with lashings, one level per floor, ringed by platforms and capped by a viewing deck under a reed cone."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("reed", "vtone1"), ("accent", "vtone2"), ("lash", "vtone3"), ("dark", "udark"), ("water", "dalablue"), ("wood", "darkwood"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    w, d = spec["footprint"]
    floors, tier = spec["floors"], spec["tier"]
    parts = [lpm.box("water", (w - 0.01, d - 0.01, 0.02), at=(0, 0, 0), color=c["water"]),
             lpm.box("island", (w - 0.14, d - 0.14, 0.05), at=(0, 0, 0.02), color=c["reed"])]
    for number in range(int((w - 0.14) / 0.1)):
        for sign in (-1, 1):
            parts.append(lpm.box(f"island_roll_{number}_{sign}", (0.09, 0.03, 0.03), at=(-(w - 0.14) / 2 + 0.06 + number * 0.1, sign * ((d - 0.14) / 2 - 0.005), 0.065), color=c["lash"]))
    huts, tower, boats = TOTORA_LAYOUT[tier]
    for number, (x, y) in enumerate(huts):
        totora_hut(parts, c, f"hut_{number}", x, y)
    for number, (x, y, length) in enumerate(boats):
        totora_boat(parts, c, f"boat_{number}", x, y, length)
    top_z, tx, ty, radius = 0.0, 0.0, 0.0, 0.0
    if tower:
        tx, ty, radius = tower
        z = 0.07
        for level in range(floors):
            r = radius - 0.03 * level
            parts.append(lpm.prism(f"tower_{level}", 8, r, 0.24, at=(tx, ty, z), color=c["reed"], radius_top=r * 0.94))
            for band in range(2):
                parts.append(lpm.prism(f"tower_{level}_lash_{band}", 8, r + 0.008, 0.02, at=(tx, ty, z + 0.06 + band * 0.1), color=c["lash"], radius_top=r + 0.008))
            parts.append(lpm.prism(f"tower_{level}_deck", 8, r + 0.05, 0.02, at=(tx, ty, z + 0.24), color=c["wood"], radius_top=r + 0.05))
            parts.append(lpm.box(f"tower_{level}_door", (0.06, 0.02, 0.1), at=(tx, ty - r + 0.0, z + 0.03), color=c["dark"]))
            z += 0.26
        top_r = radius - 0.03 * (floors - 1)
        for number in range(8):
            angle = math.radians(number * 45)
            parts.append(lpm.box(f"tower_post_{number}", (0.02, 0.02, 0.2), at=(tx + (top_r + 0.04) * math.cos(angle), ty + (top_r + 0.04) * math.sin(angle), z), color=c["wood"]))
        parts.append(lpm.lathe("tower_cone", [(top_r + 0.08, z + 0.2), (0.0, z + 0.4)], segments=8, at=(tx, ty, 0), color=c["reed"]))
        top_z = z

    if spec.get("solar"):
        for number, (px, py) in enumerate(((-0.1, -0.02), (0.1, -0.02))):
            hx, hy = huts[0]
            panel = lpm.box(f"solar_panel_{number}", (0.12, 0.12, 0.012), at=(hx + px, hy + py, 0.3), color=c["solar"])
            lpm.rotate(panel, 18, axis="X", about=(hx + px, hy + py, 0.3))
            parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=40000 + 10000 * floors, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = [w, d]
    return report


def build_valparaiso(spec, out_dir):
    """A corrugated-iron house of Valparaiso, front facing -Y, on a 1x1 or 1x2 cell; the Tier is the floor count (1 to 5).
    A tall narrow house whose floors are clad in different bright corrugated panels (the colors alternate floor by floor) with vertical ribs, a front gable corrugated roof, framed windows, a coloured door with a stoop,
    from Tier 2 a stair-landing rail, 3 a wooden balcony, 4 a roof dormer, 5 a rooftop lookout (mirador)."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("wall2", "vtone2"), ("trim", "vtone3"), ("dark", "udark"), ("roof", "kawara"), ("wood", "darkwood"), ("stone", "greywood"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    d = spec["footprint"][1]
    floors = spec["floors"]
    tier = floors
    fh, plinth = 0.27, 0.04
    bx, y0, y1 = 0.47, -d / 2 + 0.12, d / 2 - 0.03
    cy = (y0 + y1) / 2
    z_w = plinth + floors * fh
    parts = [lpm.box("plinth", (2 * bx + 0.02, y1 - y0 + 0.02, plinth), at=(0, cy, 0), color=c["stone"]),
             lpm.box("door_step", (0.5, 0.105, 0.025), at=(0, y0 - 0.0625, 0), color=c["stone"])]
    for level in range(floors):
        z = plinth + level * fh
        parts.append(lpm.box(f"floor_{level}", (2 * bx, y1 - y0, fh), at=(0, cy, z), color=c["wall"] if level % 2 == 0 else c["wall2"]))
        parts.append(lpm.box(f"floor_band_{level}", (2 * bx + 0.02, y1 - y0 + 0.02, 0.025), at=(0, cy, z + fh - 0.025), color=c["trim"]))
        for number in range(int(2 * bx / 0.1)):
            u = -bx + 0.05 + number * 0.1
            face_box(parts, f"rib_front_{level}_{number}", "front", y0, u, 0.01, fh - 0.06, z + 0.015, 0.008, c["trim"])
    hr = (y1 - y0) / 2 + 0.04
    rise = 0.26
    parts.append(extrude_y("roof", [(-bx - 0.04, z_w - 0.01), (bx + 0.04, z_w - 0.01), (0, z_w + rise)], y0 - 0.04, y1 + 0.02, c["roof"]))
    parts.append(extrude_y("gable", [(-bx + 0.05, z_w), (bx - 0.05, z_w), (0, z_w + rise - 0.08)], y0 - 0.054, y0 - 0.04, c["wall2"] if floors % 2 == 0 else c["wall"]))
    for sign in (-1, 1):
        parts.append(extrude_y(f"bargeboard_{sign}", [(sign * (bx + 0.04), z_w - 0.01), (0, z_w + rise), (0, z_w + rise - 0.05), (sign * (bx + 0.04), z_w - 0.06)], y0 - 0.07, y0 - 0.05, c["trim"]))
    victorian_window(parts, "gable_window", "front", y0 - 0.054, 0.0, z_w + 0.04, 0.08, 0.1, c)
    for level in range(floors):
        z = plinth + level * fh + 0.08
        for u in (-0.3, 0.3):
            victorian_window(parts, f"front_{level}_{u:.2f}", "front", y0, u, z, 0.09, 0.13, c)
        if level >= 1:
            victorian_window(parts, f"front_{level}_mid", "front", y0, 0.0, z, 0.09, 0.13, c)
        for number in range(max(1, round((y1 - y0) / 0.55))):
            y = y0 + (number + 0.5) * (y1 - y0) / max(1, round((y1 - y0) / 0.55))
            for face, wall in (("left", -bx), ("right", bx)):
                victorian_window(parts, f"{face}_{level}_{number}", face, wall, y, z, 0.09, 0.13, c)
        for u in (-0.25, 0.25):
            victorian_window(parts, f"back_{level}_{u:.2f}", "back", y1, u, z, 0.09, 0.13, c)
    face_box(parts, "door", "front", y0, 0.0, 0.17, 0.25, plinth, 0.02, c["wood"])
    face_box(parts, "door_frame", "front", y0, 0.0, 0.23, 0.3, plinth - 0.005, 0.012, c["trim"])
    if tier >= 2:
        for sign in (-1, 1):
            parts.append(lpm.box(f"stoop_post_{sign}", (0.02, 0.02, 0.12), at=(sign * 0.2, y0 - 0.085, 0.02), color=c["trim"]))
        parts.append(lpm.box("stoop_rail", (0.4, 0.012, 0.012), at=(0, y0 - 0.085, 0.14), color=c["trim"]))
    if tier >= 3:
        zb = plinth + fh
        parts.append(lpm.box("balcony", (0.64, 0.11, 0.025), at=(0, y0 - 0.055, zb - 0.01), color=c["wood"]))
        parts.append(lpm.box("balcony_rail", (0.64, 0.014, 0.014), at=(0, y0 - 0.108, zb + 0.1), color=c["trim"]))
        for number in range(12):
            parts.append(lpm.box(f"balcony_baluster_{number}", (0.01, 0.01, 0.1), at=(-0.29 + number * 0.053, y0 - 0.108, zb + 0.015), color=c["trim"]))
    if tier >= 4:
        parts.append(lpm.box("dormer", (0.22, 0.14, 0.13), at=(0.0, y0 + 0.14, z_w - 0.02), color=c["wall"]))
        parts.append(extrude_y("dormer_roof", [(-0.13, z_w + 0.11), (0.13, z_w + 0.11), (0, z_w + 0.2)], y0 + 0.06, y0 + 0.24, c["roof"]))
        face_box(parts, "dormer_window", "front", y0 + 0.07, 0.0, 0.09, 0.07, z_w + 0.02, 0.012, c["dark"])
    if tier >= 5:
        parts.append(lpm.box("mirador", (0.2, 0.2, 0.16), at=(0.0, cy + 0.15, z_w + 0.12), color=c["wall2"]))
        parts.append(lpm.box("mirador_roof", (0.26, 0.26, 0.025), at=(0.0, cy + 0.15, z_w + 0.28), color=c["roof"]))
        for face, wall, u in (("front", cy + 0.05, 0.0), ("back", cy + 0.25, 0.0)):
            face_box(parts, f"mirador_window_{face}", face, wall, u, 0.12, 0.08, z_w + 0.16, 0.012, c["dark"])

    if spec.get("solar"):
        angle = math.degrees(math.atan2(rise, bx))
        count = max(1, int((y1 - y0 - 0.35) / 0.24))
        for number in range(count):
            py = (y0 + y1) / 2 + 0.1 + (number - (count - 1) / 2) * 0.24
            if tier >= 5 and abs(py - cy - 0.15) < 0.2:
                continue
            px, pz = bx * 0.5 + 0.015, z_w - 0.01 + 0.5 * (rise + 0.01) + 0.015
            panel = lpm.box(f"solar_panel_{number}", (0.22, 0.2, 0.012), at=(px, py, pz), color=c["solar"])
            lpm.rotate(panel, angle, axis="Y", about=(px, py, pz))
            parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=30000 + 9000 * floors * d, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = list(spec["footprint"])
    return report


def quincha_cajon(parts, c, tag, y0, level_z, width=0.64):
    """A Lima closed wooden balcony (cajon): a carved wooden box with a slatted lattice front, side lattices, a small roof and corbels."""
    height, depth = 0.2, 0.12
    parts.append(lpm.box(f"{tag}_box", (width, depth, height), at=(0, y0 - depth / 2, level_z + 0.05), color=c["wood"]))
    parts.append(lpm.box(f"{tag}_base", (width + 0.04, depth + 0.02, 0.02), at=(0, y0 - depth / 2 - 0.005, level_z + 0.03), color=c["wood"]))
    parts.append(lpm.box(f"{tag}_roof", (width + 0.06, depth + 0.04, 0.02), at=(0, y0 - depth / 2 - 0.01, level_z + 0.25), color=c["trim"]))
    for number in range(int((width - 0.08) / 0.04)):
        parts.append(lpm.box(f"{tag}_slat_{number}", (0.016, 0.012, height - 0.06), at=(-width / 2 + 0.06 + number * 0.04, y0 - depth - 0.003, level_z + 0.08), color=c["dark"]))
    for sign in (-1, 1):
        parts.append(lpm.box(f"{tag}_corbel_{sign}", (0.03, 0.1, 0.05), at=(sign * (width / 2 - 0.05), y0 - 0.05, level_z - 0.025), color=c["wood"]))
        parts.append(lpm.box(f"{tag}_side_lattice_{sign}", (0.012, 0.07, 0.12), at=(sign * (width / 2 + 0.003), y0 - depth / 2, level_z + 0.09), color=c["dark"]))


def build_quincha(spec, out_dir):
    """A quincha balcony house of Lima, front facing -Y, on a 1x1 or 1x2 cell; the Tier is the floor count (1 to 5).
    A pastel plastered (quincha) block with a plain cornice and a flat roof behind a parapet, a tall studded double door in a white frame, and a closed carved wooden balcony (cajon) with a slatted lattice on every upper floor;
    from Tier 4 a cornice of dentils, 5 a roof lantern."""
    style = spec.get("style", "world")
    entries = palette_for(spec, style)
    index = PALETTE_NAMES.index
    c = {name: index(cell) for name, cell in (("wall", "vtone1"), ("wood", "vtone2"), ("trim", "vtone3"), ("dark", "udark"), ("stud", "honey"), ("stone", "greywood"), ("solar", "solar"))}
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    d = spec["footprint"][1]
    floors = spec["floors"]
    tier = floors
    fh, plinth = 0.29, 0.04
    bx, y0, y1 = 0.47, -d / 2 + 0.12, d / 2 - 0.03
    height = floors * fh
    z_top = plinth + height
    cy = (y0 + y1) / 2
    parts = [lpm.box("plinth", (2 * bx + 0.02, y1 - y0 + 0.02, plinth), at=(0, cy, 0), color=c["stone"]),
             lpm.box("door_step", (0.56, 0.105, 0.025), at=(0, y0 - 0.0625, 0), color=c["stone"]),
             lpm.box("walls", (2 * bx, y1 - y0, height), at=(0, cy, plinth), color=c["wall"]),
             lpm.box("cornice", (2 * bx + 0.04, y1 - y0 + 0.04, 0.03), at=(0, cy, z_top - 0.03), color=c["trim"])]
    for name, size, at in (("front", (2 * bx, 0.03, 0.06), (0, y0 + 0.015)), ("back", (2 * bx, 0.03, 0.06), (0, y1 - 0.015)), ("left", (0.03, y1 - y0, 0.06), (-bx + 0.015, cy)), ("right", (0.03, y1 - y0, 0.06), (bx - 0.015, cy))):
        parts.append(lpm.box(f"parapet_{name}", size, at=(at[0], at[1], z_top), color=c["wall"]))
    parts.append(lpm.box("door_leaf", (0.3, 0.02, 0.2), at=(0, y0 - 0.008, plinth), color=c["wood"]))
    parts.append(lpm.box("door_split", (0.012, 0.03, 0.2), at=(0, y0 - 0.014, plinth), color=c["dark"]))
    for side in (-1, 1):
        parts.append(lpm.box(f"door_post_{side}", (0.045, 0.04, 0.23), at=(side * 0.1725, y0 - 0.015, plinth), color=c["trim"]))
    parts.append(lpm.box("door_lintel", (0.4, 0.045, 0.045), at=(0, y0 - 0.017, plinth + 0.2), color=c["trim"]))
    for row in range(2):
        for col in range(4):
            parts.append(lpm.box(f"stud_{row}_{col}", (0.02, 0.012, 0.02), at=(-0.105 + col * 0.07, y0 - 0.02, plinth + 0.04 + row * 0.07), color=c["stud"]))

    for level in range(floors):
        z = plinth + level * fh + 0.09
        for u in (-0.34, 0.34):
            face_box(parts, f"front_{level}_{u:.2f}_glass", "front", y0, u, 0.1, 0.15, z, 0.012, c["dark"])
            face_box(parts, f"front_{level}_{u:.2f}_frame", "front", y0, u, 0.15, 0.2, z - 0.025, 0.01, c["trim"])
        for number in range(max(1, round((y1 - y0) / 0.55))):
            y = y0 + (number + 0.5) * (y1 - y0) / max(1, round((y1 - y0) / 0.55))
            for face, wall in (("left", -bx), ("right", bx)):
                face_box(parts, f"{face}_{level}_{number}_glass", face, wall, y, 0.1, 0.15, z, 0.012, c["dark"])
                face_box(parts, f"{face}_{level}_{number}_frame", face, wall, y, 0.15, 0.2, z - 0.025, 0.01, c["trim"])
        for u in (-0.25, 0.25):
            face_box(parts, f"back_{level}_{u:.2f}_glass", "back", y1, u, 0.1, 0.15, z, 0.012, c["dark"])
    for level in range(1, floors):
        quincha_cajon(parts, c, f"cajon_{level}", y0, plinth + level * fh)
    if tier >= 4:
        for number in range(int(2 * bx / 0.07)):
            parts.append(lpm.box(f"dentil_{number}", (0.03, 0.025, 0.025), at=(-bx + 0.04 + number * 0.07, y0 - 0.012, z_top - 0.065), color=c["trim"]))
    if tier >= 5:
        parts.append(lpm.box("lantern", (0.2, 0.2, 0.14), at=(0, cy, z_top + 0.07), color=c["wall"]))
        parts.append(lpm.box("lantern_roof", (0.26, 0.26, 0.025), at=(0, cy, z_top + 0.21), color=c["trim"]))
        for face, wall in (("front", cy - 0.1), ("back", cy + 0.1)):
            face_box(parts, f"lantern_window_{face}", face, wall, 0.0, 0.08, 0.08, z_top + 0.1, 0.012, c["dark"])

    if spec.get("solar"):
        for number, px in enumerate((-0.2, 0.2)):
            py = y1 - 0.2 if tier < 5 else y1 - 0.1
            panel = lpm.box(f"solar_panel_{number}", (0.2, 0.16, 0.012), at=(px, py, z_top + 0.08), color=c["solar"])
            lpm.rotate(panel, 20, axis="X", about=(px, py, z_top + 0.08))
            parts.append(panel)

    ob = lpm.finish(spec["id"], parts, palette, budget=30000 + 8000 * floors * d, center=False)
    report = export_model(ob, spec, out_dir)
    report["expected_footprint"] = list(spec["footprint"])
    return report


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
    projection = COLONNADE_PROJECTION if has_feature(spec, "colonnade") else PORTICO_PROJECTION if has_feature(spec, "portico") else 0.0
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
