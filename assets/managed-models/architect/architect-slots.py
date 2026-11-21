"""Wall slots of the architect studio: window, door, bay, balcony and balcony door, in the `classic` variant. One slot is 1 tile wide, 1 floor
high, with a wall 0.1 thick. Origin on the floor, centred on the slot, the outer wall plane at y = 0 (front is -Y). The wall around
the opening stays in the studio so that it follows the facade colour. Trim, glass and door colours are those of the urbtopia buildings.
Each type can get more variants later: `<type>-<variant>`."""
import math
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
sys.path.insert(0, os.path.join(REPO, "assets/managed-models"))
import building_lib  # noqa: E402
import lpm  # noqa: E402
import model_lib  # noqa: E402

ENTRIES = building_lib.PALETTE_ENTRIES + building_lib.URBTOPIA_ENTRIES
NAMES = [name for name, _ in ENTRIES]
TRIM, GLASS, DARK, ACCENT, SLAB, WHITE, BUSH, WOOD, SAND = (NAMES.index(n) for n in ("utrim", "glass_blue", "udark", "uroof", "uslab", "uwall", "bush", "uwood", "usand"))

STAND = 0.035  # how far a frame stands out of the wall
WINDOW_BOTTOM, WINDOW_HEIGHT, WINDOW_WIDTH = 0.35, 0.4, 0.6
DOOR_HEIGHT, DOOR_WIDTH = 0.75, 0.6
FRENCH_HEIGHT = 0.8
BAY_BOTTOM, BAY_HEIGHT, BAY_WIDTH = 0.15, 0.7, 0.8
ARCHED_BOTTOM, ARCHED_HEIGHT, ARCHED_WIDTH = 0.3, 0.5, 0.5  # the opening of OPENINGS.windowArched in src/architect/slotOpenings.ts
ARC_SEGMENTS = 10
SHUTTERED_WIDTH = 0.4  # the openings of OPENINGS in src/architect/slotOpenings.ts
ROUND_BOTTOM, ROUND_SIZE = 0.4, 0.4
ARCHED_DOOR_HEIGHT = 0.8
DOUBLE_WIDTH, DOUBLE_HEIGHT = 0.7, 0.78
GARAGE_WIDTH, GARAGE_HEIGHT = 0.7, 0.6


def surround(parts, name, width, bottom, height, out, inside, closed_bottom):
    """Frame around an opening: two sides, a top, and a bottom unless the opening starts on the floor."""
    bar = out + inside
    depth = STAND + 0.01
    y = -STAND / 2 + 0.005
    centre = width / 2 + out / 2 - inside / 2
    low = bottom - (out if closed_bottom else 0)
    for side, sign in (("left", -1), ("right", 1)):
        parts.append(lpm.box(f"{name}_{side}", (bar, depth, bottom + height + out - low), at=(sign * centre, y, low), color=TRIM))
    parts.append(lpm.box(f"{name}_top", (width + 2 * out, depth, bar), at=(0, y, bottom + height - inside), color=TRIM))
    if closed_bottom:
        parts.append(lpm.box(f"{name}_bottom", (width + 2 * out, depth, bar), at=(0, y, bottom - out), color=TRIM))


def window_parts(prefix=""):
    parts = [lpm.box(f"{prefix}glass", (WINDOW_WIDTH, 0.012, WINDOW_HEIGHT), at=(0, 0.03, WINDOW_BOTTOM), color=GLASS)]
    surround(parts, f"{prefix}frame", WINDOW_WIDTH, WINDOW_BOTTOM, WINDOW_HEIGHT, 0.05, 0.02, True)
    parts.append(lpm.box(f"{prefix}mullion", (0.016, 0.02, WINDOW_HEIGHT), at=(0, 0.02, WINDOW_BOTTOM), color=TRIM))
    return parts


def arch_outline(width, bottom, height, grow, segments=ARC_SEGMENTS, floor=None):
    """Outline (x, z) of an opening with a round top, grown by `grow` all around: the arch stays concentric.
    `floor`: the height of the two feet, for a door that has no bottom bar."""
    half = width / 2 + grow
    spring = bottom + height - width / 2
    arc = [(half * math.cos(math.pi * (1 - k / segments)), spring + half * math.sin(math.pi * (1 - k / segments))) for k in range(segments + 1)]
    foot = bottom - grow if floor is None else floor
    return [(-half, foot)] + arc + [(half, foot)]


