import os
import random
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(REPO, "tools", "blender"))
import lpm  # noqa: E402

P = lpm.Palette([
    ("bark", "#5a3a24", 0.0, 0.9), ("bark_dark", "#432a1a", 0.0, 0.9),
    ("needle", "#3f7a3a", 0.0, 0.8), ("needle_shade", "#30652f", 0.0, 0.8), ("needle_light", "#55934a", 0.0, 0.8),
])

# (trunk height, tiers, base radius, top radius, crown height, tier style)
# A pointed tier is a cone skirt; a round tier bulges like a cushion before closing on the next one.
VARIANTS = {
    "tree_pineDefaultA": (0.3, 4, 0.27, 0.12, 1.25, "pointed"),
    "tree_pineDefaultB": (0.3, 5, 0.27, 0.1, 1.25, "pointed"),
    "tree_pineGroundA": (0.0, 3, 0.25, 0.1, 0.9, "pointed"),
    "tree_pineGroundB": (0.0, 4, 0.25, 0.09, 1.03, "pointed"),
    "tree_pineRoundA": (0.25, 3, 0.33, 0.15, 1.12, "round"),
    "tree_pineRoundB": (0.22, 3, 0.29, 0.12, 0.98, "round"),
    "tree_pineRoundC": (0.25, 4, 0.26, 0.1, 1.0, "round"),
    "tree_pineRoundD": (0.2, 3, 0.26, 0.11, 0.88, "round"),
    "tree_pineRoundE": (0.25, 4, 0.28, 0.12, 1.0, "round"),
    "tree_pineRoundF": (0.25, 5, 0.28, 0.1, 1.0, "round"),
    "tree_pineSmallA": (0.22, 3, 0.25, 0.12, 0.75, "pointed"),
    "tree_pineSmallB": (0.25, 2, 0.2, 0.12, 0.76, "pointed"),
    "tree_pineSmallC": (0.3, 1, 0.2, 0.2, 0.82, "pointed"),
    "tree_pineSmallD": (0.28, 1, 0.18, 0.18, 0.68, "round"),
    "tree_pineTallA": (0.35, 2, 0.2, 0.15, 1.18, "pointed"),
    "tree_pineTallB": (0.45, 2, 0.2, 0.15, 1.48, "pointed"),
    "tree_pineTallC": (0.35, 3, 0.25, 0.14, 1.32, "pointed"),
    "tree_pineTallD": (0.45, 3, 0.25, 0.14, 1.63, "pointed"),
}


def tier(name, radius, z, height, style, rng):
    if style == "round":
        profile = [(radius * 0.7, 0), (radius, height * 0.18), (radius * 0.72, height * 0.55), (0, height)]
    else:
        profile = [(radius * 0.85, 0), (radius, height * 0.08), (0, height)]
    ob = lpm.lathe(name, profile, segments=8, at=(0, 0, z), color=P["needle"])
    lpm.rotate(ob, rng.uniform(0, 45), "Z")
    lpm.paint(ob, P["needle_shade"], lambda c, n, i: n.z < -0.3)
    lpm.paint(ob, P["needle_light"], lambda c, n, i: n.z > 0.45)
    return ob


def pine(trunk_height, tiers, base, top, crown, style, rng):
    parts = []
    if trunk_height:
        trunk = lpm.prism("trunk", 6, 0.05, trunk_height + 0.1, color=P["bark"], radius_top=0.035)
        lpm.paint(trunk, P["bark_dark"], lambda c, n, i: i == 1)
        parts.append(trunk)
    # Each tier overlaps the one below by a third of its height, so a tier height h covers the crown with n tiers.
    h = crown / (1 + (tiers - 1) * 2 / 3)
    for k in range(tiers):
        t = k / max(tiers - 1, 1)
        parts.append(tier(f"t{k}", base + (top - base) * t, trunk_height + k * h * 2 / 3, h, style, rng))
    return parts


def requested():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return [m for m in VARIANTS if not args or m in args]


out_dir = os.path.dirname(os.path.abspath(__file__))
for model_id in requested():
    lpm.reset()
    ob = lpm.finish(model_id, pine(*VARIANTS[model_id], random.Random(model_id)), P, budget=400)
    lpm.export_glb(ob, os.path.join(out_dir, model_id, model_id))
