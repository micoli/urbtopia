import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402
from venue_lib import block, disc  # noqa: E402

P = lpm.Palette([
    ("steel", "#c3c9d4", 0.5, 0.4), ("steel_dark", "#8a92a3", 0.5, 0.4), ("iron", "#4a4f5e", 0.4, 0.5), ("black", "#22242c", 0.0, 0.7),
    ("brass", "#d4a83a", 0.6, 0.35), ("copper", "#c8794a", 0.6, 0.35), ("red", "#e04848", 0.0, 0.7), ("green", "#5aae4a", 0.0, 0.7),
    ("yellow", "#f4c430", 0.0, 0.7), ("white", "#f6f2ea", 0.0, 0.9), ("glass", "#cfeefa", 0.0, 0.2),
    ("blue", "#3f6fb5", 0.2, 0.5), ("blue_dark", "#2c4f86", 0.2, 0.5),
    ("brick", "#a8553a", 0.0, 0.9), ("brick_dark", "#7a3a26", 0.0, 0.9), ("flame", "#ff9a2e", 0.0, 0.4, 1.2),
    ("coal", "#2b2b33", 0.1, 0.8), ("steam", "#e8eef5", 0.0, 0.6), ("belt", "#33363f", 0.0, 0.9),
    ("teal", "#2f9a8a", 0.2, 0.5), ("teal_dark", "#1f6e62", 0.2, 0.5), ("cable", "#2a2a30", 0.0, 0.6), ("stone", "#9a9a92", 0.0, 0.9), ("stone_dark", "#6f6f6a", 0.0, 0.9),
])


def sideways(ob, x=0.0, y=0.0, z=0.0):
    """Lay a part built upright along Z down along +x, then move it."""
    lpm.rotate(ob, 90, axis="Y")
    lpm.move(ob, x, y, z)
    return ob


def horizontal(ob, x=0.0, y=0.0, z=0.0):
    """Lay a part built upright along Z down along +y, then move it."""
    lpm.rotate(ob, -90, axis="X")
    lpm.move(ob, x, y, z)
    return ob


PIPE_Z = 0.34
BELT_Z = 0.42
CABLE_Z = 0.09


def pipe_run_y(name, y0, y1, color):
    return horizontal(disc(name, 0.07, y1 - y0, (0, 0, 0), P[color], 8), y=y0, z=PIPE_Z)


def pipe_run_x(name, x0, x1, color):
    return sideways(disc(name, 0.07, x1 - x0, (0, 0, 0), P[color], 8), x=x0, z=PIPE_Z)


def flange_y(name, y, color):
    return horizontal(disc(name, 0.105, 0.04, (0, 0, 0), P[color], 8), y=y, z=PIPE_Z)


def flange_x(name, x, color):
    return sideways(disc(name, 0.105, 0.04, (0, 0, 0), P[color], 8), x=x, z=PIPE_Z)


def pipe_joint(color):
    r = 0.105
    return lpm.lathe("joint", [(0, -r), (r * 0.9, -r * 0.4), (r, 0.0), (r * 0.9, r * 0.4), (0, r)], segments=8, at=(0, 0, PIPE_Z), color=P[color])


def pipe_support(name):
    return [block(f"{name}_pedestal", -0.05, 0.05, -0.05, 0.05, 0.03, PIPE_Z - 0.09, P["iron"]), block(f"{name}_foot", -0.12, 0.12, -0.12, 0.12, 0.0, 0.03, P["steel_dark"])]


def pipe_straight(body, flange, band):
    """Straight pipe along y from the front (-y) to the back, a flange at each end, a collar and a pedestal."""
    return [pipe_run_y("run", -0.46, 0.46, body), flange_y("flange_front", -0.5, flange), flange_y("flange_back", 0.46, flange),
            horizontal(disc("collar", 0.09, 0.1, (0, 0, 0), P[band], 8), y=-0.05, z=PIPE_Z)] + pipe_support("support")


def pipe_elbow(body, flange, band):
    """Elbow joining the front (-y) to the right (+x): a ball joint on a pedestal, flanges at both openings."""
    return [pipe_run_y("run_y", -0.46, 0.0, body), pipe_run_x("run_x", 0.0, 0.46, body), pipe_joint(band), flange_y("flange_front", -0.5, flange),
            flange_x("flange_right", 0.46, flange)] + pipe_support("support")


def water_pipe_straight(rng):
    return pipe_straight("blue", "blue_dark", "blue_dark")


def water_pipe_elbow(rng):
    return pipe_elbow("blue", "blue_dark", "blue_dark")


def steam_pipe_straight(rng):
    return pipe_straight("steam", "steel_dark", "brass")


def steam_pipe_elbow(rng):
    return pipe_elbow("steam", "steel_dark", "brass")


def coal_conveyor_straight(rng):
    """Straight Conveyor carrying coal toward -y, from edge to edge of its tile: two steel rails and a black belt at BELT_Z, and a yellow arrow on the belt: the coal that rides it is drawn by the game."""
    parts = [block("belt_rail_l", -0.2, -0.17, -0.5, 0.5, 0.3, BELT_Z, P["steel"]), block("belt_rail_r", 0.17, 0.2, -0.5, 0.5, 0.3, BELT_Z, P["steel"]),
             block("belt_bed", -0.17, 0.17, -0.5, 0.5, 0.3, BELT_Z - 0.02, P["belt"])]
    for k, y in enumerate((-0.42, 0.42)):
        parts += [block(f"leg_l{k}", -0.2, -0.17, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]), block(f"leg_r{k}", 0.17, 0.2, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]),
                  block(f"brace{k}", -0.2, 0.2, y - 0.02, y + 0.02, 0.12, 0.15, P["iron"])]
    head = lpm.prism("arrow_head", 3, 0.07, 0.004, at=(0, 0, BELT_Z - 0.02), color=P["yellow"])
    lpm.rotate(head, 30, axis="Z")
    lpm.move(head, 0.0, -0.4, 0)
    return parts + [head]


