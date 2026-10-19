"""Small pleasure boat: white hull, red bottom, blue stripe and a sloped cabin, bow at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("red", "#d83a3a"), ("blue", "#2a5fd0"), ("deck", "#e6dcc4")]
P = kit.palette(COLORS)

LENGTH, BEAM, H_LOW, H_UP = 2.6, 0.96, 0.1, 0.26
DECK = H_LOW + H_UP
parts = tk.hull(P, LENGTH, BEAM, H_LOW, H_UP, "red", "white", rim="white", deck="deck")
parts += kit.panel("stripe", P, "blue", 0.0, 0.95, DECK - 0.17, DECK - 0.07, BEAM / 2 * 1.03)

fb, rb, ft, rt, zt = -0.5, 0.3, -0.18, 0.18, DECK + 0.36
parts.append(kit.side_profile("cabin", [(fb, DECK), (rb, DECK), (rt, zt), (ft, zt)], 0.64, P["white"], taper_top=0.86, z0=DECK, z1=zt, bevel=0.03))
gz0, gz1 = DECK + 0.05, zt - 0.05
front = lambda z: fb + (ft - fb) * (z - DECK) / (zt - DECK) - 0.006
rear = lambda z: rb + (rt - rb) * (z - DECK) / (zt - DECK) + 0.006
parts.append(kit.side_profile("glass", [(front(gz0), gz0), (rear(gz0), gz0), (rear(gz1), gz1), (front(gz1), gz1)], 0.6, P["blue"], taper_top=0.86, z0=DECK, z1=zt, bevel=0.02))
parts += kit.panel("side window", P, "blue", fb + 0.3, rb - 0.15, DECK + 0.1, zt - 0.1, 0.32 * 0.93)
parts.append(lpm.box("roof", (0.5, 0.42, 0.04), at=(0, 0.0, zt), color=P["white"]))

parts += [
    tk.mast(P, 0.0, zt + 0.04, 0.3, radius=0.012, color="dark"),
    lpm.box("radar", (0.2, 0.03, 0.03), at=(0, 0.0, zt + 0.22), color=P["dark"]),
    lpm.box("sun pad", (0.5, 0.4, 0.05), at=(0, -0.78, DECK + 0.02), color=P["white"]),
    lpm.box("cockpit seat", (0.62, 0.22, 0.14), at=(0, 0.62, DECK + 0.02), color=P["blue"]),
    lpm.box("outboard", (0.16, 0.14, 0.28), at=(0, LENGTH / 2 + 0.04, 0.12), color=P["dark"]),
    lpm.box("bow light", (0.06, 0.06, 0.05), at=(0, -LENGTH / 2 + 0.18, DECK + 0.03), color=P["signal"]),
]
parts += tk.railing(P, "chrome", -0.4, 0.5, DECK + 0.02, BEAM / 2 * 0.74)

tk.build("Speedboat", parts, COLORS, tk.out_dir(__file__), budget=2000)
