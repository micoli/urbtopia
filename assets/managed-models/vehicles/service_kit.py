"""Builders for the four chunky service vehicles: ambulance, fire truck, garbage truck, police car."""
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402


def ambulance(P):
    hl, half = 1.625, 0.78
    cab = [(-1.62, 0.3), (-0.68, 0.3), (-0.68, 1.4), (-1.22, 1.4), (-1.62, 1.0)]
    box = [(-0.7, 0.3), (1.62, 0.3), (1.62, 1.72), (1.5, 1.78), (-0.5, 1.78), (-0.7, 1.66)]
    parts = [
        lpm.box("chassis", (1.2, 3.1, 0.2), at=(0, 0.0, 0.2), color=P["dark"]),
        kit.side_profile("cab", cab, 1.56, P["white"], bevel=0.07),
        kit.side_profile("box", box, 1.56, P["white"], bevel=0.07),
        kit.side_profile("windscreen", [(-1.605, 1.05), (-1.255, 1.385), (-1.265, 1.4), (-1.62, 1.06)], 1.2, P["glass"], bevel=0.004),
        *kit.cab_windows(P, half, -1.3, -0.82, 0.86, 1.3),
        *kit.panel("stripe", P, "body", -0.7, 1.62, 0.6, 0.78, half),
        *kit.panel("cross bar", P, "body", 0.35, 0.95, 1.1, 1.24, half),
        *kit.panel("cross post", P, "body", 0.58, 0.72, 0.95, 1.4, half),
        kit.beacon(P, -0.3, -1.0, 1.4, "blue"), kit.beacon(P, 0.3, -1.0, 1.4, "body"),
        lpm.box("roof vent", (0.9, 1.0, 0.08), at=(0, 0.6, 1.78), color=P["chrome"]),
        lpm.box("rear lights", (1.4, 0.04, 0.16), at=(0, hl, 0.4), color=P["taillight"]),
        kit.rbox("rear bumper", (1.6, 0.14, 0.2), at=(0, hl + 0.01, 0.24), color=P["trim"]),
        *kit.truck_front(P, hl, half, 0.3, 1.0, 0.52),
        *kit.mirror_pair("mirror", P, half + 0.07, -1.2, 1.0, "black"),
        *kit.wheel_set(P, half, (-1.05, 0.95), 0.34, 0.22),
    ]
    return parts


def firetruck(P):
    hl, half = 1.7, 0.78
    cab = [(-1.7, 0.3), (-0.55, 0.3), (-0.55, 1.55), (-1.5, 1.55), (-1.7, 1.3)]
    body = [(-0.5, 0.3), (1.7, 0.3), (1.7, 1.5), (-0.5, 1.5)]
    parts = [
        lpm.box("chassis", (1.2, 3.3, 0.2), at=(0, 0.0, 0.2), color=P["dark"]),
        kit.side_profile("cab", cab, 1.56, P["body"], bevel=0.07),
        kit.side_profile("body", body, 1.56, P["body"], bevel=0.07),
        kit.rbox("windscreen", (1.2, 0.02, 0.44), at=(0, -1.705, 0.86), color=P["glass"], width=0.008),
        *kit.cab_windows(P, half, -1.45, -0.62, 0.9, 1.34, split=-1.04),
        *kit.panel("cab stripe", P, "white", -1.7, -0.55, 0.55, 0.7, half),
        *kit.panel("shutter", P, "chrome", -0.15, 0.65, 0.45, 1.3, half),
        *kit.panel("reel board", P, "trim", 0.8, 1.55, 0.45, 1.3, half),
        kit.beacon(P, -0.3, -1.1, 1.55, "blue"), kit.beacon(P, 0.3, -1.1, 1.55, "blue"),
        lpm.box("ladder rail", (0.05, 2.2, 0.06), at=(-0.22, 0.55, 1.5), color=P["hub"]),
        lpm.box("ladder rail", (0.05, 2.2, 0.06), at=(0.22, 0.55, 1.5), color=P["hub"]),
        lpm.box("rear lights", (1.4, 0.04, 0.16), at=(0, hl, 0.4), color=P["taillight"]),
        kit.rbox("rear bumper", (1.6, 0.14, 0.2), at=(0, hl + 0.01, 0.24), color=P["trim"]),
        *kit.truck_front(P, hl, half, 0.3, 1.3, 0.52),
        *kit.mirror_pair("mirror", P, half + 0.07, -1.5, 1.0, "black"),
        *kit.wheel_set(P, half, (-1.15, 0.85), 0.35, 0.22),
    ]
    for i in range(9):
        parts.append(lpm.box("ladder rung", (0.44, 0.03, 0.04), at=(0, -0.45 + i * 0.25, 1.52), color=P["hub"]))
    for side in (-1, 1):
        parts.append(lpm.move(lpm.rotate(lpm.prism("hose reel", 10, 0.24, 0.05, color=P["headlight"]), 90 * side, "Y"), side * (half + 0.01), 1.18, 0.88))
    return parts