def steam_boiler(rng):
    """Steam boiler, one tile: a brick firebox with a glowing door carries a horizontal steel drum. Coal comes in at +y through a hopper under the belt of a Conveyor, water at -x and
    steam at +x, both at pipe height: a blue and a white pipe rise to the drum and to its dome. A chimney and a pressure gauge stand on top."""
    parts = [block("firebox", -0.42, 0.42, -0.4, 0.4, 0.0, 0.4, P["brick"]), block("firebox_base", -0.44, 0.44, -0.42, 0.42, 0.0, 0.06, P["brick_dark"]),
             block("firebox_cap", -0.44, 0.44, -0.42, 0.42, 0.38, 0.42, P["brick_dark"]),
             block("door_frame", -0.2, 0.2, -0.43, -0.4, 0.08, 0.34, P["iron"]), block("door_fire", -0.15, 0.15, -0.44, -0.43, 0.12, 0.28, P["flame"]),
             block("ash_door", -0.12, 0.12, -0.43, -0.4, 0.02, 0.07, P["black"])]
    parts += [horizontal(disc("drum", 0.26, 0.76, (0, 0, 0), P["steel"], 12), y=-0.38, z=0.68),
              horizontal(disc("drum_end", 0.28, 0.04, (0, 0, 0), P["steel_dark"], 12), y=-0.42, z=0.68),
              horizontal(disc("drum_band_a", 0.275, 0.04, (0, 0, 0), P["steel_dark"], 12), y=-0.15, z=0.68),
              horizontal(disc("drum_band_b", 0.275, 0.04, (0, 0, 0), P["steel_dark"], 12), y=0.15, z=0.68),
              disc("dome", 0.1, 0.1, (0.0, 0.0, 0.94), P["brass"], 8), disc("dome_cap", 0.06, 0.05, (0.0, 0.0, 1.04), P["steel_dark"], 8)]
    parts += [disc("chimney", 0.07, 0.34, (0.0, -0.3, 0.94), P["iron"], 8), disc("chimney_rim", 0.09, 0.04, (0.0, -0.3, 1.26), P["black"], 8),
              block("gauge_stem", -0.012, 0.012, 0.3, 0.324, 0.94, 1.0, P["brass"]),
              horizontal(disc("gauge", 0.06, 0.03, (0, 0, 0), P["white"], 10), x=0.0, y=0.285, z=1.04),
              horizontal(disc("gauge_rim", 0.07, 0.02, (0, 0, 0), P["brass"], 10), x=0.0, y=0.275, z=1.04)]
    parts += [block("hopper_neck", -0.12, 0.12, 0.4, 0.5, 0.18, 0.4, P["iron"]), block("hopper_coal", -0.1, 0.1, 0.42, 0.5, 0.38, 0.41, P["coal"]),
              block("hopper_rim", -0.14, 0.14, 0.4, 0.5, 0.34, 0.4, P["steel_dark"])]
    parts += [sideways(disc("water_pipe", 0.04, 0.235, (0, 0, 0), P["blue"], 8), x=-0.455, z=0.68),
              disc("water_riser", 0.05, 0.4, (-0.455, 0.0, 0.3), P["blue"], 8),
              sideways(disc("water_stub", 0.07, 0.05, (0, 0, 0), P["blue"], 8), x=-0.5, z=PIPE_Z),
              sideways(disc("water_flange", 0.105, 0.04, (0, 0, 0), P["blue_dark"], 8), x=-0.5, z=PIPE_Z),
              sideways(disc("water_collar", 0.06, 0.03, (0, 0, 0), P["blue_dark"], 8), x=-0.3, z=0.68)]
    parts += [sideways(disc("steam_pipe", 0.04, 0.455, (0, 0, 0), P["steam"], 8), x=0.0, z=0.99),
              disc("steam_riser", 0.05, 0.7, (0.455, 0.0, 0.3), P["steam"], 8),
              sideways(disc("steam_stub", 0.07, 0.05, (0, 0, 0), P["steam"], 8), x=0.455, z=PIPE_Z),
              sideways(disc("steam_flange", 0.105, 0.04, (0, 0, 0), P["steel_dark"], 8), x=0.46, z=PIPE_Z),
              sideways(disc("steam_band", 0.055, 0.03, (0, 0, 0), P["brass"], 8), x=0.3, z=0.99),
              block("steam_support", 0.3, 0.34, -0.02, 0.02, 0.42, 0.95, P["steel_dark"])]
    return parts


def cable_run_y(name, y0, y1):
    return horizontal(disc(name, 0.045, y1 - y0, (0, 0, 0), P["cable"], 8), y=y0, z=CABLE_Z)


def cable_run_x(name, x0, x1):
    return sideways(disc(name, 0.045, x1 - x0, (0, 0, 0), P["cable"], 8), x=x0, z=CABLE_Z)


def cable_plug_y(name, y):
    return horizontal(disc(name, 0.06, 0.04, (0, 0, 0), P["brass"], 8), y=y, z=CABLE_Z)


