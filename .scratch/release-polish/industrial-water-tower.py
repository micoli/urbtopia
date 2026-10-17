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

SPEC = {"id": "industrial-water-tower", "footprint": (1, 1), "style": "urbtopia"}


def build_tower(tier=1, export=True, out_dir=None):
    from mathutils import Vector

    lpm = building_lib.lpm
    model_id = SPEC["id"] if tier == 1 else f"{SPEC['id']}-tier-{tier}"
    platform_height = {1: 0.74, 2: 1.10, 3: 1.40}[tier]
    elevation = platform_height - 0.74
    roof_base = 1.305 if tier == 1 else 1.26
    entries = building_lib.use_palette(building_lib.STYLES[SPEC["style"]])
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in entries])
    colors = {name: palette[name] for name, _ in entries}
    platform_outline = ((-0.34, -0.46), (0.34, -0.46), (0.46, -0.34), (0.46, 0.34), (0.34, 0.46), (-0.34, 0.46), (-0.46, 0.34), (-0.46, -0.34))
    platform_vertices = [(x, y, z) for z in (platform_height, platform_height + 0.08) for x, y in platform_outline]
    platform_faces = [tuple(reversed(range(8))), tuple(range(8, 16))]
    platform_faces.extend((i, (i + 1) % 8, (i + 1) % 8 + 8, i + 8) for i in range(8))
    platform = lpm._object("tower_platform", lpm._bm_from(platform_vertices, platform_faces), colors["slate_dark"])
    parts = [
        platform,
        lpm.prism("tank_shoulder", 10, 0.30, 0.10, at=(0, 0, 0.82 + elevation), color=colors["offwhite"], radius_top=0.36),
        lpm.prism("tank_body", 10, 0.36, 0.34, at=(0, 0, 0.92 + elevation), color=colors["offwhite"]),
        lpm.prism("tank_roof", 10, 0.38, 0.13, at=(0, 0, roof_base + elevation), color=colors["slate_dark"], radius_top=0.24),
        lpm.prism("tank_vent", 8, 0.07, 0.08, at=(0, 0, roof_base + elevation + 0.13), color=colors["utrim"]),
    ]
    if tier == 1:
        parts.append(lpm.prism("tank_rim", 10, 0.38, 0.045, at=(0, 0, 1.26 + elevation), color=colors["coral"]))
    else:
        band_heights = {2: (1.12, 1.22), 3: (1.05, 1.14, 1.23)}[tier]
        for index, height in enumerate(band_heights):
            parts.append(lpm.prism(f"tank_band_{index}", 10, 0.38, 0.045, at=(0, 0, height + elevation), color=colors["tangerine"]))

    leg_positions = ((-0.30, -0.30), (0.30, -0.30), (-0.30, 0.30), (0.30, 0.30))
    for index, (x, y) in enumerate(leg_positions):
        parts.append(lpm.prism(f"tower_leg_{index}", 6, 0.055, platform_height, at=(x, y, 0), color=colors["grey"], radius_top=0.045))

    def brace(name, start, end):
        start = Vector(start)
        end = Vector(end)
        direction = end - start
        length = direction.length
        center = (start + end) / 2
        rotation = Vector((0, 0, 1)).rotation_difference(direction.normalized())
        beam = lpm.box(name, (0.035, 0.035, length), at=(center.x, center.y, center.z - length / 2), color=colors["grey"])
        for vertex in beam.data.vertices:
            vertex.co = rotation @ (Vector(vertex.co) - center) + center
        return beam

    brace_top = platform_height - 0.04
    for face, y in (("front", -0.30), ("back", 0.30)):
        parts.append(brace(f"tower_brace_{face}_a", (-0.30, y, 0.10), (0.30, y, brace_top)))
        parts.append(brace(f"tower_brace_{face}_b", (0.30, y, 0.10), (-0.30, y, brace_top)))
    for face, x in (("left", -0.30), ("right", 0.30)):
        parts.append(brace(f"tower_brace_{face}_a", (x, -0.30, 0.10), (x, 0.30, brace_top)))
        parts.append(brace(f"tower_brace_{face}_b", (x, 0.30, 0.10), (x, -0.30, brace_top)))

    parts.extend((
        lpm.box("ladder_rail_left", (0.025, 0.025, platform_height), at=(-0.10, -0.39, 0.04), color=colors["slate_dark"]),
        lpm.box("ladder_rail_right", (0.025, 0.025, platform_height), at=(0.10, -0.39, 0.04), color=colors["slate_dark"]),
    ))
    rung_count = {1: 8, 2: 12, 3: 15}[tier]
    for index in range(rung_count):
        z = 0.08 + index * (0.085 if tier == 1 else 0.09)
        parts.append(lpm.box(f"ladder_rung_{index}", (0.20, 0.025, 0.025), at=(0, -0.39, z), color=colors["grey"]))

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
    if export:
        return lpm.export_glb(model, os.path.join(out_dir or os.path.dirname(os.path.abspath(__file__)), model_id))
    return model


if __name__ == "__main__":
    print(build_tower())
