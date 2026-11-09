import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402
from venue_lib import block, checker_floor, disc, junction_wall, partition_wall, thick_corner, thick_wall  # noqa: E402

P = lpm.Palette([
    ("steel", "#c3c9d4", 0.5, 0.4), ("steel_dark", "#8a92a3", 0.5, 0.4), ("iron", "#4a4f5e", 0.4, 0.5), ("black", "#22242c", 0.0, 0.7),
    ("blue", "#3f6fb5", 0.2, 0.5), ("blue_dark", "#2c4f86", 0.2, 0.5), ("brass", "#d4a83a", 0.6, 0.35),
    ("red", "#e04848", 0.0, 0.7), ("green", "#5aae4a", 0.0, 0.7), ("yellow", "#f4c430", 0.0, 0.7),
    ("teal", "#2f9e8f", 0.2, 0.5), ("teal_dark", "#1f6e63", 0.2, 0.5), ("white", "#f6f2ea", 0.0, 0.9),
    ("orange", "#e07b2c", 0.2, 0.5), ("orange_dark", "#b45a1a", 0.2, 0.5), ("glass", "#cfeefa", 0.0, 0.2),
    ("olive", "#5d8f6a", 0.2, 0.5), ("olive_dark", "#3f6b4a", 0.2, 0.5),
    ("slate", "#7f8ea1", 0.0, 0.9), ("concrete", "#a3a9b3", 0.0, 0.95), ("concrete_dark", "#8f95a0", 0.0, 0.95),
    ("copper", "#b87333", 0.6, 0.4), ("brick", "#a8553a", 0.0, 0.9), ("flame", "#ff9a2e", 0.0, 0.4, 1.2),
])


PIPE_Z = 0.34


def horizontal(ob, x=0.0, y=0.0, z=0.0):
    """Lay a part built upright along Z down along +y, then move it."""
    lpm.rotate(ob, -90, axis="X")
    lpm.move(ob, x, y, z)
    return ob


def sideways(ob, x=0.0, y=0.0, z=0.0):
    """Lay a part built upright along Z down along +x, then move it."""
    lpm.rotate(ob, 90, axis="Y")
    lpm.move(ob, x, y, z)
    return ob


def motor(rng):
    """Electric motor facing -y: the shaft comes out of the front, the junction box sits on top, the cooling fins ring the body."""
    parts = [block("base", -0.4, 0.4, -0.3, 0.38, 0.0, 0.05, P["iron"]),
             block("foot_l", -0.3, -0.18, -0.24, 0.3, 0.05, 0.12, P["blue_dark"]), block("foot_r", 0.18, 0.3, -0.24, 0.3, 0.05, 0.12, P["blue_dark"])]
    parts.append(horizontal(disc("body", 0.22, 0.58, (0, 0, 0), P["blue"], 8), y=-0.2, z=0.34))
    for k in range(5):
        parts.append(horizontal(disc(f"fin{k}", 0.25, 0.03, (0, 0, 0), P["blue_dark"], 8), y=-0.12 + 0.1 * k, z=0.34))
    parts += [horizontal(disc("front_cap", 0.2, 0.06, (0, 0, 0), P["steel_dark"], 8), y=-0.26, z=0.34),
              horizontal(disc("rear_cap", 0.2, 0.05, (0, 0, 0), P["iron"], 8), y=0.38, z=0.34),
              block("junction", -0.1, 0.1, -0.02, 0.18, 0.56, 0.66, P["iron"]), block("junction_lid", -0.11, 0.11, -0.03, 0.19, 0.66, 0.69, P["steel_dark"]),
              block("lamp", -0.03, 0.03, 0.2, 0.26, 0.6, 0.64, P["green"])]
    turning = [horizontal(disc("shaft", 0.05, 0.22, (0, 0, 0), P["steel"], 6), y=-0.48, z=0.34), horizontal(disc("coupling", 0.08, 0.06, (0, 0, 0), P["brass"], 6), y=-0.5, z=0.34),
               block("key", -0.012, 0.012, -0.46, -0.4, 0.385, 0.405, P["steel_dark"])]
    return parts, {"spin-y": (turning, (0, 0, PIPE_Z))}