def cable_plug_x(name, x):
    return sideways(disc(name, 0.06, 0.04, (0, 0, 0), P["brass"], 8), x=x, z=CABLE_Z)


def cable_clips(count_y=(), count_x=()):
    return ([block(f"clip_y{k}", -0.07, 0.07, y - 0.015, y + 0.015, 0.0, CABLE_Z + 0.02, P["yellow"]) for k, y in enumerate(count_y)]
            + [block(f"clip_x{k}", x - 0.015, x + 0.015, -0.07, 0.07, 0.0, CABLE_Z + 0.02, P["yellow"]) for k, x in enumerate(count_x)])


def cable_straight(rng):
    """Straight Cable along y from the front (-y) to the back, lying on the floor: a black cable, a brass plug at each end and two yellow clips."""
    return [cable_run_y("run", -0.46, 0.46), cable_plug_y("plug_front", -0.5), cable_plug_y("plug_back", 0.46)] + cable_clips(count_y=(-0.2, 0.2))


def cable_elbow(rng):
    """Elbow Cable joining the front (-y) to the right (+x), lying on the floor: two black runs meeting on a yellow clip, a brass plug at each end."""
    return [cable_run_y("run_y", -0.46, 0.04), cable_run_x("run_x", -0.04, 0.46), cable_plug_y("plug_front", -0.5), cable_plug_x("plug_right", 0.46),
            block("clip_corner", -0.08, 0.08, -0.08, 0.08, 0.0, CABLE_Z + 0.03, P["yellow"])]


def alternator(rng):
    """Alternator, one tile: the Steam comes in at -x at pipe height into a copper steam chest and a cylinder that turns a brass flywheel and the shaft of a teal generator with cooling
    fins. A terminal box on the generator sends the electricity down a conduit that leaves at +x as a Cable on the floor, with a brass plug."""
    parts = [block("base", -0.46, 0.46, -0.3, 0.3, 0.0, 0.06, P["iron"]), block("base_rail_l", -0.44, 0.44, -0.3, -0.26, 0.06, 0.1, P["steel_dark"]),
             block("base_rail_r", -0.44, 0.44, 0.26, 0.3, 0.06, 0.1, P["steel_dark"])]
    parts += [sideways(disc("steam_stub", 0.07, 0.1, (0, 0, 0), P["steam"], 8), x=-0.5, z=PIPE_Z),
              sideways(disc("steam_flange", 0.105, 0.04, (0, 0, 0), P["steel_dark"], 8), x=-0.5, z=PIPE_Z),
              sideways(disc("chest", 0.16, 0.2, (0, 0, 0), P["copper"], 10), x=-0.42, z=PIPE_Z),
              sideways(disc("chest_band", 0.17, 0.03, (0, 0, 0), P["brass"], 10), x=-0.33, z=PIPE_Z),
              sideways(disc("cylinder_head", 0.12, 0.04, (0, 0, 0), P["steel_dark"], 10), x=-0.22, z=PIPE_Z)]
    parts += [block("pillar_a", -0.22, -0.12, -0.2, -0.12, 0.1, PIPE_Z - 0.1, P["iron"]), block("pillar_b", -0.22, -0.12, 0.12, 0.2, 0.1, PIPE_Z - 0.1, P["iron"]),
              block("pillar_c", 0.2, 0.3, -0.2, -0.12, 0.1, PIPE_Z - 0.1, P["iron"]), block("pillar_d", 0.2, 0.3, 0.12, 0.2, 0.1, PIPE_Z - 0.1, P["iron"]),
              block("saddle_gen", 0.05, 0.4, -0.18, 0.18, 0.1, 0.18, P["teal_dark"]),
              sideways(disc("generator", 0.2, 0.35, (0, 0, 0), P["teal"], 12), x=0.05, z=PIPE_Z),
              sideways(disc("generator_cap", 0.17, 0.05, (0, 0, 0), P["teal_dark"], 12), x=0.4, z=PIPE_Z)]
    parts += [sideways(disc(f"fin{k}", 0.215, 0.025, (0, 0, 0), P["teal_dark"], 12), x=0.09 + 0.07 * k, z=PIPE_Z) for k in range(5)]
    turning = [sideways(disc("shaft", 0.04, 0.3, (0, 0, 0), P["steel"], 6), x=-0.2, z=PIPE_Z),
               sideways(disc("flywheel", 0.26, 0.05, (0, 0, 0), P["brass"], 12), x=-0.1, z=PIPE_Z),
               sideways(disc("flywheel_hub", 0.07, 0.08, (0, 0, 0), P["steel_dark"], 8), x=-0.115, z=PIPE_Z),
               block("spoke_v", -0.095, -0.065, -0.012, 0.012, PIPE_Z - 0.22, PIPE_Z + 0.22, P["steel_dark"]),
               block("spoke_h", -0.095, -0.065, -0.22, 0.22, PIPE_Z - 0.012, PIPE_Z + 0.012, P["steel_dark"])]
    parts += [block("terminal_box", 0.17, 0.3, -0.08, 0.08, 0.52, 0.64, P["brass"]), block("terminal_lid", 0.16, 0.31, -0.09, 0.09, 0.62, 0.66, P["steel_dark"]),
              sideways(disc("conduit_top", 0.04, 0.17, (0, 0, 0), P["cable"], 8), x=0.3, z=0.58),
              disc("conduit_down", 0.04, 0.52, (0.46, 0.0, CABLE_Z), P["cable"], 8),
              sideways(disc("cable_stub", 0.045, 0.05, (0, 0, 0), P["cable"], 8), x=0.45, z=CABLE_Z), cable_plug_x("plug_out", 0.46),
              block("band_a", 0.425, 0.495, -0.035, 0.035, 0.3, 0.33, P["yellow"])]
    return parts, {"spin-x": (turning, (0, 0, PIPE_Z))}


