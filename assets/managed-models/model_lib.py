import os
import random
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(REPO, "tools", "blender"))
import bmesh  # noqa: E402
import lpm  # noqa: E402


def requested(model_ids):
    """The model ids named after `--` on the command line, or all of them."""
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return [model_id for model_id in model_ids if not args or model_id in args]


def fillet(ob, width, segments=2, min_angle=0.35):
    """Round the sharp edges of a single-coloured part with a small bevel."""
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    layer = bm.faces.layers.int["lpm_color"]
    bm.faces.ensure_lookup_table()
    color = bm.faces[0][layer]
    edges = [e for e in bm.edges if len(e.link_faces) == 2 and e.calc_face_angle(0) > min_angle]
    bmesh.ops.bevel(bm, geom=edges, offset=width, offset_type="OFFSET", segments=segments, profile=0.5, affect="EDGES", clamp_overlap=True)
    for f in bm.faces:
        f[layer] = color
        f.smooth = False
    bm.to_mesh(ob.data)
    bm.free()
    return ob


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
