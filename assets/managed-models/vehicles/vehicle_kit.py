"""Shared builders for the chunky low-poly vehicles: x is the width, y the length (front at -Y), z up, base on z = 0."""
import os
import sys

import bmesh

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "tools", "blender"))
import lpm  # noqa: E402

SHARED_COLORS = [
    ("glass", "#7fa6e0"), ("dark", "#2b2a33"), ("tire", "#1d1c22"), ("hub", "#8d8fa0"), ("hub_dark", "#5a5b6a"),
    ("headlight", "#ffe27a"), ("signal", "#ff8a2a"), ("taillight", "#e0302a"), ("plate", "#d9dbe6"),
    ("white", "#f4f5fb"), ("chrome", "#b9bccb"), ("black", "#17161b"), ("trim", "#4b4a57"),
]
SHARED_NAMES = [name for name, _ in SHARED_COLORS]


def palette(extra):
    return lpm.Palette([(n, h, 0.0, 0.75) for n, h in SHARED_COLORS + list(extra)])


def fillet(part, width, segments=2, min_angle=0.2):
    """Round the sharp edges of a part with a small bevel; flat triangulation seams are merged first and left alone."""
    bm = bmesh.new()
    bm.from_mesh(part.data)
    bmesh.ops.dissolve_limit(bm, angle_limit=0.001, verts=bm.verts, edges=bm.edges)
    sharp = [e for e in bm.edges if len(e.link_faces) == 2 and e.calc_face_angle(0) > min_angle]
    bmesh.ops.bevel(bm, geom=sharp, offset=width, offset_type="OFFSET", segments=segments, profile=0.5, affect="EDGES", clamp_overlap=True)
    bm.normal_update()
    bm.to_mesh(part.data)
    bm.free()
    return part


def rbox(name, size, at=(0, 0, 0), color=0, width=0.03):
    return fillet(lpm.box(name, size, at=at, color=color), width)


def side_profile(name, points, width, color, at_x=0.0, taper_top=None, z0=0.0, z1=1.0, bevel=0.0):
    """Extrude a (y, z) outline across the width; optionally lean the sides in towards the top and round the edges."""
    part = lpm.sweep(name, [(y, z) for y, z in points], width, at=(0, 0, 0), color=color, axis="y")
    lpm.rotate(part, 90, "Z")
    if taper_top is not None:
        lpm.taper(part, taper_top, z0, z1, axes="x")
    if bevel:
        fillet(part, bevel)
    return lpm.move(part, at_x, 0, 0)


def _across(part, outward):
    """Turn a Z-standing prism so its axis runs along X, growing towards the outside of the vehicle."""
    return lpm.rotate(part, 90 * outward, "Y")


def wheel(prefix, P, x, y, radius, width, hub_color="hub"):
    outward = 1 if x > 0 else -1
    inner = x - outward * width / 2
    tyre = _across(lpm.prism(f"{prefix} tyre", 10, radius, width, color=P["tire"], rotate=18), outward)
    lpm.move(tyre, inner, y, radius)
    hub = _across(lpm.prism(f"{prefix} hub", 8, radius * 0.55, 0.03, color=P[hub_color]), outward)
    lpm.move(hub, x + outward * (width / 2 - 0.012), y, radius)
    return [tyre, hub]


def wheel_arch(prefix, P, x, y, radius, body_half_width, depth=0.03):
    outward = 1 if x > 0 else -1
    arch = _across(lpm.prism(f"{prefix} arch", 10, radius * 1.22, depth, color=P["dark"], rotate=18), outward)
    return lpm.move(arch, outward * (body_half_width - depth * 0.5), y, radius)


def mirror_pair(name, P, x, y, z, color):
    parts = []
    for side in (-1, 1):
        parts.append(lpm.box(f"{name} {side}", (0.07, 0.1, 0.1), at=(side * x, y, z), color=P[color]))
    return parts


def headlights(P, y, x, z, span=0.3, height=0.13, depth=0.05):
    """Front lights: a yellow lamp with an orange indicator on the outer side."""
    parts = []
    for side in (-1, 1):
        parts.append(lpm.box("headlight", (span * 0.6, depth, height), at=(side * (x - span * 0.3), y, z), color=P["headlight"]))
        parts.append(lpm.box("signal", (span * 0.4, depth, height), at=(side * (x + span * 0.2), y, z), color=P["signal"]))
    return parts


