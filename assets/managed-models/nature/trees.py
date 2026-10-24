import math
import os
import random
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(REPO, "tools", "blender"))
import lpm  # noqa: E402

P = lpm.Palette([
    ("bark", "#8a5a34", 0.0, 0.9), ("bark_dark", "#6e4222", 0.0, 0.9),
    ("bark_deep", "#5a3a24", 0.0, 0.9), ("bark_deep_dark", "#432a1a", 0.0, 0.9),
    ("birch", "#e9e3d3", 0.0, 0.9), ("birch_mark", "#4a4648", 0.0, 0.9),
    ("leaf", "#6fb043", 0.0, 0.8), ("leaf_shade", "#56963a", 0.0, 0.8), ("leaf_light", "#8ccc55", 0.0, 0.8),
    ("dark", "#3f7a3a", 0.0, 0.8), ("dark_shade", "#30652f", 0.0, 0.8), ("dark_light", "#55934a", 0.0, 0.8),
    ("fall", "#e8892a", 0.0, 0.8), ("fall_shade", "#cf5e26", 0.0, 0.8), ("fall_light", "#f2b63a", 0.0, 0.8),
])

SEASONS = {
    "green": {"leaves": ("leaf", "leaf_shade", "leaf_light"), "bark": ("bark", "bark_dark")},
    "dark": {"leaves": ("dark", "dark_shade", "dark_light"), "bark": ("bark_deep", "bark_deep_dark")},
    "fall": {"leaves": ("fall", "fall_shade", "fall_light"), "bark": ("birch", "birch_mark")},
}


def blob(name, radius, at, color, height=1.0, segments=7, rng=None):
    """Faceted round crown: a coarse lathed sphere, squashed or stretched by `height`."""
    r = radius
    profile = [(0, -r * 0.75 * height), (r * 0.78, -r * 0.5 * height), (r, 0.05 * r * height), (r * 0.72, r * 0.62 * height), (0, r * 0.92 * height)]
    ob = lpm.lathe(name, profile, segments=segments, at=at, color=color)
    lpm.rotate(ob, (rng or random).uniform(0, 360), "Z", about=at)
    return ob


def shade_crown(ob, season):
    leaf, shade, light = (P[c] for c in season["leaves"])
    lpm.paint(ob, leaf)
    lpm.paint(ob, shade, lambda c, n, i: n.z < -0.25)
    lpm.paint(ob, light, lambda c, n, i: n.z > 0.55)


def trunk(season, height, radius=0.05, top=None, sides=6):
    bark, mark = (P[c] for c in season["bark"])
    ob = lpm.prism("trunk", sides, radius, height, color=bark, radius_top=top if top is not None else radius * 0.7)
    lpm.paint(ob, mark, lambda c, n, i: i == 1)
    return ob


def crown(name, season, radius, at, height=1.0, rng=None, segments=7):
    ob = blob(name, radius, at, P[season["leaves"][0]], height=height, rng=rng, segments=segments)
    shade_crown(ob, season)
    return ob


def tree_default(season, rng):
    parts = [trunk(season, 0.75, 0.06)]
    parts.append(crown("c0", season, 0.36, (0, 0, 0.82), rng=rng))
    parts.append(crown("c1", season, 0.3, (0.05, -0.04, 1.18), rng=rng))
    parts.append(crown("c2", season, 0.2, (-0.03, 0.03, 1.48), rng=rng))
    return parts


def tree_oak(season, rng):
    parts = [trunk(season, 0.55, 0.075, 0.05)]
    for i, (a, d, z, r) in enumerate(((0, 0.0, 0.88, 0.32), (40, 0.22, 0.78, 0.22), (150, 0.22, 0.8, 0.23), (260, 0.2, 0.76, 0.22), (90, 0.1, 1.04, 0.22))):
        x, y = d * math.cos(math.radians(a)), d * math.sin(math.radians(a))
        parts.append(crown(f"c{i}", season, r, (x, y, z), height=0.85, rng=rng))
    return parts


def tree_fat(season, rng):
    return [trunk(season, 0.35, 0.07, 0.06), crown("c0", season, 0.38, (0, 0, 0.68), height=1.1, rng=rng, segments=8)]


def cone_tier(name, season, radius, z, height, rng):
    ob = lpm.prism(name, 7, radius, height, at=(0, 0, z), color=P[season["leaves"][0]], radius_top=0.0, rotate=rng.uniform(0, 360))
    shade_crown(ob, season)
    lpm.paint(ob, P[season["leaves"][1]], lambda c, n, i: n.z < -0.5)
    return ob


