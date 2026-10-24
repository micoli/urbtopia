import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nature_lib import export_all, lpm  # noqa: E402

P = lpm.Palette([
    ("grass", "#7cbf4a", 0.0, 0.9), ("grass_shade", "#5f9f3a", 0.0, 0.9), ("grass_light", "#95d15c", 0.0, 0.9),
    ("leaf", "#4e9136", 0.0, 0.8), ("leaf_dark", "#3f7a3a", 0.0, 0.8),
    ("purple", "#9b5cd6", 0.0, 0.7), ("red", "#e04848", 0.0, 0.7), ("yellow", "#f4c430", 0.0, 0.7),
    ("white", "#f6f2e8", 0.0, 0.7), ("heart", "#f2b02c", 0.0, 0.7),
    ("tan", "#d9b27a", 0.0, 0.8), ("tan_dark", "#b58c56", 0.0, 0.8), ("stem", "#f1e6d0", 0.0, 0.8),
    ("pad", "#5fae4a", 0.0, 0.8), ("pad_dark", "#3f8a3a", 0.0, 0.8),
    ("cactus", "#5f9a4a", 0.0, 0.8), ("cactus_dark", "#4a7f3a", 0.0, 0.8),
])


def blade(name, at, height, width, yaw, lean, color):
    """A thin three-sided spike leaning outward: one blade of a grass tuft."""
    ob = lpm.prism(name, 3, width, height, color=color, radius_top=0.0, rotate=yaw)
    lpm.rotate(ob, lean, "Y")
    lpm.rotate(ob, yaw, "Z")
    return lpm.move(ob, *at)


def tuft(rng, blades, radius, height, prefix="g"):
    parts = []
    for k in range(blades):
        a = 2 * math.pi * k / blades + rng.uniform(-0.3, 0.3)
        r = radius * rng.uniform(0.2, 1.0)
        color = P[rng.choice(("grass", "grass_shade", "grass_light"))]
        parts.append(blade(f"{prefix}{k}", (r * math.cos(a), r * math.sin(a), 0), height * rng.uniform(0.6, 1.0), 0.03, math.degrees(a), rng.uniform(8, 28), color))
    return parts


def broad_leaf(name, length, width, yaw, pitch, color, at=(0, 0, 0)):
    """A flat pointed leaf lying along +x, raised by `pitch` degrees, turned by `yaw`."""
    ob = lpm.box(name, (length, width, 0.012), at=(length / 2, 0, 0), color=color, taper=(1.0, 1.0))
    for v in ob.data.vertices:
        t = v.co.x / length
        v.co.y *= 1 - t * t
    lpm.rotate(ob, -pitch, "Y")
    lpm.rotate(ob, yaw, "Z")
    return lpm.move(ob, *at)


def bloom(name, at, color, heart, petals=5, size=0.05):
    parts = [lpm.prism(f"{name}h", 6, size * 0.4, size * 0.3, at=at, color=P[heart])]
    for k in range(petals):
        petal = broad_leaf(f"{name}p{k}", size, size * 0.8, 360 * k / petals, 15, P[color])
        parts.append(lpm.move(petal, at[0], at[1], at[2] + size * 0.15))
    return parts


def flower(name, at, height, color, heart, rng, size=0.05):
    stem = lpm.prism(f"{name}s", 4, 0.008, height, at=at, color=P["leaf"])
    parts = [stem] + bloom(name, (at[0], at[1], at[2] + height), color, heart, size=size)
    for k in range(2):
        parts.append(broad_leaf(f"{name}l{k}", height * 0.4, 0.035, rng.uniform(0, 360), 35, P["leaf"], at=(at[0], at[1], at[2] + height * 0.15)))
    return parts


FLOWER_HEIGHT = {"purple": 0.2, "red": 0.25, "yellow": 0.15}


def flowers(color, kind):
    def build(rng):
        height = FLOWER_HEIGHT[color]
        if kind == "A":
            return flower("f", (0, 0, 0), height, color, "heart", rng)
        if kind == "B":
            return [p for k, (x, y, s) in enumerate(((-0.05, -0.04, 1.0), (0.06, 0.0, 0.8), (-0.01, 0.07, 0.65))) for p in flower(f"f{k}", (x, y, 0), height * s, color, "heart", rng)]
        return flower("f", (0, 0, 0), height * 0.8, "white", color, rng, size=0.06) + tuft(rng, 5, 0.06, 0.08)
    return build


def bush(blobs, triangle=False):
    def build(rng):
        parts = []
        for k, (x, y, r, h) in enumerate(blobs):
            if triangle:
                ob = lpm.prism(f"b{k}", 4, r, h, at=(x, y, 0), color=P["grass"], radius_top=0.0, rotate=rng.uniform(0, 90))
            else:
                ob = lpm.lathe(f"b{k}", [(r * 0.8, 0), (r, h * 0.35), (r * 0.7, h * 0.8), (0, h)], segments=6, at=(x, y, 0), color=P["grass"])
                lpm.rotate(ob, rng.uniform(0, 60), "Z", about=(x, y, 0))
            lpm.paint(ob, P["grass_shade"], lambda c, n, i: n.x + n.y < -0.5)
            lpm.paint(ob, P["grass_light"], lambda c, n, i: n.z > 0.6)
            parts.append(ob)
        return parts
    return build


def flat_plant(leaves, length, pitch):
    def build(rng):
        return [broad_leaf(f"l{k}", length * rng.uniform(0.85, 1.0), 0.07, 360 * k / leaves + rng.uniform(-10, 10), pitch + rng.uniform(-8, 8),
                           P["leaf" if k % 2 else "grass_shade"]) for k in range(leaves)]
    return build


