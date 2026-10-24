import os
import random
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(REPO, "tools", "blender"))
import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))


def requested(model_ids):
    """The model ids named after `--` on the command line, or all of them."""
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return [model_id for model_id in model_ids if not args or model_id in args]


def export_all(models, palette, budget, **finish):
    """models: {model_id: builder(rng) -> parts}. Each model gets its own seeded rng, so a rebuild is identical."""
    for model_id in requested(models):
        lpm.reset()
        ob = lpm.finish(model_id, models[model_id](random.Random(model_id)), palette, budget=budget, **finish)
        lpm.export_glb(ob, os.path.join(OUT_DIR, model_id, model_id))
