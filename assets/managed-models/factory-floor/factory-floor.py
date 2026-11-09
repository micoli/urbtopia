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
              horizontal(disc("shaft", 0.05, 0.22, (0, 0, 0), P["steel"], 6), y=-0.48, z=0.34),
              horizontal(disc("coupling", 0.08, 0.06, (0, 0, 0), P["brass"], 6), y=-0.5, z=0.34),
              block("key", -0.012, 0.012, -0.46, -0.4, 0.385, 0.405, P["steel_dark"]),
              horizontal(disc("rear_cap", 0.2, 0.05, (0, 0, 0), P["iron"], 8), y=0.38, z=0.34),
              block("junction", -0.1, 0.1, -0.02, 0.18, 0.56, 0.66, P["iron"]), block("junction_lid", -0.11, 0.11, -0.03, 0.19, 0.66, 0.69, P["steel_dark"]),
              block("lamp", -0.03, 0.03, 0.2, 0.26, 0.6, 0.64, P["green"])]
    return parts


TEETH = 12


def gear(rng):
    """Spur gear lying flat on a post, one tile wide: the pitch circle is the tile edge, so two gears side by side mesh when one is turned half a tooth.
    Teeth point along the tile axes; its turning is animated by the game around the vertical axis."""
    parts = [disc("mount", 0.14, 0.05, (0, 0, 0), P["iron"], 8), disc("post", 0.05, 0.3, (0, 0, 0.05), P["steel"], 6),
             disc("body", 0.41, 0.09, (0, 0, 0.2), P["brass"], 24), disc("hub", 0.13, 0.14, (0, 0, 0.2), P["steel_dark"], 10),
             disc("axle_cap", 0.06, 0.05, (0, 0, 0.34), P["steel"], 6)]
    for k in range(6):
        parts.append(disc(f"hole{k}", 0.055, 0.095, (0.28 * lpm.math.cos(k * lpm.math.pi / 3), 0.28 * lpm.math.sin(k * lpm.math.pi / 3), 0.2), P["black"], 6))
    for k in range(TEETH):
        tooth = block(f"tooth{k}", 0.38, 0.53, -0.07, 0.07, 0.2, 0.29, P["brass"])
        parts.append(lpm.rotate(tooth, 360 / TEETH * k, axis="Z"))
    return parts


def shaft(rng):
    """Straight shaft along y, edge to edge of its tile, at the height of the motor's shaft: two bearings on pedestals and a yellow collar that shows the turning."""
    parts = [horizontal(disc("rod", 0.045, 1.0, (0, 0, 0), P["steel"], 6), y=-0.5, z=0.34),
             horizontal(disc("collar", 0.06, 0.09, (0, 0, 0), P["yellow"], 6), y=-0.045, z=0.34),
             block("key_flat", -0.012, 0.012, -0.5, 0.5, 0.385, 0.395, P["steel_dark"])]
    for k, y in enumerate((-0.3, 0.3)):
        parts += [block(f"pedestal{k}", -0.07, 0.07, y - 0.06, y + 0.06, 0.0, 0.26, P["iron"]), block(f"bearing{k}", -0.09, 0.09, y - 0.08, y + 0.08, 0.26, 0.3, P["blue_dark"]),
                  horizontal(disc(f"sleeve{k}", 0.075, 0.16, (0, 0, 0), P["brass"], 8), y=y - 0.08, z=0.34),
                  block(f"foot{k}", -0.12, 0.12, y - 0.09, y + 0.09, 0.0, 0.03, P["iron"])]
    return parts


def pump(rng):
    """Centrifugal pump facing -y: the outlet pipe leaves through the front at pipe height, the drive motor sits at the back, a gauge on top."""
    parts = [block("base", -0.42, 0.42, -0.3, 0.42, 0.0, 0.05, P["iron"]),
             sideways(disc("casing", 0.27, 0.34, (0, 0, 0), P["teal"], 10), x=-0.17, y=-0.05, z=0.34),
             sideways(disc("casing_ring_l", 0.29, 0.04, (0, 0, 0), P["teal_dark"], 10), x=-0.2, y=-0.05, z=0.34),
             sideways(disc("casing_ring_r", 0.29, 0.04, (0, 0, 0), P["teal_dark"], 10), x=0.16, y=-0.05, z=0.34),
             sideways(disc("motor", 0.17, 0.24, (0, 0, 0), P["blue"], 8), x=0.17, y=-0.05, z=0.34),
             sideways(disc("motor_cap", 0.15, 0.04, (0, 0, 0), P["iron"], 8), x=0.41, y=-0.05, z=0.34),
             horizontal(disc("outlet", 0.07, 0.34, (0, 0, 0), P["steel"], 8), y=-0.5, z=0.34),
             horizontal(disc("flange", 0.11, 0.05, (0, 0, 0), P["steel_dark"], 8), y=-0.5, z=0.34),
             horizontal(disc("outlet_band", 0.085, 0.05, (0, 0, 0), P["teal_dark"], 8), y=-0.3, z=0.34),
             sideways(disc("inlet", 0.06, 0.1, (0, 0, 0), P["steel"], 8), x=-0.4, y=-0.05, z=0.34),
             sideways(disc("inlet_flange", 0.09, 0.04, (0, 0, 0), P["steel_dark"], 8), x=-0.44, y=-0.05, z=0.34),
             disc("gauge_stem", 0.025, 0.1, (-0.17, -0.05, 0.6), P["steel"], 6), disc("gauge", 0.08, 0.04, (-0.17, -0.05, 0.7), P["white"], 10),
             block("needle", -0.18, -0.16, -0.12, -0.05, 0.74, 0.755, P["red"])]
    for k, y in enumerate((-0.2, 0.3)):
        parts.append(block(f"foot{k}", -0.38, 0.38, y - 0.04, y + 0.04, 0.05, 0.12, P["teal_dark"]))
    return parts


