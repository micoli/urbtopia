"""Old ocean liner: black hull with a white band of portholes, stepped white decks, four funnels, two masts, bow at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("red", "#c9352f"), ("hull", "#25252d"), ("funnel", "#e0602c"), ("deck", "#b79a6a"), ("navy", "#27406e"), ("wood", "#7b4a2b")]
P = kit.palette(COLORS)

LENGTH, BEAM, H_LOW, H_UP = 7.0, 1.1, 0.14, 0.5
STATIONS = [(0.0, 0.0), (0.06, 0.4), (0.2, 0.85), (0.4, 1.0), (0.85, 1.0), (1.0, 0.8)]
DECK = H_LOW + H_UP
parts = tk.hull(P, LENGTH, BEAM, H_LOW, H_UP, "red", "hull", stations=STATIONS, rim="white", deck="deck")
parts += kit.panel("white band", P, "white", -2.8, 3.0, DECK - 0.17, DECK - 0.03, BEAM / 2 * 1.05)
parts += tk.porthole_row(P, "dark", -2.8, 3.0, DECK - 0.1, BEAM / 2 * 1.06, 22, size=0.05)

y0, y1 = -1.9, 2.3
parts.append(lpm.box("deck 1", (BEAM * 0.74, y1 - y0, 0.26), at=(0, (y0 + y1) / 2, DECK), color=P["white"], taper=(1.0, 0.97)))
parts += tk.window_row(P, "navy", y0 + 0.1, y1 - 0.1, DECK + 0.13, BEAM * 0.37, 16, height=0.08, gap=0.45)
y0, y1 = -1.2, 1.8
z2 = DECK + 0.26
parts.append(lpm.box("deck 2", (BEAM * 0.6, y1 - y0, 0.24), at=(0, (y0 + y1) / 2, z2), color=P["white"]))
parts += tk.window_row(P, "navy", y0 + 0.1, y1 - 0.1, z2 + 0.12, BEAM * 0.3, 11, height=0.08, gap=0.45)
z3 = z2 + 0.24
parts.append(lpm.box("deck 3", (BEAM * 0.46, 2.2, 0.16), at=(0, 0.35, z3), color=P["white"]))
parts.append(lpm.box("deck 3 roof", (BEAM * 0.5, 2.3, 0.03), at=(0, 0.35, z3 + 0.16), color=P["deck"]))
parts += tk.window_row(P, "navy", -0.6, 1.2, z3 + 0.08, BEAM * 0.23, 8, height=0.06, gap=0.45)
parts.append(lpm.box("bridge", (BEAM * 0.5, 0.35, 0.17), at=(0, -1.55, DECK + 0.26), color=P["white"]))
parts.append(lpm.box("bridge glass", (BEAM * 0.5, 0.03, 0.08), at=(0, -1.73, DECK + 0.32), color=P["navy"]))

for i, y in enumerate((-0.6, 0.15, 0.9, 1.65)):
    for part in tk.funnel(P, y, z3 + 0.19, 0.55, 0.14, "funnel", top="black", ry=1.2):
        parts.append(part)
for y, h in ((-3.0, 1.5), (2.8, 1.35)):
    parts.append(tk.mast(P, y, DECK, h, radius=0.025, color="wood"))
    parts.append(lpm.box("yard", (0.5, 0.03, 0.03), at=(0, y, DECK + h * 0.7), color=P["wood"]))
parts.append(lpm.box("fore deck house", (0.5, 0.4, 0.12), at=(0, -2.45, DECK), color=P["white"]))
for y in (-0.4, 0.4, 1.2, 2.0):
    for side in (-1, 1):
        parts.append(lpm.box("lifeboat", (0.12, 0.3, 0.06), at=(side * BEAM * 0.33, y, z2 + 0.24), color=P["white"]))
        parts.append(lpm.box("lifeboat band", (0.125, 0.3, 0.02), at=(side * BEAM * 0.33, y, z2 + 0.28), color=P["funnel"]))

tk.build("Liner", parts, COLORS, tk.out_dir(__file__), budget=6500)
