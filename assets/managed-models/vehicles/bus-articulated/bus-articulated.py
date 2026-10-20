"""Articulated bus: yellow shell, dark glass band between pillars, two sections joined by a ribbed black bellows, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import carbody_kit as cb  # noqa: E402
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("bus_yellow", "#f2c030"), ("yellow_dark", "#c99a1a"), ("pane", "#1b2a4a"), ("roof_light", "#f7cf4a")]
P = kit.palette(COLORS)

SECTION, GAP, WIDTH, Z0, HEIGHT = 3.2, 0.3, 1.5, 0.3, 1.08
HW = WIDTH / 2
END = dict(length=0.2, drop=0.12, tip=0.92, steps=2, power=1.0)
FLAT = dict(length=0.04, drop=0.0, tip=1.0, steps=1, power=1.0)
BREAKS = (0.07, 0.42, 0.86)
def picker(door):
    return cb.banded(P, [(0.07, "dark"), (0.42, "bus_yellow"), (0.86, "pane")], "bus_yellow", roof="roof_light",
                     door_zones=[door], door_replace=("pane",), door_fill="bus_yellow", door_zf=(0.42, 0.86), door_side=1)


FRONT_DOOR, REAR_DOOR = (-0.45, 0.25), (-0.9, -0.2)
offset = SECTION / 2 + GAP / 2
z_lo, z_hi = Z0 + HEIGHT * 0.42, Z0 + HEIGHT * 0.86
front, rear = -offset - SECTION / 2 - 0.01, offset + SECTION / 2 + 0.01

parts = []
sections = (("front", -offset, END, FLAT, FRONT_DOOR), ("rear", offset, FLAT, END, REAR_DOOR))
for name, y, nose_a, nose_b, door in sections:
    body = cb.loft_body(P, f"carbody {name}", SECTION, WIDTH, Z0, HEIGHT, picker(door), profile=cb.PASSENGER, breaks=BREAKS, front=nose_a, rear=nose_b, cap="bus_yellow", cuts=cb.zone_cuts([door]))
    parts.append(lpm.move(body, 0, y, 0))
    parts += cb.window_pillars(P, "bus_yellow", y - 1.3, y + 1.3, 8, z_lo, z_hi, HW, width=0.08, sides=(-1,))
    parts += cb.window_pillars(P, "bus_yellow", y - 1.3, y + 1.3, 8, z_lo, z_hi, HW, width=0.08, sides=(1,), skip=[(y + door[0], y + door[1])])
parts += cb.sliding_door(P, -offset - 0.1, Z0 + 0.1, z_hi, HW, frame="yellow_dark", glass="pane", width=0.62, sides=(1,))
parts += cb.sliding_door(P, offset - 0.55, Z0 + 0.1, z_hi, HW, frame="yellow_dark", glass="pane", width=0.62, sides=(1,))

bellows = cb.loft_body(P, "carbody bellows", GAP + 0.08, WIDTH - 0.14, Z0 + 0.04, HEIGHT - 0.06, cb.banded(P, [], "black", roof="hub_dark"), profile=cb.PASSENGER, cap="black")
parts.append(bellows)
for i in range(5):
    parts.append(lpm.box("bellows rib", (WIDTH - 0.06, 0.02, HEIGHT - 0.1), at=(0, -GAP / 2 + 0.03 + i * (GAP - 0.06) / 4, Z0 + 0.04), color=P["hub_dark"]))
parts.append(lpm.box("turntable", (WIDTH * 0.6, GAP + 0.1, 0.05), at=(0, 0, Z0 - 0.04), color=P["hub_dark"]))

parts += [lpm.box("windscreen", (WIDTH * 0.84, 0.03, HEIGHT * 0.44), at=(0, front - 0.005, Z0 + HEIGHT * 0.42), color=P["pane"]),
          lpm.box("windscreen pillar", (0.05, 0.04, HEIGHT * 0.44), at=(0, front - 0.01, Z0 + HEIGHT * 0.42), color=P["bus_yellow"]),
          lpm.box("destination", (0.9, 0.03, 0.11), at=(0, front - 0.005, Z0 + HEIGHT * 0.9), color=P["dark"]),
          lpm.box("destination glow", (0.7, 0.032, 0.05), at=(0, front - 0.008, Z0 + HEIGHT * 0.9 + 0.03), color=P["signal"]),
          lpm.box("rear window", (WIDTH * 0.6, 0.03, HEIGHT * 0.3), at=(0, rear, Z0 + HEIGHT * 0.5), color=P["pane"]),
          lpm.box("grille", (0.7, 0.03, 0.1), at=(0, front - 0.005, Z0 + 0.17), color=P["black"])]
parts += cb.front_face(P, Z0, HW, front, Z0 + 0.2)
parts += cb.rear_face(P, Z0, HW, rear, Z0 + 0.34)
parts += cb.bus_wheels(P, HW, (-offset - 1.1, -offset + 0.9, offset + 0.85))
for side in (-1, 1):
    parts += cb.side_mirror(P, side, front + 0.3, Z0 + HEIGHT * 0.7, HW)
parts += cb.roof_unit(P, -offset + 0.4, Z0 + HEIGHT - 0.02, width=0.8, length=1.2, colour="roof_light", vents=3)
parts += cb.roof_unit(P, offset + 0.2, Z0 + HEIGHT - 0.02, width=0.8, length=1.2, colour="roof_light", vents=3)

tk.build("BusArticulated", parts, COLORS, tk.out_dir(__file__), budget=12000)