# 11 teeth: a tooth on one side of the rim and a gap on the other, so Gears side by side along their rim mesh without turning any of them.
TEETH = 11


def gear(rng):
    """Spur gear standing across the line: its wheel is parallel to the front-back line of its tile, its axle runs along x at the height of the Shafts and of the
    Motor's output (PIPE_Z). The rim (front and back, a tooth on one side and a gap on the other) meshes with the rim of the next Gear along the line;
    the axle ends (left and right) meet another axle in line. The wheel rises from a slot in the floor."""
    wheel = [disc("body", 0.41, 0.09, (0, 0, -0.045), P["brass"], 24), disc("hub", 0.13, 0.14, (0, 0, -0.07), P["steel_dark"], 10)]
    for k in range(6):
        wheel.append(disc(f"hole{k}", 0.055, 0.095, (0.28 * lpm.math.cos(k * lpm.math.pi / 3), 0.28 * lpm.math.sin(k * lpm.math.pi / 3), -0.0475), P["black"], 6))
    for k in range(TEETH):
        tooth = block(f"tooth{k}", 0.38, 0.53, -0.07, 0.07, -0.045, 0.045, P["brass"])
        wheel.append(lpm.rotate(tooth, 90 + 360 / TEETH * k, axis="Z"))
    turning = [sideways(part, 0, 0, PIPE_Z) for part in wheel]
    turning.append(sideways(disc("axle", 0.045, 1.0, (0, 0, 0), P["steel"], 6), x=-0.5, z=PIPE_Z))
    parts = []
    for k, x in enumerate((-0.3, 0.3)):
        parts += [block(f"pedestal{k}", x - 0.05, x + 0.05, -0.07, 0.07, 0.0, 0.26, P["iron"]), block(f"bearing{k}", x - 0.06, x + 0.06, -0.09, 0.09, 0.26, 0.3, P["blue_dark"]),
                  sideways(disc(f"sleeve{k}", 0.075, 0.12, (0, 0, 0), P["brass"], 8), x=x - 0.06, z=PIPE_Z)]
    return parts, {"spin-x": (turning, (0, 0, PIPE_Z))}


def shaft(rng):
    """Straight shaft along y, edge to edge of its tile, at the height of the motor's shaft: two bearings on pedestals and a yellow collar that shows the turning."""
    turning = [horizontal(disc("rod", 0.045, 1.0, (0, 0, 0), P["steel"], 6), y=-0.5, z=0.34),
               horizontal(disc("collar", 0.06, 0.09, (0, 0, 0), P["yellow"], 6), y=-0.045, z=0.34),
               block("key_flat", -0.012, 0.012, -0.5, 0.5, 0.385, 0.395, P["steel_dark"])]
    parts = []
    for k, y in enumerate((-0.3, 0.3)):
        parts += [block(f"pedestal{k}", -0.07, 0.07, y - 0.06, y + 0.06, 0.0, 0.26, P["iron"]), block(f"bearing{k}", -0.09, 0.09, y - 0.08, y + 0.08, 0.26, 0.3, P["blue_dark"]),
                  horizontal(disc(f"sleeve{k}", 0.075, 0.16, (0, 0, 0), P["brass"], 8), y=y - 0.08, z=0.34),
                  block(f"foot{k}", -0.12, 0.12, y - 0.09, y + 0.09, 0.0, 0.03, P["iron"])]
    return parts, {"spin-y": (turning, (0, 0, PIPE_Z))}


