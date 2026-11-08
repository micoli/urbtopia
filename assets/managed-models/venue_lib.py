"""Shell pieces of the Venue interiors (floor, wall, window wall, corner) and small shared props.

The block-wall kits (arcade, supermarket, restaurant) stand on the outer edge of their floor tile: a wall is 1 wide and
1 high, centred on x, its back face on the edge (y 0) and its decorated inner face at y -0.15. The corner is the square
post of the outer floor corner and is placed at the origin of the floor, unrotated.
The walls a player places inside (partitions, window walls) are centred on their tile instead, so that neighbours join."""
import math

from model_lib import lpm

THICK = 0.15


def block(name, x0, x1, y0, y1, z0, z1, color):
    return lpm.box(name, (x1 - x0, y1 - y0, z1 - z0), at=((x0 + x1) / 2, (y0 + y1) / 2, z0), color=color)


def checker_floor(P, light, dark, size=1.0, height=0.03, cells=2, centered=True):
    """A floor tile of cells x cells squares; centred on the origin, or from the origin toward +x and +y."""
    start = -size / 2 if centered else 0.0
    step = size / cells
    return [block(f"f{i}{j}", start + step * i, start + step * (i + 1), start + step * j, start + step * (j + 1), 0, height,
                  P[light if (i + j) % 2 == 0 else dark]) for i in range(cells) for j in range(cells)]


def _band(name, x0, x1, y0, y1, color):
    return [] if color is None else [block(name, x0, x1, y0, y1, 0.3, 0.55, color)]


def thick_wall(P, body, band, plinth, cap):
    """A wall block with a plinth and, when `band` is given, a coloured band on its inner face (-y)."""
    parts = [block("body", -0.5, 0.5, -THICK, 0.0, 0.0, 1.0, P[body]), block("plinth", -0.5, 0.5, -THICK - 0.03, -THICK, 0.0, 0.12, P[plinth]),
             block("cap", -0.5, 0.5, -THICK, 0.0, 0.97, 1.0, P[cap])]
    return parts + _band("band", -0.5, 0.5, -THICK - 0.015, -THICK, None if band is None else P[band])


def partition_wall(P, body, band, plinth, cap):
    """A wall that divides the room, centred on its tile so that two of them cross into a T or a cross: plinth and band on both faces."""
    h = THICK / 2
    parts = [block("body", -0.5, 0.5, -h, h, 0.0, 1.0, P[body]), block("cap", -0.5, 0.5, -h, h, 0.97, 1.0, P[cap]),
             block("plinth_a", -0.5, 0.5, h, h + 0.03, 0.0, 0.12, P[plinth]), block("plinth_b", -0.5, 0.5, -h - 0.03, -h, 0.0, 0.12, P[plinth])]
    if band is None:
        return parts
    return parts + [block("band_a", -0.5, 0.5, h, h + 0.015, 0.3, 0.55, P[band]), block("band_b", -0.5, 0.5, -h - 0.015, -h, 0.3, 0.55, P[band])]


def thick_window_wall(P, body, frame, glass, plinth, cap):
    """A partition with a framed window through it, its sill at 0.25 and its head at 0.8."""
    h = THICK / 2
    parts = [
        block("left", -0.5, -0.3, -h, h, 0.0, 1.0, P[body]),
        block("right", 0.3, 0.5, -h, h, 0.0, 1.0, P[body]),
        block("sill", -0.3, 0.3, -h, h, 0.0, 0.25, P[body]),
        block("head", -0.3, 0.3, -h, h, 0.8, 1.0, P[body]),
        block("glass", -0.3, 0.3, -0.01, 0.01, 0.25, 0.8, P[glass]),
        block("mullion", -0.015, 0.015, -0.03, 0.03, 0.25, 0.8, P[frame]),
        block("plinth_a", -0.5, 0.5, h, h + 0.03, 0.0, 0.12, P[plinth]),
        block("plinth_b", -0.5, 0.5, -h - 0.03, -h, 0.0, 0.12, P[plinth]),
        block("cap", -0.5, 0.5, -h, h, 0.97, 1.0, P[cap]),
    ]
    for k, (x0, x1, z0, z1) in enumerate(((-0.32, -0.28, 0.23, 0.82), (0.28, 0.32, 0.23, 0.82), (-0.32, 0.32, 0.23, 0.27), (-0.32, 0.32, 0.78, 0.82))):
        parts.append(block(f"frame{k}", x0, x1, -h - 0.02, h + 0.02, z0, z1, P[frame]))
    return parts


def along(side, along0, along1, off0, off1, z0, z1, color, name):
    """A box from `along0` to `along1` out of the centre toward a side, `off0` to `off1` across it. Sides: E +x, W -x, S -y, N +y."""
    box = {"E": (along0, along1, off0, off1), "W": (-along1, -along0, off0, off1), "S": (off0, off1, -along1, -along0), "N": (off0, off1, along0, along1)}[side]
    return block(name, *box, z0, z1, color)


def junction_wall(P, body, band, plinth, cap, arms):
    """The centre square of a partition with arms to the given sides (E, S, W, N), where two or more walls meet: an elbow, a T or a cross."""
    h = THICK / 2
    t = 0.03
    parts = [block("centre", -h, h, -h, h, 0.0, 1.0, P[body]), block("centre_cap", -h, h, -h, h, 0.97, 1.0, P[cap])]
    for side in "ESWN":
        if side in arms:
            parts += [along(side, h, 0.5, -h, h, 0.0, 1.0, P[body], f"arm{side}"), along(side, h, 0.5, -h, h, 0.97, 1.0, P[cap], f"cap{side}")]
            for k, (o0, o1) in enumerate(((h, h + t), (-h - t, -h))):
                parts.append(along(side, h, 0.5, o0, o1, 0.0, 0.12, P[plinth], f"plinth{side}{k}"))
            if band is not None:
                for k, (o0, o1) in enumerate(((h, h + 0.015), (-h - 0.015, -h))):
                    parts.append(along(side, h, 0.5, o0, o1, 0.3, 0.55, P[band], f"band{side}{k}"))
            continue
        parts.append(along(side, h, h + t, -h - t, h + t, 0.0, 0.12, P[plinth], f"plinth_end{side}"))
        if band is not None:
            parts.append(along(side, h, h + 0.015, -h - 0.015, h + 0.015, 0.3, 0.55, P[band], f"band_end{side}"))
    return parts


def thick_corner(P, body, band, plinth, cap):
    """The post where two walls meet, on the outer corner of the floor: a square from the origin toward +x and -y."""
    inner = THICK + 0.03
    parts = [
        block("post", 0.0, THICK, -THICK, 0.0, 0.0, 1.0, P[body]),
        block("plinthx", 0.0, inner, -inner, -THICK, 0.0, 0.12, P[plinth]),
        block("plinthy", THICK, inner, -THICK, 0.0, 0.0, 0.12, P[plinth]),
        block("cap", 0.0, THICK, -THICK, 0.0, 0.97, 1.0, P[cap]),
    ]
    if band is None:
        return parts
    return parts + [block("bandx", 0.0, THICK + 0.015, -THICK - 0.015, -THICK, 0.3, 0.55, P[band]), block("bandy", THICK, THICK + 0.015, -THICK, 0.0, 0.3, 0.55, P[band])]


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