def circle_outline(centre, radius, segments=16):
    return [(radius * math.cos(2 * math.pi * k / segments), centre + radius * math.sin(2 * math.pi * k / segments)) for k in range(segments)]


def ring(name, outer, inner, front, back, color, closed=True):
    """A frame between two outlines of as many points, from y = front (outside) to y = back (inside). Open: a U with no bottom bar."""
    count = len(outer)
    verts = [(x, front, z) for x, z in outer] + [(x, front, z) for x, z in inner] + [(x, back, z) for x, z in outer] + [(x, back, z) for x, z in inner]
    of, inf, ob, ib = 0, count, 2 * count, 3 * count
    faces = []
    for i in range(count if closed else count - 1):
        j = (i + 1) % count
        faces += [(of + i, of + j, inf + j, inf + i), (ob + j, ob + i, ib + i, ib + j), (of + j, of + i, ob + i, ob + j), (inf + i, inf + j, ib + j, ib + i)]
    if not closed:
        faces += [(of, inf, ib, ob), (inf + count - 1, of + count - 1, ob + count - 1, ib + count - 1)]
    return lpm._object(name, lpm._bm_from(verts, faces), color)


def window_arched(_rng):
    """Round-headed window: a frame that follows the arch, a keystone, a mullion and a sill."""
    width, bottom, height = ARCHED_WIDTH, ARCHED_BOTTOM, ARCHED_HEIGHT
    parts = [lpm.sweep("glass", arch_outline(width, bottom, height, 0), 0.012, at=(0, 0.03, 0), color=GLASS)]
    parts.append(ring("frame", arch_outline(width, bottom, height, 0.05), arch_outline(width, bottom, height, -0.02), -STAND, 0.005, TRIM))
    spring = bottom + height - width / 2
    parts.append(lpm.box("mullion", (0.016, 0.02, height - width / 2 + 0.02), at=(0, 0.02, bottom), color=TRIM))
    parts.append(lpm.box("transom", (width, 0.02, 0.016), at=(0, 0.02, spring - 0.008), color=TRIM))
    parts.append(lpm.box("keystone", (0.08, STAND + 0.02, 0.09), at=(0, -STAND / 2 - 0.005, bottom + height + 0.02), color=TRIM))
    parts.append(lpm.box("sill", (width + 0.14, 0.06, 0.025), at=(0, -0.03, bottom - 0.075), color=TRIM))
    return parts


def window(_rng):
    return window_parts()


def door(_rng):
    parts = [lpm.box("leaf", (DOOR_WIDTH, 0.04, DOOR_HEIGHT), at=(0, 0.03, 0), color=DARK)]
    surround(parts, "frame", DOOR_WIDTH, 0.0, DOOR_HEIGHT, 0.05, 0.02, False)
    for number, z in enumerate((0.08, 0.42)):
        parts.append(lpm.box(f"panel_{number}", (DOOR_WIDTH - 0.2, 0.012, 0.28), at=(0, 0.004, z), color=DARK))
    parts.append(lpm.box("step", (DOOR_WIDTH + 0.2, 0.2, 0.05), at=(0, -0.1, 0), color=TRIM))
    parts.append(lpm.box("handle", (0.04, 0.04, 0.1), at=(0.22, 0.0, 0.36), color=ACCENT))
    return parts


def bay(_rng):
    """Large glazed opening with three panes."""
    parts = [lpm.box("glass", (BAY_WIDTH, 0.012, BAY_HEIGHT), at=(0, 0.03, BAY_BOTTOM), color=GLASS)]
    surround(parts, "frame", BAY_WIDTH, BAY_BOTTOM, BAY_HEIGHT, 0.04, 0.02, True)
    for number, x in enumerate((-BAY_WIDTH / 6, BAY_WIDTH / 6)):
        parts.append(lpm.box(f"mullion_{number}", (0.016, 0.02, BAY_HEIGHT), at=(x, 0.02, BAY_BOTTOM), color=TRIM))
    parts.append(lpm.box("sill", (BAY_WIDTH + 0.1, 0.06, 0.025), at=(0, -0.03, BAY_BOTTOM - 0.03), color=TRIM))
    return parts


