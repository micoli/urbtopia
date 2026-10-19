"""Large motor yacht: white hull, red bottom, three stepped decks with dark glass, bow at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("red", "#c9352f"), ("blue", "#2a5fd0"), ("deck", "#e6dcc4"), ("navy", "#27406e")]
P = kit.palette(COLORS)

LENGTH, BEAM, H_LOW, H_UP = 4.0, 1.3, 0.14, 0.32
DECK = H_LOW + H_UP
parts = tk.hull(P, LENGTH, BEAM, H_LOW, H_UP, "red", "white", rim="white", deck="deck")
parts += kit.panel("stripe", P, "navy", -0.2, 1.4, DECK - 0.2, DECK - 0.1, BEAM / 2 * 1.03)
parts += tk.window_row(P, "navy", -0.1, 1.5, DECK - 0.3, BEAM / 2 * 1.03, 7, height=0.08, gap=0.4)

z1 = DECK
l1 = [(-0.95, z1), (1.55, z1), (1.45, z1 + 0.34), (-0.5, z1 + 0.34)]
parts.append(kit.side_profile("lower cabin", l1, 1.0, P["white"], bevel=0.03))
parts += kit.panel("lower windows", P, "navy", -0.55, 1.35, z1 + 0.1, z1 + 0.27, 0.5)
z2 = z1 + 0.34
l2 = [(-0.3, z2), (1.25, z2), (1.15, z2 + 0.3), (-0.05, z2 + 0.3)]
parts.append(kit.side_profile("upper cabin", l2, 0.82, P["white"], bevel=0.03))
parts += kit.panel("upper windows", P, "navy", -0.05, 1.1, z2 + 0.08, z2 + 0.24, 0.41)
parts.append(lpm.box("front glass", (0.7, 0.03, 0.2), at=(0, -0.3, z2 + 0.06), color=P["navy"]))
z3 = z2 + 0.3
parts.append(lpm.box("roof deck", (0.9, 1.4, 0.04), at=(0, 0.55, z3), color=P["white"]))
parts.append(lpm.box("bridge", (0.5, 0.45, 0.2), at=(0, 0.35, z3 + 0.04), color=P["white"], taper=(0.9, 0.9)))
parts.append(lpm.box("bridge glass", (0.46, 0.03, 0.1), at=(0, 0.1, z3 + 0.1), color=P["navy"]))
parts += [
    tk.mast(P, 0.45, z3 + 0.24, 0.5, radius=0.02, color="white"),
    lpm.box("radar bar", (0.36, 0.03, 0.03), at=(0, 0.45, z3 + 0.6), color=P["dark"]),
    lpm.box("radar dome", (0.16, 0.16, 0.12), at=(0, 0.8, z3 + 0.04), color=P["white"], taper=(0.7, 0.7)),
    lpm.box("sun pad", (0.8, 0.5, 0.05), at=(0, -1.35, DECK + 0.02), color=P["white"]),
    lpm.box("tender", (0.5, 0.9, 0.12), at=(0, 1.55, DECK + 0.02), color=P["white"], taper=(0.8, 0.9)),
    lpm.box("tender stripe", (0.52, 0.9, 0.03), at=(0, 1.55, DECK + 0.1), color=P["blue"]),
    lpm.box("stern seat", (1.0, 0.2, 0.12), at=(0, 1.78, DECK + 0.02), color=P["blue"]),
    lpm.box("bow light", (0.07, 0.07, 0.06), at=(0, -LENGTH / 2 + 0.25, DECK + 0.03), color=P["signal"]),
]
parts += tk.railing(P, "chrome", -1.7, -0.95, DECK + 0.02, BEAM / 2 * 0.62)
parts += tk.railing(P, "chrome", 1.0, 1.9, DECK + 0.02, BEAM / 2 * 0.82)

tk.build("Yacht", parts, COLORS, tk.out_dir(__file__), budget=3200)