def pump(rng):
    """In-line centrifugal pump facing -y: the fluid enters through the flanged pipe at the back and leaves through the front, and a shaft
    stub with its bearing brings the Drive in from the right. A gauge sits on the casing."""
    parts = [block("base", -0.42, 0.3, -0.3, 0.3, 0.0, 0.05, P["iron"]),
             sideways(disc("casing", 0.27, 0.34, (0, 0, 0), P["teal"], 10), x=-0.25, y=0.0, z=PIPE_Z),
             sideways(disc("casing_ring_l", 0.29, 0.04, (0, 0, 0), P["teal_dark"], 10), x=-0.28, y=0.0, z=PIPE_Z),
             sideways(disc("casing_ring_r", 0.29, 0.04, (0, 0, 0), P["teal_dark"], 10), x=0.05, y=0.0, z=PIPE_Z),
             horizontal(disc("outlet", 0.07, 0.34, (0, 0, 0), P["steel"], 8), y=-0.5, z=PIPE_Z),
             horizontal(disc("outlet_flange", 0.105, 0.04, (0, 0, 0), P["teal_dark"], 8), y=-0.5, z=PIPE_Z),
             horizontal(disc("inlet", 0.07, 0.34, (0, 0, 0), P["steel"], 8), y=0.16, z=PIPE_Z),
             horizontal(disc("inlet_flange", 0.105, 0.04, (0, 0, 0), P["teal_dark"], 8), y=0.46, z=PIPE_Z),
             block("bearing", 0.32, 0.44, -0.09, 0.09, 0.0, 0.3, P["blue_dark"]),
             disc("gauge_stem", 0.025, 0.1, (-0.12, 0.0, 0.6), P["steel"], 6), disc("gauge", 0.08, 0.04, (-0.12, 0.0, 0.7), P["white"], 10),
             block("needle", -0.13, -0.11, -0.07, 0.0, 0.74, 0.755, P["red"])]
    for k, y in enumerate((-0.22, 0.22)):
        parts.append(block(f"foot{k}", -0.38, 0.28, y - 0.04, y + 0.04, 0.05, 0.12, P["teal_dark"]))
    coupling = [sideways(disc("drive_stub", 0.045, 0.28, (0, 0, 0), P["steel"], 6), x=0.22, z=PIPE_Z),
                sideways(disc("coupling", 0.11, 0.05, (0, 0, 0), P["brass"], 8), x=0.1, z=PIPE_Z),
                block("coupling_bar_a", 0.15, 0.18, -0.13, 0.13, PIPE_Z - 0.02, PIPE_Z + 0.02, P["steel_dark"]),
                block("coupling_bar_b", 0.15, 0.18, -0.02, 0.02, PIPE_Z - 0.13, PIPE_Z + 0.13, P["steel_dark"])]
    return parts, {"spin-x": (coupling, (0.2, 0.0, PIPE_Z))}


def tank(rng):
    """Storage tank facing -y: a steel drum on legs, a flanged pipe leaves through the front at pipe height, a level gauge on the side."""
    parts = [block(f"leg{k}", x - 0.04, x + 0.04, y - 0.04, y + 0.04, 0.0, 0.2, P["iron"]) for k, (x, y) in enumerate(((-0.25, -0.25), (0.25, -0.25), (0.25, 0.25), (-0.25, 0.25)))]
    parts += [disc("drum", 0.36, 0.6, (0, 0, 0.2), P["steel"], 12), disc("drum_band_low", 0.375, 0.05, (0, 0, 0.3), P["steel_dark"], 12), disc("drum_band_high", 0.375, 0.05, (0, 0, 0.7), P["steel_dark"], 12),
              disc("lid", 0.3, 0.06, (0, 0, 0.8), P["teal_dark"], 12), disc("cap", 0.07, 0.07, (0.1, 0.1, 0.86), P["steel_dark"], 6),
              horizontal(disc("outlet", 0.07, 0.2, (0, 0, 0), P["steel"], 8), y=-0.5, z=PIPE_Z),
              horizontal(disc("outlet_flange", 0.105, 0.04, (0, 0, 0), P["teal_dark"], 8), y=-0.5, z=PIPE_Z),
              block("level_back", 0.34, 0.37, -0.04, 0.04, 0.3, 0.7, P["white"]), block("level_fill", 0.345, 0.365, -0.025, 0.025, 0.3, 0.55, P["blue"])]
    return parts


def pipe_run_y(name, y0, y1):
    return horizontal(disc(name, 0.07, y1 - y0, (0, 0, 0), P["steel"], 8), y=y0, z=PIPE_Z)