def flow_arrow(name, y, z, toward):
    """A small flat arrow on top of a part that points toward -y (`toward` -1) or +y (+1)."""
    head = lpm.prism(name, 3, 0.05, 0.004, at=(0, 0, z), color=P["yellow"])
    lpm.rotate(head, 30 if toward < 0 else 210, axis="Z")
    return lpm.move(head, 0.0, y, 0)


def hazard_band(name, x0, x1, y0, y1, z0, z1, stripes=6):
    width = (x1 - x0) / stripes
    return [block(f"{name}{k}", x0 + width * k, x0 + width * (k + 1), y0, y1, z0, z1, P["yellow" if k % 2 == 0 else "black"]) for k in range(stripes)]


def pad(name, y0, color="stone_dark"):
    return block(name, -0.46, 0.46, y0, 0.5, 0.0, 0.05, P[color])


def pipe_stand(name, y):
    return [block(f"{name}_pedestal", -0.05, 0.05, y - 0.05, y + 0.05, 0.03, PIPE_Z - 0.09, P["iron"]), block(f"{name}_foot", -0.12, 0.12, y - 0.12, y + 0.12, 0.0, 0.03, P["steel_dark"])]


def coal_quay(rng):
    """Coal quay, against the back wall on the tile along it, facing -y: a brick unloading house with a wide black hatch and a hazard-striped lip lets coal fall down a steel chute
    onto the belt of a Conveyor that leaves toward -y at BELT_Z."""
    parts = [pad("pad", -0.12), block("house", -0.4, 0.4, 0.1, 0.5, 0.05, 0.8, P["brick"]), block("house_roof", -0.44, 0.44, 0.06, 0.5, 0.8, 0.86, P["brick_dark"]),
             block("hatch_frame", -0.3, 0.3, 0.085, 0.1, 0.3, 0.7, P["iron"]), block("hatch", -0.26, 0.26, 0.075, 0.085, 0.34, 0.66, P["black"]),
             block("hatch_beam", -0.3, 0.3, 0.07, 0.1, 0.7, 0.74, P["steel_dark"])]
    parts += hazard_band("hazard", -0.44, 0.44, 0.055, 0.07, 0.8, 0.86)
    parts += [block("chute_a", -0.22, 0.22, -0.02, 0.1, 0.44, 0.48, P["steel"]), block("chute_b", -0.22, 0.22, -0.1, -0.02, 0.4, 0.44, P["steel"]),
              block("chute_wall_l", -0.24, -0.22, -0.1, 0.1, 0.4, 0.58, P["steel_dark"]), block("chute_wall_r", 0.22, 0.24, -0.1, 0.1, 0.4, 0.58, P["steel_dark"])]
    parts += [block("belt_rail_l", -0.2, -0.17, -0.5, 0.1, 0.3, BELT_Z, P["steel"]), block("belt_rail_r", 0.17, 0.2, -0.5, 0.1, 0.3, BELT_Z, P["steel"]),
              block("belt_bed", -0.17, 0.17, -0.5, 0.1, 0.3, BELT_Z - 0.02, P["belt"]),
              block("leg_l", -0.2, -0.17, -0.45, -0.39, 0.0, 0.3, P["iron"]), block("leg_r", 0.17, 0.2, -0.45, -0.39, 0.0, 0.3, P["iron"]),
              block("brace", -0.2, 0.2, -0.43, -0.41, 0.12, 0.15, P["iron"])]
    return parts + [flow_arrow("arrow", -0.42, BELT_Z - 0.02, -1)]


def water_inlet(rng):
    """Water inlet, against the back wall: a blue pump housing on the wall with a pressure gauge feeds a Water pipe that leaves toward -y at pipe height, through a ball valve with a
    red handwheel. A yellow arrow on the pipe points away from the wall."""
    parts = [block("housing", -0.22, 0.22, 0.28, 0.5, 0.1, 0.6, P["blue_dark"]), block("housing_top", -0.24, 0.24, 0.28, 0.5, 0.58, 0.64, P["blue"]),
             block("housing_foot", -0.26, 0.26, 0.26, 0.5, 0.0, 0.1, P["steel_dark"]),
             horizontal(disc("gauge", 0.05, 0.03, (0, 0, 0), P["white"], 10), x=0.1, y=0.25, z=0.48), horizontal(disc("gauge_rim", 0.06, 0.02, (0, 0, 0), P["brass"], 10), x=0.1, y=0.23, z=0.48),
             pipe_run_y("run", -0.46, 0.3, "blue"), flange_y("flange_front", -0.5, "blue_dark"), pipe_joint("blue_dark"),
             disc("valve_stem", 0.02, 0.14, (0.0, 0.0, PIPE_Z + 0.08), P["steel"], 6), disc("valve_wheel", 0.08, 0.025, (0.0, 0.0, PIPE_Z + 0.22), P["red"], 10)]
    parts += pipe_stand("stand", -0.25)
    return parts + [flow_arrow("arrow", -0.35, PIPE_Z + 0.075, -1)]