PIPE_Z = 0.34


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


def hazard_stripes(name, x0, x1, y, z0, z1, count=6):
    width = (x1 - x0) / count
    return [block(f"{name}{k}", x0 + width * k, x0 + width * (k + 1), y, y + 0.005, z0, z1, P["yellow" if k % 2 == 0 else "black"]) for k in range(count)]


def press(rng):
    """Flywheel press facing -y: the drive comes in through the shaft stub at the front, the flywheel turns on the right, the ram falls on a plate."""
    parts = [block("base", -0.42, 0.42, -0.4, 0.4, 0.0, 0.12, P["iron"]), block("bed", -0.3, 0.3, -0.22, 0.22, 0.12, 0.2, P["steel_dark"]),
             block("plate", -0.16, 0.16, -0.12, 0.12, 0.2, 0.235, P["steel"]),
             block("frame_back", -0.38, 0.38, 0.24, 0.4, 0.12, 0.88, P["orange"]), block("crown", -0.38, 0.38, -0.3, 0.4, 0.72, 0.9, P["orange"]),
             block("rib_l", -0.38, -0.3, -0.3, 0.24, 0.12, 0.72, P["orange_dark"]), block("rib_r", 0.3, 0.38, -0.3, 0.24, 0.12, 0.72, P["orange_dark"]),
             block("ram", -0.1, 0.1, -0.08, 0.08, 0.36, 0.72, P["steel"]), block("die", -0.15, 0.15, -0.12, 0.12, 0.26, 0.36, P["steel_dark"]),
             disc("cylinder", 0.14, 0.1, (0, 0, 0.9), P["orange_dark"], 8),
             block("gearbox", -0.12, 0.12, -0.4, -0.28, 0.14, 0.46, P["iron"]),
             horizontal(disc("input", 0.045, 0.22, (0, 0, 0), P["steel"], 6), y=-0.5, z=0.34),
             horizontal(disc("input_collar", 0.07, 0.05, (0, 0, 0), P["brass"], 6), y=-0.5, z=0.34),
             sideways(disc("flywheel", 0.28, 0.06, (0, 0, 0), P["steel_dark"], 12), x=0.38, y=0.0, z=0.55),
             sideways(disc("flywheel_rim", 0.28, 0.02, (0, 0, 0), P["black"], 12), x=0.44, y=0.0, z=0.55),
             sideways(disc("flywheel_hub", 0.08, 0.12, (0, 0, 0), P["brass"], 8), x=0.38, y=0.0, z=0.55),
             block("lamp", -0.04, 0.04, -0.31, -0.28, 0.8, 0.86, P["green"])]
    return parts + hazard_stripes("stripe", -0.42, 0.42, -0.405, 0.03, 0.09)


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
    return parts


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
             sideways(disc("chuck", 0.13, 0.06, (0, 0, 0), P["steel"], 10), x=-0.15, z=0.58), sideways(disc("bar", 0.05, 0.3, (0, 0, 0), P["brass"], 8), x=-0.09, z=0.58),
             block("tailstock", 0.25, 0.45, -0.12, 0.12, 0.4, 0.66, P["olive_dark"]), sideways(disc("center", 0.025, 0.1, (0, 0, 0), P["steel"], 6), x=0.15, z=0.58),
             block("carriage", -0.05, 0.15, -0.2, 0.2, 0.4, 0.5, P["olive"]), block("cross_slide", -0.03, 0.13, -0.2, -0.04, 0.5, 0.55, P["olive_dark"]),
             block("tool_post", 0.0, 0.1, -0.12, -0.04, 0.55, 0.6, P["iron"]), block("tool", 0.03, 0.07, -0.06, -0.01, 0.57, 0.585, P["steel"]),
             block("gearbox", -0.1, 0.1, -0.3, -0.2, 0.3, 0.45, P["iron"]),
             horizontal(disc("input", 0.045, 0.22, (0, 0, 0), P["steel"], 6), y=-0.5, z=0.34), horizontal(disc("input_collar", 0.07, 0.05, (0, 0, 0), P["brass"], 6), y=-0.5, z=0.34)]
    return parts + turn_arrow(clockwise, (-0.3, 0.0), 0.72) + hazard_stripes("stripe", -0.45, 0.45, -0.255, 0.03, 0.09)


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
             block("gearbox", -0.1, 0.1, 0.3, 0.4, 0.28, 0.44, P["iron"]),
             horizontal(disc("input", 0.045, 0.2, (0, 0, 0), P["steel"], 6), y=0.3, z=0.34), horizontal(disc("input_collar", 0.07, 0.05, (0, 0, 0), P["brass"], 6), y=0.45, z=0.34)]
    return parts


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
        "pipe-straight": pipe_straight,
        "pipe-elbow": pipe_elbow,
        "pipe-tee": pipe_tee,
        "press": press,
        "mixing-vat": mixing_vat,
        "lathe-cw": turning_lathe_cw,
        "lathe-ccw": turning_lathe_ccw,
        "boiler": boiler,
    }
    export_all(models, P, 1200, HERE, center=False, ground=False)
    export_all(wall_set(), P, 900, HERE, center=False, ground=False)