def pipe_run_x(name, x0, x1):
    return sideways(disc(name, 0.07, x1 - x0, (0, 0, 0), P["steel"], 8), x=x0, z=PIPE_Z)


def flange_y(name, y):
    return horizontal(disc(name, 0.105, 0.04, (0, 0, 0), P["teal_dark"], 8), y=y, z=PIPE_Z)


def flange_x(name, x):
    return sideways(disc(name, 0.105, 0.04, (0, 0, 0), P["teal_dark"], 8), x=x, z=PIPE_Z)


def pipe_joint():
    r = 0.105
    return lpm.lathe("joint", [(0, -r), (r * 0.9, -r * 0.4), (r, 0.0), (r * 0.9, r * 0.4), (0, r)], segments=8, at=(0, 0, PIPE_Z), color=P["teal"])


def pipe_support(name, x, y):
    return [block(f"{name}_pedestal", x - 0.05, x + 0.05, y - 0.05, y + 0.05, 0.0, PIPE_Z - 0.09, P["iron"]),
            block(f"{name}_foot", x - 0.1, x + 0.1, y - 0.1, y + 0.1, 0.0, 0.03, P["iron"])]


def pipe_straight(rng):
    """Straight pipe along y from the front (-y) to the back, with a flange at each end, a collar and a pedestal."""
    return [pipe_run_y("run", -0.46, 0.46), flange_y("flange_front", -0.5), flange_y("flange_back", 0.46),
            horizontal(disc("collar", 0.09, 0.1, (0, 0, 0), P["teal"], 8), y=-0.05, z=PIPE_Z)] + pipe_support("support", 0, 0)


def pipe_elbow(rng):
    """Elbow joining the front (-y) to the right (+x): a ball joint on a pedestal, flanges at both openings."""
    return [pipe_run_y("run_y", -0.46, 0.0), pipe_run_x("run_x", 0.0, 0.46), pipe_joint(), flange_y("flange_front", -0.5), flange_x("flange_right", 0.46)] + pipe_support("support", 0, 0)


def pipe_tee(rng):
    """Tee joining the front (-y), the right (+x) and the left (-x): the elbow with a third arm."""
    return [pipe_run_y("run_y", -0.46, 0.0), pipe_run_x("run_x", -0.46, 0.46), pipe_joint(), flange_y("flange_front", -0.5), flange_x("flange_right", 0.46),
            flange_x("flange_left", -0.5)] + pipe_support("support", 0, 0)


def bevel_cone(name):
    """A 45 degree cone with its tip at the origin of its axis (local z) and its wide end 0.14 further, drawn with 12 sides and a ring of teeth."""
    cone = lpm.lathe(name, [(0.0, 0.0), (0.08, 0.0), (0.22, 0.14), (0.0, 0.14)], segments=12, at=(0, 0, 0), color=P["brass"])
    ring = disc(f"{name}_teeth", 0.235, 0.036, (0, 0, 0.105), P["steel_dark"], 10)
    return [cone, ring]


def bevel_toward(parts, side):
    """Lays a cone built along +z so that its wide end points to a side of the tile (front is -y in Blender, right +x, left -x), tip 0.08 from the centre."""
    out = []
    for part in parts:
        if side == "front":
            lpm.move(lpm.rotate(part, 90, axis="X"), 0, -0.08, PIPE_Z)
        elif side == "right":
            sideways(part, x=0.08, z=PIPE_Z)
        else:
            lpm.move(lpm.rotate(part, -90, axis="Y"), -0.08, 0, PIPE_Z)
        out.append(part)
    return out


def bevel_stub(side):
    """The shaft stub that carries the cone out to the edge of the tile, on its bearing."""
    if side == "front":
        return [horizontal(disc("stub_front", 0.045, 0.28, (0, 0, 0), P["steel"], 6), y=-0.5, z=PIPE_Z), block("bearing_front", -0.09, 0.09, -0.44, -0.32, 0.0, 0.3, P["blue_dark"])]
    if side == "right":
        return [sideways(disc("stub_right", 0.045, 0.28, (0, 0, 0), P["steel"], 6), x=0.22, z=PIPE_Z), block("bearing_right", 0.32, 0.44, -0.09, 0.09, 0.0, 0.3, P["blue_dark"])]
    return [sideways(disc("stub_left", 0.045, 0.28, (0, 0, 0), P["steel"], 6), x=-0.5, z=PIPE_Z), block("bearing_left", -0.44, -0.32, -0.09, 0.09, 0.0, 0.3, P["blue_dark"])]


