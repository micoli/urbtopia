"""Builders shared by the boats, trains and buses: x is the width, y the length (front at -Y), z up, base on z = 0."""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def out_dir(script_file):
    return argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(script_file)[0]


# bow tip first (t = 0), stern last (t = 1): (fraction of the length, fraction of the half beam)
HULL_STATIONS = [(0.0, 0.0), (0.1, 0.5), (0.28, 0.88), (0.5, 1.0), (0.85, 1.0), (1.0, 0.86)]


def plan(length, beam, stations=HULL_STATIONS, bow_y=None):
    """Closed (x, y) outline of a hull seen from above, bow towards -Y."""
    right = [(beam / 2 * w, -length / 2 + length * t) for t, w in stations]
    left = [(-x, y) for x, y in reversed(right) if x > 1e-6]
    return right + left


def hull(P, length, beam, h_low, h_up, low, up, stations=HULL_STATIONS, flare=1.06, rim=None, deck=None, z0=0.0):
    """Boot-topping hull in two bands (a darker bottom, a coloured side) with a rim and an optional deck slab."""
    parts = []
    bottom = lpm.sweep("hull bottom", plan(length, beam * 0.74, stations), h_low, at=(0, 0, z0), color=P[low], axis="z")
    lpm.taper(bottom, beam / (beam * 0.74), z0, z0 + h_low, axes="x")
    parts.append(bottom)
    side = lpm.sweep("hull side", plan(length, beam, stations), h_up, at=(0, 0, z0 + h_low), color=P[up], axis="z")
    lpm.taper(side, flare, z0 + h_low, z0 + h_low + h_up, axes="x")
    if rim:
        lpm.paint(side, P[rim], where=lambda c, n, i: n.z > 0.5)
    parts.append(side)
    if deck:
        slab = lpm.sweep("deck", plan(length * 0.9, beam * 0.8, stations), 0.03, at=(0, length * 0.02, z0 + h_low + h_up - 0.005), color=P[deck], axis="z")
        parts.append(slab)
    return parts


def mast(P, y, z, height, radius=0.025, color="dark", x=0.0):
    return lpm.prism("mast", 6, radius, height, at=(x, y, z), color=P[color])


def funnel(P, y, z, height, radius, color, top="black", ry=1.0, x=0.0):
    body = lpm.prism("funnel", 8, radius, height * 0.85, at=(x, y, z), radius_top=radius * 0.9, color=P[color], rotate=22.5)
    lpm.scale(body, 1.0, ry, 1.0, about=(x, y, z))
    cap = lpm.prism("funnel top", 8, radius * 0.9, height * 0.15, at=(x, y, z + height * 0.85), color=P[top], rotate=22.5)
    lpm.scale(cap, 1.0, ry, 1.0, about=(x, y, z))
    return [body, cap]


def window_row(P, color, y0, y1, z, half, count, height=0.1, depth=0.02, gap=0.35, side_color=None):
    """`count` windows spread between y0 and y1 on both flanks of a body whose half width is `half`."""
    step = (y1 - y0) / count
    width = step * (1 - gap)
    parts = []
    for side in (-1, 1):
        for i in range(count):
            y = y0 + step * (i + 0.5)
            parts.append(lpm.box("window", (depth, width, height), at=(side * (half + depth * 0.2), y, z), color=P[color]))
    return parts


def porthole_row(P, color, y0, y1, z, half, count, size=0.07, depth=0.02):
    step = (y1 - y0) / count
    parts = []
    for side in (-1, 1):
        for i in range(count):
            y = y0 + step * (i + 0.5)
            parts.append(lpm.prism("porthole", 6, size / 2, depth, at=(side * half, y, z), color=P[color]))
            lpm.rotate(parts[-1], 90 * side, "Y", about=(side * half, y, z))
    return parts


def sail(P, color, y, z, width, height, thickness=0.025, billow=0.0, x=0.0, top_ratio=1.0, shape="quad", flip=False, side=False, nx=6, nz=5):
    """Billowed sail on a grid. Faces forward (-Y) by default; side=True lays it in the Y-Z plane, `width` then running along Y
    (`y` is the centre of that run). shape="tri" is a triangle whose vertical edge is at the start of the run (the end, with flip)."""
    part = lpm.grid_box("sail", (width, thickness, height), at=(0, 0, 0), color=P[color], nx=nx, nz=nz)
    for v in part.data.vertices:
        u, h = v.co.x / width + 0.5, v.co.z / height
        if flip:
            u = 1 - u
        if shape == "tri":
            nu = u * (1 - h)
        else:
            nu = 0.5 + (u - 0.5) * (1 + (top_ratio - 1) * h)
        bulge = billow * math.sin(math.pi * u) * math.sin(math.pi * (0.08 + 0.84 * h)) * (1 - 0.4 * h if shape == "tri" else 1.0)
        v.co.y -= bulge
        v.co.x = ((1 - nu if flip else nu) - 0.5) * width
    part.data.update()
    if side:
        lpm.rotate(part, 90, "Z")
    return lpm.move(part, x, y, z)


