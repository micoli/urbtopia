import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

P = lpm.Palette([
    ("cap", "#b98a5a", 0.0, 0.8), ("cap_dark", "#9b6e44", 0.0, 0.8), ("cap_light", "#d4a974", 0.0, 0.8),
    ("stem", "#f1e8d6", 0.0, 0.9), ("gills", "#e0cfae", 0.0, 0.9), ("stub_top", "#d9cfb8", 0.0, 0.9),
])

LAYOUT = [(-0.23, -0.18, 1.0), (0.05, -0.26, 0.85), (0.25, -0.11, 1.1), (-0.11, 0.02, 1.2), (0.18, 0.18, 0.9), (-0.25, 0.2, 0.8), (0.0, 0.27, 1.0)]


def mushroom(name, at, stem_height, cap_radius, cap_height, rng, sides=6):
    x, y, _ = at
    stem = lpm.prism(f"{name}_stem", sides, cap_radius * 0.3, stem_height, at=(x, y, 0), color=P["stem"], radius_top=cap_radius * 0.24)
    profile = [(cap_radius * 0.3, 0), (cap_radius, cap_height * 0.12), (cap_radius * 0.85, cap_height * 0.6), (cap_radius * 0.4, cap_height * 0.95), (0.005, cap_height)]
    cap = lpm.lathe(f"{name}_cap", profile, segments=sides, at=(x, y, stem_height * 0.88), color=P["cap"])
    lpm.paint(cap, P["gills"], lambda c, n, i: n.z < -0.4)
    lpm.paint(cap, P["cap_light"], lambda c, n, i: n.z > 0.75)
    lpm.paint(cap, P["cap_dark"], lambda c, n, i: i % 3 == 0 and abs(n.z) < 0.6)
    lpm.rotate(cap, rng.uniform(0, 60), "Z", about=(x, y, 0))
    return [stem, cap]


def field(rng, stem, radius, height, sides=6):
    parts = []
    for k, (x, y, scale) in enumerate(LAYOUT):
        parts += mushroom(f"m{k}", (x * 0.92 + rng.uniform(-0.02, 0.02), y * 0.92 + rng.uniform(-0.02, 0.02), 0), stem * scale, radius * scale, height * scale, rng, sides)
    return parts


def stage_1(rng):
    return field(rng, 0.045, 0.028, 0.025, sides=4)


def stage_2(rng):
    return field(rng, 0.07, 0.05, 0.045, sides=5)


def stage_3(rng):
    return field(rng, 0.1, 0.08, 0.065)


def stage_4(rng):
    return field(rng, 0.15, 0.115, 0.085)


def harvested(rng):
    parts = []
    for k, (x, y, scale) in enumerate(LAYOUT):
        px, py = x * 0.92, y * 0.92
        parts.append(lpm.prism(f"stub{k}", 6, 0.03, 0.03 + 0.012 * (k % 3), at=(px, py, 0), color=P["stem"], radius_top=0.026))
        parts.append(lpm.prism(f"stub{k}_top", 6, 0.026, 0.006, at=(px, py, 0.03 + 0.012 * (k % 3)), color=P["stub_top"]))
    return parts


def crop(rng):
    parts = []
    for k, (x, y, scale) in enumerate(((-0.1, -0.06, 1.0), (0.1, -0.04, 0.9), (0.0, 0.1, 1.1))):
        parts += mushroom(f"c{k}", (x, y, 0), 0.12 * scale, 0.1 * scale, 0.075 * scale, rng)
    return parts


MODELS = {"mushroom-1": stage_1, "mushroom-2": stage_2, "mushroom-3": stage_3, "mushroom-4": stage_4, "mushroom-harvested": harvested, "mushroom-crop": crop}

if __name__ == "__main__":
    model_lib.export_all(MODELS, P, 800, OUT_DIR)