def bevel_box(sides):
    """Gear box for a bevel gear elbow or tee: a base and a cradle behind the cones, cones turning on shaft stubs at the given sides.
    The Drive goes through the box with the same turn, so one Motor can serve several Machines."""
    parts = [block("base", -0.3, 0.3, -0.3, 0.3, 0.0, 0.05, P["iron"]), block("back", -0.25, 0.25, 0.1, 0.16, 0.05, 0.56, P["blue"]), block("back_cap", -0.26, 0.26, 0.09, 0.17, 0.56, 0.6, P["blue_dark"])]
    if "left" not in sides:
        parts.append(block("side", -0.25, -0.19, -0.1, 0.16, 0.05, 0.56, P["blue"]))
    spinners = {}
    for side in sides:
        cone = bevel_toward(bevel_cone(f"cone_{side}"), side)
        stub = bevel_stub(side)
        spinners[{"front": "spin-y", "right": "spin-x", "left": "spin-nx"}[side]] = ([c for c in cone] + [stub[0]], (0, 0, PIPE_Z))
        parts.append(stub[1])
    return parts, spinners


def bevel_elbow(rng):
    return bevel_box(("front", "right"))


def bevel_tee(rng):
    return bevel_box(("front", "right", "left"))


def hazard_stripes(name, x0, x1, y, z0, z1, count=6):
    width = (x1 - x0) / count
    return [block(f"{name}{k}", x0 + width * k, x0 + width * (k + 1), y, y + 0.005, z0, z1, P["yellow" if k % 2 == 0 else "black"]) for k in range(count)]


def press(rng):
    """Flywheel press facing -y: the drive comes in through the shaft stub at the front, the flywheel turns on the right, the ram falls on a plate."""
    parts = [block("base", -0.42, 0.42, -0.4, 0.4, 0.0, 0.12, P["iron"]), block("bed", -0.3, 0.3, -0.22, 0.22, 0.12, 0.2, P["steel_dark"]),
             block("plate", -0.16, 0.16, -0.12, 0.12, 0.2, 0.235, P["steel"]),
             block("frame_back", -0.38, 0.38, 0.24, 0.4, 0.12, 0.88, P["orange"]), block("crown", -0.38, 0.38, -0.3, 0.4, 0.72, 0.9, P["orange"]),
             block("rib_l", -0.38, -0.3, -0.3, 0.24, 0.12, 0.72, P["orange_dark"]), block("rib_r", 0.3, 0.38, -0.3, 0.24, 0.12, 0.72, P["orange_dark"]),
             disc("cylinder", 0.14, 0.1, (0, 0, 0.9), P["orange_dark"], 8),
             block("gearbox", -0.12, 0.12, -0.4, -0.28, 0.14, 0.46, P["iron"]),
             horizontal(disc("input", 0.045, 0.22, (0, 0, 0), P["steel"], 6), y=-0.5, z=0.34),
             horizontal(disc("input_collar", 0.07, 0.05, (0, 0, 0), P["brass"], 6), y=-0.5, z=0.34),
             block("lamp", -0.04, 0.04, -0.31, -0.28, 0.8, 0.86, P["green"])]
    turning = [sideways(disc("flywheel", 0.28, 0.06, (0, 0, 0), P["steel_dark"], 12), x=0.38, y=0.0, z=0.55),
               sideways(disc("flywheel_rim", 0.28, 0.02, (0, 0, 0), P["black"], 12), x=0.44, y=0.0, z=0.55),
               sideways(disc("flywheel_hub", 0.08, 0.12, (0, 0, 0), P["brass"], 8), x=0.38, y=0.0, z=0.55),
               block("flywheel_spoke", 0.4, 0.43, -0.2, 0.2, 0.52, 0.58, P["black"])]
    ram = [block("ram", -0.1, 0.1, -0.08, 0.08, 0.48, 0.84, P["steel"]), block("die", -0.15, 0.15, -0.12, 0.12, 0.37, 0.48, P["steel_dark"])]
    return parts + hazard_stripes("stripe", -0.42, 0.42, -0.405, 0.03, 0.09), {"spin-x": (turning, (0.4, 0, 0.55)), "slide-up": (ram, (0, 0, 0))}


