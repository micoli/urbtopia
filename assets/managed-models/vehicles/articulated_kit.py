"""One section of the articulated bus, with half of the bellows, so the two halves meet when placed nose to tail."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import carbody_kit as cb  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

COLORS = [("bus_yellow", "#f2c030"), ("yellow_dark", "#c99a1a"), ("pane", "#1b2a4a"), ("roof_light", "#f7cf4a")]
SECTION, WIDTH, Z0, HEIGHT = 3.2, 1.5, 0.3, 1.08
HW = WIDTH / 2
HALF_BELLOWS = 0.19
BREAKS = (0.07, 0.42, 0.86)
END = dict(length=0.2, drop=0.12, tip=0.92, steps=2, power=1.0)
FLAT = dict(length=0.04, drop=0.0, tip=1.0, steps=1, power=1.0)
DOORS = {"front": (-0.45, 0.25), "rear": (-0.9, -0.2)}
DOOR_CENTRE = {"front": -0.1, "rear": -0.55}
AXLES = {"front": (-1.1, 0.9), "rear": (0.85,)}


def section_parts(P, which):
    """`which` is "front" or "rear"; the section is centred on y = 0 and the bellows stub sticks out of the joint end."""
    front = which == "front"
    door = DOORS[which]
    pick = cb.banded(P, [(0.07, "dark"), (0.42, "bus_yellow"), (0.86, "pane")], "bus_yellow", roof="roof_light",
                     door_zones=[door], door_replace=("pane",), door_fill="bus_yellow", door_zf=(0.42, 0.86), door_side=1)
    parts = [cb.loft_body(P, f"carbody {which}", SECTION, WIDTH, Z0, HEIGHT, pick, profile=cb.PASSENGER, breaks=BREAKS,
                          front=END if front else FLAT, rear=FLAT if front else END, cap="bus_yellow", cuts=cb.zone_cuts([door]))]
    z_lo, z_hi = Z0 + HEIGHT * 0.42, Z0 + HEIGHT * 0.86
    parts += cb.window_pillars(P, "bus_yellow", -1.3, 1.3, 8, z_lo, z_hi, HW, width=0.08, sides=(-1,))
    parts += cb.window_pillars(P, "bus_yellow", -1.3, 1.3, 8, z_lo, z_hi, HW, width=0.08, sides=(1,), skip=[door])
    parts += cb.sliding_door(P, DOOR_CENTRE[which], Z0 + 0.1, z_hi, HW, frame="yellow_dark", glass="pane", width=0.62, sides=(1,))

    joint = SECTION / 2 + HALF_BELLOWS / 2 if front else -(SECTION / 2 + HALF_BELLOWS / 2)
    bellows = cb.loft_body(P, "carbody bellows", HALF_BELLOWS + 0.02, WIDTH - 0.14, Z0 + 0.04, HEIGHT - 0.06, cb.banded(P, [], "black", roof="hub_dark"), profile=cb.PASSENGER, cap="black")
    parts.append(lpm.move(bellows, 0, joint, 0))
    for i in range(3):
        y = joint + (i - 1) * HALF_BELLOWS / 3
        parts.append(lpm.box("bellows rib", (WIDTH - 0.06, 0.02, HEIGHT - 0.1), at=(0, y, Z0 + 0.04), color=P["hub_dark"]))
    parts.append(lpm.box("turntable", (WIDTH * 0.6, HALF_BELLOWS + 0.1, 0.05), at=(0, joint, Z0 - 0.04), color=P["hub_dark"]))

    if front:
        end_y = -SECTION / 2 - 0.01
        parts += [lpm.box("windscreen", (WIDTH * 0.84, 0.03, HEIGHT * 0.44), at=(0, end_y - 0.005, Z0 + HEIGHT * 0.42), color=P["pane"]),
                  lpm.box("windscreen pillar", (0.05, 0.04, HEIGHT * 0.44), at=(0, end_y - 0.01, Z0 + HEIGHT * 0.42), color=P["bus_yellow"]),
                  lpm.box("destination", (0.9, 0.03, 0.11), at=(0, end_y - 0.005, Z0 + HEIGHT * 0.9), color=P["dark"]),
                  lpm.box("destination glow", (0.7, 0.032, 0.05), at=(0, end_y - 0.008, Z0 + HEIGHT * 0.9 + 0.03), color=P["signal"]),
                  lpm.box("grille", (0.7, 0.03, 0.1), at=(0, end_y - 0.005, Z0 + 0.17), color=P["black"])]
        parts += cb.front_face(P, Z0, HW, end_y, Z0 + 0.2)
        for side in (-1, 1):
            parts += cb.side_mirror(P, side, end_y + 0.3, Z0 + HEIGHT * 0.7, HW)
        parts += cb.roof_unit(P, 0.4, Z0 + HEIGHT - 0.02, width=0.8, length=1.2, colour="roof_light", vents=3)
    else:
        end_y = SECTION / 2 + 0.01
        parts.append(lpm.box("rear window", (WIDTH * 0.6, 0.03, HEIGHT * 0.3), at=(0, end_y, Z0 + HEIGHT * 0.5), color=P["pane"]))
        parts += cb.rear_face(P, Z0, HW, end_y, Z0 + 0.34)
        parts += cb.roof_unit(P, 0.2, Z0 + HEIGHT - 0.02, width=0.8, length=1.2, colour="roof_light", vents=3)
    parts += cb.bus_wheels(P, HW, AXLES[which])
    return parts
