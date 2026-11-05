"""City bicycle at human size: mint frame, two spoked wheels, saddle on a vertical seat post, handlebar on a vertical steering column over a two-leg fork, crank with pedals, a rear mudguard and a chain guard, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import carbody_kit as cb  # noqa: E402
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("bike_frame", "#7fc8ae"), ("bike_tire", "#2a2d33"), ("bike_rim", "#b8bec9"), ("bike_dark", "#3a3f4a"), ("bike_light", "#fff1a8")]
P = kit.palette(COLORS)

WHEEL_R, BASE = 0.34, 0.52
REAR, FRONT = (0.0, BASE, WHEEL_R), (0.0, -BASE, WHEEL_R)
BOTTOM_BRACKET = (0.0, 0.12, 0.3)
SEAT_TOP = (0.0, 0.3, 0.8)
HEAD_BOTTOM, HEAD_TOP = (0.0, -0.42, 0.62), (0.0, -0.42, 0.84)

parts = []
for y in (-BASE, BASE):
    parts += cb.spoked_wheel(P, 0.0, y, WHEEL_R, width=0.045, rim="bike_rim", tire="bike_tire", hub="bike_dark", spokes=4, sides=16)
for base, top, radius in (
    (BOTTOM_BRACKET, SEAT_TOP, 0.016),
    (SEAT_TOP, HEAD_TOP, 0.016),
    (BOTTOM_BRACKET, (0.0, HEAD_TOP[1], 0.78), 0.02),
    (REAR, BOTTOM_BRACKET, 0.012),
    (REAR, SEAT_TOP, 0.011),
):
    parts.append(tk.strut(P, "bike_frame", base, top, radius))
# The seat post rises straight from the frame to the saddle.
parts.append(tk.strut(P, "bike_rim", SEAT_TOP, (0.0, SEAT_TOP[1], 0.93), 0.012))
# The down tube leaves the bottom bracket and climbs the steering column towards the handlebar.
# The steering column is one vertical tube from the crown of the fork to the handlebar: the head tube, then the stem.
parts.append(tk.strut(P, "bike_rim", HEAD_BOTTOM, (0.0, HEAD_BOTTOM[1], 0.98), 0.014))
# The fork: a crown across the top of the wheel and one leg on each side down to the hub.
parts.append(lpm.box("fork crown", (0.12, 0.04, 0.025), at=(0.0, HEAD_BOTTOM[1], HEAD_BOTTOM[2] - 0.02), color=P["bike_rim"]))
for side in (-1, 1):
    parts.append(tk.strut(P, "bike_rim", (side * 0.055, HEAD_BOTTOM[1], HEAD_BOTTOM[2] - 0.01), (side * 0.055, FRONT[1], FRONT[2]), 0.011))
parts.append(lpm.box("handlebar", (0.54, 0.03, 0.03), at=(0.0, HEAD_BOTTOM[1], 0.98), color=P["bike_rim"]))
for side in (-1, 1):
    parts.append(lpm.box("grip", (0.1, 0.034, 0.034), at=(side * 0.3, HEAD_BOTTOM[1], 0.98), color=P["bike_dark"]))
# The crank: an axle through the bottom bracket, and an arm from each end to its pedal, the two arms opposite each other.
parts.append(lpm.box("crank axle", (0.16, 0.03, 0.03), at=BOTTOM_BRACKET, color=P["bike_rim"]))
for side, (dy, dz) in ((-1, (-0.05, -0.16)), (1, (0.05, 0.16))):
    end = (side * 0.075, BOTTOM_BRACKET[1] + dy, BOTTOM_BRACKET[2] + dz)
    parts.append(tk.strut(P, "bike_rim", (side * 0.075, BOTTOM_BRACKET[1], BOTTOM_BRACKET[2]), end, 0.011))
    parts.append(lpm.box("pedal", (0.11, 0.07, 0.02), at=(side * 0.13, end[1], end[2]), color=P["bike_dark"]))
parts.append(lpm.box("saddle", (0.14, 0.3, 0.05), at=(0.0, SEAT_TOP[1] + 0.03, 0.93), color=P["bike_dark"]))
parts.append(lpm.box("headlight", (0.06, 0.05, 0.05), at=(0.0, HEAD_BOTTOM[1] - 0.03, 0.88), color=P["bike_light"]))
parts.append(lpm.box("mudguard rear", (0.06, 0.34, 0.015), at=(0.0, BASE, WHEEL_R * 2 + 0.03), color=P["bike_frame"]))
parts.append(lpm.box("chain guard", (0.02, 0.4, 0.06), at=(0.07, 0.3, 0.27), color=P["bike_dark"]))

tk.build("Bicycle", parts, COLORS, tk.out_dir(__file__), budget=4000)
