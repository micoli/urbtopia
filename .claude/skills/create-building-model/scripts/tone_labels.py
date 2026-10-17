"""
tone_labels.py - pure Python (no Blender): the name and swatch color of each tone of a model, from its tones table.

The primary role cell of a tone is the first of `vtone1`, `vtone3`, `vtone2` that the first tone sets; its color gives the
swatch (a `#rrggbb`) and its palette name gives the color name (the game translates `color.<name>`).
"""

PRIMARY_CELLS = ("vtone1", "vtone3", "vtone2")
NAMES = {"uroof": "mint", "uwall": "white"}


def tone_labels(tones, entries):
    """{tone: {"name": ..., "color": "#rrggbb"}} for every tone of `tones`; `entries` is [(palette name, hex)]."""
    by_name = dict(entries)
    cell = next((c for c in PRIMARY_CELLS if c in tones["a"]), None)
    labels = {}
    for tone, colors in tones.items():
        value = colors[cell] if cell else by_name["uroof"]
        hex_ = value if value.startswith("#") else by_name[value]
        labels[tone] = {"name": value if not value.startswith("#") else "custom", "color": hex_.lower()}
        labels[tone]["name"] = NAMES.get(labels[tone]["name"], labels[tone]["name"])
    return labels
