import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402

P = lpm.Palette([
    ("cell", "#2f4a8a", 0.3, 0.3), ("cell_light", "#4a6ab8", 0.3, 0.3),
    ("frame", "#d7dbe3", 0.5, 0.5), ("leg", "#8f95a3", 0.5, 0.5),
])

# Bounding boxes of the Kenney models these replace, in Blender axes: the game places them by their raw coordinates.
BOXES = {
    "solar-panel-flat": ((-0.21, -0.36, 0.0), (0.21, 0.36, 0.06)),
    "solar-panel-landscape": ((-0.5, -0.07, 0.0), (0.21, 0.32, 0.26)),
    "solar-panel-landscape-group": ((-0.76, -0.45, 0.0), (0.76, 0.45, 0.26)),
}


def panel(name, width, depth, at=(0, 0, 0), tilt=0.0, columns=3, rows=4):
    """A framed panel of rows x columns cells, lying flat then raised on its -y edge by `tilt` degrees."""
    parts = [lpm.box(f"{name}f", (width, depth, 0.03), color=P["frame"])]
    cw, cd = (width - 0.03) / columns, (depth - 0.03) / rows
    for i in range(columns):
        for j in range(rows):
            cell = lpm.box(f"{name}c{i}{j}", (cw * 0.9, cd * 0.9, 0.01), at=(-width / 2 + 0.015 + cw * (i + 0.5), -depth / 2 + 0.015 + cd * (j + 0.5), 0.03),
                           color=P["cell_light" if (i + j) % 2 else "cell"])
            parts.append(cell)
    for p in parts:
        lpm.move(p, 0, -depth / 2, 0)
        lpm.rotate(p, tilt, "X")
        lpm.move(p, at[0], at[1] + depth / 2, at[2])
    return parts


def standing(name, width, depth, at, tilt=-22):
    """A tilted panel on legs: high on its -y edge."""
    x, y = at
    parts = panel(name, width, depth, at=(x, y, 0.06), tilt=tilt)
    for k, (dx, h) in enumerate(((-width / 2 + 0.03, 0.22), (width / 2 - 0.03, 0.22))):
        parts.append(lpm.box(f"{name}l{k}", (0.025, 0.025, h), at=(x + dx, y - depth / 2 + 0.03, 0), color=P["leg"]))
        parts.append(lpm.box(f"{name}s{k}", (0.025, 0.025, 0.08), at=(x + dx, y + depth / 2 - 0.05, 0), color=P["leg"]))
    return parts


if __name__ == "__main__":
    export_all({
        "solar-panel-flat": lambda rng: panel("p", 0.42, 0.72),
        "solar-panel-landscape": lambda rng: standing("p", 0.71, 0.4, (0, 0)),
        "solar-panel-landscape-group": lambda rng: [part for k, (x, y) in enumerate(((-0.38, -0.22), (0.38, -0.22), (-0.38, 0.23), (0.38, 0.23)))
                                                    for part in standing(f"p{k}", 0.74, 0.42, (x, y))],
    }, P, 1000, HERE, boxes=BOXES, center=False, ground=False)
