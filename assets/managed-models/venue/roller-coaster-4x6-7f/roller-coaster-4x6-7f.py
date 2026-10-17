import math
import os
import sys

import bpy
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
sys.path.insert(0, os.path.join(ROOT, "tools", "blender"))
from lpm import export_glb


def material(name, color, metallic=0.0, roughness=0.55):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    shader = next(node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return mat


TRACK = material("Track | vermilion steel", (0.72, 0.12, 0.10), 0.35, 0.38)
SUPPORT = material("Supports | deep blue steel", (0.12, 0.27, 0.42), 0.45, 0.4)
RAIL = material("Rail | cool silver", (0.65, 0.72, 0.76), 0.55, 0.34)
STATION_ROOF = material("Station roof | sky blue", (0.26, 0.70, 0.92), 0.12, 0.42)
PLATFORM = material("Station platform | dark green", (0.035, 0.22, 0.09), 0.08, 0.62)


def tube(name, points, radius, mat, resolution=8, cyclic=False):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 2
    curve.bevel_depth = radius
    curve.bevel_resolution = 1
    curve.use_fill_caps = True
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for point, co in zip(spline.points, points):
        point.co = (*co, 1.0)
    spline.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.select_set(False)
    return obj


def beam(name, a, b, radius, mat, vertices=8):
    start, end = Vector(a), Vector(b)
    delta = end - start
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=delta.length, location=(start + end) / 2)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = delta.to_track_quat("Z", "Y")
    obj.data.materials.append(mat)
    return obj


def box(name, dimensions, location, mat):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    return obj


def gable_roof(name, center_x, y0, y1, half_width, eave_z, ridge_z, thickness, mat):
    vertices = []
    faces = []
    for side in (-1, 1):
        eave_x = center_x + side * half_width
        if side < 0:
            top = [(eave_x, y0, eave_z), (center_x, y0, ridge_z), (center_x, y1, ridge_z), (eave_x, y1, eave_z)]
        else:
            top = [(center_x, y0, ridge_z), (eave_x, y0, eave_z), (eave_x, y1, eave_z), (center_x, y1, ridge_z)]
        bottom = [(x, y, z - thickness) for x, y, z in top]
        offset = len(vertices)
        vertices.extend(top + bottom)
        faces.extend([
            tuple(offset + index for index in range(4)),
            tuple(offset + index for index in (7, 6, 5, 4)),
        ])
        for index in range(4):
            next_index = (index + 1) % 4
            faces.append((offset + index, offset + next_index, offset + next_index + 4, offset + index + 4))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def bezier_points(anchors, steps=12):
    points = [Vector(point) for point in anchors]
    result = []
    for index in range(len(points) - 1):
        p0 = points[max(0, index - 1)]
        p1 = points[index]
        p2 = points[index + 1]
        p3 = points[min(len(points) - 1, index + 2)]
        for step in range(steps):
            t = step / steps
            t2, t3 = t * t, t * t * t
            value = 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
            result.append(tuple(value))
    result.append(tuple(points[-1]))
    return result


def cubic_bezier_points(start, control_a, control_b, end, steps=12):
    points = [Vector(point) for point in (start, control_a, control_b, end)]
    result = []
    for step in range(steps):
        t = step / steps
        inverse = 1.0 - t
        value = inverse ** 3 * points[0] + 3 * inverse ** 2 * t * points[1] + 3 * inverse * t ** 2 * points[2] + t ** 3 * points[3]
        result.append(tuple(value))
    result.append(tuple(points[-1]))
    return result


def join_by_material(objects, name):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    result = bpy.context.object
    result.name = name
    return result


