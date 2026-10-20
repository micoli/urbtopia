"""Faceted vehicle bodies lofted along Y (chamfered roofs, shaped noses, colour bands) and the details that go on them:
bogies, spoked wheels, doors, window pillars, pantographs. x is the width, y the length (front at -Y), z up."""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

PASSENGER = [(0.93, 0.0), (1.0, 0.05), (1.0, 0.8), (0.86, 0.95), (0.55, 1.0), (0.0, 1.0)]
ROUNDED = [(0.9, 0.0), (1.0, 0.08), (1.0, 0.62), (0.95, 0.82), (0.8, 0.93), (0.5, 1.0), (0.0, 1.0)]
ELECTRIC = [(0.93, 0.0), (1.0, 0.05), (1.0, 0.78), (0.9, 0.9), (0.66, 0.98), (0.38, 1.0), (0.0, 1.0)]
FLAT_ROOF = [(0.95, 0.0), (1.0, 0.04), (1.0, 0.92), (0.94, 1.0), (0.0, 1.0)]


def _smooth(t):
    return t * t * (3 - 2 * t)


def _nose_stations(length, spec, front):
    if not spec:
        return []
    steps = spec.get("steps", 4)
    out = []
    for i in range(steps + 1):
        t = i / steps
        tip = spec.get("tip", 0.6)
        k = (1 - t) ** spec.get("power", 1.5)
        y = -length / 2 + spec["length"] * t if front else length / 2 - spec["length"] * t
        out.append((y, tip + (1 - tip) * _smooth(t), spec["drop"] * k, spec.get("rise", 0.0) * k, t))
    return out if front else out[::-1]


def loft_body(P, name, length, width, z0, height, color_fn, *, profile=PASSENGER, breaks=(), front=None, rear=None, cap="body", cuts=()):
    """Body lofted from rounded-rectangle-like sections. `front` / `rear` = dict(length, drop, tip, rise, steps, power) shape the nose
    (tip = width kept at the very end, drop = how far the roof falls, rise = how far the floor rises).
    color_fn(x_fraction, z_fraction, nose_t, y) -> palette name, evaluated at the centre of each strip of faces."""
    hw = width / 2
    section = []
    for a, b in zip(profile, profile[1:]):
        section.append(a)
        if a[0] >= 0.999 and b[0] >= 0.999:
            section += [(1.0, z) for z in sorted(breaks) if a[1] < z < b[1]]
    section.append(profile[-1])
    ring = section + [(-x, z) for x, z in reversed(section[:-1])]
    count = len(ring)
    stations = _nose_stations(length, front, True)
    stations += [(-length / 2, 1, 0, 0, 1)] if not front else []
    stations += [(length / 2, 1, 0, 0, 1)] if not rear else []
    stations += _nose_stations(length, rear, False)
    body_start = -length / 2 + (front["length"] if front else 0.0)
    body_end = length / 2 - (rear["length"] if rear else 0.0)
    stations += [(y, 1, 0, 0, 1) for y in cuts if body_start + 0.01 < y < body_end - 0.01]
    stations.sort(key=lambda st: st[0])
    verts, faces, colours = [], [], []
    for y, wf, drop, rise, _ in stations:
        zb, zt = z0 + rise, z0 + height - drop
        verts += [(xf * hw * wf, y, zb + zf * (zt - zb)) for xf, zf in ring]
    for k in range(len(stations) - 1):
        t = (stations[k][4] + stations[k + 1][4]) / 2
        y_mid = (stations[k][0] + stations[k + 1][0]) / 2
        for j in range(count):
            j2 = (j + 1) % count
            a, b = k * count + j, k * count + j2
            faces.append((a, b, b + count, a + count))
            colours.append(color_fn((ring[j][0] + ring[j2][0]) / 2, (ring[j][1] + ring[j2][1]) / 2, t, y_mid))
    last = (len(stations) - 1) * count
    faces += [tuple(reversed(range(count))), tuple(range(last, last + count))]
    colours += [cap, cap]
    ob = lpm._object(name, lpm._bm_from(verts, faces), 0)
    attr = ob.data.attributes["lpm_color"]
    for i, colour in enumerate(colours):
        attr.data[i].value = P[colour]
    return ob