def beam_x(P, color, y, z, width, thickness=0.03):
    return lpm.box("spar", (width, thickness, thickness), at=(0, y, z), color=P[color])


def railing(P, color, y0, y1, z, half, height=0.07):
    parts = []
    for side in (-1, 1):
        parts.append(lpm.box("rail", (0.015, y1 - y0, 0.015), at=(side * half, (y0 + y1) / 2, z + height), color=P[color]))
    return parts


def cyl_y(P, color, sides, r, y0, y1, z, x=0.0, r_end=None, rotate=0.0, name="cylinder"):
    """Cylinder lying along Y from y0 to y1, centred on height z."""
    part = lpm.prism(name, sides, r, y1 - y0, color=P[color], radius_top=r_end, rotate=rotate)
    lpm.rotate(part, -90, "X")
    return lpm.move(part, x, y0, z)


def cyl_x(P, color, sides, r, x0, x1, y, z, name="cylinder"):
    """Cylinder lying along X from x0 to x1."""
    part = lpm.prism(name, sides, r, x1 - x0, color=P[color], rotate=360 / sides / 2)
    lpm.rotate(part, 90, "Y")
    return lpm.move(part, x0, y, z)


def rail_wheel(P, x, y, r, width, color="tire", hub="hub", sides=10):
    outward = 1 if x > 0 else -1
    tyre = lpm.rotate(lpm.prism("wheel", sides, r, width, color=P[color], rotate=18), 90 * outward, "Y")
    lpm.move(tyre, x - outward * width / 2, y, r)
    cap = lpm.rotate(lpm.prism("wheel hub", 6, r * 0.5, 0.03, color=P[hub]), 90 * outward, "Y")
    lpm.move(cap, x + outward * (width / 2 - 0.012), y, r)
    return [tyre, cap]


def bogie(P, y, track=0.44, r=0.14, spacing=0.34, axles=2, frame="dark", wheel_color="tire", hub="hub"):
    parts = [lpm.box("bogie frame", (track * 2 - 0.1, spacing * (axles - 1) + 0.3, 0.07), at=(0, y, r * 1.1), color=P[frame])]
    for i in range(axles):
        ay = y + spacing * (i - (axles - 1) / 2)
        for side in (-1, 1):
            parts += rail_wheel(P, side * track, ay, r, 0.09, wheel_color, hub)
        parts.append(lpm.box("axle", (track * 2, 0.04, 0.04), at=(0, ay, r - 0.02), color=P[frame]))
    return parts


def underframe(P, length, width, z, color="dark", height=0.1):
    return lpm.box("underframe", (width - 0.12, length - 0.1, height), at=(0, 0, z - 0.02), color=P[color])


def railcar_outline(length, z0, z1, front=None, rear=None):
    """Side outline (y, z) of a car; front / rear are (nose length, drop of the windscreen base) or None for a flat end."""
    hl = length / 2
    pts = []
    fn, fd = front or (0.0, 0.0)
    rn, rd = rear or (0.0, 0.0)
    pts.append((-hl, z0))
    pts.append((hl, z0))
    pts.append((hl, z1 - rd))
    if rn:
        pts.append((hl - rn, z1))
    if fn:
        pts.append((-hl + fn, z1))
    pts.append((-hl, z1 - fd))
    return pts


def nose_glass(P, color, length, z1, nose, width, rear=False, inset=0.0):
    """Sloped windscreen sliver on a nose: nose = (nose length, drop)."""
    nlen, drop = nose
    sign = 1 if rear else -1
    a = (sign * length / 2, z1 - drop)
    b = (sign * (length / 2 - nlen), z1)
    dy, dz = b[0] - a[0], b[1] - a[1]
    norm = (dy * dy + dz * dz) ** 0.5
    out = 0.012
    ny, nz = sign * abs(dz) / norm, abs(dy) / norm
    t0, t1 = 0.12 + inset, 0.8 - inset
    p0 = (a[0] + dy * t0, a[1] + dz * t0)
    p1 = (a[0] + dy * t1, a[1] + dz * t1)
    pts = [(p0[0] + ny * out, p0[1] + nz * out), (p1[0] + ny * out, p1[1] + nz * out),
           (p1[0] - ny * 0.05, p1[1] - nz * 0.05), (p0[0] - ny * 0.05, p0[1] - nz * 0.05)]
    return kit.side_profile("windscreen", pts, width, P[color])


