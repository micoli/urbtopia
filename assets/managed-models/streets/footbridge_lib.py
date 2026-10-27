"""Pieces of the Footbridge, in the cells of the road kit (see street_lib). Frame as street_lib: Z up, one tile is 1 unit, N is +Y, E is +X.

The walking route runs along X over the deck. A stair climbs in two flights at 90° inside one tile: it is entered from the north edge (`stair_left`) or the south edge (`stair_right`) and left at the east edge, at the height of the deck.
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


def corridor(kit):
    """Flat tile open on the west, east and south edges, closed by a rail on the north edge."""
    kit.rect(-0.5, -0.5, 0.5, 0.5, lib.Z_FLAT, "road")
    rail(kit, -0.5, 0.5 - RAIL_T, 0.5, 0.5, lib.Z_FLAT)


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