def banded(P, bands, default, roof=None, glass=None, windscreen=None, ends=None, end_length=0.0, length=0.0, roof_width=1.0,
           door_zones=(), door_replace=(), door_fill=None, door_zf=(0.0, 1.0), door_side=0):
    """Colour function: `bands` = [(z_fraction_below, colour)], roof colour on the chamfer and top, windscreen on the sloped nose roof."""
    def base(xf, zf, t, y):
        if ends and end_length and abs(y) > length / 2 - end_length:
            return ends
        if windscreen and t < 0.999 and zf > 0.9 and abs(xf) < 0.62:
            return windscreen
        if roof and zf > 0.9 and abs(xf) < roof_width:
            return roof
        for limit, colour in bands:
            if zf < limit:
                return colour
        return default

    def pick(xf, zf, t, y):
        colour = base(xf, zf, t, y)
        if colour in door_replace and door_zf[0] <= zf <= door_zf[1] and (door_side == 0 or xf * door_side > 0):
            if any(y0 < y < y1 for y0, y1 in door_zones):
                return door_fill or default
        return colour
    return pick


def ring_part(P, colour, r_out, r_in, width, sides=12, name="ring"):
    verts, faces = [], []
    for z in (0.0, width):
        for r in (r_out, r_in):
            verts += [(r * math.cos(2 * math.pi * i / sides), r * math.sin(2 * math.pi * i / sides), z) for i in range(sides)]
    s = sides
    for i in range(s):
        j = (i + 1) % s
        faces += [(i, j, 2 * s + j, 2 * s + i), (s + i, 3 * s + i, 3 * s + j, s + j), (2 * s + i, 2 * s + j, 3 * s + j, 3 * s + i), (i, s + i, s + j, j)]
    return lpm._object(name, lpm._bm_from(verts, faces), P[colour])


def _across(parts, x, y, z, width, outward):
    for part in parts:
        lpm.rotate(part, 90 * outward, "Y")
        lpm.move(part, x - outward * width / 2, y, z)
    return parts


def spoked_wheel(P, x, y, r, width=0.08, rim="loco_red", tire="coal", hub="coal", spokes=3, sides=14):
    outward = 1 if x > 0 else -1
    parts = [
        ring_part(P, tire, r, r * 0.88, width * 0.9, sides, "wheel tire"),
        ring_part(P, rim, r * 0.88, r * 0.72, width, sides, "wheel rim"),
        lpm.prism("wheel hub", 8, r * 0.2, width * 1.5, color=P[hub]),
    ]
    for k in range(spokes):
        spoke = lpm.box("wheel spoke", (0.025, r * 1.5, width * 0.5), at=(0, 0, width * 0.25), color=P[rim])
        parts.append(lpm.rotate(spoke, 180 * k / spokes, "Z"))
    return _across(parts, x, y, r, width, outward)


def solid_wheel(P, x, y, r, width=0.09, tire="tire", rim="hub", sides=14):
    outward = 1 if x > 0 else -1
    parts = [
        lpm.prism("wheel tire", sides, r, width, color=P[tire]),
        lpm.move(lpm.prism("wheel rim", sides, r * 0.6, 0.02, color=P[rim]), 0, 0, width - 0.005),
        lpm.move(lpm.prism("wheel hub", 8, r * 0.26, 0.04, color=P["hub_dark"]), 0, 0, width + 0.008),
    ]
    return _across(parts, x, y, r, width, outward)


def truck(P, y, track=0.5, r=0.16, spacing=0.42, frame="dark", sides=14, axles=2):
    """Bogie with `axles` axles: side frames, cross beams, axle boxes, springs and detailed wheels."""
    parts = []
    offsets = [(i - (axles - 1) / 2) * spacing for i in range(axles)]
    length = spacing * (axles - 1) + 0.5
    for side in (-1, 1):
        parts.append(lpm.box("truck side", (0.06, length, 0.08), at=(side * (track - 0.17), y, r * 1.15), color=P[frame]))
        parts.append(lpm.box("truck spring", (0.05, 0.16, 0.06), at=(side * (track - 0.17), y, r * 1.15 + 0.08), color=P["hub_dark"]))
        for dy in offsets:
            parts.append(lpm.box("axle box", (0.08, 0.12, 0.13), at=(side * (track - 0.1), y + dy, r * 0.9), color=P[frame]))
            parts += solid_wheel(P, side * track, y + dy, r, 0.09, sides=sides)
    for dy in offsets:
        parts.append(lpm.box("axle", (track * 2 - 0.12, 0.045, 0.045), at=(0, y + dy, r - 0.022), color=P[frame]))
    parts.append(lpm.box("truck beam", (track * 2 - 0.3, 0.1, 0.07), at=(0, y, r * 1.15), color=P[frame]))
    parts.append(lpm.box("truck bolster", (0.3, 0.3, 0.06), at=(0, y, r * 1.15 + 0.07), color=P["hub_dark"]))
    return parts


