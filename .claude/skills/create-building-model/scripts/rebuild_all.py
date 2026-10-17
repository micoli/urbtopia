#!/usr/bin/env python3
"""Rebuild managed building models by running their recipes headless through tools/blender/bl.py.

  python .claude/skills/create-building-model/scripts/rebuild_all.py                 # every recipe
  python .../rebuild_all.py silo hotel                                               # ids containing any filter
  python .../rebuild_all.py --jobs 8 --dry-run
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
BUILDINGS = ROOT / "assets/managed-models/buildings"
BL = ROOT / "tools/blender/bl.py"


def recipes(filters: list[str]) -> list[Path]:
    found = sorted(p for p in BUILDINGS.glob("*/*.py") if p.parent.name == p.stem and p.with_suffix(".glb").exists())
    if not filters:
        return found
    return [p for p in found if any(f in p.stem for f in filters)]


def build(recipe: Path) -> tuple[Path, int, str]:
    run = subprocess.run(
        [sys.executable, str(BL), "--script", str(recipe), "--", "--out", str(recipe.with_suffix(""))],
        cwd=ROOT, capture_output=True, text=True,
    )
    return recipe, run.returncode, (run.stdout + run.stderr)[-1500:]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("filters", nargs="*", help="only recipes whose id contains one of these")
    parser.add_argument("--jobs", type=int, default=max(1, (os.cpu_count() or 2) // 2))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    todo = recipes(args.filters)
    if not todo:
        print("no recipe matches", file=sys.stderr)
        return 1
    if args.dry_run:
        print("\n".join(p.stem for p in todo))
        print(f"{len(todo)} recipes")
        return 0

    start = time.time()
    failures: list[tuple[Path, str]] = []
    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        futures = [pool.submit(build, p) for p in todo]
        for done, future in enumerate(as_completed(futures), 1):
            recipe, code, output = future.result()
            print(f"[{done}/{len(todo)}] {'ok  ' if code == 0 else 'FAIL'} {recipe.stem}", flush=True)
            if code != 0:
                failures.append((recipe, output))

    for backup in BUILDINGS.glob("*.blend1"):
        backup.unlink()
    print(f"\n{len(todo) - len(failures)}/{len(todo)} built in {time.time() - start:.0f}s")
    for recipe, output in failures:
        print(f"\n--- {recipe.stem} ---\n{output}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
