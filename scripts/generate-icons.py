"""Generates the PWA icons in public/. Requires Pillow: python3 scripts/generate-icons.py"""
from PIL import Image, ImageDraw

BACKGROUND = (24, 28, 40)
GROUND = (146, 195, 111)
GROUND_EDGE = (111, 143, 90)
CUBE_TOP = (226, 230, 240)
CUBE_LEFT = (150, 158, 178)
CUBE_RIGHT = (96, 104, 128)
ACCENT = (53, 208, 127)
SCALE = 4


def iso_point(cx, cy, x, y, z, unit):
    """Projects grid coordinates (x right-down, y left-down, z up) on the 2D canvas."""
    return (cx + (x - y) * unit, cy + (x + y) * unit * 0.5 - z * unit)


def draw_cube(draw, cx, cy, x, y, size, height, unit):
    p = lambda px, py, pz: iso_point(cx, cy, px, py, pz, unit)
    top = [p(x, y, height), p(x + size, y, height), p(x + size, y + size, height), p(x, y + size, height)]
    left = [p(x, y + size, height), p(x + size, y + size, height), p(x + size, y + size, 0), p(x, y + size, 0)]
    right = [p(x + size, y, height), p(x + size, y + size, height), p(x + size, y + size, 0), p(x + size, y, 0)]
    draw.polygon(left, fill=CUBE_LEFT)
    draw.polygon(right, fill=CUBE_RIGHT)
    draw.polygon(top, fill=CUBE_TOP)


def render(size, rounded, content_ratio):
    pixels = size * SCALE
    image = Image.new('RGBA', (pixels, pixels), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    if rounded:
        draw.rounded_rectangle([0, 0, pixels - 1, pixels - 1], radius=pixels * 0.22, fill=BACKGROUND)
    else:
        draw.rectangle([0, 0, pixels, pixels], fill=BACKGROUND)

    unit = pixels * content_ratio / 6.2
    cx, cy = pixels / 2, pixels * 0.6
    ground = [iso_point(cx, cy, -2.2, -2.2, 0, unit), iso_point(cx, cy, 2.2, -2.2, 0, unit), iso_point(cx, cy, 2.2, 2.2, 0, unit), iso_point(cx, cy, -2.2, 2.2, 0, unit)]
    thickness = unit * 0.35
    draw.polygon([(x, y + thickness) for x, y in ground], fill=GROUND_EDGE)
    draw.polygon(ground, fill=GROUND)
    draw_cube(draw, cx, cy, -1.6, -1.4, 1.5, 3.1, unit)
    draw_cube(draw, cx, cy, 0.3, -0.2, 1.4, 1.7, unit)
    draw_cube(draw, cx, cy, -1.2, 0.7, 1.0, 0.9, unit)
    draw.ellipse([cx + unit * 1.5, cy - unit * 3.4, cx + unit * 2.5, cy - unit * 2.4], fill=ACCENT)
    return image.resize((size, size), Image.LANCZOS)


for name, size, rounded, ratio in [
    ('icon-192.png', 192, True, 0.68),
    ('icon-512.png', 512, True, 0.68),
    ('icon-maskable-512.png', 512, False, 0.56),
    ('apple-touch-icon.png', 180, False, 0.66),
]:
    render(size, rounded, ratio).save(f'public/{name}')
    print('wrote', name)