def water_outlet(rng):
    """Water outlet, against the back wall: a Water pipe arrives from -y at pipe height and ends in a wide outfall funnel on a steel wall plate with a black grille. A yellow arrow on the
    pipe points at the wall."""
    parts = [block("plate", -0.26, 0.26, 0.4, 0.5, 0.1, 0.6, P["steel_dark"]), block("plate_foot", -0.28, 0.28, 0.36, 0.5, 0.0, 0.1, P["steel"]),
             pipe_run_y("run", -0.46, 0.4, "blue"), flange_y("flange_front", -0.5, "blue_dark"),
             horizontal(disc("funnel_ring", 0.15, 0.03, (0, 0, 0), P["blue_dark"], 10), y=0.36, z=PIPE_Z),
             horizontal(disc("funnel", 0.11, 0.05, (0, 0, 0), P["blue"], 10), y=0.3, z=PIPE_Z)]
    parts += [block(f"grille{k}", -0.2, 0.2, 0.39, 0.4, 0.14 + 0.07 * k, 0.17 + 0.07 * k, P["black"]) for k in range(7) if abs((0.14 + 0.07 * k) - PIPE_Z) > 0.1]
    parts += pipe_stand("stand", -0.25)
    return parts + [flow_arrow("arrow", -0.35, PIPE_Z + 0.075, 1)]


def underground_water_inlet(rng):
    """Underground water inlet, against the back wall: a wellhead on a stone pad where the hot water of the ground comes up through a steel casing under a brass cap, a valve stack with a red handwheel
    on top and a gauge. A white Steam pipe leaves it toward -y at pipe height."""
    parts = [pad("pad", -0.3), block("rock_a", -0.4, -0.22, 0.2, 0.42, 0.05, 0.14, P["stone"]), block("rock_b", 0.24, 0.42, 0.3, 0.46, 0.05, 0.12, P["stone"]),
             disc("casing", 0.14, 0.52, (0.0, 0.34, 0.05), P["steel"], 10), disc("casing_band", 0.16, 0.04, (0.0, 0.34, 0.2), P["steel_dark"], 10), disc("cap", 0.18, 0.05, (0.0, 0.34, 0.57), P["brass"], 10),
             disc("stack", 0.06, 0.14, (0.0, 0.34, 0.62), P["steel_dark"], 8), disc("stem", 0.02, 0.1, (0.0, 0.34, 0.76), P["steel"], 6), disc("wheel", 0.09, 0.025, (0.0, 0.34, 0.86), P["red"], 10),
             horizontal(disc("gauge", 0.05, 0.03, (0, 0, 0), P["white"], 10), x=-0.1, y=0.2, z=0.5), horizontal(disc("gauge_rim", 0.06, 0.02, (0, 0, 0), P["brass"], 10), x=-0.1, y=0.18, z=0.5),
             pipe_run_y("run", -0.46, 0.34, "steam"), flange_y("flange_front", -0.5, "steel_dark"), pipe_joint("brass")]
    parts += pipe_stand("stand", -0.2)
    return parts + [flow_arrow("arrow", -0.35, PIPE_Z + 0.075, -1)]


def injection_well(rng):
    """Injection well, against the back wall: a Steam pipe arrives from -y at pipe height, turns down at a brass joint and goes into a stone collar capped by a bolted steel lid, where the water
    goes back to the ground. A yellow arrow on the pipe points at the well."""
    parts = [pad("pad", -0.3), disc("collar", 0.22, 0.14, (0.0, 0.3, 0.05), P["stone"], 10), disc("collar_rim", 0.24, 0.03, (0.0, 0.3, 0.19), P["stone_dark"], 10),
             disc("lid", 0.17, 0.04, (0.0, 0.3, 0.22), P["steel"], 10), disc("lid_hub", 0.06, 0.04, (0.0, 0.3, 0.26), P["steel_dark"], 8),
             pipe_run_y("run", -0.46, 0.3, "steam"), flange_y("flange_front", -0.5, "steel_dark"), lpm.move(pipe_joint("brass"), 0.0, 0.3, 0.0),
             disc("drop", 0.07, PIPE_Z - 0.2, (0.0, 0.3, 0.2), P["steam"], 8), disc("drop_band", 0.09, 0.03, (0.0, 0.3, 0.26), P["brass"], 8)]
    parts += [block(f"bolt{k}", 0.12 * math.cos(k * math.pi / 3) - 0.015, 0.12 * math.cos(k * math.pi / 3) + 0.015, 0.3 + 0.12 * math.sin(k * math.pi / 3) - 0.015,
                    0.3 + 0.12 * math.sin(k * math.pi / 3) + 0.015, 0.26, 0.29, P["black"]) for k in range(6)]
    parts += pipe_stand("stand", -0.2)
    return parts + [flow_arrow("arrow", -0.35, PIPE_Z + 0.075, 1)]