def mixing_vat(rng):
    """Mixing vat facing -y: the fluid comes in through the flanged pipe at the front, an agitator motor sits on the dome, a sight glass shows the level."""
    parts = [block(f"leg{k}", x - 0.04, x + 0.04, y - 0.04, y + 0.04, 0.0, 0.22, P["iron"]) for k, (x, y) in enumerate(((-0.27, -0.27), (0.27, -0.27), (0.27, 0.27), (-0.27, 0.27)))]
    parts += [disc("tank", 0.38, 0.56, (0, 0, 0.2), P["steel"], 12), disc("band_low", 0.395, 0.05, (0, 0, 0.28), P["teal_dark"], 12),
              disc("band_high", 0.395, 0.05, (0, 0, 0.68), P["teal_dark"], 12),
              lpm.lathe("dome", [(0.0, 0.0), (0.385, 0.0), (0.34, 0.1), (0.2, 0.17), (0.0, 0.2)], segments=12, at=(0, 0, 0.76), color=P["steel_dark"]),
              disc("agitator_motor", 0.09, 0.14, (0, 0, 0.96), P["blue"], 8), disc("agitator_cap", 0.07, 0.03, (0, 0, 1.1), P["iron"], 8),
              disc("hatch", 0.08, 0.04, (-0.16, 0.08, 0.92), P["steel"], 8),
              block("sight_glass", -0.2, -0.12, -0.37, -0.33, 0.4, 0.66, P["glass"]), block("sight_frame", -0.215, -0.105, -0.375, -0.33, 0.39, 0.4, P["iron"]),
              block("sight_frame_top", -0.215, -0.105, -0.375, -0.33, 0.66, 0.67, P["iron"]),
              horizontal(disc("inlet", 0.07, 0.22, (0, 0, 0), P["steel"], 8), y=-0.5, z=0.34),
              horizontal(disc("inlet_flange", 0.105, 0.04, (0, 0, 0), P["teal_dark"], 8), y=-0.5, z=0.34),
              sideways(disc("drain", 0.035, 0.12, (0, 0, 0), P["steel"], 6), x=0.36, y=0.0, z=0.27), disc("drain_stem", 0.02, 0.1, (0.46, 0.0, 0.27), P["steel_dark"], 6),
              disc("drain_wheel", 0.06, 0.025, (0.46, 0.0, 0.37), P["red"], 8)]
    blades = [block("blade_a", -0.14, 0.14, -0.025, 0.025, 1.13, 1.16, P["steel"]), block("blade_b", -0.025, 0.025, -0.14, 0.14, 1.13, 1.16, P["steel"])]
    return parts, {"spin-up": (blades, (0, 0, 1.145))}


def turn_arrow(clockwise, center, z, radius=0.09):
    """A curved arrow lying flat, clockwise or counter-clockwise seen from above: the direction the machine needs its Drive to turn."""
    sign = -1 if clockwise else 1
    start = 150 if clockwise else 30
    angles = [start + sign * 30 * k for k in range(8)]
    parts = []
    for k, a in enumerate(angles):
        seg = block(f"arrow{k}", radius - 0.012, radius + 0.012, -0.022, 0.022, z, z + 0.012, P["yellow"])
        parts.append(lpm.move(lpm.rotate(seg, a, axis="Z"), center[0], center[1]))
    end = angles[-1]
    head = lpm.prism("arrow_head", 3, 0.05, 0.012, at=(0, 0, z), color=P["yellow"])
    lpm.rotate(head, end + sign * 90, axis="Z")
    px, py = radius * lpm.math.cos(lpm.math.radians(end)), radius * lpm.math.sin(lpm.math.radians(end))
    parts.append(lpm.move(head, center[0] + px, center[1] + py))
    return parts