def underbody(P, length, hw, z, color="dark", dark2="hub_dark", spans=((-0.5, 0.3), (0.55, 0.28)), y_shift=0.0):
    """Boxes slung under the floor between the bogies."""
    parts = [lpm.box("underframe", (hw * 2 - 0.16, length - 0.4, 0.06), at=(0, y_shift, z - 0.05), color=P[color])]
    for y, size in spans:
        parts.append(lpm.box("equipment", (hw * 1.2, size, 0.16), at=(0, y, z - 0.2), color=P[dark2]))
    return parts


def window_pillars(P, colour, y0, y1, count, z_lo, z_hi, hw, width=0.05, out=0.012, skip=(), sides=(-1, 1)):
    """Thin uprights between windows; `skip` lists (y0, y1) zones (doors) that get none."""
    step = (y1 - y0) / count
    return [lpm.box("pillar", (out * 2, width, z_hi - z_lo), at=(side * hw, y0 + step * i, z_lo), color=P[colour])
            for side in sides for i in range(count + 1) if not any(a < y0 + step * i < b for a, b in skip)]


def zone_cuts(zones):
    """Loft stations needed so colour zones start and end exactly at their limits."""
    return sorted({y for zone in zones for y in zone if abs(y) < 50})


def window_frames(P, frame, glass, y0, y1, count, z_lo, z_hi, hw, gap=0.34, sides=(-1, 1), inset=0.012):
    """Individual windows with a visible frame."""
    step = (y1 - y0) / count
    width = step * (1 - gap)
    parts = []
    for side in sides:
        for i in range(count):
            y = y0 + step * (i + 0.5)
            parts.append(lpm.box("window frame", (0.03, width + 0.05, z_hi - z_lo + 0.05), at=(side * (hw + 0.004), y, z_lo - 0.025), color=P[frame]))
            parts.append(lpm.box("window glass", (0.036, width, z_hi - z_lo), at=(side * (hw + 0.006), y, z_lo), color=P[glass]))
    return parts


def sliding_door(P, y, z_lo, z_hi, hw, frame="dark", glass="glass", width=0.66, sides=(-1, 1)):
    parts = []
    for side in sides:
        x = side * (hw + 0.008)
        parts.append(lpm.box("door frame", (0.03, width, z_hi - z_lo), at=(x, y, z_lo), color=P[frame]))
        for dy in (-1, 1):
            parts.append(lpm.box("door glass", (0.036, width * 0.38, (z_hi - z_lo) * 0.52), at=(x + side * 0.003, y + dy * width * 0.23, z_lo + (z_hi - z_lo) * 0.34), color=P[glass]))
        parts.append(lpm.box("door seam", (0.038, 0.012, z_hi - z_lo - 0.04), at=(x + side * 0.003, y, z_lo + 0.02), color=P["black"]))
        parts.append(tk.strut(P, "chrome", (x + side * 0.02, y - width * 0.46, z_lo + 0.1), (x + side * 0.02, y - width * 0.46, z_hi - 0.08), radius=0.01))
    return parts


