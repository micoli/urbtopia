import math
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {"id": "industrial-building-j", "footprint": (1, 2), "style": "urbtopia"}
CORNER = building_lib.STYLES[SPEC["style"]]["corner"]
POWERHOUSE_X = -0.21
PENSTOCKS = {1: ((0.22, 0.075),), 2: ((0.15, 0.06), (0.33, 0.06)), 3: ((0.06, 0.05), (0.2, 0.05), (0.34, 0.05))}


def window_frames(lpm, colors, thick=0.012):
    """Thin surrounds on the four sides of the two powerhouse windows, like the coal plant."""
    frames = []
    for side, name in ((-1, "left"), (1, "right")):
        cx, bottom, width, height = POWERHOUSE_X + side * 0.12, 0.25, 0.12, 0.15
        frames.append(lpm.box(f"window_frame_{name}_left", (thick, 0.04, height + 2 * thick), at=(cx - width / 2 - thick / 2, -0.33, bottom - thick), color=colors["uframe"]))
        frames.append(lpm.box(f"window_frame_{name}_right", (thick, 0.04, height + 2 * thick), at=(cx + width / 2 + thick / 2, -0.33, bottom - thick), color=colors["uframe"]))
        frames.append(lpm.box(f"window_frame_{name}_top", (width + 2 * thick, 0.04, thick), at=(cx, -0.33, bottom + height), color=colors["uframe"]))
        frames.append(lpm.box(f"window_frame_{name}_bottom", (width + 2 * thick, 0.04, thick), at=(cx, -0.33, bottom - thick), color=colors["uframe"]))
    return frames


def rounded_outline(width, depth, radius, cx, cy):
    """Same corner arcs as building_lib.rounded_block, as a closed outline."""
    outline = []
    for corner_x, corner_y, start in ((1, -1, -90), (1, 1, 0), (-1, 1, 90), (-1, -1, 180)):
        for step in (0, 45, 90):
            angle = math.radians(start + step)
            outline.append((cx + corner_x * (width / 2 - radius) + radius * math.cos(angle), cy + corner_y * (depth / 2 - radius) + radius * math.sin(angle)))
    return outline


def basin_ring(name, width, depth, height, thickness, color, at):
    """Walls of a basin as one rounded ring, with the same corner ratio as the houses."""
    cx, cy, z = at
    radius = CORNER * min(width, depth)
    outer = rounded_outline(width, depth, radius, cx, cy)
    inner = rounded_outline(width - 2 * thickness[0], depth - 2 * thickness[1], radius / 2, cx, cy)
    count = len(outer)
    verts = [(x, y, z) for x, y in outer + inner] + [(x, y, z + height) for x, y in outer + inner]
    top = 2 * count
    faces = []
    for i in range(count):
        j = (i + 1) % count
        faces.append((i, j, top + j, top + i))
        faces.append((count + j, count + i, top + count + i, top + count + j))
        faces.append((top + i, top + j, top + count + j, top + count + i))
        faces.append((j, i, count + i, count + j))
    return building_lib.lpm._object(name, building_lib._bm(verts, faces), color)


