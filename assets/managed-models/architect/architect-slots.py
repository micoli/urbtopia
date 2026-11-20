"""Wall slots of the architect studio: window, door, bay, balcony and balcony door, in the `classic` variant. One slot is 1 tile wide, 1 floor
high, with a wall 0.1 thick. Origin on the floor, centred on the slot, the outer wall plane at y = 0 (front is -Y). The wall around
the opening stays in the studio so that it follows the facade colour. Trim, glass and door colours are those of the urbtopia buildings.
Each type can get more variants later: `<type>-<variant>`."""
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
TRIM, GLASS, DARK, ACCENT, SLAB = (NAMES.index(n) for n in ("utrim", "glass_blue", "udark", "uroof", "uslab"))

STAND = 0.035  # how far a frame stands out of the wall
WINDOW_BOTTOM, WINDOW_HEIGHT, WINDOW_WIDTH = 0.35, 0.4, 0.6
DOOR_HEIGHT, DOOR_WIDTH = 0.75, 0.6
FRENCH_HEIGHT = 0.8
BAY_BOTTOM, BAY_HEIGHT, BAY_WIDTH = 0.15, 0.7, 0.8


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


palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in ENTRIES])
MODELS = {"window-classic": window, "door-classic": door, "bay-classic": bay, "balcony-classic": balcony, "balcony-door-classic": balcony_door}
model_lib.export_all(MODELS, palette, 400, os.path.dirname(os.path.abspath(__file__)), ground=False, center=False)