def balcony_parts():
    """Slab, handrail, posts and balusters in front of the slot."""
    reach, width = 0.5, 1.0
    parts = [lpm.box("slab", (width, reach, 0.06), at=(0, -reach / 2, 0), color=SLAB)]
    rail_height, rail_top = 0.3, 0.06
    parts.append(lpm.box("rail_front", (width, 0.03, 0.03), at=(0, -reach + 0.015, rail_top + rail_height), color=DARK))
    for side, sign in (("left", -1), ("right", 1)):
        parts.append(lpm.box(f"rail_{side}", (0.03, reach, 0.03), at=(sign * (width / 2 - 0.015), -reach / 2, rail_top + rail_height), color=DARK))
        parts.append(lpm.box(f"post_{side}", (0.04, 0.04, rail_height), at=(sign * (width / 2 - 0.02), -reach + 0.02, rail_top), color=DARK))
    for number in range(7):
        x = -width / 2 + 0.12 + number * (width - 0.24) / 6
        parts.append(lpm.box(f"baluster_{number}", (0.015, 0.015, rail_height), at=(x, -reach + 0.015, rail_top), color=DARK))
    return parts


def balcony(_rng):
    """The window and a balcony in front of it."""
    return window_parts() + balcony_parts()


def balcony_door(_rng):
    """Two glazed leaves down to the floor, opening onto the balcony."""
    parts = [lpm.box("glass", (DOOR_WIDTH, 0.012, FRENCH_HEIGHT), at=(0, 0.03, 0), color=GLASS)]
    surround(parts, "frame", DOOR_WIDTH, 0.0, FRENCH_HEIGHT, 0.05, 0.02, False)
    parts.append(lpm.box("mullion", (0.02, 0.025, FRENCH_HEIGHT), at=(0, 0.02, 0), color=TRIM))
    parts.append(lpm.box("transom", (DOOR_WIDTH, 0.02, 0.016), at=(0, 0.02, 0.5), color=TRIM))
    parts.append(lpm.box("handle_left", (0.02, 0.03, 0.1), at=(-0.05, 0.0, 0.36), color=ACCENT))
    parts.append(lpm.box("handle_right", (0.02, 0.03, 0.1), at=(0.05, 0.0, 0.36), color=ACCENT))
    return parts + balcony_parts()


def window_shutters(_rng):
    """A window with a louvred shutter on each side."""
    width = SHUTTERED_WIDTH
    parts = [lpm.box("glass", (width, 0.012, WINDOW_HEIGHT), at=(0, 0.03, WINDOW_BOTTOM), color=GLASS)]
    surround(parts, "frame", width, WINDOW_BOTTOM, WINDOW_HEIGHT, 0.03, 0.02, True)
    parts.append(lpm.box("mullion", (0.016, 0.02, WINDOW_HEIGHT), at=(0, 0.02, WINDOW_BOTTOM), color=TRIM))
    parts.append(lpm.box("sill", (width + 0.1, 0.05, 0.025), at=(0, -0.025, WINDOW_BOTTOM - 0.055), color=TRIM))
    shutter_height = WINDOW_HEIGHT + 0.04
    for side, sign in (("left", -1), ("right", 1)):
        x = sign * (width / 2 + 0.03 + 0.005 + 0.05)
        parts.append(lpm.box(f"shutter_{side}", (0.1, 0.02, shutter_height), at=(x, -0.01, WINDOW_BOTTOM - 0.02), color=ACCENT))
        for number in range(6):
            z = WINDOW_BOTTOM - 0.02 + 0.03 + number * (shutter_height - 0.06) / 5.0 - 0.01
            parts.append(lpm.box(f"slat_{side}_{number}", (0.08, 0.012, 0.014), at=(x, -0.02, z), color=DARK))
    return parts


def window_round(_rng):
    """A porthole: a round frame with a cross."""
    centre = ROUND_BOTTOM + ROUND_SIZE / 2
    radius = ROUND_SIZE / 2
    parts = [lpm.sweep("glass", circle_outline(centre, radius), 0.012, at=(0, 0.03, 0), color=GLASS)]
    parts.append(ring("frame", circle_outline(centre, radius + 0.05), circle_outline(centre, radius - 0.02), -STAND, 0.005, TRIM))
    parts.append(lpm.box("mullion_up", (0.016, 0.02, ROUND_SIZE), at=(0, 0.02, ROUND_BOTTOM), color=TRIM))
    parts.append(lpm.box("mullion_across", (ROUND_SIZE, 0.02, 0.016), at=(0, 0.02, centre - 0.008), color=TRIM))
    return parts


def door_step(width, parts):
    parts.append(lpm.box("step", (width + 0.2, 0.2, 0.05), at=(0, -0.1, 0), color=TRIM))