def turning_lathe(clockwise):
    """Lathe facing -y: the drive comes in through the shaft stub at the front, the headstock chuck holds a bar, a yellow arrow on the headstock shows the direction it must turn."""
    parts = [block("cabinet", -0.45, 0.45, -0.25, 0.25, 0.0, 0.3, P["iron"]), block("bed", -0.45, 0.45, -0.2, 0.2, 0.3, 0.4, P["steel_dark"]),
             block("headstock", -0.45, -0.15, -0.22, 0.22, 0.4, 0.72, P["olive"]),
             block("tailstock", 0.25, 0.45, -0.12, 0.12, 0.4, 0.66, P["olive_dark"]), sideways(disc("center", 0.025, 0.1, (0, 0, 0), P["steel"], 6), x=0.15, z=0.58),
             block("gearbox", -0.1, 0.1, -0.3, -0.2, 0.3, 0.45, P["iron"]),
             horizontal(disc("input", 0.045, 0.22, (0, 0, 0), P["steel"], 6), y=-0.5, z=0.34), horizontal(disc("input_collar", 0.07, 0.05, (0, 0, 0), P["brass"], 6), y=-0.5, z=0.34)]
    turning = [sideways(disc("chuck", 0.13, 0.06, (0, 0, 0), P["steel"], 10), x=-0.15, z=0.58), sideways(disc("bar", 0.05, 0.3, (0, 0, 0), P["brass"], 8), x=-0.09, z=0.58),
               block("jaw", -0.14, -0.1, -0.02, 0.02, 0.69, 0.72, P["black"])]
    carriage = [block("carriage", -0.05, 0.15, -0.2, 0.2, 0.4, 0.5, P["olive"]), block("cross_slide", -0.03, 0.13, -0.2, -0.04, 0.5, 0.55, P["olive_dark"]),
                block("tool_post", 0.0, 0.1, -0.12, -0.04, 0.55, 0.6, P["iron"]), block("tool", 0.03, 0.07, -0.06, -0.01, 0.57, 0.585, P["steel"])]
    return parts + turn_arrow(clockwise, (-0.3, 0.0), 0.72) + hazard_stripes("stripe", -0.45, 0.45, -0.255, 0.03, 0.09), {"spin-x": (turning, (-0.12, 0, 0.58)), "slide-x": (carriage, (0, 0, 0))}


def turning_lathe_cw(rng):
    return turning_lathe(True)


def turning_lathe_ccw(rng):
    return turning_lathe(False)


