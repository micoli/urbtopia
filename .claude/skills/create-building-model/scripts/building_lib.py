"""
building_lib.py - shared art direction and builders for Urbix low-poly buildings.
Run INSIDE Blender through the LPM skill's bl.py (see SKILL.md). Units: 1 tile = 1 world unit, Z up, front = -Y.

A recipe is: `import building_lib; building_lib.build(SPEC, out_dir)`.
Two styles share the geometry code and differ by the STYLES table: "kenney" (default, matches the suburban Kenney
models of the game: off-white walls, thick slate trims, soft green roofs) and "vivid" (saturated colors, fine trims).
"""
import math
import os
import random
import shutil
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

LPM_DIR = os.path.expanduser("~/.claude/skills/blender-lpm-skill/scripts")
sys.path.insert(0, LPM_DIR)
import lpm  # noqa: E402

PALETTE_ENTRIES = [
    ("coral", "#ff5a4e"), ("tangerine", "#ff9a1f"), ("sun", "#ffd21f"), ("lime", "#8bdc2a"),
    ("mint", "#2fd6a2"), ("aqua", "#14c8e8"), ("sky", "#3d9bff"), ("cobalt", "#3b4bff"),
    ("violet", "#8a4dff"), ("magenta", "#f03dd0"), ("pink", "#ff8fb8"), ("cream", "#fff1d6"),
    ("white", "#f6f8ff"), ("graphite", "#2c2f4a"), ("brick", "#c2432e"), ("navy", "#1b2a6b"),
    ("offwhite", "#e8e8e6"), ("slate", "#6d7390"), ("slate_dark", "#464b63"), ("softgreen", "#7cc08f"),
    ("glass_blue", "#9fcdea"), ("bush", "#4f9a62"), ("solar", "#26304f"),
    ("bluegrey", "#8ea3bd"), ("salmon", "#ff9c80"),
]
PALETTE_NAMES = [name for name, _ in PALETTE_ENTRIES]

FLOOR_HEIGHT = {"house": 0.30, "apartment": 0.28, "office": 0.32}
FLOOR_RANGE = {"house": (1, 3), "apartment": (3, 12), "office": (4, 20)}
ROOF_STYLES = ("flat", "gable_half", "gable_third", "hip", "mansard", "shed", "gable_cross")
FEATURES = ("sign", "chimney", "antenna", "awning", "balcony", "skylight", "monumental_door",
            "vent", "solar_panels", "bushes")
FRONT_FEATURES = ("sign", "awning", "balcony", "monumental_door", "bushes")
FACES = ("front", "back", "left", "right")

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
    elif spec["roof"] == "shed":
        height = min(MAX_SHED_HEIGHT, math.tan(math.radians(SHED_PITCH_DEG)) * short_side)
    else:
        height = min(MAX_ROOF_HEIGHT, math.tan(math.radians(ROOF_PITCH_DEG)) * short_side / 2)
    return long_side, short_side, height


def roof_height(spec):
    thickness = spec["cfg"]["roof_thickness"]
    if spec["roof"] == "flat":
        return max(thickness, 0.04)
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


def has_gable_ends(spec):
    return spec["roof"] in ("gable_half", "gable_third", "shed")


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
    return [roof, extrude_profile(spec, "gable_wall", attic, -body_long, body_long, attic_color)]


def roof_parts(spec, z):
    cfg = spec["cfg"]
    thickness = cfg["roof_thickness"]
    roof_color = color_index(spec, "roof")
    style = spec["roof"]
    width, depth = spec["footprint"]
    if style == "flat":
        return [fillet(lpm.box("roof", (width, depth, max(thickness, 0.04)), at=(0, 0, z), color=roof_color), cfg["roof_fillet"])]
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
    post = cfg["door_post_mon"] if monumental else cfg["door_post"]
    parts.append(wall_rounded_plate(spec, "door_surround", "front", 0, 0, width + 2 * post, height + post, cfg["door_plate_depth"], trim, cfg["door_radius"]))
    if monumental:
        parts.append(wall_box(spec, "door_pediment", "front", 0, height + post - 0.005, (width + 2 * post + 0.04, 0.03, 0.025), trim))
    parts.append(wall_box(spec, "door_step", "front", 0, 0, (width + 2 * post + 0.02, 0.035, 0.014), trim))
    parts.append(wall_box(spec, "door", "front", 0, 0, (width, cfg["door_depth"], height), door))
    if spec["kind"] == "office":
        parts.append(wall_quad(spec, "decal_door_split", "front", 0, 0.014, 0.008, height - 0.014, trim, push=cfg["door_depth"] - 0.01 + DECAL_STEP))
    parts.append(wall_box(spec, "door_handle", "front", width / 2 - 0.03, height * 0.45, (0.014, cfg["handle_depth"], 0.03), color_index(spec, "accent")))


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


