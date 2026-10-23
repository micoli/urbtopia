"""Paint the road palette textures: a 4x4 grid of 16 px flat cells, read by street_lib at each cell centre.

  python tools/blender/bl.py --script assets/managed-models/streets/make_textures.py
"""
import os

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
CELL_PX = 16
GRID = 4
# name: (column, row, colormap color, variation-a color); variation-a is the BRT corridor: pink gutters, darker asphalt.
CELLS = {
    "gutter": (0, 0, "#515566", "#ca707b"),
    "road": (1, 0, "#666b80", "#474a58"),
    "line": (2, 0, "#8e95b3", "#868ba1"),
    "curb": (3, 0, "#bdc5ed", "#bdc5ed"),
    "side": (0, 1, "#7d829c", "#7d829c"),
}


for name, index in (("colormap", 2), ("variation-a", 3)):
    size = CELL_PX * GRID
    image = bpy.data.images.new(name, size, size, alpha=False)
    image.colorspace_settings.name = "sRGB"
    pixels = [0.0, 0.0, 0.0, 1.0] * size * size
    for cell in CELLS.values():
        column, row = cell[0], cell[1]
        srgb = [int(cell[index][i:i + 2], 16) / 255 for i in (1, 3, 5)]
        for y in range(CELL_PX):
            for x in range(CELL_PX):
                at = ((size - 1 - (row * CELL_PX + y)) * size + column * CELL_PX + x) * 4
                pixels[at:at + 3] = srgb
    image.pixels = pixels
    image.filepath_raw = os.path.join(HERE, "Textures", f"{name}.png")
    image.file_format = "PNG"
    image.save()
    print("wrote", image.filepath_raw)
