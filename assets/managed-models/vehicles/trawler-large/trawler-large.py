"""Large fishing trawler: green hull, red bottom, white wheelhouse, yellow crates and a tall gantry aft, bow at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("red", "#c9352f"), ("green", "#2f8a4a"), ("crate", "#f2b92a"), ("deck", "#8a8272"), ("cream", "#efe6cf")]
P = kit.palette(COLORS)

LENGTH, BEAM, H_LOW, H_UP = 4.4, 1.5, 0.16, 0.5
DECK = H_LOW + H_UP
parts = tk.hull(P, LENGTH, BEAM, H_LOW, H_UP, "red", "green", rim="white", deck="deck")
parts += kit.panel("hull stripe", P, "white", -0.2, 1.9, DECK - 0.1, DECK - 0.05, BEAM / 2 * 1.04)

parts.append(lpm.box("house base", (1.1, 1.1, 0.4), at=(0, -0.9, DECK), color=P["white"]))
parts += kit.panel("house windows", P, "glass", -1.35, -0.55, DECK + 0.14, DECK + 0.32, 0.55)
parts.append(lpm.box("front windows", (1.0, 0.03, 0.18), at=(0, -1.46, DECK + 0.14), color=P["glass"]))
parts.append(lpm.box("bridge", (0.95, 0.75, 0.32), at=(0, -0.95, DECK + 0.4), color=P["white"]))
parts.append(lpm.box("bridge glass", (0.97, 0.03, 0.16), at=(0, -1.33, DECK + 0.5), color=P["glass"]))
parts += kit.panel("bridge side glass", P, "glass", -1.3, -0.65, DECK + 0.5, DECK + 0.66, 0.475)
parts.append(lpm.box("bridge roof", (1.05, 0.85, 0.04), at=(0, -0.95, DECK + 0.72), color=P["red"]))
parts += [
    tk.mast(P, -0.85, DECK + 0.76, 0.9, radius=0.03, color="white"),
    lpm.box("yard", (0.5, 0.03, 0.03), at=(0, -0.85, DECK + 1.3), color=P["dark"]),
    lpm.box("radar", (0.26, 0.06, 0.1), at=(0, -0.85, DECK + 1.5), color=P["dark"]),
]
parts += tk.funnel(P, -0.15, DECK, 0.55, 0.13, "red", top="black")

for x, y in ((-0.38, 0.1), (0.0, 0.1), (0.38, 0.1), (-0.2, 0.5), (0.2, 0.5)):
    parts.append(lpm.box("crate", (0.34, 0.34, 0.22), at=(x, y, DECK), color=P["crate"]))
parts.append(lpm.box("net drum", (0.9, 0.3, 0.24), at=(0, 0.95, DECK), color=P["dark"]))
for side in (-1, 1):
    parts.append(tk.strut(P, "dark", (side * 0.55, 1.75, DECK), (side * 0.1, 1.85, DECK + 1.3), radius=0.035))
    parts.append(tk.strut(P, "dark", (side * 0.55, 1.15, DECK), (side * 0.1, 1.85, DECK + 1.3), radius=0.028))
parts.append(lpm.box("gantry top", (0.34, 0.12, 0.1), at=(0, 1.85, DECK + 1.26), color=P["dark"]))
parts.append(tk.strut(P, "dark", (0, 1.85, DECK + 1.3), (0, 2.2, DECK + 0.3), radius=0.012))
parts += tk.railing(P, "chrome", 0.0, 2.0, DECK + 0.01, BEAM / 2 * 0.9)

tk.build("TrawlerLarge", parts, COLORS, tk.out_dir(__file__), budget=3800)