def add_window(spec, parts, tag, face, along, z, width, height, half=None):
    cfg = spec["cfg"]
    trim, glass = color_index(spec, "trim"), color_index(spec, "glass")
    columns, rows = panes_for(spec)
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


def windows_on_face(spec, parts, face, rng, has_door, blocked):
    cfg, floor = spec["cfg"], spec["floor_height"]
    columns, widths = window_columns(spec, face, rng)
    varied = spec.get("window_sizes", "same") == "varied"
    door_width, _ = door_layout(spec)
    spec.setdefault("window_columns", {})[face] = columns
    for level in range(spec["floors"]):
        height = floor * cfg["window_height"] * (rng.choice(HEIGHT_FACTORS) if varied else 1.0)
        for index, (along, width) in enumerate(zip(columns, widths)):
            reach = width / 2 + cfg["window_pad"]
            if has_door and face == "front" and level == 0 and abs(along) < door_width / 2 + reach + 0.03:
                continue
            if any(a0 - reach < along < a1 + reach and level < levels for a0, a1, levels in blocked.get(face, [])):
                continue
            zone = sign_zone(spec) if face == "front" else None
            window_bottom = level * floor + floor * cfg["window_z"] - cfg["window_pad"]
            if zone and abs(along) < zone[0] + reach and window_bottom < zone[2] and window_bottom + height + 2 * cfg["window_pad"] > zone[1]:
                continue
            add_window(spec, parts, f"{face}_{level}_{index}", face, along, level * floor + floor * cfg["window_z"], width, height)


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
    return ((4 * len(text) - 1) * SIGN_PIXEL + 0.04) / 2, z, z + 5 * SIGN_PIXEL + 0.02


def add_sign_text(spec, parts, face, text, board_color, board_z, pixel=SIGN_PIXEL, half=None):
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


def add_roof_sign(spec, parts, face, text, board_color):
    """Board standing on a flat roof, set back from the edge, text facing outward."""
    if spec["roof"] != "flat":
        raise ValueError("a roof sign needs a flat roof")
    top = spec["floors"] * spec["floor_height"]
    add_sign_text(spec, parts, face, text, board_color, top + 0.035, pixel=ROOF_SIGN_PIXEL, half=wall_half(spec, face) - 0.06)


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


def add_solar_panels(spec, parts):
    if spec["roof"] not in ("gable_half", "gable_third", "shed"):
        raise ValueError("solar_panels need a gable_half, gable_third or shed roof")
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


