import os
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {"id": "industrial-hydro-power-plant", "footprint": (1, 2), "style": "urbtopia"}
POWERHOUSE_X = -0.21


def build_plant():
    from mathutils import Vector

    lpm = building_lib.lpm
    entries = building_lib.use_palette(building_lib.STYLES[SPEC["style"]])
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    colors = {name: palette[name] for name, _ in entries}
    parts = [
        lpm.box("upper_reservoir_floor", (0.90, 0.72, 0.08), at=(0, 0.55, 0.40), color=colors["uslab"]),
        lpm.box("upper_reservoir_support_front_left", (0.10, 0.12, 0.40), at=(-0.33, 0.30, 0.0), color=colors["greygreen"]),
        lpm.box("upper_reservoir_support_front_right", (0.10, 0.12, 0.40), at=(0.33, 0.30, 0.0), color=colors["greygreen"]),
        lpm.box("upper_reservoir_support_back_left", (0.10, 0.12, 0.40), at=(-0.33, 0.80, 0.0), color=colors["greygreen"]),
        lpm.box("upper_reservoir_support_back_right", (0.10, 0.12, 0.40), at=(0.33, 0.80, 0.0), color=colors["greygreen"]),
        lpm.box("upper_water", (0.70, 0.53, 0.14), at=(0, 0.55, 0.48), color=colors["aqua"]),
        lpm.box("upper_wall_left", (0.08, 0.72, 0.18), at=(-0.41, 0.55, 0.48), color=colors["offwhite"]),
        lpm.box("upper_wall_right", (0.08, 0.72, 0.18), at=(0.41, 0.55, 0.48), color=colors["offwhite"]),
        lpm.box("upper_wall_back", (0.90, 0.08, 0.18), at=(0, 0.87, 0.48), color=colors["offwhite"]),
        lpm.box("upper_wall_front", (0.90, 0.08, 0.18), at=(0, 0.23, 0.48), color=colors["offwhite"]),
        lpm.box("lower_reservoir_floor", (0.88, 0.50, 0.11), at=(0, -0.67, 0.0), color=colors["uslab"]),
        lpm.box("lower_water", (0.68, 0.31, 0.04), at=(0, -0.67, 0.11), color=colors["aqua"]),
        lpm.box("lower_wall_left", (0.10, 0.50, 0.18), at=(-0.39, -0.67, 0.11), color=colors["offwhite"]),
        lpm.box("lower_wall_right", (0.10, 0.50, 0.18), at=(0.39, -0.67, 0.11), color=colors["offwhite"]),
        lpm.box("lower_wall_front", (0.88, 0.08, 0.18), at=(0, -0.88, 0.11), color=colors["offwhite"]),
        lpm.box("lower_wall_back", (0.88, 0.08, 0.18), at=(0, -0.46, 0.11), color=colors["offwhite"]),
        lpm.box("powerhouse", (0.40, 0.52, 0.43), at=(POWERHOUSE_X, -0.06, 0.0), color=colors["offwhite"]),
        lpm.box("powerhouse_roof", (0.48, 0.60, 0.08), at=(POWERHOUSE_X, -0.06, 0.43), color=colors["slate_dark"]),
        lpm.box("powerhouse_window_left", (0.12, 0.025, 0.15), at=(POWERHOUSE_X - 0.12, -0.335, 0.25), color=colors["glass_blue"]),
        lpm.box("powerhouse_window_right", (0.12, 0.025, 0.15), at=(POWERHOUSE_X + 0.12, -0.335, 0.25), color=colors["glass_blue"]),
        lpm.prism("powerhouse_vent", 8, 0.07, 0.10, at=(POWERHOUSE_X, -0.06, 0.51), color=colors["utrim"]),
    ]

    upper_water_level = 0.48 + 0.14
    lower_water_level = 0.11 + 0.04
    penstock_start = Vector((0.22, 0.34, upper_water_level))
    penstock_end = Vector((0.22, -0.58, lower_water_level))
    penstock_direction = penstock_end - penstock_start

    def pipe_segment(name, start, end, radius, color):
        direction = end - start
        length = direction.length
        rotation = Vector((0, 0, 1)).rotation_difference(direction.normalized())
        midpoint = (start + end) / 2
        pipe = lpm.prism(name, 8, radius, length, at=(0, 0, -length / 2), color=color)
        for vertex in pipe.data.vertices:
            vertex.co = rotation @ Vector(vertex.co) + midpoint
        return pipe

    parts.append(pipe_segment("penstock", penstock_start, penstock_end, 0.075, colors["slate_dark"]))
    for index, position in enumerate((0.28, 0.72)):
        center = penstock_start + penstock_direction * position
        half_length = 0.035
        parts.append(pipe_segment(f"penstock_collar_{index}", center - penstock_direction.normalized() * half_length, center + penstock_direction.normalized() * half_length, 0.095, colors["coral"]))

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

    mesh = lpm.bpy.data.meshes.new(SPEC["id"])
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
    mesh.materials.append(palette.material(SPEC["id"]))

    collection = lpm.bpy.data.collections.get("COL_LowPoly")
    if collection is None:
        collection = lpm.bpy.data.collections.new("COL_LowPoly")
        lpm.bpy.context.scene.collection.children.link(collection)
    model = lpm.bpy.data.objects.new(SPEC["id"], mesh)
    collection.objects.link(model)
    model["footprint_x"], model["footprint_y"] = SPEC["footprint"]
    for part in parts:
        lpm.bpy.data.objects.remove(part, do_unlink=True)
    return model


if __name__ == "__main__":
    print(build_plant())