def door_arched(_rng):
    """A round-headed door with a raised panel in the arch and a keystone."""
    width, height = DOOR_WIDTH, ARCHED_DOOR_HEIGHT
    parts = [lpm.sweep("leaf", arch_outline(width, 0, height, 0, floor=0), 0.04, at=(0, 0.03, 0), color=DARK)]
    parts.append(ring("frame", arch_outline(width, 0, height, 0.05, floor=0), arch_outline(width, 0, height, -0.02, floor=0), -STAND, 0.005, TRIM, closed=False))
    parts.append(lpm.box("panel_low", (width - 0.2, 0.012, 0.28), at=(0, 0.004, 0.08), color=DARK))
    parts.append(lpm.sweep("panel_arch", arch_outline(width - 0.2, 0.42, 0.34, 0, floor=None), 0.012, at=(0, 0.004, 0), color=DARK))
    parts.append(lpm.box("keystone", (0.08, STAND + 0.02, 0.09), at=(0, -STAND / 2 - 0.005, height + 0.02), color=TRIM))
    parts.append(lpm.box("handle", (0.04, 0.04, 0.1), at=(0.22, 0.0, 0.36), color=ACCENT))
    door_step(width, parts)
    return parts


def door_double(_rng):
    """Two leaves with two panels each, a handle on each."""
    width, height = DOUBLE_WIDTH, DOUBLE_HEIGHT
    parts = []
    surround(parts, "frame", width, 0.0, height, 0.05, 0.02, False)
    for side, sign in (("left", -1), ("right", 1)):
        x = sign * (width / 4)
        parts.append(lpm.box(f"leaf_{side}", (width / 2 - 0.005, 0.04, height), at=(x, 0.03, 0), color=DARK))
        for number, z in enumerate((0.08, 0.44)):
            panel_height = 0.3 if number == 0 else 0.26
            parts.append(lpm.box(f"panel_{side}_{number}", (width / 2 - 0.1, 0.012, panel_height), at=(x, 0.004, z), color=DARK))
        parts.append(lpm.box(f"handle_{side}", (0.03, 0.04, 0.1), at=(-sign * 0.05, 0.0, 0.36), color=ACCENT))
    parts.append(lpm.box("mullion", (0.02, 0.05, height), at=(0, 0.015, 0), color=TRIM))
    door_step(width, parts)
    return parts


def door_glazed(_rng):
    """A door with a glazed upper half, split in four by bars."""
    width, height = DOOR_WIDTH, DOOR_HEIGHT
    parts = [lpm.box("leaf", (width, 0.04, height), at=(0, 0.03, 0), color=DARK)]
    surround(parts, "frame", width, 0.0, height, 0.05, 0.02, False)
    pane_width, pane_height, pane_bottom = width - 0.2, 0.4, 0.3
    parts.append(lpm.box("glass", (pane_width, 0.012, pane_height), at=(0, 0.004, pane_bottom), color=GLASS))
    for name, size, at in (("bar_top", (pane_width + 0.03, 0.02, 0.02), (0, 0.0, pane_bottom + pane_height)),
                           ("bar_bottom", (pane_width + 0.03, 0.02, 0.02), (0, 0.0, pane_bottom - 0.02)),
                           ("bar_left", (0.02, 0.02, pane_height + 0.02), (-pane_width / 2 - 0.005, 0.0, pane_bottom - 0.01)),
                           ("bar_right", (0.02, 0.02, pane_height + 0.02), (pane_width / 2 + 0.005, 0.0, pane_bottom - 0.01)),
                           ("bar_up", (0.014, 0.02, pane_height), (0, 0.0, pane_bottom)),
                           ("bar_across", (pane_width, 0.02, 0.014), (0, 0.0, pane_bottom + pane_height / 2 - 0.007))):
        parts.append(lpm.box(name, size, at=at, color=TRIM))
    parts.append(lpm.box("panel_low", (width - 0.2, 0.012, 0.2), at=(0, 0.004, 0.06), color=DARK))
    parts.append(lpm.box("handle", (0.04, 0.04, 0.1), at=(0.22, 0.0, 0.36), color=ACCENT))
    door_step(width, parts)
    return parts