def add_support_pairs(path, parts, spacing=1.25, skip_station=False):
    points = [Vector(point) for point in path]
    lengths = [(points[index + 1] - points[index]).length for index in range(len(points) - 1)]
    total_length = sum(lengths)
    if total_length < spacing:
        return

    station = 0.65
    while station < total_length - 0.45:
        traversed = 0.0
        for index, length in enumerate(lengths):
            if traversed + length < station:
                traversed += length
                continue
            fraction = (station - traversed) / max(length, 1e-6)
            point = points[index].lerp(points[index + 1], fraction)
            tangent = points[index + 1] - points[index]
            planar = Vector((tangent.x, tangent.y, 0.0))
            if planar.length < 1e-5:
                break
            normal = Vector((-planar.y, planar.x, 0.0)).normalized()
            if skip_station and abs(point.x - 1.15) < 0.1 and -0.55 <= point.y <= 0.95:
                break
            bottom = Vector((tangent.x * tangent.z / (planar.length * tangent.length), tangent.y * tangent.z / (planar.length * tangent.length), -planar.length / tangent.length))
            crossbar_center = point + bottom * (0.085 + 0.04)
            for side in (-1, 1):
                foot = crossbar_center + normal * side * 0.16
                top = foot.copy()
                foot.z = 0.09
                parts.append(beam("Paired vertical support", foot, top, 0.09, SUPPORT))
            cross_a = crossbar_center - normal * 0.16
            cross_b = crossbar_center + normal * 0.16
            parts.append(beam("Track support crossbar", cross_a, cross_b, 0.04, SUPPORT))
            break
        station += spacing


