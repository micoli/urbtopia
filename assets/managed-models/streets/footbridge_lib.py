"""Pieces of the Footbridge, in the cells of the road kit (see street_lib). Frame as street_lib: Z up, one tile is 1 unit, N is +Y, E is +X.

The walking route runs along X over the deck. The corridor is a flat walkway as wide as the stairs, aligned with them. A stair climbs in two flights at 90° inside one tile: it is entered from the north edge (`stair_left`) or the south edge (`stair_right`) and left at the east edge, at the height of the deck.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import street_lib as lib

ELEVATION = 0.5
HALF = 0.26
RAIL_T = 0.04
RAIL_H = 0.12
STEPS = 4
RUN = (0.5 - HALF) / STEPS
RISE = ELEVATION / (2 * STEPS)
LANDING = ELEVATION / 2
SLAB = lib.DECK
PIER = 0.07


def solid(kit, x0, y0, z0, x1, y1, z1, top, side):
    for facing, quad, cell in (
        ((0, 0, 1), [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)], top),
        ((0, 0, -1), [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0)], side),
        ((1, 0, 0), [(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)], side),
        ((-1, 0, 0), [(x0, y0, z0), (x0, y1, z0), (x0, y1, z1), (x0, y0, z1)], side),
        ((0, 1, 0), [(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)], side),
        ((0, -1, 0), [(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)], side),
    ):
        kit.poly(quad, cell, facing)


def rail(kit, x0, y0, x1, y1, z):
    solid(kit, x0, y0, z, x1, y1, z + RAIL_H, "curb", "curb")


def chamfered_rail(kit, x0, x1, y0, y1, z, cut_low=False, cut_high=False):
    """A rail along X whose end at `x0` and/or `x1` is cut at 45° in the vertical plane: the top slopes down to the ground over its own height."""
    top = z + RAIL_H
    upper = ([(x0, z), (x0 + RAIL_H, top)] if cut_low else [(x0, top)]) + ([(x1 - RAIL_H, top), (x1, z)] if cut_high else [(x1, top)])
    profile = [(x0, z), (x1, z), *reversed(upper)]
    profile = [point for index, point in enumerate(profile) if point != profile[index - 1]]
    for y, facing in ((y0, (0, -1, 0)), (y1, (0, 1, 0))):
        kit.poly([(x, y, h) for x, h in profile], "curb", facing)
    for (xa, ha), (xb, hb) in zip(upper, upper[1:]):
        kit.poly([(xa, y0, ha), (xb, y0, hb), (xb, y1, hb), (xa, y1, ha)], "curb", (ha - hb, 0, xb - xa))
    kit.poly([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], "curb", (0, 0, -1))
    for x, shut, facing in ((x0, not cut_low, (-1, 0, 0)), (x1, not cut_high, (1, 0, 0))):
        if shut:
            kit.poly([(x, y0, z), (x, y1, z), (x, y1, top), (x, y0, top)], "curb", facing)


def corridor(kit, closed=None):
    """Flat walkway as wide as the stairs, a T: a bar along X, and a stem along Y open on the south edge, where the stair is. Rails on both sides of every arm. The bar is open at both ends, or stops at the line of the stem on the `closed` side ('W' or 'E'), where the rail of the stair goes straight on along the bar. The rails of an open end are cut at 45° in elevation."""
    z = lib.Z_FLAT
    low = -HALF if closed == "W" else -0.5
    high = HALF if closed == "E" else 0.5
    kit.rect(low, -HALF, high, HALF, z, "road")
    kit.rect(-HALF, -0.5, HALF, -HALF, z, "road")
    open_ends = [sign for sign in (-1, 1) if closed != ("W" if sign < 0 else "E")]
    chamfered_rail(kit, low, high, HALF - RAIL_T, HALF, z, cut_low=-1 in open_ends, cut_high=1 in open_ends)
    for sign, end in ((-1, low), (1, high)):
        shut = sign not in open_ends
        if not shut:
            x0, x1 = sorted((sign * HALF, end))
            chamfered_rail(kit, x0, x1, -HALF, -HALF + RAIL_T, z, cut_low=sign < 0, cut_high=sign > 0)
        x0, x1 = sorted((sign * HALF, sign * (HALF - RAIL_T)))
        rail(kit, x0, -0.5, x1, HALF if shut else -HALF, z)


def deck(kit):
    """Walkway along X at the elevation of the deck, with a rail on each side and four slim piers."""
    solid(kit, -0.5, -0.3, ELEVATION - SLAB, 0.5, 0.3, ELEVATION, "road", "side")
    for sign in (-1, 1):
        y0, y1 = sorted((sign * HALF, sign * 0.3))
        rail(kit, -0.5, y0, 0.5, y1, ELEVATION)
    for x in (-0.44, 0.44):
        for y in (-0.22, 0.22):
            solid(kit, x - PIER / 2, y - PIER / 2, 0, x + PIER / 2, y + PIER / 2, ELEVATION - SLAB, "side", "side")


def stair(kit, mirror):
    """First flight from the north edge (south edge when mirrored) to the landing, second flight from the landing to the east edge."""
    flip = -1 if mirror else 1

    def block(x0, y0, z0, x1, y1, z1):
        ya, yb = sorted((flip * y0, flip * y1))
        solid(kit, x0, ya, z0, x1, yb, z1, "curb", "side")

    def side_rail(x0, y0, x1, y1, z):
        ya, yb = sorted((flip * y0, flip * y1))
        rail(kit, x0, ya, x1, yb, z)

    for k in range(1, STEPS + 1):
        y1, y0 = 0.5 - RUN * (k - 1), 0.5 - RUN * k
        block(-HALF, y0, 0, HALF, y1, RISE * k)
        side_rail(-HALF, y0, -HALF + RAIL_T, y1, RISE * k)
        side_rail(HALF - RAIL_T, y0, HALF, y1, RISE * k)
    block(-HALF, -HALF, 0, HALF, HALF, LANDING)
    side_rail(-HALF, -HALF, HALF, -HALF + RAIL_T, LANDING)
    side_rail(-HALF, -HALF, -HALF + RAIL_T, HALF, LANDING)
    for k in range(1, STEPS + 1):
        x0, x1 = HALF + RUN * (k - 1), HALF + RUN * k
        top = LANDING + RISE * k
        block(x0, -HALF, 0, x1, HALF, top)
        side_rail(x0, HALF - RAIL_T, x1, HALF, top)
        side_rail(x0, -HALF, x1, -HALF + RAIL_T, top)
