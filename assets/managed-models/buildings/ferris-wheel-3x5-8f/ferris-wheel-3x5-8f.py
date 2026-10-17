import math
from pathlib import Path

import bpy


NAME = "ferris-wheel-3x5-8f"
WIDTH = 3.0
DEPTH = 5.0
HEIGHT = 2.24
WHEEL_Y = 0.72
WHEEL_RADIUS = 0.82
WHEEL_CENTER_Z = HEIGHT - WHEEL_RADIUS - 0.2145
PARTS = []


def material(name, color, metallic=0.0):
    value = bpy.data.materials.new(name)
    value.use_nodes = True
    value.diffuse_color = (*color, 1.0)
    value.metallic = metallic
    value.roughness = 0.72
    shader = next(node for node in value.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = 0.72
    return value


MATERIALS = {
    "deck": material("Ferris wheel | warm concrete", (0.48, 0.49, 0.44)),
    "frame": material("Ferris wheel | deep teal", (0.035, 0.23, 0.26), 0.15),
    "rim": material("Ferris wheel | sea glass", (0.08, 0.64, 0.61), 0.12),
    "accent": material("Ferris wheel | coral", (0.94, 0.24, 0.15)),
    "gold": material("Ferris wheel | golden yellow", (1.0, 0.66, 0.12)),
    "cream": material("Ferris wheel | cream", (0.95, 0.88, 0.67)),
    "glass": material("Ferris wheel | blue glass", (0.13, 0.48, 0.72), 0.1),
}


def finish_part(obj, name, color):
    obj.name = name
    obj.data.materials.append(MATERIALS[color])
    for polygon in obj.data.polygons:
        polygon.use_smooth = False
    PARTS.append(obj)
    return obj


def box(name, size, center, color):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish_part(obj, name, color)


def beam_xz(name, start, end, width, depth, y, color):
    ax, az = start
    bx, bz = end
    dx, dz = bx - ax, bz - az
    length = math.hypot(dx, dz)
    nx, nz = -dz / length * width / 2, dx / length * width / 2
    outline = [(ax + nx, az + nz), (bx + nx, bz + nz), (bx - nx, bz - nz), (ax - nx, az - nz)]
    verts = [(x, y - depth / 2, z) for x, z in outline] + [(x, y + depth / 2, z) for x, z in outline]
    faces = [(0, 3, 2, 1), (4, 5, 6, 7)]
    faces.extend((i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i) for i in range(4))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish_part(obj, name, color)


def polygon_ring(name, radius, width, depth, y, color, segments=16):
    for index in range(segments):
        a0 = 2 * math.pi * index / segments
        a1 = 2 * math.pi * (index + 1) / segments
        start = (math.cos(a0) * radius, WHEEL_CENTER_Z + math.sin(a0) * radius)
        end = (math.cos(a1) * radius, WHEEL_CENTER_Z + math.sin(a1) * radius)
        beam_xz(f"{name} {index + 1:02}", start, end, width, depth, y, color)


def build():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for mesh in list(bpy.data.meshes):
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh)
    for x in (-0.82, 0.82):
        beam_xz("front support", (x, 0.033), (0, WHEEL_CENTER_Z), 0.13, 0.16, WHEEL_Y - 0.22, "frame")
        beam_xz("rear support", (x, 0.033), (0, WHEEL_CENTER_Z), 0.13, 0.16, WHEEL_Y + 0.22, "frame")
    box("axle", (0.34, 0.34, 0.34), (0, WHEEL_Y, WHEEL_CENTER_Z), "gold")
    polygon_ring("front wheel rim", WHEEL_RADIUS, 0.075, 0.08, WHEEL_Y - 0.12, "rim")
    polygon_ring("rear wheel rim", WHEEL_RADIUS, 0.075, 0.08, WHEEL_Y + 0.12, "rim")

    spoke_count = 10
    for index in range(spoke_count):
        angle = 2 * math.pi * index / spoke_count
        end = (math.cos(angle) * (WHEEL_RADIUS - 0.04), WHEEL_CENTER_Z + math.sin(angle) * (WHEEL_RADIUS - 0.04))
        beam_xz("front spoke", (0, WHEEL_CENTER_Z), end, 0.045, 0.07, WHEEL_Y - 0.12, "cream")
        beam_xz("rear spoke", (0, WHEEL_CENTER_Z), end, 0.045, 0.07, WHEEL_Y + 0.12, "cream")

    gondola_colors = ["accent", "gold", "glass", "cream"]
    for index in range(10):
        angle = 2 * math.pi * index / 10 + math.pi / 2
        x = math.cos(angle) * (WHEEL_RADIUS + 0.1)
        z = WHEEL_CENTER_Z + math.sin(angle) * (WHEEL_RADIUS + 0.1)
        color = gondola_colors[index % len(gondola_colors)]
        box("gondola", (0.19, 0.2, 0.16), (x, WHEEL_Y, z), color)
        box("gondola roof", (0.22, 0.22, 0.035), (x, WHEEL_Y, z + 0.095), "frame")

    bpy.ops.object.select_all(action="DESELECT")
    for obj in PARTS:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = PARTS[0]
    bpy.ops.object.join()
    model = bpy.context.object
    model.name = NAME
    model.data.name = NAME
    for polygon in model.data.polygons:
        polygon.use_smooth = False

    model["footprint"] = [WIDTH, DEPTH]
    model["height_floors"] = 8
    model["height_units"] = HEIGHT
    model["front"] = "-Y"

    out_stem = Path(__file__).resolve().with_suffix("")
    out_stem.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    model.select_set(True)
    bpy.context.view_layer.objects.active = model
    bpy.ops.wm.save_as_mainfile(filepath=str(out_stem.with_suffix(".blend")))
    bpy.ops.export_scene.gltf(filepath=str(out_stem.with_suffix(".glb")), export_format="GLB", use_selection=True)
    print(f"MODEL_OUTPUT={out_stem}")
    print(f"MODEL_DIMENSIONS={tuple(round(value, 3) for value in model.dimensions)}")
    print(f"MODEL_TRIANGLES={sum(len(polygon.vertices) - 2 for polygon in model.data.polygons)}")


build()