def boiler(rng):
    """Boiler facing -y: the water comes in through the flanged pipe at the front, the drive comes in through the shaft stub at the back (it feeds the stoker), a chimney rises from the drum."""
    parts = [block("base", -0.42, 0.42, -0.36, 0.36, 0.0, 0.2, P["brick"]), block("base_cap", -0.44, 0.44, -0.38, 0.38, 0.17, 0.2, P["iron"]),
             block("door", -0.2, 0.2, -0.375, -0.36, 0.04, 0.16, P["black"]), block("glow", -0.14, 0.14, -0.38, -0.375, 0.07, 0.13, P["flame"]),
             sideways(disc("drum", 0.28, 0.68, (0, 0, 0), P["copper"], 12), x=-0.34, z=0.48),
             sideways(disc("end_l", 0.3, 0.03, (0, 0, 0), P["brass"], 12), x=-0.36, z=0.48), sideways(disc("end_r", 0.3, 0.03, (0, 0, 0), P["brass"], 12), x=0.33, z=0.48),
             sideways(disc("band_a", 0.295, 0.04, (0, 0, 0), P["brass"], 12), x=-0.17, z=0.48), sideways(disc("band_b", 0.295, 0.04, (0, 0, 0), P["brass"], 12), x=0.13, z=0.48),
             disc("chimney", 0.07, 0.3, (0.2, 0.0, 0.74), P["iron"], 8), disc("chimney_cap", 0.095, 0.03, (0.2, 0.0, 1.04), P["black"], 8),
             disc("dome", 0.1, 0.1, (-0.17, 0.0, 0.74), P["copper"], 8), disc("valve", 0.03, 0.08, (-0.17, 0.0, 0.84), P["red"], 6),
             disc("gauge_stem", 0.02, 0.06, (0.0, 0.0, 0.74), P["steel"], 6), disc("gauge", 0.06, 0.03, (0.0, 0.0, 0.8), P["white"], 8),
             block("needle", -0.01, 0.01, -0.05, 0.0, 0.83, 0.845, P["red"]),
             horizontal(disc("inlet", 0.07, 0.24, (0, 0, 0), P["steel"], 8), y=-0.5, z=0.34), horizontal(disc("inlet_flange", 0.105, 0.04, (0, 0, 0), P["teal_dark"], 8), y=-0.5, z=0.34),
             block("gearbox", -0.1, 0.1, 0.3, 0.4, 0.28, 0.44, P["iron"])]
    stoker = [horizontal(disc("input", 0.045, 0.2, (0, 0, 0), P["steel"], 6), y=0.3, z=0.34), horizontal(disc("input_collar", 0.07, 0.05, (0, 0, 0), P["brass"], 6), y=0.45, z=0.34),
              block("input_key", -0.012, 0.012, 0.32, 0.45, 0.375, 0.395, P["steel_dark"])]
    blower = [sideways(disc("blower_hub", 0.06, 0.04, (0, 0, 0), P["iron"], 8), x=-0.4, z=0.48),
              block("blower_a", -0.44, -0.41, -0.17, 0.17, 0.48 - 0.025, 0.48 + 0.025, P["steel"]), block("blower_b", -0.44, -0.41, -0.025, 0.025, 0.48 - 0.17, 0.48 + 0.17, P["steel"])]
    return parts, {"spin-y": (stoker, (0, 0, 0.34)), "spin-x": (blower, (-0.42, 0, 0.48))}


def concrete_floor(rng):
    """Concrete floor tile centred on the origin, like the walls."""
    return checker_floor(P, "concrete", "concrete_dark", cells=4)


def half_height(parts):
    """Walls stand at half the height of the Venue walls, so that the machines stay in view."""
    return [clip_band(part) if part.name.startswith("band") else lpm.scale(part, sz=0.5) for part in parts]


def clip_band(band, top=0.47):
    """The yellow band keeps its place on the wall (from 0.3), cut under the cap of the lower wall."""
    for vertex in band.data.vertices:
        vertex.co.z = min(vertex.co.z, top)
    band.data.update()
    return band


def plain_wall(rng):
    return half_height(thick_wall(P, "slate", "yellow", "iron", "steel_dark"))


def plain_partition(rng):
    return half_height(partition_wall(P, "slate", "yellow", "iron", "steel_dark"))


def plain_junction(arms):
    return lambda rng: half_height(junction_wall(P, "slate", "yellow", "iron", "steel_dark", arms))


def plain_corner(rng):
    return half_height(thick_corner(P, "slate", "yellow", "iron", "steel_dark"))


def wall_set():
    return {"floor": concrete_floor, "wall": plain_wall, "partition": plain_partition, "partition-elbow": plain_junction("ES"), "partition-tee": plain_junction("WES"),
            "partition-cross": plain_junction("ESWN"), "wall-corner": plain_corner}


if __name__ == "__main__":
    models = {
        "motor": motor,
        "gear": gear,
        "shaft": shaft,
        "pump": pump,
        "tank": tank,
        "pipe-straight": pipe_straight,
        "pipe-elbow": pipe_elbow,
        "pipe-tee": pipe_tee,
        "press": press,
        "mixing-vat": mixing_vat,
        "lathe-cw": turning_lathe_cw,
        "lathe-ccw": turning_lathe_ccw,
        "boiler": boiler,
        "bevel": bevel_elbow,
        "bevel-tee": bevel_tee,
    }
    export_all(models, P, 1200, HERE, center=False, ground=False)
    export_all(wall_set(), P, 900, HERE, center=False, ground=False)