def power_outlet(rng):
    """Power outlet, against the back wall: a Cable lying on the floor arrives from -y and goes into a grey switchgear cabinet with a yellow warning plate and a dark door. Two white insulators
    on the roof carry a busbar toward the wall, to the city's grid."""
    parts = [block("cabinet", -0.4, 0.4, 0.14, 0.5, 0.05, 0.64, P["steel"]), block("cabinet_base", -0.42, 0.42, 0.12, 0.5, 0.0, 0.05, P["iron"]),
             block("door", -0.3, 0.3, 0.125, 0.14, 0.14, 0.56, P["steel_dark"]), block("door_handle", 0.2, 0.24, 0.11, 0.125, 0.3, 0.4, P["black"]),
             block("warning_plate", -0.12, 0.12, 0.11, 0.125, 0.44, 0.56, P["yellow"]), block("warning_bolt", -0.025, 0.025, 0.1, 0.11, 0.46, 0.54, P["black"]),
             block("roof", -0.42, 0.42, 0.12, 0.5, 0.64, 0.68, P["iron"]),
             block("busbar", -0.22, 0.22, 0.3, 0.34, 0.88, 0.94, P["copper"])]
    parts += [disc(f"insulator{k}", 0.05, 0.2, (x, 0.32, 0.68), P["white"], 8) for k, x in enumerate((-0.2, 0.2))]
    parts += [disc(f"insulator_cap{k}", 0.065, 0.03, (x, 0.32, 0.86), P["steel_dark"], 8) for k, x in enumerate((-0.2, 0.2))]
    parts += [cable_run_y("cable", -0.46, 0.12), cable_plug_y("plug", -0.5), block("cable_gland", -0.07, 0.07, 0.1, 0.14, 0.04, 0.16, P["steel_dark"])]
    parts += cable_clips(count_y=(-0.3, -0.1))
    return parts


def generator_cable(x, y_box, z_box):
    """The conduit that takes the electricity from a terminal box toward -y, down to the floor and out of the tile at -y as a Cable with a brass plug."""
    return [sideways_y(disc("conduit_top", 0.04, y_box + 0.4, (0, 0, 0), P["cable"], 8), x=x, y=-0.4, z=z_box),
            disc("conduit_down", 0.04, z_box - 0.045, (x, -0.4, 0.045), P["cable"], 8),
            cable_run_y("cable_stub", -0.5, -0.4), cable_plug_y("plug_out", -0.5), block("conduit_band", x - 0.035, x + 0.035, -0.435, -0.365, 0.3, 0.33, P["yellow"])]


def sideways_y(ob, x=0.0, y=0.0, z=0.0):
    """A part built upright along Z, laid along -y from `y` toward the tile centre, then moved: it spans y .. y + length."""
    return horizontal(ob, x=x, y=y, z=z)


def water_turbine(rng):
    """Water turbine, one tile: the Water comes in at -x and leaves at +x, both at pipe height, through a blue bulb casing with rings on two iron saddles. A teal generator with cooling fins stands on
    top, under a dark cap. Its brass terminal box sends the electricity down a conduit that leaves at -y as a Cable on the floor."""
    parts = [block("base", -0.46, 0.46, -0.3, 0.3, 0.0, 0.06, P["iron"]), block("saddle_a", -0.24, -0.12, -0.14, 0.14, 0.06, 0.2, P["iron"]), block("saddle_b", 0.12, 0.24, -0.14, 0.14, 0.06, 0.2, P["iron"])]
    parts += [pipe_run_x("pipe_in", -0.5, -0.3, "blue"), flange_x("flange_in", -0.5, "blue_dark"), pipe_run_x("pipe_out", 0.3, 0.5, "blue"), flange_x("flange_out", 0.46, "blue_dark"),
              sideways(disc("casing", 0.22, 0.6, (0, 0, 0), P["blue"], 12), x=-0.3, z=PIPE_Z),
              sideways(disc("cap_in", 0.15, 0.04, (0, 0, 0), P["blue_dark"], 12), x=-0.34, z=PIPE_Z), sideways(disc("cap_out", 0.15, 0.04, (0, 0, 0), P["blue_dark"], 12), x=0.3, z=PIPE_Z)]
    parts += [sideways(disc(f"ring{k}", 0.235, 0.04, (0, 0, 0), P["blue_dark"], 12), x=x, z=PIPE_Z) for k, x in enumerate((-0.22, 0.0, 0.18))]
    parts += [disc("coupling", 0.09, 0.04, (0.0, 0.0, 0.54), P["steel_dark"], 8), disc("generator", 0.15, 0.24, (0.0, 0.0, 0.58), P["teal"], 12), disc("generator_cap", 0.12, 0.06, (0.0, 0.0, 0.82), P["teal_dark"], 12)]
    parts += [disc(f"fin{k}", 0.165, 0.025, (0.0, 0.0, 0.61 + 0.06 * k), P["teal_dark"], 12) for k in range(4)]
    parts += [block("terminal_box", -0.07, 0.07, -0.22, -0.13, 0.6, 0.74, P["brass"]), block("terminal_lid", -0.08, 0.08, -0.23, -0.12, 0.72, 0.76, P["steel_dark"])]
    return parts + generator_cable(0.0, -0.13, 0.67)