def taillights(P, y, x, z, span=0.28, height=0.14, depth=0.05):
    return [lpm.box("taillight", (span, depth, height), at=(side * x, y, z), color=P["taillight"]) for side in (-1, 1)]


def licence_plate(P, y, z, width=0.34, front=True):
    sign = -1 if front else 1
    return lpm.box("plate", (width, 0.03, 0.13), at=(0, y + sign * 0.005, z), color=P["plate"])


def door_seams(P, xs, ys, z0, z1, color="dark"):
    """Thin dark vertical lines on both flanks at the given y positions."""
    parts = []
    for side in (-1, 1):
        for y in ys:
            parts.append(lpm.box("seam", (0.012, 0.016, z1 - z0), at=(side * xs, y, z0), color=P[color]))
    return parts


def build(name, parts, extra_colors, out_dir, budget):
    pal = palette(extra_colors)
    ob = lpm.finish(name, parts, pal, budget=budget, center=True)
    return lpm.export_glb(ob, out_dir)


def _along(p0, p1, z):
    """y of the segment p0 -> p1 (each (y, z)) at height z."""
    t = (z - p0[1]) / (p1[1] - p0[1])
    return p0[0] + (p1[0] - p0[0]) * t


def bumper_pair(P, length, width, zb, height=0.2):
    return [
        rbox("front bumper", (width + 0.04, 0.12, height), at=(0, -length / 2, zb), color=P["dark"], width=0.025),
        rbox("rear bumper", (width + 0.04, 0.12, height), at=(0, length / 2, zb), color=P["dark"], width=0.025),
    ]


def roof_rack(P, y0, y1, z, half_width, color="black"):
    parts = [lpm.box("rack rail", (0.03, y1 - y0, 0.05), at=(side * half_width, (y0 + y1) / 2, z), color=P[color]) for side in (-1, 1)]
    for y in (y0 + 0.05, y1 - 0.05):
        parts.append(lpm.box("rack bar", (half_width * 2 + 0.03, 0.04, 0.04), at=(0, y, z + 0.05), color=P[color]))
    return parts