def leafs(count, length):
    def build(rng):
        return [broad_leaf(f"l{k}", length * rng.uniform(0.75, 1.0), 0.09, 360 * k / count + rng.uniform(-15, 15), rng.uniform(15, 30),
                           P[rng.choice(("grass", "grass_shade"))]) for k in range(count)]
    return build


def lily_pad(name, radius, at, yaw, color):
    ob = lpm.prism(name, 9, radius, 0.012, at=at, color=P[color], rotate=yaw)
    lpm.paint(ob, P["pad_dark"], lambda c, n, i: abs(n.z) < 0.5)
    return ob


def lily(large):
    def build(rng):
        parts = [lily_pad("p0", 0.13 if large else 0.09, (0, 0, 0), rng.uniform(0, 360), "pad")]
        if large:
            parts.append(lily_pad("p1", 0.07, (0.1, 0.1, 0.004), rng.uniform(0, 360), "pad_dark"))
            parts += bloom("fl", (-0.02, 0.0, 0.015), "red", "heart", petals=6, size=0.045)
        else:
            parts.append(lily_pad("p1", 0.05, (0.07, -0.06, 0.004), rng.uniform(0, 360), "pad_dark"))
        return parts
    return build


def cactus(height, arms):
    def build(rng):
        body = lpm.prism("body", 8, 0.07, height, color=P["cactus"], radius_top=0.06)
        lpm.paint(body, P["cactus_dark"], lambda c, n, i: i % 2 == 0 and abs(n.z) < 0.5)
        parts = [body, lpm.prism("top", 8, 0.06, 0.04, at=(0, 0, height), color=P["cactus"], radius_top=0.03)]
        for k, (side, z, up) in enumerate(arms):
            out = lpm.prism(f"out{k}", 6, 0.04, 0.1, color=P["cactus"])
            lpm.rotate(out, 90 * side, "Y")
            lpm.move(out, 0, 0, z)
            arm = lpm.prism(f"arm{k}", 6, 0.04, up, at=(0.1 * side, 0, z - 0.04), color=P["cactus"], radius_top=0.032)
            lpm.paint(arm, P["cactus_dark"], lambda c, n, i: i % 2 == 0 and abs(n.z) < 0.5)
            parts += [out, arm]
        return parts
    return build


def mushroom(name, at, height, cap, cap_color, spots):
    x, y, z = at
    parts = [lpm.prism(f"{name}s", 6, cap * 0.32, height, at=at, color=P["stem"], radius_top=cap * 0.26)]
    head = lpm.lathe(f"{name}c", [(cap * 0.3, 0), (cap, 0.02), (cap * 0.8, cap * 0.5), (0, cap * 0.7)], segments=8, at=(x, y, z + height * 0.9), color=P[cap_color])
    lpm.paint(head, P["stem"], lambda c, n, i: n.z < -0.5)
    if spots:
        lpm.paint(head, P["white"], lambda c, n, i: n.z > 0 and i % 3 == 0)
    return parts + [head]


def mushrooms(color, kind):
    spots = color == "red"
    cap = "red" if spots else "tan"

    def build(rng):
        if kind == "single":
            return mushroom("m", (0, 0, 0), 0.08 if spots else 0.05, 0.09, cap, spots)
        if kind == "tall":
            return mushroom("m", (0, 0, 0), 0.18, 0.06, cap, spots)
        return [p for k, (x, y, h, c) in enumerate(((0, 0, 0.15, 0.09), (0.09, 0.05, 0.08, 0.06), (-0.06, 0.08, 0.05, 0.05))) for p in mushroom(f"m{k}", (x, y, 0), h, c, cap, spots)]
    return build


def ground_grass(rng):
    return [lpm.box("ground", (1.0, 1.0, 0.01), color=P["grass"])]


MODELS = {f"flower_{color}{kind}": flowers(color, kind) for color in FLOWER_HEIGHT for kind in "ABC"}
MODELS.update({
    "grass": lambda rng: tuft(rng, 12, 0.16, 0.25),
    "grass_large": lambda rng: tuft(rng, 20, 0.19, 0.25),
    "grass_leafs": leafs(5, 0.12),
    "grass_leafsLarge": leafs(9, 0.24),
    "ground_grass": ground_grass,
    "plant_bush": bush([(0, 0, 0.2, 0.24)]),
    "plant_bushLarge": bush([(-0.06, 0, 0.14, 0.24), (0.08, 0.04, 0.11, 0.18), (0.0, -0.08, 0.1, 0.15)]),
    "plant_bushSmall": bush([(0, 0, 0.17, 0.21)]),
    "plant_bushTriangle": bush([(0, 0, 0.2, 0.3)], triangle=True),
    "plant_bushLargeTriangle": bush([(-0.08, 0, 0.17, 0.17), (0.1, 0.06, 0.13, 0.13), (0.02, -0.12, 0.11, 0.11)], triangle=True),
    "plant_flatShort": flat_plant(7, 0.15, 45),
    "plant_flatTall": flat_plant(6, 0.2, 62),
    "lily_large": lily(True),
    "lily_small": lily(False),
    "cactus_short": cactus(0.45, [(1, 0.25, 0.14)]),
    "cactus_tall": cactus(0.7, [(1, 0.3, 0.18), (-1, 0.42, 0.16)]),
    **{f"mushroom_{color}{suffix}": mushrooms(color, kind) for color in ("red", "tan") for suffix, kind in (("", "single"), ("Group", "group"), ("Tall", "tall"))},
})

if __name__ == "__main__":
    export_all(MODELS, P, budget=400)
