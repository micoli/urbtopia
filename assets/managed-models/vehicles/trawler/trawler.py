"""Small fishing trawler: blue hull, red bottom, white wheelhouse forward, orange crates and an A-frame aft, bow at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("red", "#c9352f"), ("blue", "#2a5fa8"), ("crate", "#f0a830"), ("deck", "#7d7566"), ("rope", "#b9a57a")]
P = kit.palette(COLORS)

LENGTH, BEAM, H_LOW, H_UP = 3.4, 1.15, 0.14, 0.4
DECK = H_LOW + H_UP
parts = tk.hull(P, LENGTH, BEAM, H_LOW, H_UP, "red", "blue", rim="white", deck="deck")

parts.append(lpm.box("wheelhouse base", (0.9, 0.85, 0.34), at=(0, -0.7, DECK), color=P["white"]))
parts += kit.panel("house windows", P, "glass", -1.0, -0.4, DECK + 0.12, DECK + 0.28, 0.45)
parts.append(lpm.box("front windows", (0.8, 0.03, 0.16), at=(0, -1.13, DECK + 0.12), color=P["glass"]))
parts.append(lpm.box("wheelhouse top", (0.78, 0.6, 0.26), at=(0, -0.72, DECK + 0.34), color=P["white"]))
parts.append(lpm.box("top windows", (0.8, 0.03, 0.14), at=(0, -1.03, DECK + 0.4), color=P["glass"]))
parts += kit.panel("top side windows", P, "glass", -1.0, -0.45, DECK + 0.4, DECK + 0.54, 0.39)
parts.append(lpm.box("house roof", (0.86, 0.7, 0.04), at=(0, -0.72, DECK + 0.6), color=P["red"]))
parts += [
    tk.mast(P, -0.6, DECK + 0.64, 0.75, radius=0.025, color="white"),
    lpm.box("crow bar", (0.4, 0.03, 0.03), at=(0, -0.6, DECK + 1.1), color=P["dark"]),
    lpm.box("radar", (0.2, 0.05, 0.1), at=(0, -0.6, DECK + 1.3), color=P["dark"]),
]
parts += tk.funnel(P, 0.0, DECK, 0.5, 0.11, "red", top="black")

for y, x in ((0.15, -0.28), (0.15, 0.28), (0.55, -0.28)):
    parts.append(lpm.box("crate", (0.34, 0.3, 0.2), at=(x, y, DECK), color=P["crate"]))
parts.append(lpm.box("winch", (0.5, 0.3, 0.2), at=(0, 0.75, DECK), color=P["dark"]))
for side in (-1, 1):
    parts.append(tk.strut(P, "dark", (side * 0.42, 1.45, DECK), (side * 0.08, 1.55, DECK + 1.0), radius=0.03))
    parts.append(tk.strut(P, "dark", (side * 0.42, 1.0, DECK), (side * 0.08, 1.55, DECK + 1.0), radius=0.025))
parts.append(lpm.box("A-frame top", (0.3, 0.1, 0.08), at=(0, 1.55, DECK + 0.96), color=P["dark"]))
parts += tk.railing(P, "chrome", 0.1, 1.6, DECK + 0.01, BEAM / 2 * 0.9)

tk.build("Trawler", parts, COLORS, tk.out_dir(__file__), budget=3200)
