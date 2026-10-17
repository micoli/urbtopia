"""
register_model.py - add or refresh the Model definition of a generated building in assets/models.json.

  python register_model.py <id> [--footprint W D] [--rotation-offset DEG]

The Model id is `buildings-<id>`, its file `buildings/<id>`. An existing entry keeps every field the
editor set (fit, scale, rotationOffset...); only `file`, `source` and `license` are enforced (and `tones`, read from the `<id>.tones.json` the build wrote), and the
footprint is set when given. A Model id is never renamed (ADR 0022), so an id that already exists with
another file is refused.
"""
import argparse
import json
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
MODELS = os.path.join(REPO, "assets", "models.json")


def main():
    parser = argparse.ArgumentParser(prog="register_model")
    parser.add_argument("id")
    parser.add_argument("--footprint", nargs=2, type=int, metavar=("W", "D"))
    parser.add_argument("--rotation-offset", type=int)
    args = parser.parse_args()

    glb = os.path.join(REPO, "assets", "managed-models", "buildings", args.id, f"{args.id}.glb")
    if not os.path.exists(glb):
        sys.exit(f"no generated model: {glb}")

    with open(MODELS) as handle:
        models = json.load(handle)
    model_id = f"buildings-{args.id}"
    file = f"buildings/{args.id}"
    entry = models.get(model_id)
    if entry and entry.get("file") != file:
        sys.exit(f"{model_id} already points to {entry.get('file')}: a Model id is never renamed")

    entry = {**(entry or {}), "file": file, "source": "managed", "license": "Own work"}
    if args.footprint:
        entry["footprint"] = list(args.footprint)
    if args.rotation_offset is not None:
        entry["rotationOffset"] = args.rotation_offset
    tones = os.path.join(os.path.dirname(glb), f"{args.id}.tones.json")
    if os.path.exists(tones):
        with open(tones) as handle:
            entry["tones"] = json.load(handle)
    models[model_id] = entry
    models = {"$schema": models["$schema"], **{key: models[key] for key in sorted(models) if key != "$schema"}}

    with open(MODELS, "w") as handle:
        json.dump(models, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    print(f"registered {model_id}; now run `npm run defs:generate`")


main()