def door_garage(_rng):
    """A sectional garage door: four panels, a row of small windows in the top one."""
    width, height = GARAGE_WIDTH, GARAGE_HEIGHT
    parts = [lpm.box("door", (width, 0.04, height), at=(0, 0.03, 0), color=SLAB)]
    surround(parts, "frame", width, 0.0, height, 0.04, 0.02, False)
    for number, z in enumerate((0.15, 0.3, 0.45)):
        parts.append(lpm.box(f"seam_{number}", (width, 0.012, 0.012), at=(0, 0.004, z - 0.006), color=DARK))
    panes = 4
    pane = (width - 0.1) / panes
    for number in range(panes):
        x = -(width - 0.1) / 2 + pane * (number + 0.5)
        parts.append(lpm.box(f"pane_{number}", (pane - 0.02, 0.012, 0.08), at=(x, 0.0, 0.48), color=GLASS))
    parts.append(lpm.box("threshold", (width + 0.1, 0.16, 0.03), at=(0, -0.08, 0), color=TRIM))
    return parts


def strut(x, bottom, reach, rise, color=DARK, size=0.025):
    """A brace from the wall at height `bottom` to a point `reach` in front of it and `rise` higher."""
    length = math.hypot(reach, rise)
    return lpm.rotate(lpm.box(f"strut_{x:.2f}", (size, length, size), at=(x, -length / 2, bottom), color=color), -math.degrees(math.atan2(rise, reach)), "X", about=(x, 0, bottom))


def door_hood(_rng):
    """A small mono-pitch roof over the door, on two braces."""
    top, reach, tilt, width = 0.93, 0.3, 16, 0.84
    pivot = (0, 0, top)
    parts = [lpm.rotate(lpm.box("hood_roof", (width, reach, 0.035), at=(0, -reach / 2, top - 0.035), color=ACCENT), tilt, "X", about=pivot)]
    parts.append(lpm.rotate(lpm.box("hood_edge", (width + 0.02, 0.03, 0.05), at=(0, -reach, top - 0.05), color=TRIM), tilt, "X", about=pivot))
    front_under = top - 0.035 - reach * math.sin(math.radians(tilt))
    for sign in (-1, 1):
        parts.append(strut(sign * (width / 2 - 0.05), front_under - 0.22, reach - 0.04, 0.22))
    return parts


def awning_parts(striped):
    """A canvas awning over an opening: a sloping cloth with a hanging edge, on two thin arms."""
    top, reach, tilt, width = 0.96, 0.32, 28, 0.72
    slices = 7 if striped else 1
    step = width / slices
    drop = reach * math.sin(math.radians(tilt))
    front = reach * math.cos(math.radians(tilt))
    parts = []
    for number in range(slices):
        x = -width / 2 + step * (number + 0.5)
        color = WHITE if striped and number % 2 else ACCENT
        parts.append(lpm.rotate(lpm.box(f"cloth_{number}", (step, reach, 0.012), at=(x, -reach / 2, top - 0.012), color=color), tilt, "X", about=(0, 0, top)))
        parts.append(lpm.box(f"edge_{number}", (step, 0.012, 0.07), at=(x, -front - 0.006, top - 0.012 - drop - 0.06), color=color))
    for sign in (-1, 1):
        parts.append(strut(sign * (width / 2 - 0.02), top - drop - 0.25, front - 0.03, 0.2))
    return parts


def awning(_rng):
    return awning_parts(False)


def awning_striped(_rng):
    return awning_parts(True)


def pilasters(_rng):
    """A flat column with a base and a capital on each side of the slot."""
    parts = []
    for side, sign in (("left", -1), ("right", 1)):
        x = sign * 0.44
        parts.append(lpm.box(f"shaft_{side}", (0.09, 0.03, 0.88), at=(x, -0.015, 0.06), color=WHITE))
        parts.append(lpm.box(f"base_{side}", (0.12, 0.045, 0.06), at=(x, -0.0225, 0.0), color=TRIM))
        parts.append(lpm.box(f"capital_{side}", (0.12, 0.045, 0.06), at=(x, -0.0225, 0.94), color=TRIM))
    return parts


def stone_accents(_rng):
    """Quoins: blocks of two lengths, one over the other, up both sides of the slot."""
    parts = []
    height = 1.0 / 6
    for side, sign in (("left", -1), ("right", 1)):
        for number in range(6):
            long = number % 2 == 0
            width = 0.15 if long else 0.09
            parts.append(lpm.box(f"quoin_{side}_{number}", (width, 0.025, height - 0.012), at=(sign * (0.5 - width / 2), -0.0125, number * height + 0.006), color=SAND if long else SLAB))
    return parts


