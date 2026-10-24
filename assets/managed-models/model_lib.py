import os
import random
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(REPO, "tools", "blender"))
import lpm  # noqa: E402


def requested(model_ids):
    """The model ids named after `--` on the command line, or all of them."""
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return [model_id for model_id in model_ids if not args or model_id in args]


def fit_box(ob, low, high):
    """Stretch the mesh onto the bounding box low..high, so the model takes the place of the one it replaces."""
    me = ob.data
    for axis in range(3):
        values = [v.co[axis] for v in me.vertices]
        lo, hi = min(values), max(values)
        span = hi - lo
        for v in me.vertices:
            v.co[axis] = low[axis] + (v.co[axis] - lo) / span * (high[axis] - low[axis]) if span > 1e-9 else (low[axis] + high[axis]) / 2
    me.update()


def export_all(models, palette, budget, out_dir, boxes=None, **finish):
    """models: {model_id: builder(rng) -> parts}. Each model gets its own seeded rng, so a rebuild is identical.
    boxes: {model_id: ((x, y, z), (x, y, z))} in Blender axes, to stretch the model onto a given bounding box."""
    for model_id in requested(models):
        lpm.reset()
        ob = lpm.finish(model_id, models[model_id](random.Random(model_id)), palette, budget=budget, **finish)
        if boxes and model_id in boxes:
            fit_box(ob, *boxes[model_id])
        lpm.export_glb(ob, os.path.join(out_dir, model_id, model_id))