def garbage_truck(P, hopper="body"):
    hl, half = 1.725, 0.78
    cab = [(-1.72, 0.3), (-0.65, 0.3), (-0.65, 1.55), (-1.5, 1.55), (-1.72, 1.32)]
    hop = [(-0.58, 0.48), (1.72, 0.48), (1.72, 1.7), (1.0, 1.95), (-0.58, 1.95)]
    parts = [
        lpm.box("chassis", (1.2, 3.4, 0.2), at=(0, 0.0, 0.2), color=P["dark"]),
        kit.side_profile("cab", cab, 1.56, P["white"], bevel=0.07),
        kit.side_profile("hopper", hop, 1.56, P[hopper], bevel=0.07),
        kit.rbox("windscreen", (1.2, 0.02, 0.46), at=(0, -1.725, 0.86), color=P["glass"], width=0.008),
        *kit.cab_windows(P, half, -1.45, -0.9, 0.9, 1.36),
        *kit.panel("hopper seam", P, "dark", 0.3, 0.33, 0.55, 1.9, half),
        *kit.panel("hopper seam", P, "dark", 1.0, 1.03, 0.55, 1.75, half),
        *kit.panel("hazard strip", P, "taillight", 0.35, 1.7, 0.5, 0.6, half),
        lpm.box("lift arm", (0.2, 0.3, 1.0), at=(0, 1.8, 0.62), color=P["dark"]),
        kit.rbox("rear bumper", (1.6, 0.14, 0.2), at=(0, 1.72, 0.24), color=P["trim"]),
        lpm.box("rear lights", (1.3, 0.04, 0.14), at=(0, 1.72, 0.44), color=P["taillight"]),
        kit.beacon(P, -0.45, -1.1, 1.55, "signal", (0.16, 0.12, 0.1)),
        *kit.truck_front(P, hl, half, 0.3, 1.3, 0.55),
        *kit.mirror_pair("mirror", P, half + 0.07, -1.45, 1.0, "black"),
        *kit.wheel_set(P, half, (-1.1, 0.6, 1.2), 0.34, 0.22),
    ]
    return parts


def police(P):
    return kit.passenger(P, "body", length=2.9, zs=0.74, roof_h=0.46, cabin=(-0.55, 0.92, -0.2, 0.8), wheel_r=0.3, axle=0.92,
                         cabin_color="white", cladding=False) + [
        *kit.panel("door", P, "white", -0.22, 0.58, 0.34, 0.72, 0.73),
        lpm.box("push bar", (1.0, 0.06, 0.26), at=(0, -1.5, 0.3), color=P["black"]),
        kit.beacon(P, -0.2, -0.02, 1.2, "blue", (0.3, 0.2, 0.1)),
        kit.beacon(P, 0.2, -0.02, 1.2, "body_red", (0.3, 0.2, 0.1)),
    ]