def portico(_rng):
    """A porch in front of the door: two columns carrying an entablature and a pediment, on a slab."""
    reach, width = 0.34, 0.8
    parts = [lpm.box("floor", (width + 0.06, reach, 0.03), at=(0, -reach / 2, 0.0), color=SLAB)]
    for side, sign in (("left", -1), ("right", 1)):
        parts.append(lpm.prism(f"column_{side}", 8, 0.04, 0.82, at=(sign * (width / 2 - 0.05), -reach + 0.06, 0.03), color=WHITE))
        parts.append(lpm.box(f"base_{side}", (0.1, 0.1, 0.03), at=(sign * (width / 2 - 0.05), -reach + 0.06, 0.03), color=TRIM))
    parts.append(lpm.box("entablature", (width + 0.04, reach, 0.05), at=(0, -reach / 2, 0.85), color=TRIM))
    parts.append(lpm.sweep("pediment", [(-width / 2 - 0.02, 0.0), (width / 2 + 0.02, 0.0), (0, 0.12)], 0.03, at=(0, -reach + 0.015, 0.9), color=ACCENT))
    return parts


def colonnade(_rng):
    """A covered walk in front of the facade: two columns per slot under a continuous entablature."""
    reach = 0.26
    parts = [lpm.box("floor", (1.0, reach, 0.03), at=(0, -reach / 2, 0.0), color=SLAB)]
    for number, x in enumerate((-0.25, 0.25)):
        parts.append(lpm.prism(f"column_{number}", 8, 0.04, 0.84, at=(x, -reach + 0.05, 0.03), color=WHITE))
        parts.append(lpm.box(f"base_{number}", (0.1, 0.1, 0.03), at=(x, -reach + 0.05, 0.03), color=TRIM))
    parts.append(lpm.box("entablature", (1.0, reach, 0.06), at=(0, -reach / 2, 0.87), color=TRIM))
    parts.append(lpm.box("cornice", (1.0, reach + 0.04, 0.025), at=(0, -(reach + 0.04) / 2, 0.93), color=WHITE))
    return parts


def pergola(_rng):
    """A timber frame in front of the facade: four posts, beams and rafters, no roof."""
    reach, height = 0.4, 0.86
    parts = []
    for side, sign in (("left", -1), ("right", 1)):
        x = sign * 0.46
        parts.append(lpm.box(f"post_{side}", (0.05, 0.05, height), at=(x, -reach + 0.025, 0.0), color=WOOD))
        parts.append(lpm.box(f"beam_{side}", (0.05, reach, 0.05), at=(x, -reach / 2, height), color=WOOD))
    parts.append(lpm.box("ledger", (1.0, 0.04, 0.05), at=(0, -0.02, height), color=WOOD))
    parts.append(lpm.box("front_beam", (1.0, 0.05, 0.05), at=(0, -reach + 0.025, height), color=WOOD))
    for number in range(5):
        parts.append(lpm.box(f"rafter_{number}", (0.03, reach + 0.06, 0.03), at=(-0.36 + number * 0.18, -reach / 2 - 0.0, height + 0.05), color=WOOD))
    return parts


def cypresses(_rng):
    """Two slim cypresses in front of the wall."""
    parts = []
    for number, (x, height) in enumerate(((-0.27, 0.86), (0.27, 0.7))):
        parts.append(lpm.prism(f"trunk_{number}", 6, 0.025, 0.1, at=(x, -0.25, 0.0), color=WOOD))
        parts.append(lpm.prism(f"crown_{number}", 8, 0.11, height, at=(x, -0.25, 0.08), color=BUSH, radius_top=0.015))
    return parts


palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in ENTRIES])
MODELS = {"window-classic": window, "window-arched": window_arched, "window-shutters": window_shutters, "window-round": window_round, "door-arched": door_arched, "door-double": door_double, "door-glazed": door_glazed, "door-hood": door_hood, "pilasters": pilasters, "stone-accents": stone_accents, "portico": portico, "colonnade": colonnade, "pergola": pergola, "cypresses": cypresses, "awning": awning, "awning-striped": awning_striped, "door-garage": door_garage, "door-classic": door, "bay-classic": bay, "balcony-classic": balcony, "balcony-door-classic": balcony_door}
model_lib.export_all(MODELS, palette, 400, os.path.dirname(os.path.abspath(__file__)), ground=False, center=False)