def pantograph(P, y, z, spread=0.3, height=0.42, colour="dark"):
    """Frame pantograph: two lower and two upper arms, collector head with two strips."""
    parts = [lpm.box("pantograph insulator", (0.06, 0.06, 0.05), at=(side * 0.14, y, z), color=P["hub"]) for side in (-1, 1)]
    knee = (0.1, y + spread * 0.5, z + height * 0.55)
    for side in (-1, 1):
        base = (side * 0.14, y, z + 0.05)
        knuckle = (side * 0.1, y + spread * 0.5, z + height * 0.55)
        head = (side * 0.2, y - spread * 0.3, z + height)
        parts.append(tk.strut(P, colour, base, knuckle, radius=0.012))
        parts.append(tk.strut(P, colour, knuckle, head, radius=0.012))
    parts.append(lpm.box("pantograph head", (0.52, 0.04, 0.03), at=(0, y - spread * 0.3, z + height), color=P[colour]))
    parts.append(lpm.box("pantograph strip", (0.5, 0.025, 0.025), at=(0, y - spread * 0.3 - 0.07, z + height + 0.02), color=P["hub"]))
    parts.append(lpm.box("pantograph strip", (0.5, 0.025, 0.025), at=(0, y - spread * 0.3 + 0.07, z + height + 0.02), color=P["hub"]))
    parts.append(lpm.box("pantograph tie", (0.2, 0.03, 0.03), at=(0, y + spread * 0.5, z + height * 0.55), color=P[colour]))
    del knee
    return parts


def roof_unit(P, y, z, width=0.6, length=0.7, colour="grey", vents=3):
    parts = [lpm.box("roof unit", (width, length, 0.1), at=(0, y, z), color=P[colour], taper=(0.88, 0.92))]
    for i in range(vents):
        parts.append(lpm.box("roof vent", (width * 0.7, 0.03, 0.025), at=(0, y - length * 0.3 + i * length * 0.3, z + 0.1), color=P["hub_dark"]))
    return parts


def round_lamp(P, x, y, z, radius=0.05, colour="headlight", depth=0.04, facing=-1):
    lamp = lpm.prism("lamp", 8, radius, depth, color=P[colour], rotate=22.5)
    lpm.rotate(lamp, -90 * facing, "X")
    return lpm.move(lamp, x, y, z)


def bus_wheels(P, hw, axles, r=0.28, width=0.22, arch_scale=1.16):
    """Wheels that stand slightly proud of the flank, with a dark arch disc just behind each of them."""
    parts = []
    for side in (-1, 1):
        for y in axles:
            parts += solid_wheel(P, side * (hw - 0.07), y, r, width, sides=14)
            arch = lpm.prism("wheel arch", 14, r * arch_scale, 0.025, color=P["black"], rotate=12)
            lpm.rotate(arch, 90 * side, "Y")
            parts.append(lpm.move(arch, side * (hw - 0.012), y, r))
    return parts


def side_mirror(P, side, y, z, hw, colour="black"):
    return [
        tk.strut(P, "hub_dark", (side * hw, y + 0.02, z), (side * (hw + 0.22), y - 0.04, z + 0.05), radius=0.012),
        lpm.box("mirror", (0.05, 0.14, 0.24), at=(side * (hw + 0.24), y - 0.06, z - 0.1), color=P[colour]),
    ]


def front_face(P, z0, hw, y, lamp_z, bumper="black", lamp="headlight", signal="signal"):
    """Bumper, round headlamps with turn signals and a number plate on a flat front at y."""
    parts = [lpm.box("bumper", (hw * 2 * 0.98, 0.1, 0.14), at=(0, y - 0.04, z0 - 0.06), color=P[bumper])]
    for side in (-1, 1):
        parts.append(round_lamp(P, side * (hw - 0.3), y - 0.005, lamp_z, radius=0.07, colour=lamp, facing=-1))
        parts.append(lpm.box("lamp signal", (0.12, 0.03, 0.06), at=(side * (hw - 0.12), y - 0.005, lamp_z - 0.03), color=P[signal]))
    parts.append(lpm.box("number plate", (0.34, 0.03, 0.12), at=(0, y - 0.02, z0 + 0.02), color=P["plate"]))
    return parts


def rear_face(P, z0, hw, y, lamp_z, bumper="black"):
    parts = [lpm.box("bumper", (hw * 2 * 0.98, 0.1, 0.14), at=(0, y + 0.04, z0 - 0.06), color=P[bumper])]
    for side in (-1, 1):
        parts.append(lpm.box("lamp rear", (0.2, 0.03, 0.1), at=(side * (hw - 0.2), y + 0.005, lamp_z), color=P["taillight"]))
    parts.append(lpm.box("number plate", (0.34, 0.03, 0.12), at=(0, y + 0.02, z0 + 0.02), color=P["plate"]))
    return parts