def build():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    track_parts = []
    support_parts = []

    approach = bezier_points([(-0.10, -2.40, 0.68), (-1.15, -1.70, 0.48), (-1.75, -1.1, 0.55), (-0.85, -0.42, 0.62), (0.086, -0.32, 0.705)])
    loop_points = []
    center_x, center_z, radius = -0.10, 1.40, 0.72
    for step in range(96):
        progress = step / 95
        angle = math.radians(285 + 330 * progress)
        loop_points.append((center_x + radius * math.cos(angle), -0.32 + 0.64 * progress, center_z + radius * math.sin(angle)))
    loop_points[0] = approach[-1]

    loop_exit = Vector(loop_points[-1])
    exit_direction = (loop_exit - Vector(loop_points[-2])).normalized()
    straight_end = loop_exit + exit_direction * 0.55
    exit_straight = [tuple(loop_exit.lerp(straight_end, step / 8)) for step in range(9)]
    circle_center_y = 1.10
    circle_start = Vector((-0.082, circle_center_y + 0.75 * math.sin(math.radians(130)), 0.60))
    circle_tangent = Vector((math.sin(math.radians(130)), -math.cos(math.radians(130)), -0.035)).normalized()
    exit_transition = cubic_bezier_points(straight_end, straight_end + exit_direction * 0.28, circle_start - circle_tangent * 0.30, circle_start)
    return_arc = []
    for step in range(25):
        angle = math.radians(130 - 130 * step / 24)
        return_arc.append((0.4 + 0.75 * math.cos(angle), circle_center_y + 0.75 * math.sin(angle), 0.60 - 0.08 * step / 24))
    exit_run = exit_straight + exit_transition[1:] + return_arc[1:]
    loop_points[-1] = exit_run[0]
    return_run = bezier_points([(1.15, circle_center_y, 0.52), (1.15, -1.4, 0.45), (0.95, -1.9, 0.48), (0.65, -2.55, 0.60), (-0.10, -2.40, 0.68)])
    route = approach + loop_points[1:] + exit_run[1:] + return_run[1:-1]
    track_parts.append(tube("Single continuous closed circuit", route, 0.085, TRACK, 10, cyclic=True))

    for path in (approach, exit_run, return_run):
        for index in range(3, len(path) - 1, 14):
            x, y, z = path[index]
            previous = Vector(path[index - 1])
            following = Vector(path[index + 1])
            tangent = following - previous
            planar_length = math.hypot(tangent.x, tangent.y)
            normal = Vector((0.0, 1.0, 0.0)) if planar_length < 1e-5 else Vector((-tangent.y / planar_length, tangent.x / planar_length, 0.0))
            bottom = Vector((tangent.x * tangent.z / (planar_length * tangent.length), tangent.y * tangent.z / (planar_length * tangent.length), -planar_length / tangent.length)) if planar_length > 1e-5 else Vector((0.0, 0.0, -1.0))
            tie_center = Vector((x, y, z)) + bottom * (0.085 + 0.024)
            track_parts.append(beam("Track cross tie", tie_center - normal * 0.13, tie_center + normal * 0.13, 0.024, RAIL))

    add_support_pairs(approach, support_parts)
    add_support_pairs(exit_run, support_parts, skip_station=True)
    add_support_pairs(return_run, support_parts, skip_station=True)

    left_loop_side = min(loop_points, key=lambda point: point[0])
    right_loop_side = max(loop_points, key=lambda point: point[0])
    for point, side in ((left_loop_side, -1), (right_loop_side, 1)):
        x_track, y_track, z_track = point
        post_x = x_track + side * 0.48
        contact_x = x_track + side * 0.085
        for y in (y_track - 0.16, y_track + 0.16):
            support_parts.append(beam("Paired loop foot", (post_x, y, 0.09), (post_x, y, z_track - 0.04), 0.09, SUPPORT))
        support_parts.append(beam("Loop foot crossbar", (post_x, y_track - 0.16, z_track), (post_x, y_track + 0.16, z_track), 0.04, SUPPORT))
        support_parts.append(beam("Loop foot connector", (post_x, y_track, z_track), (contact_x, y_track, z_track), 0.04, SUPPORT))

    station_x, station_y, track_x, track_z = 1.20, 0.20, 1.15, 0.52
    roof_half_width, roof_half_length, eave_z, ridge_z, roof_thickness = 0.52, 0.72, 1.08, 1.42, 0.045
    for x in (station_x - roof_half_width + 0.05, station_x + roof_half_width - 0.05):
        for y in (station_y - roof_half_length + 0.07, station_y + roof_half_length - 0.07):
            support_parts.append(beam("Station roof post", (x, y, 0.06), (x, y, eave_z - roof_thickness), 0.06, SUPPORT))
    track_crossbar_z = track_z - 0.085 - 0.04
    for x in (track_x - 0.16, track_x + 0.16):
        support_parts.append(beam("Station paired track foot", (x, station_y, 0.09), (x, station_y, track_crossbar_z), 0.09, SUPPORT))
    support_parts.append(beam("Station track support", (track_x - 0.16, station_y, track_crossbar_z), (track_x + 0.16, station_y, track_crossbar_z), 0.04, SUPPORT))

    station_objects = [
        box("Departure platform", (0.36, 1.15, 0.08), (1.50, station_y, 0.46), PLATFORM),
        gable_roof("Departure station gable roof", station_x, station_y - roof_half_length, station_y + roof_half_length, roof_half_width, eave_z, ridge_z, roof_thickness, STATION_ROOF),
        beam("Station roof ridge", (station_x, station_y - roof_half_length, ridge_z + 0.025), (station_x, station_y + roof_half_length, ridge_z + 0.025), 0.025, SUPPORT),
    ]
    for x in (1.38, 1.62):
        for y in (station_y - 0.48, station_y + 0.48):
            station_objects.append(beam("Platform foot", (x, y, 0.035), (x, y, 0.42), 0.035, SUPPORT))

    coaster = join_by_material(track_parts + station_objects, "Roller coaster | 4x6 | 7 floors")
    pylons = join_by_material(support_parts, "Suspended tubular supports")
    bpy.ops.object.select_all(action="DESELECT")
    coaster.select_set(True)
    pylons.select_set(True)
    bpy.context.view_layer.objects.active = coaster
    bpy.ops.object.join()
    coaster.name = "roller-coaster-4x6-7f"
    bpy.context.view_layer.update()
    lowest_z = min((coaster.matrix_world @ Vector(corner)).z for corner in coaster.bound_box)
    coaster.location.z -= lowest_z
    bpy.context.view_layer.update()
    coaster.dimensions.x = min(coaster.dimensions.x, 3.92)
    coaster.dimensions.y = min(coaster.dimensions.y, 5.92)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    export_glb(coaster, os.path.join(os.path.dirname(__file__), "roller-coaster-4x6-7f"))


build()
