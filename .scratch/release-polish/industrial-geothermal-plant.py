import os
import sys

REPO = os.path.abspath(os.path.dirname(__file__))
while not os.path.isdir(os.path.join(REPO, ".claude")):
    parent = os.path.dirname(REPO)
    if parent == REPO:
        raise RuntimeError("Could not find the repository root")
    REPO = parent
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {"id": "industrial-detail-tank-large", "footprint": (1, 1), "style": "urbtopia"}


def build_geothermal(export=False, out_dir=None):
    lpm = building_lib.lpm
    entries = building_lib.use_palette(building_lib.STYLES[SPEC["style"]])
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    colors = {name: palette[name] for name, _ in entries}
    parts = [
        lpm.box("plant_housing", (0.72, 0.56, 0.40), at=(0, 0.02, 0.05), color=colors["offwhite"]),
        lpm.box("plant_roof", (0.78, 0.62, 0.08), at=(0, 0.02, 0.45), color=colors["slate_dark"]),
        lpm.box("plant_door", (0.14, 0.025, 0.27), at=(0, -0.272, 0.06), color=colors["udark"]),
        lpm.box("plant_window_left", (0.12, 0.025, 0.12), at=(-0.22, -0.272, 0.25), color=colors["glass_blue"]),
        lpm.box("plant_window_right", (0.12, 0.025, 0.12), at=(0.22, -0.272, 0.25), color=colors["glass_blue"]),
        lpm.prism("separator_left", 10, 0.13, 0.34, at=(-0.18, 0.02, 0.53), color=colors["grey"]),
        lpm.prism("separator_right", 10, 0.13, 0.34, at=(0.18, 0.02, 0.53), color=colors["grey"]),
        lpm.box("steam_header", (0.44, 0.06, 0.06), at=(0, 0.02, 0.75), color=colors["slate"]),
        lpm.box("exhaust_stack", (0.12, 0.12, 0.40), at=(0, 0.22, 0.53), color=colors["slate_dark"]),
        lpm.prism("exhaust_cap", 8, 0.09, 0.05, at=(0, 0.22, 0.93), color=colors["tangerine"]),
    ]
    for name, x in (("left", -0.18), ("right", 0.18)):
        parts.append(lpm.prism(f"separator_band_{name}", 10, 0.145, 0.04, at=(x, 0.02, 0.78), color=colors["tangerine"]))

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
    if export:
        return lpm.export_glb(model, os.path.join(out_dir or os.path.dirname(os.path.abspath(__file__)), SPEC["id"]))
    return model


if __name__ == "__main__":
    print(build_geothermal(export=True))
