"""Articulated bus, front section with half of the bellows: yellow shell, dark glass band, door between windows, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import articulated_kit as ak  # noqa: E402
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
P = kit.palette(ak.COLORS)
tk.build("BusArticulatedFront", ak.section_parts(P, "front"), ak.COLORS, tk.out_dir(__file__), budget=9000)
