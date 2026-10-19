"""Sailing catamaran: two slim white hulls, blue trim, cream main sail and jib, bow at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("blue", "#2a6fb8"), ("cream", "#efe6cf"), ("deck", "#d8cdb2"), ("navy", "#27406e")]
P = kit.palette(COLORS)

LENGTH, SPAN, HULL_BEAM = 3.0, 1.5, 0.3
STATIONS = [(0.0, 0.0), (0.12, 0.5), (0.35, 0.9), (0.6, 1.0), (0.9, 0.9), (1.0, 0.7)]
parts = []
for side in (-1, 1):
    hull = tk.hull(P, LENGTH, HULL_BEAM, 0.1, 0.26, "blue", "white", stations=STATIONS, rim="white")
    for part in hull:
        lpm.move(part, side * SPAN / 2, 0, 0)
    parts += hull
DECK = 0.36
parts.append(lpm.box("trampoline", (SPAN - 0.1, 1.5, 0.04), at=(0, 0.2, DECK - 0.1), color=P["navy"]))
parts.append(lpm.box("bridge deck", (SPAN, 1.2, 0.08), at=(0, 0.1, DECK - 0.1), color=P["white"]))
parts.append(lpm.box("bow beam", (SPAN, 0.08, 0.06), at=(0, -1.1, DECK - 0.04), color=P["white"]))
parts.append(lpm.box("stern beam", (SPAN, 0.08, 0.06), at=(0, 1.35, DECK - 0.04), color=P["white"]))
parts.append(kit.side_profile("cabin", [(-0.55, DECK - 0.02), (0.65, DECK - 0.02), (0.55, DECK + 0.3), (-0.3, DECK + 0.3)], 0.7, P["white"], taper_top=0.9, z0=DECK, z1=DECK + 0.3, bevel=0.03))
parts += kit.panel("cabin windows", P, "navy", -0.35, 0.5, DECK + 0.1, DECK + 0.24, 0.33)
parts.append(lpm.box("cabin glass", (0.5, 0.03, 0.14), at=(0, -0.43, DECK + 0.08), color=P["navy"]))
parts.append(lpm.box("cabin roof", (0.6, 0.9, 0.04), at=(0, 0.1, DECK + 0.3), color=P["white"]))

MAST_Y, MAST_H = -0.2, 3.0
parts.append(tk.mast(P, MAST_Y, DECK + 0.3, MAST_H, radius=0.03, color="trim"))
parts.append(tk.sail(P, "cream", MAST_Y + 0.05 + 0.7, DECK + 0.65, 1.4, MAST_H - 0.55, thickness=0.02, billow=0.2, side=True, shape="tri", nx=7, nz=7, x=0.0))
parts.append(lpm.box("boom", (0.03, 1.4, 0.04), at=(0, MAST_Y + 0.7, DECK + 0.62), color=P["trim"]))
JIB_LEN = MAST_Y - 0.05 - (-LENGTH / 2 + 0.2)
parts.append(tk.sail(P, "cream", MAST_Y - 0.05 - JIB_LEN / 2, DECK + 0.3, JIB_LEN, MAST_H - 0.5, thickness=0.02, billow=0.14, side=True, shape="tri", flip=True, nx=6, nz=7))
parts.append(tk.strut(P, "trim", (0, -LENGTH / 2 + 0.2, DECK - 0.02), (0, MAST_Y, DECK + MAST_H - 0.2), radius=0.008))
parts += tk.railing(P, "chrome", -0.9, -0.6, DECK - 0.06, SPAN / 2 - 0.15)

tk.build("Catamaran", parts, COLORS, tk.out_dir(__file__), budget=2800)