def passenger(P, body, *, length, width=1.46, zs=0.72, lift=0.0, wheel_r=0.3, axle=0.84, rear_axle=None, hood_drop=0.06,
              trunk_drop=0.08, cabin=(-0.5, 0.82, -0.14, 0.62), roof_h=0.48, roof=None, rack=False, bed=False,
              wheel_w=0.2, cladding=False, hub="hub", cabin_color=None):
    """A chunky passenger car; `cabin` is (front base, rear base, front top, rear top) along y."""
    hl, half, zb = length / 2, width / 2, 0.22 + lift
    fb, rb, ft, rt = cabin
    zt = zs + roof_h
    rear_axle = axle if rear_axle is None else rear_axle
    deck_end = rb + 0.08 if bed else hl
    outline = [(-hl, zb), (deck_end, zb), (deck_end, zs - (0 if bed else trunk_drop)), (deck_end - (0 if bed else 0.32), zs),
               (fb - 0.02, zs), (-hl, zs - hood_drop)]
    parts = [side_profile("body", outline, width, P[body], bevel=0.05)]
    cabin_pts = [(fb, zs), (rb, zs), (rt, zt), (ft, zt)]
    cabin_part = side_profile("cabin", cabin_pts, width - 0.12, P[cabin_color or roof or body], taper_top=0.84, z0=zs, z1=zt, bevel=0.04)
    if roof and not cabin_color:
        lpm.paint(cabin_part, P[body], where=lambda c, n, i: n.z < 0.5)
    parts.append(cabin_part)
    gz0, gz1 = zs + 0.07, zt - 0.08
    front_edge, rear_edge = ((fb, zs), (ft, zt)), ((rb, zs), (rt, zt))
    glass = [(_along(*front_edge, gz0) - 0.006, gz0), (_along(*rear_edge, gz0) + 0.006, gz0),
             (_along(*rear_edge, gz1) + 0.006, gz1), (_along(*front_edge, gz1) - 0.006, gz1)]
    parts.append(side_profile("glass", glass, width - 0.1, P["glass"], taper_top=0.84, z0=zs, z1=zt, bevel=0.03))
    ymid = (glass[0][0] + glass[1][0]) / 2 + 0.05
    pillar = [(ymid - 0.05, gz0), (ymid + 0.05, gz0), (ymid + 0.05, gz1), (ymid - 0.05, gz1)]
    parts.append(side_profile("b pillar", pillar, width - 0.09, P[body], taper_top=0.84, z0=zs, z1=zt, bevel=0.015))
    parts.append(side_profile("sill", [(-0.55, zb - 0.02), (0.55, zb - 0.02), (0.55, zb + 0.12), (-0.55, zb + 0.12)], width + 0.04, P["dark"]))
    parts += bumper_pair(P, length, width, zb)
    parts += [
        lpm.box("grille", (0.8, 0.04, 0.2), at=(0, -hl + 0.01, zb + 0.22), color=P["black"]),
        licence_plate(P, -hl - 0.04, zb),
        licence_plate(P, hl + 0.04, zb + 0.04, front=False),
        *headlights(P, -hl + 0.015, half - 0.23, zs - 0.22),
        *taillights(P, hl - 0.015, half - 0.2, zs - 0.2),
        *mirror_pair("mirror", P, half + 0.04, fb + 0.1, zs + 0.06, "dark" if cladding else body),
    ]
    for side in (-1, 1):
        for y, hub_y in ((-axle, -axle), (rear_axle, rear_axle)):
            parts += wheel("wheel", P, side * (half - 0.1), hub_y, wheel_r, wheel_w, hub)
            parts.append(wheel_arch("arch", P, side * half, hub_y, wheel_r, half))
        if cladding:
            parts.append(lpm.box("cladding", (0.02, hl * 1.7, 0.12), at=(side * (half + 0.004), 0, zb + 0.1), color=P["dark"]))
    parts += door_seams(P, half + 0.005, (fb + 0.32, ymid + 0.12, rb - 0.05), zb + 0.12, zs - 0.02)
    if rack:
        parts += roof_rack(P, ft - 0.05, rt - 0.02, zt, (width - 0.12) * 0.84 / 2 - 0.02)
    if bed:
        wall = lpm.box
        floor_z = zs - 0.14
        parts.append(wall("bed floor", (width - 0.1, hl - deck_end, 0.05), at=(0, (deck_end + hl) / 2, floor_z), color=P["dark"]))
        for side in (-1, 1):
            parts.append(wall("bed wall", (0.05, hl - deck_end, 0.22), at=(side * (half - 0.03), (deck_end + hl) / 2, floor_z), color=P[body]))
        parts.append(wall("tailgate", (width - 0.02, 0.05, 0.22), at=(0, hl - 0.03, floor_z), color=P[body]))
        parts.append(wall("bed front", (width - 0.02, 0.05, 0.22), at=(0, deck_end + 0.03, floor_z), color=P[body]))
    return parts


def wheel_set(P, half, ys, radius, width, hub="hub"):
    parts = []
    for side in (-1, 1):
        for y in ys:
            parts += wheel("wheel", P, side * (half - width / 2 + 0.02), y, radius, width, hub)
            parts.append(wheel_arch("arch", P, side * half, y, radius, half))
    return parts


def panel(name, P, color, y0, y1, z0, z1, half, round_edges=0.0):
    """Flat panel stuck on both flanks, 1 cm proud of a body whose half width is `half`."""
    parts = [lpm.box(name, (0.02, y1 - y0, z1 - z0), at=(side * (half + 0.004), (y0 + y1) / 2, z0), color=P[color]) for side in (-1, 1)]
    return [fillet(part, round_edges, segments=1) for part in parts] if round_edges else parts


def beacon(P, x, y, z, color, size=(0.22, 0.12, 0.1)):
    return lpm.box("beacon", size, at=(x, y, z), color=P[color])


def truck_front(P, hl, half, zb, cab_top_chamfer_z, grille_z):
    """Grille, bumper, headlights and plate on a flat truck nose at y = -hl."""
    return [
        lpm.box("grille", (half * 1.1, 0.04, 0.34), at=(0, -hl - 0.01, grille_z), color=P["black"]),
        rbox("front bumper", (half * 2 + 0.04, 0.14, 0.2), at=(0, -hl - 0.02, zb - 0.06), color=P["trim"], width=0.03),
        *headlights(P, -hl - 0.005, half - 0.28, grille_z + 0.06, span=0.34, height=0.16),
        licence_plate(P, -hl - 0.09, zb - 0.04),
    ]


def cab_windows(P, half, y0, y1, z0, z1, split=None):
    parts = panel("side window", P, "glass", y0, y1, z0, z1, half, round_edges=0.008)
    if split is not None:
        parts += panel("window pillar", P, "white", split - 0.03, split + 0.03, z0 - 0.003, z1 + 0.003, half + 0.002)
    return parts