def add_bushes(spec, parts, sides):
    bush = PALETTE_NAMES.index("bush")
    body_width = spec["body"][0]
    profile = [(0.0, 0.0), (0.062, 0.0), (0.07, 0.038), (0.05, 0.077), (0.0, 0.092)]
    for side in sides:
        x, y, _ = plane_point("front", side * (body_width / 2 - 0.09), wall_half(spec, "front") - 0.03, 0)
        parts.append(lpm.lathe(f"bush_{side}", profile, segments=7, at=(x, y, 0), color=bush))


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
            add_roof_sign(spec, parts, face, text, accent)
            return
        if text:
            add_sign_text(spec, parts, face, text, accent, sign_board_z(spec))
            return
        parts.append(wall_box(spec, f"sign_{face}", face, 0, floor * 0.84, (min(0.6, length * 0.5), 0.03, 0.07), accent))
    elif kind == "awning":
        width, height = door_layout(spec)
        parts.append(wall_box(spec, "awning", "front", 0, height + 0.03, (width + 0.14, 0.06, 0.025), accent))
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
        for level in range(1, spec["floors"]):
            for index in range(0, len(columns), 2):
                along = columns[index]
                if level == 1 and face == "front" and has_feature(spec, "sign") and abs(along) < SIGN_CLEARANCE:
                    continue
                parts.append(wall_box(spec, f"balcony_{face}_{level}_{index}", face, along, level * floor + 0.005, (0.22, 0.06, 0.02), trim))
                parts.append(wall_box(spec, f"rail_{face}_{level}_{index}", face, along, level * floor + 0.025, (0.22, 0.06, 0.045), accent))
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
    push = 2 * cfg["belt_push"]
    for level in range(1, spec["floors"]):
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
        wing_cx = -width / 2 + wing_width / 2 if wing_side == "left" else width / 2 - wing_width / 2
        volumes.append({"role": "wing", "cx": wing_cx, "cy": -depth / 2 + wing_depth / 2, "width": wing_width, "depth": wing_depth,
                        "floors": wing_floors, "roof": wing.get("roof", "gable_half"), "door": False,
                        "garage": wing.get("garage", False), "faces": [f for f in FACES if f != ("right" if wing_side == "left" else "left")],
                        "bushes": (-1,) if wing_side == "left" else (1,), "blocked": {}})
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
        if main["width"] < main["depth"]:
            raise ValueError("gable_cross needs a main volume at least as wide as deep")
        bay_width = spec.get("bay_width", min(1.0, main["width"] * 0.5))
        bay_depth = main["cy"] + depth / 2
        volumes.append({"role": "bay", "cx": main["cx"], "cy": -depth / 2 + bay_depth / 2, "width": bay_width, "depth": bay_depth,
                        "floors": spec["floors"], "roof": "gable_half", "door": True, "garage": False,
                        "faces": ["front", "left", "right"], "bushes": (-1, 1), "blocked": {}})
        main["blocked"]["front"] = [(-bay_width / 2 - 0.02, bay_width / 2 + 0.02, spec["floors"])]
    return volumes


def volume_spec(spec, volume, features):
    cfg = spec["cfg"]
    vs = dict(spec)
    vs.update(footprint=(volume["width"], volume["depth"]), floors=volume["floors"], roof=volume["roof"], features=features, window_columns={})
    over_x = over_y = cfg["overhang"]
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
    for feature in vs["features"]:
        add_feature(vs, parts, feature)
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


def build(spec, out_dir):
    """Build, check, export <out_dir>/<id>.blend + <id>.glb. Returns the lpm report."""
    check_spec(spec)
    style = spec.get("style", "kenney")
    cfg = STYLES[style]
    spec["cfg"] = cfg
    spec["style"] = style
    width, depth = spec["footprint"]
    spec["colors"] = {**cfg["colors"], **spec.get("colors", {})}
    spec["floor_height"] = FLOOR_HEIGHT[spec["kind"]]
    rng = random.Random(spec.get("seed", spec["id"]))

    volumes = plan_volumes(spec)
    features = spec.get("features", [])
    main = volumes[0]
    front = next((v for v in volumes if v["role"] == "bay"), main)
    specs = {v["role"]: volume_spec(spec, v, features_of(v, front, main, features)) for v in volumes}
    if "bay" in specs:
        specs["bay"]["roof_height"] = roof_dimensions(specs["main"])[2]
    bushes = has_feature(spec, "bushes")

    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in PALETTE_ENTRIES])
    parts = []
    for volume in volumes:
        parts += build_volume(specs[volume["role"]], volume, rng, bushes)
    assert_closed(parts)

    extra_volumes = len(volumes) - 1
    if style == "kenney":
        budget = 600 + cfg["budget_per_floor_tile"] * width * depth * spec["floors"] + 450 * extra_volumes + 150 * len(features)
    else:
        budget = 700 + spec["floors"] * 2 * (width + depth) * cfg["budget_per_floor_tile"] + 150 * len(features) + 600 * extra_volumes
    if spec["roof"] == "mansard":
        budget += 1500
    ob = lpm.finish(spec["id"], parts, palette, budget=int(budget), center=False)
    work = os.path.join(out_dir, "_work")
    report = lpm.export_unity(ob, os.path.join(work, spec["id"]), glb=True)
    for ext in ("blend", "glb"):
        shutil.move(os.path.join(work, f"{spec['id']}.{ext}"), os.path.join(out_dir, f"{spec['id']}.{ext}"))
    shutil.rmtree(work)
    report["expected_footprint"] = [width, depth]
    return report