def steam_turbine(rng):
    """Steam turbine, one tile: the Steam comes in at -x through a copper steam chest and leaves at +x, both at pipe height, through a steel casing in four steps, from a thin high-pressure end to a wide
    low-pressure end, with brass bands and bolted rings. A teal generator lies on top along the shaft, on two saddles, with cooling fins and a brass terminal box whose conduit leaves at -y as a Cable."""
    parts = [block("base", -0.46, 0.46, -0.3, 0.3, 0.0, 0.06, P["iron"]), block("saddle_a", -0.26, -0.14, -0.12, 0.12, 0.06, 0.18, P["iron"]), block("saddle_b", 0.14, 0.26, -0.12, 0.12, 0.06, 0.18, P["iron"])]
    parts += [pipe_run_x("pipe_in", -0.5, -0.42, "steam"), flange_x("flange_in", -0.5, "steel_dark"), pipe_run_x("pipe_out", 0.38, 0.5, "steam"), flange_x("flange_out", 0.46, "steel_dark"),
              sideways(disc("chest", 0.11, 0.1, (0, 0, 0), P["copper"], 10), x=-0.42, z=PIPE_Z), sideways(disc("chest_band", 0.125, 0.025, (0, 0, 0), P["brass"], 10), x=-0.38, z=PIPE_Z)]
    for k, (x0, radius) in enumerate(((-0.32, 0.12), (-0.16, 0.16), (0.0, 0.2), (0.16, 0.235))):
        parts += [sideways(disc(f"step{k}", radius, 0.16, (0, 0, 0), P["steel"], 12), x=x0, z=PIPE_Z), sideways(disc(f"ring{k}", radius + 0.02, 0.025, (0, 0, 0), P["steel_dark"], 12), x=x0 + 0.13, z=PIPE_Z)]
    parts += [sideways(disc("exhaust_cap", 0.2, 0.05, (0, 0, 0), P["steel_dark"], 12), x=0.32, z=PIPE_Z), sideways(disc("exhaust_band", 0.07, 0.03, (0, 0, 0), P["brass"], 8), x=0.4, z=PIPE_Z)]
    parts += [block("gen_saddle_a", -0.2, -0.1, -0.1, 0.1, 0.5, 0.58, P["iron"]), block("gen_saddle_b", 0.1, 0.2, -0.1, 0.1, 0.5, 0.58, P["iron"]),
              sideways(disc("generator", 0.12, 0.44, (0, 0, 0), P["teal"], 12), x=-0.22, z=0.68),
              sideways(disc("generator_cap_a", 0.1, 0.04, (0, 0, 0), P["teal_dark"], 12), x=-0.26, z=0.68), sideways(disc("generator_cap_b", 0.1, 0.04, (0, 0, 0), P["teal_dark"], 12), x=0.22, z=0.68)]
    parts += [sideways(disc(f"fin{k}", 0.135, 0.025, (0, 0, 0), P["teal_dark"], 12), x=-0.16 + 0.08 * k, z=0.68) for k in range(5)]
    parts += [block("terminal_box", -0.07, 0.07, -0.2, -0.1, 0.62, 0.76, P["brass"]), block("terminal_lid", -0.08, 0.08, -0.21, -0.09, 0.74, 0.78, P["steel_dark"])]
    return parts + generator_cable(0.0, -0.1, 0.69)


def condenser(rng):
    """Condenser, one tile: the Steam comes in at -x and leaves at +x as condensed water, both at pipe height, through a steel shell with copper end bells on two saddles. A square casing on top holds a
    grille and a fan that turns, and a blue pipe on each side carries the cooling water."""
    parts = [block("base", -0.46, 0.46, -0.3, 0.3, 0.0, 0.06, P["iron"]), block("saddle_a", -0.26, -0.14, -0.14, 0.14, 0.06, 0.15, P["iron"]), block("saddle_b", 0.14, 0.26, -0.14, 0.14, 0.06, 0.15, P["iron"])]
    parts += [pipe_run_x("pipe_in", -0.5, -0.34, "steam"), flange_x("flange_in", -0.5, "steel_dark"), pipe_run_x("pipe_out", 0.34, 0.5, "steam"), flange_x("flange_out", 0.46, "steel_dark"),
              sideways(disc("shell", 0.19, 0.6, (0, 0, 0), P["steel"], 12), x=-0.3, z=PIPE_Z), sideways(disc("bell_in", 0.21, 0.06, (0, 0, 0), P["copper"], 12), x=-0.36, z=PIPE_Z),
              sideways(disc("bell_out", 0.21, 0.06, (0, 0, 0), P["copper"], 12), x=0.3, z=PIPE_Z)]
    parts += [sideways(disc(f"band{k}", 0.205, 0.03, (0, 0, 0), P["steel_dark"], 12), x=x, z=PIPE_Z) for k, x in enumerate((-0.2, 0.0, 0.2))]
    parts += [block("fan_box_front", -0.2, 0.2, -0.2, -0.17, 0.5, 0.74, P["steel_dark"]), block("fan_box_back", -0.2, 0.2, 0.17, 0.2, 0.5, 0.74, P["steel_dark"]),
              block("fan_box_left", -0.2, -0.17, -0.2, 0.2, 0.5, 0.74, P["steel_dark"]), block("fan_box_right", 0.17, 0.2, -0.2, 0.2, 0.5, 0.74, P["steel_dark"]),
              block("fan_floor", -0.17, 0.17, -0.17, 0.17, 0.5, 0.53, P["iron"])]
    parts += [block(f"grille{k}", -0.17, 0.17, -0.17 + 0.085 * k - 0.008, -0.17 + 0.085 * k + 0.008, 0.72, 0.745, P["black"]) for k in range(5)]
    parts += [block("grille_cross", -0.008, 0.008, -0.17, 0.17, 0.72, 0.745, P["black"])]
    turning = [disc("fan_hub", 0.04, 0.05, (0.0, 0.0, 0.55), P["brass"], 8)] + [block(f"blade{k}", -0.015, 0.015, 0.0, 0.14, 0.58, 0.6, P["steel"]) for k in range(4)]
    for k, blade in enumerate(turning[1:]):
        lpm.rotate(blade, 90 * k, axis="Z")
    parts += [sideways(disc("coolant_in", 0.035, 0.13, (0, 0, 0), P["blue"], 8), x=-0.46, y=-0.2, z=0.3), sideways(disc("coolant_out", 0.035, 0.13, (0, 0, 0), P["blue"], 8), x=0.33, y=0.2, z=0.3),
              disc("coolant_riser_a", 0.035, 0.22, (-0.34, -0.2, 0.08), P["blue"], 8), disc("coolant_riser_b", 0.035, 0.22, (0.34, 0.2, 0.08), P["blue"], 8)]
    return parts, {"spin-z": (turning, (0, 0, 0.55))}