def build_plant(export=True, out_dir=None, tier=1, model_id=None, tones=None):
    model_id = model_id or SPEC["id"]
    accent_name = "vtone1"
    from mathutils import Vector

    lpm = building_lib.lpm
    lpm.reset()
    model_spec = {"id": model_id, "style": SPEC["style"], **({"tones": tones} if tones else {})}
    entries = building_lib.palette_for(model_spec, SPEC["style"])
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    colors = {name: palette[name] for name, _ in entries}
    parts = [
        building_lib.rounded_block("upper_reservoir_floor", 0.90, 0.72, 0.08, colors["uslab"], CORNER, at=(0, 0.55, 0.40)),
        lpm.box("upper_reservoir_support_front_left", (0.10, 0.12, 0.40), at=(-0.33, 0.30, 0.0), color=colors["greygreen"]),
        lpm.box("upper_reservoir_support_front_right", (0.10, 0.12, 0.40), at=(0.33, 0.30, 0.0), color=colors["greygreen"]),
        lpm.box("upper_reservoir_support_back_left", (0.10, 0.12, 0.40), at=(-0.33, 0.80, 0.0), color=colors["greygreen"]),
        lpm.box("upper_reservoir_support_back_right", (0.10, 0.12, 0.40), at=(0.33, 0.80, 0.0), color=colors["greygreen"]),
        lpm.box("upper_water", (0.70, 0.53, 0.14), at=(0, 0.55, 0.48), color=colors["aqua"]),
        building_lib.rounded_block("lower_reservoir_floor", 0.88, 0.50, 0.11, colors["uslab"], CORNER, at=(0, -0.67, 0.0)),
        lpm.box("lower_water", (0.68, 0.31, 0.04), at=(0, -0.67, 0.11), color=colors["aqua"]),
        basin_ring("upper_walls", 0.90, 0.72, 0.18, (0.08, 0.08), colors["offwhite"], (0, 0.55, 0.48)),
        basin_ring("lower_walls", 0.88, 0.50, 0.18, (0.10, 0.08), colors["offwhite"], (0, -0.67, 0.11)),
        lpm.box("powerhouse", (0.40, 0.52, 0.43), at=(POWERHOUSE_X, -0.06, 0.0), color=colors["offwhite"]),
        lpm.box("powerhouse_roof", (0.48, 0.60, 0.08), at=(POWERHOUSE_X, -0.06, 0.43), color=colors["slate_dark"]),
        lpm.box("powerhouse_window_left", (0.12, 0.025, 0.15), at=(POWERHOUSE_X - 0.12, -0.335, 0.25), color=colors["glass_blue"]),
        lpm.box("powerhouse_window_right", (0.12, 0.025, 0.15), at=(POWERHOUSE_X + 0.12, -0.335, 0.25), color=colors["glass_blue"]),
        *window_frames(lpm, colors),
        lpm.prism("powerhouse_vent", 8, 0.07, 0.10, at=(POWERHOUSE_X, -0.06, 0.51), color=colors["utrim"]),
    ]

    upper_water_level = 0.48 + 0.14
    lower_water_level = 0.11 + 0.04

    def pipe_segment(name, start, end, radius, color):
        direction = end - start
        length = direction.length
        rotation = Vector((0, 0, 1)).rotation_difference(direction.normalized())
        midpoint = (start + end) / 2
        pipe = lpm.prism(name, 8, radius, length, at=(0, 0, -length / 2), color=color)
        for vertex in pipe.data.vertices:
            vertex.co = rotation @ Vector(vertex.co) + midpoint
        return pipe

    for number, (x, radius) in enumerate(PENSTOCKS[tier]):
        penstock_start = Vector((x, 0.34, upper_water_level))
        penstock_end = Vector((x, -0.58, lower_water_level))
        penstock_direction = penstock_end - penstock_start
        suffix = "" if tier == 1 else f"_{number}"
        parts.append(pipe_segment(f"penstock{suffix}", penstock_start, penstock_end, radius, colors["slate_dark"]))
        for index, position in enumerate((0.28, 0.72)):
            center = penstock_start + penstock_direction * position
            half_length = 0.035
            parts.append(pipe_segment(f"penstock_collar{suffix}_{index}", center - penstock_direction.normalized() * half_length, center + penstock_direction.normalized() * half_length, radius + 0.02, colors[accent_name]))

    vertices = []
    faces = []
    face_colors = []
    for part in parts:
        offset = len(vertices)
        vertices.extend(tuple(vertex.co) for vertex in part.data.vertices)
        color_attr = part.data.attributes.get("lpm_color")
        for polygon in part.data.polygons:
            faces.append(tuple(offset + index for index in polygon.vertices))
            face_colors.append(color_attr.data[polygon.index].value if color_attr else 0)

    mesh = lpm.bpy.data.meshes.new(model_id)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    color_attr = mesh.attributes.new("lpm_color", "INT", "FACE")
    uv = mesh.uv_layers.new(name="UVMap")
    for polygon, color in zip(mesh.polygons, face_colors):
        color_attr.data[polygon.index].value = color
        u, v = palette.uv(color)
        for loop_index in polygon.loop_indices:
            uv.data[loop_index].uv = (u, v)
        polygon.use_smooth = False
    mesh.materials.append(palette.material(model_id))

    collection = lpm.bpy.data.collections.get("COL_LowPoly")
    if collection is None:
        collection = lpm.bpy.data.collections.new("COL_LowPoly")
        lpm.bpy.context.scene.collection.children.link(collection)
    model = lpm.bpy.data.objects.new(model_id, mesh)
    collection.objects.link(model)
    model["footprint_x"], model["footprint_y"] = SPEC["footprint"]
    for part in parts:
        lpm.bpy.data.objects.remove(part, do_unlink=True)
    if not export:
        return model
    report = building_lib.export_model(model, model_spec, out_dir or os.path.dirname(os.path.abspath(__file__)))
    report["expected_footprint"] = list(SPEC["footprint"])
    return report