def tree_cone(season, rng):
    return [trunk(season, 0.4, 0.05), cone_tier("t0", season, 0.27, 0.3, 0.7, rng), cone_tier("t1", season, 0.2, 0.75, 0.68, rng)]


def tree_blocks(season, rng):
    parts = [trunk(season, 0.45, 0.06, 0.06, sides=4)]
    leaf, shade, light = (P[c] for c in season["leaves"])
    for i, (size, x, y, z) in enumerate(((0.56, 0, 0, 0.4), (0.38, 0.04, -0.02, 0.82))):
        ob = lpm.box(f"b{i}", (size, size, size * 0.85), at=(x, y, z), color=leaf)
        lpm.rotate(ob, rng.uniform(-12, 12), "Z")
        lpm.paint(ob, shade, lambda c, n, i: n.z < -0.5 or n.x > 0.5)
        lpm.paint(ob, light, lambda c, n, i: n.z > 0.5)
        parts.append(ob)
    return parts


def tree_plateau(season, rng):
    parts = [trunk(season, 0.8, 0.055, 0.04)]
    for i, (r, z, h) in enumerate(((0.31, 0.62, 0.16), (0.25, 0.86, 0.15), (0.16, 1.08, 0.13))):
        ob = lpm.prism(f"p{i}", 7, r, h, at=(0, 0, z), color=P[season["leaves"][0]], radius_top=r * 0.82, rotate=rng.uniform(0, 360))
        shade_crown(ob, season)
        parts.append(ob)
    return parts


def on_trunk(name, season, trunk_height, radius, height, rng, segments):
    """A single crown whose bottom pole sits a little below the top of the trunk."""
    return crown(name, season, radius, (0, 0, trunk_height + radius * 0.6 * height), height=height, rng=rng, segments=segments)


def tree_simple(season, rng):
    return [trunk(season, 0.45, 0.045), on_trunk("c0", season, 0.45, 0.18, 3.0, rng, 6)]


def tree_small(season, rng):
    return [trunk(season, 0.35, 0.045), on_trunk("c0", season, 0.35, 0.18, 2.2, rng, 6)]


def tree_tall(season, rng):
    return [trunk(season, 0.45, 0.05), on_trunk("c0", season, 0.45, 0.21, 3.2, rng, 7)]


def tree_thin(season, rng):
    parts = [trunk(season, 1.0, 0.045, 0.03)]
    bark = P[season["bark"][0]]
    for i, (yaw, z, length) in enumerate(((20, 0.45, 0.3), (140, 0.6, 0.28), (260, 0.75, 0.26))):
        branch = lpm.prism(f"br{i}", 5, 0.025, length, color=bark, radius_top=0.015)
        lpm.rotate(branch, 50, "Y")
        lpm.rotate(branch, yaw, "Z")
        lpm.move(branch, 0, 0, z)
        parts.append(branch)
        reach = length * math.sin(math.radians(50))
        tip = (reach * math.cos(math.radians(yaw)), reach * math.sin(math.radians(yaw)), z + length * math.cos(math.radians(50)))
        parts.append(crown(f"c{i}", season, 0.16, tip, height=0.9, rng=rng))
    parts.append(crown("top", season, 0.2, (0, 0, 1.12), height=1.1, rng=rng))
    return parts


SHAPES = {
    "default": tree_default, "oak": tree_oak, "fat": tree_fat, "cone": tree_cone, "blocks": tree_blocks,
    "plateau": tree_plateau, "simple": tree_simple, "small": tree_small, "tall": tree_tall, "thin": tree_thin,
}
# The Kenney catalogue spelled the dark fat tree `tree_fat_darkh`: the file name keeps the model id stable.
MODELS = [(f"tree_{shape}" + {"green": "", "dark": "_dark", "fall": "_fall"}[season], shape, season) for shape in SHAPES for season in SEASONS]
MODELS = [("tree_fat_darkh" if model_id == "tree_fat_dark" else model_id, shape, season) for model_id, shape, season in MODELS]


def requested():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return [m for m in MODELS if not args or m[0] in args]


if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    for model_id, shape, season in requested():
        lpm.reset()
        rng = random.Random(model_id.split("_")[1])
        ob = lpm.finish(model_id, SHAPES[shape](SEASONS[season], rng), P, budget=400)
        lpm.export_glb(ob, os.path.join(out_dir, model_id, model_id))