def circuit(inlet, turbine, outlet):
    """A Turbine circuit against one back wall: a wall port at the back brings the medium down two pipes into the turbine, which leaves it toward -y; the pipes turn twice and climb along x = 1 to the
    outlet port on the same wall, while the Cable leaves the turbine and climbs along x = -1 to the Power outlet."""
    return (placed(inlet[0], 0, 3) + placed(inlet[1], 0, 2) + placed(inlet[1], 0, 1) + placed(turbine, 0, 0, 270)
            + placed(power_outlet, -1, 3) + placed(cable_straight, -1, 2) + placed(cable_straight, -1, 1) + placed(cable_elbow, -1, 0, 90))


def hydro_line(rng):
    """A complete Hydro circuit: Water inlet, Water pipes, Water turbine, Water pipes with two turns and the Water outlet, and a Cable to the Power outlet."""
    return (circuit((water_inlet, water_pipe_straight), water_turbine, None) + placed(water_pipe_straight, 0, -1) + placed(water_pipe_elbow, 0, -2, 90) + placed(water_pipe_elbow, 1, -2, 180)
            + placed(water_pipe_straight, 1, -1) + placed(water_pipe_straight, 1, 0) + placed(water_pipe_straight, 1, 1) + placed(water_pipe_straight, 1, 2) + placed(water_outlet, 1, 3))


def geothermal_line(rng):
    """A complete Geothermal circuit: Underground water inlet, Steam pipes, Steam turbine, Condenser, Steam pipes with two turns and the Injection well, and a Cable to the Power outlet."""
    return (circuit((underground_water_inlet, steam_pipe_straight), steam_turbine, None) + placed(condenser, 0, -1, 270) + placed(steam_pipe_elbow, 0, -2, 90) + placed(steam_pipe_elbow, 1, -2, 180)
            + placed(steam_pipe_straight, 1, -1) + placed(steam_pipe_straight, 1, 0) + placed(steam_pipe_straight, 1, 1) + placed(steam_pipe_straight, 1, 2) + placed(injection_well, 1, 3))


def placed(builder, x, y, turn=0):
    """The parts of a builder, turned about the centre of its tile (quarter turns counter-clockwise) and moved to tile (x, y)."""
    built = builder(None)
    if isinstance(built, tuple):
        parts = built[0] + [part for group, _ in built[1].values() for part in group]
    else:
        parts = built
    for part in parts:
        if turn:
            lpm.rotate(part, turn, axis="Z")
        lpm.move(part, x, y, 0)
    return parts


def coal_line(rng):
    """A complete Coal circuit against one back wall: the Coal quay and a coal Conveyor feed the Steam boiler, the Water inlet and a water pipe with a turn feed it water, a steam pipe with a turn
    takes the steam to the Alternator, and a Cable takes the electricity to the Power outlet."""
    return (placed(steam_boiler, 0, 0) + placed(coal_conveyor_straight, 0, 1) + placed(coal_conveyor_straight, 0, 2) + placed(coal_quay, 0, 3)
            + placed(water_pipe_straight, -1, 0, 90) + placed(water_pipe_elbow, -2, 0, 90) + placed(water_pipe_straight, -2, 1) + placed(water_pipe_straight, -2, 2)
            + placed(water_inlet, -2, 3)
            + placed(steam_pipe_straight, 1, 0, 90) + placed(steam_pipe_elbow, 2, 0, 180) + placed(alternator, 2, 1, 90) + placed(cable_straight, 2, 2) + placed(power_outlet, 2, 3))


def wall_ports(rng):
    """The wall ports not on the Coal circuit, side by side against one wall, each with a pipe tile in front: Water outlet, Underground water inlet, Injection well."""
    return (placed(water_outlet, 0, 0) + placed(water_pipe_straight, 0, -1) + placed(underground_water_inlet, 1.6, 0) + placed(steam_pipe_straight, 1.6, -1)
            + placed(injection_well, 3.2, 0) + placed(steam_pipe_straight, 3.2, -1))


if __name__ == "__main__":
    models = {
        "steam-boiler": steam_boiler,
        "water-pipe-straight": water_pipe_straight,
        "water-pipe-elbow": water_pipe_elbow,
        "steam-pipe-straight": steam_pipe_straight,
        "steam-pipe-elbow": steam_pipe_elbow,
        "coal-conveyor-straight": coal_conveyor_straight,
        "alternator": alternator,
        "water-turbine": water_turbine,
        "steam-turbine": steam_turbine,
        "condenser": condenser,
        "coal-quay": coal_quay,
        "water-inlet": water_inlet,
        "water-outlet": water_outlet,
        "underground-water-inlet": underground_water_inlet,
        "injection-well": injection_well,
        "power-outlet": power_outlet,
        "cable-straight": cable_straight,
        "cable-elbow": cable_elbow,
    }
    export_all(models, P, 1200, HERE, center=False, ground=False)
    # The previews are for the eyes only: they are exported when asked for by name, never with the Fixtures, so that no unused model is kept.
    previews = {"wall-ports-preview": wall_ports, "hydro-line-preview": hydro_line, "geothermal-line-preview": geothermal_line, "coal-line-preview": coal_line}
    export_all({name: builder for name, builder in previews.items() if name in sys.argv}, P, 9000, HERE, center=False, ground=False)
