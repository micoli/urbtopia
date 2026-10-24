"""Shell pieces of the Venue interiors (floor, wall, window wall, corner) and small shared props.

The block-wall kits (arcade, supermarket) keep the frame of the pieces they replace: a wall is 1 wide and 1 high,
centred on x, its decorated inner face at y -0.3; the corner is an L whose inner faces look toward -x and -y.
src/scene/renderItems.ts places them with the corner offsets of the Venue definitions. The walls are a quarter as
thick as the Kenney ones (0.15 instead of 0.6): the inner faces stay where they were and the back faces move in."""
import math

from model_lib import lpm

BACK = -0.15
CORNER_BACK = 0.02


def block(name, x0, x1, y0, y1, z0, z1, color):
    return lpm.box(name, (x1 - x0, y1 - y0, z1 - z0), at=((x0 + x1) / 2, (y0 + y1) / 2, z0), color=color)


def checker_floor(P, light, dark, size=1.0, height=0.03, cells=2, centered=True):
    """A floor tile of cells x cells squares; centred on the origin, or from the origin toward +x and +y."""
    start = -size / 2 if centered else 0.0
    step = size / cells
    return [block(f"f{i}{j}", start + step * i, start + step * (i + 1), start + step * j, start + step * (j + 1), 0, height,
                  P[light if (i + j) % 2 == 0 else dark]) for i in range(cells) for j in range(cells)]


def thick_wall(P, body, band, plinth, cap):
    """A wall block with a plinth and a coloured band on its inner face (-y)."""
    parts = [block("body", -0.5, 0.5, -0.27, BACK, 0.0, 1.0, P[body])]
    parts.append(block("plinth", -0.5, 0.5, -0.3, -0.27, 0.0, 0.12, P[plinth]))
    parts.append(block("band", -0.5, 0.5, -0.285, -0.27, 0.3, 0.55, P[band]))
    parts.append(block("cap", -0.5, 0.5, -0.27, BACK, 0.97, 1.0, P[cap]))
    return parts


def thick_window_wall(P, body, frame, glass, plinth, cap):
    """The wall with a framed window through it, its sill at 0.25 and its head at 0.8."""
    parts = [
        block("left", -0.5, -0.3, -0.27, BACK, 0.0, 1.0, P[body]),
        block("right", 0.3, 0.5, -0.27, BACK, 0.0, 1.0, P[body]),
        block("sill", -0.3, 0.3, -0.27, BACK, 0.0, 0.25, P[body]),
        block("head", -0.3, 0.3, -0.27, BACK, 0.8, 1.0, P[body]),
        block("glass", -0.3, 0.3, -0.225, -0.205, 0.25, 0.8, P[glass]),
        block("mullion", -0.015, 0.015, -0.23, -0.2, 0.25, 0.8, P[frame]),
        block("plinth", -0.5, 0.5, -0.3, -0.27, 0.0, 0.12, P[plinth]),
        block("cap", -0.5, 0.5, -0.27, BACK, 0.97, 1.0, P[cap]),
    ]
    for k, (x0, x1, z0, z1) in enumerate(((-0.32, -0.28, 0.23, 0.82), (0.28, 0.32, 0.23, 0.82), (-0.32, 0.32, 0.23, 0.27), (-0.32, 0.32, 0.78, 0.82))):
        parts.append(block(f"frame{k}", x0, x1, -0.29, -0.25, z0, z1, P[frame]))
    return parts


def thick_corner(P, body, band, plinth, cap):
    """An L of two wall arms, one along x on the +y side and one along y on the +x side."""
    parts = [
        block("armx", -0.5, CORNER_BACK, -0.07, CORNER_BACK, 0.0, 1.0, P[body]),
        block("army", -0.07, CORNER_BACK, -0.5, -0.07, 0.0, 1.0, P[body]),
        block("plinthx", -0.5, -0.1, -0.1, -0.07, 0.0, 0.12, P[plinth]),
        block("plinthy", -0.1, -0.07, -0.5, -0.07, 0.0, 0.12, P[plinth]),
        block("bandx", -0.5, -0.085, -0.085, -0.07, 0.3, 0.55, P[band]),
        block("bandy", -0.085, -0.07, -0.5, -0.085, 0.3, 0.55, P[band]),
        block("capx", -0.5, CORNER_BACK, -0.07, CORNER_BACK, 0.97, 1.0, P[cap]),
        block("capy", -0.07, CORNER_BACK, -0.5, -0.07, 0.97, 1.0, P[cap]),
    ]
    return parts


def disc(name, radius, height, at, color, sides=10):
    return lpm.prism(name, sides, radius, height, at=at, color=color)


def vertical_disc(name, radius, depth, center, color, sides=12):
    """A disc standing up, facing -y, centred on `center`."""
    ob = lpm.prism(name, sides, radius, depth, color=color)
    lpm.rotate(ob, -90, "X")
    x, y, z = center
    return lpm.move(ob, x, y - depth / 2, z)


def ring_of_boxes(name, count, radius, size, z, color, center=(0, 0)):
    parts = []
    for k in range(count):
        a = 2 * math.pi * k / count
        parts.append(lpm.box(f"{name}{k}", size, at=(center[0] + radius * math.cos(a), center[1] + radius * math.sin(a), z), color=color))
    return parts