def railcar(P, length, width, body, *, roof=None, z0=0.24, height=0.72, front=None, rear=None, glass="glass", windows=None,
            window_z=(0.34, 0.54), band=None, bogies=True, bogie_offset=0.95, skirt="dark", front_glass=True, bevel=0.05):
    """Passenger car or railcar. `windows` = (y0, y1, count); `band` = (colour, z low, z high) painted as a flank stripe."""
    z1 = z0 + height
    hw = width / 2
    parts = [kit.side_profile("car body", railcar_outline(length, z0, z1, front, rear), width, P[body], bevel=bevel)]
    if roof:
        lpm.paint(parts[0], P[roof], where=lambda c, n, i: n.z > 0.5 and c.z > z1 - 0.03)
    parts.append(lpm.box("skirt", (width - 0.08, length - 0.12, 0.14), at=(0, 0, z0 - 0.08), color=P[skirt]))
    if windows:
        y0, y1, count = windows
        parts += window_row(P, glass, y0, y1, z0 + window_z[0], hw, count, height=window_z[1] - window_z[0], gap=0.3, depth=0.03)
    if band:
        colour, lo, hi = band
        parts += kit.panel("stripe", P, colour, -length / 2 + 0.2, length / 2 - 0.2, z0 + lo, z0 + hi, hw)
    for nose, rear_end in ((front, False), (rear, True)):
        if nose and front_glass:
            parts.append(nose_glass(P, glass, length, z1, nose, width * 0.78, rear=rear_end))
        elif front_glass and not nose:
            sign = 1 if rear_end else -1
            parts.append(lpm.box("end window", (width * 0.6, 0.03, 0.2), at=(0, sign * (length / 2 + 0.005), z0 + 0.38), color=P[glass]))
    for sign in (-1, 1):
        parts.append(lpm.box("coupler", (0.12, 0.12, 0.07), at=(0, sign * (length / 2 + 0.05), z0 - 0.06), color=P[skirt]))
    if bogies:
        for sign in (-1, 1):
            parts += bogie(P, sign * (length / 2 - bogie_offset))
    return parts


def pantograph(P, y, z, height=0.3, color="dark"):
    parts = [lpm.box("pantograph base", (0.34, 0.3, 0.04), at=(0, y, z), color=P[color])]
    for side in (-1, 1):
        parts.append(strut(P, color, (side * 0.1, y - 0.1, z + 0.04), (side * 0.06, y + 0.04, z + height), radius=0.012))
    parts.append(lpm.box("pantograph head", (0.5, 0.05, 0.03), at=(0, y + 0.04, z + height), color=P[color]))
    return parts


def bus_body(P, length, width, body, *, height=1.0, zb=0.3, lower=None, lower_h=0.4, roof=None, rows=((0.5, 0.82),), window_count=6,
             glass="glass", wheel_r=0.3, axles=(-1.3, 1.1), cab=True, tail=True, door_y=(), win_y=None, bevel=0.07, front_rows=True):
    """Boxy bus section centred on y = 0, front at -Y. `rows` are (low, high) window heights relative to the floor."""
    hl, half = length / 2, width / 2
    zt = zb + height
    outline = [(-hl, zb), (hl, zb), (hl, zt), (-hl, zt)]
    main = kit.side_profile("bus body", outline, width, P[body], bevel=bevel)
    if roof:
        lpm.paint(main, P[roof], where=lambda c, n, i: n.z > 0.5)
    parts = [main]
    if lower:
        parts += kit.panel("lower band", P, lower, -hl + 0.12, hl - 0.12, zb, zb + lower_h, half, round_edges=0.01)
    y0, y1 = win_y or (-hl + (0.62 if cab else 0.25), hl - 0.25)
    step = (y1 - y0) / window_count
    arch_top = wheel_r * 2.22 + 0.03
    for lo, hi in rows:
        for side in (-1, 1):
            for i in range(window_count):
                y = y0 + step * (i + 0.5)
                if side == 1 and any(abs(y - dy) < 0.5 for dy in door_y):
                    continue
                if zb + lo * height < arch_top and any(abs(y - a) < wheel_r * 1.22 + step * 0.4 + 0.02 for a in axles):
                    continue
                parts.append(lpm.box("window", (0.03, step * 0.8, (hi - lo) * height), at=(side * (half + 0.004), y, zb + lo * height), color=P[glass]))
        if cab and front_rows:
            parts.append(lpm.box("front window", (width * 0.8, 0.03, (hi - lo) * height), at=(0, -hl - 0.005, zb + lo * height), color=P[glass]))
        if tail:
            parts.append(lpm.box("rear window", (width * 0.7, 0.03, (hi - lo) * height * 0.9), at=(0, hl + 0.005, zb + lo * height), color=P[glass]))
    door_top = rows[0][1] * height
    for y in door_y:
        assert all(abs(y - a) >= wheel_r * 1.22 + 0.33 for a in axles), f"door at y={y} overlaps a wheel"
        parts.append(lpm.box("door frame", (0.04, 0.62, door_top - 0.04), at=(half + 0.006, y, zb + 0.08), color=P["trim"]))
        parts.append(lpm.box("door glass", (0.05, 0.5, door_top - 0.2), at=(half + 0.012, y, zb + 0.14), color=P[glass]))
    if cab:
        parts += [
            lpm.box("front bumper", (width + 0.02, 0.1, 0.14), at=(0, -hl - 0.03, zb - 0.04), color=P["dark"]),
            *kit.headlights(P, -hl, half - 0.28, zb + 0.1, span=0.3, height=0.12),
            kit.licence_plate(P, -hl - 0.06, zb + 0.02, width=0.36),
            *kit.mirror_pair("mirror", P, half + 0.05, -hl + 0.3, zb + height * 0.55, "dark"),
        ]
    if tail:
        parts += [lpm.box("rear bumper", (width + 0.02, 0.1, 0.14), at=(0, hl + 0.03, zb - 0.04), color=P["dark"]), *kit.taillights(P, hl, half - 0.2, zb + 0.14)]
    parts += kit.wheel_set(P, half, axles, wheel_r, 0.2)
    return parts


def shorten(parts, start, end, by):
    """Shorten a model by `by` metres between y = start and y = end: the bow side and the stern side keep their exact shape and
    move closer together, long parts are squeezed across the waist, small parts are moved without being squashed."""
    new_start, new_end = start + by / 2, end - by / 2

    def remap(y):
        if y <= start:
            return y + by / 2
        if y >= end:
            return y - by / 2
        return new_start + (y - start) * (new_end - new_start) / (end - start)

    for part in parts:
        me = part.data
        ys = [v.co.y for v in me.vertices]
        if not ys:
            continue
        if max(ys) - min(ys) < 1.0:
            centre = (max(ys) + min(ys)) / 2
            lpm.move(part, 0, remap(centre) - centre, 0)
            continue
        for v in me.vertices:
            v.co.y = remap(v.co.y)
        me.update()
    return parts


FILLET = 0.014
PLAIN_PARTS = ("carbody", "pillar", "truck", "wheel", "lamp", "equipment", "underframe", "axle", "roof vent", "roof unit", "number plate", "buffer", "louver", "flag", "eye", "arch", "strut", "yard band", "sail", "door frame", "door", "front window", "rear window", "lower band", "mirror", "coupler", "windscreen", "end window", "axle", "wheel hub", "pantograph", "window", "porthole", "rail", "mast", "seam", "bone", "skull")


def strut(P, color, base, top, radius=0.02, sides=6):
    """Round bar from `base` to `top` (each (x, y, z))."""
    from mathutils import Matrix, Vector
    delta = Vector(top) - Vector(base)
    bar = lpm.prism("strut", sides, radius, delta.length, color=P[color])
    bar.data.transform(Matrix.Translation(Vector(base)) @ delta.to_track_quat("Z", "Y").to_matrix().to_4x4())
    return bar


def side_shape(P, color, points, width, x=0.0, name="side shape"):
    """Flat shape given as (y, z) points, extruded across the width."""
    return kit.side_profile(name, points, width, P[color], at_x=x)


def build(name, parts, extra_colors, out, budget, fillet=FILLET):
    if fillet:
        for part in parts:
            if part.name.startswith(PLAIN_PARTS):
                continue
            kit.fillet(part, fillet, segments=1)
    return kit.build(name, parts, extra_colors, out, budget)
