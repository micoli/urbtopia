import interiorBalance from '../../../assets/defs/balance/factoryInterior.json' with { type: 'json' };
import packhouseBalance from '../../../assets/defs/balance/packhouseInterior.json' with { type: 'json' };
import { FIXTURES } from '../venues/fixtures';
import { PRODUCTION_INTERIOR_KINDS, type FixtureSide } from '../venues/venueVocabulary';
import type { Building, BuildingType, VenueFixture } from '../engine/state';
import { interiorLayoutOf } from '../interiors/interiorStaff';
import { memoizedByLayout } from './memoizedByLayout';

export type Turn = 'cw' | 'ccw';

// What a Machine that is not linked lacks.
export type MachineProblem = 'noDrive' | 'wrongTurn' | 'jammed' | 'noFlow' | 'overloaded' | 'tankFull';

export interface InteriorLinks {
  // The Machines that receive every Drive and every Flow they need.
  linked: ReadonlySet<number>;
  // A group of Gears fed in two opposite directions: nothing in it turns.
  jammed: boolean;
  // Why each Machine that is not linked is not, by id.
  problems: ReadonlyMap<number, readonly MachineProblem[]>;
  // Packhouse interior: the Fixtures of a Line that carries Packets from a Packer, whose Drive is linked, to an Exit.
  lined: ReadonlySet<number>;
  // The Fixtures that the Machine ahead of them feeds beyond its limit.
  overfed: ReadonlySet<number>;
}

type Cell = { x: number; y: number };
type Kind = 'drive' | 'flow';

// Where each side of a Fixture drawn with rotation 0 faces; each quarter turn takes (x, y) to (-y, x).
export const SIDE_OFFSETS: Record<FixtureSide, Cell> = { front: { x: 0, y: 1 }, right: { x: 1, y: 0 }, back: { x: 0, y: -1 }, left: { x: -1, y: 0 } };

export const turned = ({ x, y }: Cell, quarterTurns: number): Cell => (quarterTurns % 4 === 0 ? { x, y } : turned({ x: -y, y: x }, quarterTurns - 1));

export const keyOf = (x: number, y: number): string => `${x},${y}`;

const flip = (turn: Turn): Turn => (turn === 'cw' ? 'ccw' : 'cw');

export const isFactoryFixture = (fixture: VenueFixture): boolean => (PRODUCTION_INTERIOR_KINDS as readonly string[]).includes(FIXTURES[fixture.type].venue) && FIXTURES[fixture.type].role !== undefined;

export const roleOf = (fixture: VenueFixture) => FIXTURES[fixture.type].role;

const sidesOf = (fixture: VenueFixture, kind: Kind): readonly FixtureSide[] => FIXTURES[fixture.type][kind] ?? [];

// The side of a Fixture that faces a neighbouring cell, if it is one of the four.
export function sideToward(fixture: VenueFixture, target: Cell): FixtureSide | undefined {
  return (Object.keys(SIDE_OFFSETS) as FixtureSide[]).find(side => {
    const offset = turned(SIDE_OFFSETS[side], fixture.rotation);
    return fixture.x + offset.x === target.x && fixture.y + offset.y === target.y;
  });
}

const isRim = (fixture: VenueFixture, target: Cell): boolean => {
  const side = sideToward(fixture, target);
  return side !== undefined && (FIXTURES[fixture.type].rim ?? []).includes(side);
};

// A Gear takes and gives Drive through its axle ends only: a Motor, a Shaft, a Machine or a Pump never meets its rim. The rim meshes with the rim of another Gear:
// two Gears touch rim to rim or axle to axle, never rim to axle. A bevel gear meshes on its own cones.
const sameKindOfEdge = (a: VenueFixture, b: VenueFixture): boolean => {
  const gearA = roleOf(a) === 'gear', gearB = roleOf(b) === 'gear';
  if (gearA && gearB) return isRim(a, b) === isRim(b, a);
  if (gearA) return roleOf(b) === 'bevel' || !isRim(a, b);
  if (gearB) return roleOf(a) === 'bevel' || !isRim(b, a);
  return true;
};

const opensToward = (fixture: VenueFixture, kind: Kind, target: Cell): boolean =>
  sidesOf(fixture, kind).some(side => {
    const offset = turned(SIDE_OFFSETS[side], fixture.rotation);
    return fixture.x + offset.x === target.x && fixture.y + offset.y === target.y;
  });

// The Fixtures that a Fixture hands Drive or Flow to, and takes it from: both sides of the edge must be open.
function connectionsOf(fixture: VenueFixture, kind: Kind, at: ReadonlyMap<string, VenueFixture>): VenueFixture[] {
  return sidesOf(fixture, kind).flatMap(side => {
    const offset = turned(SIDE_OFFSETS[side], fixture.rotation);
    const neighbour = at.get(keyOf(fixture.x + offset.x, fixture.y + offset.y));
    return neighbour && opensToward(neighbour, kind, fixture) && (kind === 'flow' || sameKindOfEdge(fixture, neighbour)) ? [neighbour] : [];
  });
}

export const placedOn = (fixtures: readonly VenueFixture[]): Map<string, VenueFixture> => new Map(fixtures.map(fixture => [keyOf(fixture.x, fixture.y), fixture]));

// A Machine takes the Drive it is handed and passes none on.
export const isMachine = (fixture: VenueFixture): boolean => roleOf(fixture) === 'machine';

// A Pump takes the Drive it is handed too, and passes none on.
const takesDrive = (fixture: VenueFixture): boolean => isMachine(fixture) || roleOf(fixture) === 'pump';

// The groups of Fixtures that can pass Drive to one another, without crossing a Machine.
function driveGroups(fixtures: readonly VenueFixture[], at: ReadonlyMap<string, VenueFixture>): VenueFixture[][] {
  const seen = new Set<number>();
  const groups: VenueFixture[][] = [];
  for (const start of fixtures.filter(fixture => sidesOf(fixture, 'drive').length > 0 && !takesDrive(fixture))) {
    if (seen.has(start.id)) continue;
    const group: VenueFixture[] = [];
    const queue = [start];
    seen.add(start.id);
    while (queue.length > 0) {
      const current = queue.pop()!;
      group.push(current);
      for (const next of connectionsOf(current, 'drive', at)) {
        if (takesDrive(next) || seen.has(next.id)) continue;
        seen.add(next.id);
        queue.push(next);
      }
    }
    groups.push(group);
  }
  return groups;
}

// What a Fixture carries of the Drive: the turn it turns with, or, for a bevel gear, the turn of each of its cones.
export type InteriorMotion = Turn | Readonly<Partial<Record<FixtureSide, Turn>>>;

export interface DriveReceipts {
  // The directions each Machine is handed, by id.
  received: Map<number, Set<Turn>>;
  jammed: boolean;
  // The Machines next to a jammed group.
  jammedMachines: Set<number>;
  // The way each Fixture that passes Drive turns, in the groups that are not jammed.
  carried: Map<number, InteriorMotion>;
  // The Machines each Motor's group hands Drive to, and the Motors in that group.
  served: Map<number, { handed: Set<number>; motors: number; overloaded: number }>;
  // The Machines and Pumps that a group of Motors has no strength left to drive: the highest ids, past what the Motors can drive.
  overloaded: Set<number>;
}

// A point of the Drive: a Fixture, or one cone of a bevel gear.
interface Node {
  fixture: VenueFixture;
  side?: FixtureSide;
}

const isBevel = (fixture: VenueFixture): boolean => roleOf(fixture) === 'bevel';

const nodeKey = ({ fixture, side }: Node): string => (side ? `${fixture.id}:${side}` : `${fixture.id}`);

// The Fixture across a side, when both sides of the edge are open.
function across(fixture: VenueFixture, side: FixtureSide, at: ReadonlyMap<string, VenueFixture>): VenueFixture | undefined {
  const offset = turned(SIDE_OFFSETS[side], fixture.rotation);
  const neighbour = at.get(keyOf(fixture.x + offset.x, fixture.y + offset.y));
  return neighbour && opensToward(neighbour, 'drive', fixture) && sameKindOfEdge(fixture, neighbour) ? neighbour : undefined;
}

interface Step {
  node?: Node;
  machine?: VenueFixture;
  // The turn reverses on the way: two Gears meshed rim to rim, or two cones of a bevel gear that mesh.
  reverses: boolean;
}

// A turn is told about the +x or +z axis of the floor. Two cones meshing at a right angle turn opposite ways about their outward axes, so
// their turns are reversed when both point toward the positive axes or both away. The two side cones of a tee both mesh the stem, so
// they turn opposite ways about the floor.
function meshReverses(fixture: VenueFixture, a: FixtureSide, b: FixtureSide): boolean {
  const positive = (side: FixtureSide): boolean => {
    const { x, y } = turned(SIDE_OFFSETS[side], fixture.rotation);
    return x + y > 0;
  };
  if (a !== 'front' && b !== 'front') return true;
  return positive(a) === positive(b);
}

function stepsFrom(node: Node, at: ReadonlyMap<string, VenueFixture>): Step[] {
  const { fixture, side } = node;
  const sides = side ? [side] : sidesOf(fixture, 'drive');
  const steps: Step[] = [];
  for (const own of sides) {
    const next = across(fixture, own, at);
    if (!next) continue;
    if (takesDrive(next)) steps.push({ machine: next, reverses: false });
    else if (isBevel(next)) steps.push({ node: { fixture: next, side: sideToward(next, fixture)! }, reverses: false });
    else steps.push({ node: { fixture: next }, reverses: roleOf(next) === 'gear' && isRim(fixture, next) });
  }
  // Inside a bevel gear the stem cone (the front) meshes with the others.
  if (side) for (const other of sidesOf(fixture, 'drive')) if (other !== side) steps.push({ node: { fixture, side: other }, reverses: meshReverses(fixture, side, other) });
  return steps;
}

function driveReceipts(fixtures: readonly VenueFixture[], at: ReadonlyMap<string, VenueFixture>): DriveReceipts {
  const received = new Map<number, Set<Turn>>();
  const jammedMachines = new Set<number>();
  const carried = new Map<number, InteriorMotion>();
  const served = new Map<number, { handed: Set<number>; motors: number; overloaded: number }>();
  const overloaded = new Set<number>();
  let jammed = false;
  for (const group of driveGroups(fixtures, at)) {
    const turns = new Map<string, { node: Node; turn: Turn }>();
    const queue: Node[] = group.filter(fixture => roleOf(fixture) === 'motor').map(fixture => ({ fixture }));
    queue.forEach(node => turns.set(nodeKey(node), { node, turn: 'cw' }));
    const handed: [number, Turn][] = [];
    let conflict = false;
    while (queue.length > 0 && !conflict) {
      const current = queue.shift()!;
      const turn = turns.get(nodeKey(current))!.turn;
      for (const step of stepsFrom(current, at)) {
        const nextTurn = step.reverses ? flip(turn) : turn;
        if (step.machine) {
          handed.push([step.machine.id, nextTurn]);
          continue;
        }
        const known = turns.get(nodeKey(step.node!));
        if (known === undefined) {
          turns.set(nodeKey(step.node!), { node: step.node!, turn: nextTurn });
          queue.push(step.node!);
        } else if (known.turn !== nextTurn) conflict = true;
      }
    }
    if (conflict) {
      jammed = true;
      for (const member of group) for (const next of connectionsOf(member, 'drive', at)) if (takesDrive(next)) jammedMachines.add(next.id);
      continue;
    }
    const motors = group.filter(fixture => roleOf(fixture) === 'motor');
    const ids = [...new Set(handed.map(([id]) => id))].sort((a, b) => a - b);
    const capacity = motors.length * interiorBalance.motorCapacity;
    const share = { handed: new Set(ids.slice(0, capacity)), motors: motors.length, overloaded: Math.max(0, ids.length - capacity) };
    for (const id of ids.slice(capacity)) overloaded.add(id);
    for (const motor of motors) served.set(motor.id, share);
    for (const [id, turn] of handed.filter(([id]) => share.handed.has(id))) received.set(id, (received.get(id) ?? new Set<Turn>()).add(turn));
    for (const { node, turn } of turns.values()) {
      if (!node.side) carried.set(node.fixture.id, turn);
      else carried.set(node.fixture.id, { ...(carried.get(node.fixture.id) as object | undefined), [node.side]: turn });
    }
  }
  return { received, jammed, jammedMachines, carried, served, overloaded };
}

export interface LineReach {
  // The Fixtures from which Packets can come to an Exit.
  lined: Set<number>;
  // For each Fixture the Fixtures that Packets go on to.
  next: Map<number, number[]>;
  // The Fixtures that a Machine feeds beyond its limit: Packets do not go into them.
  overfed: Set<number>;
}

// A Line: Packets come out of a Fixture by a side of its lineOut and go into the next one when that one takes them in on the side that faces back. They start from a Packer
// whose Drive is linked and stop at a Strapper that is not linked; only what leads to an Exit counts.
function unlimitedLineReach(fixtures: readonly VenueFixture[], at: ReadonlyMap<string, VenueFixture>, linked: ReadonlySet<number>): LineReach {
  const sides = (fixture: VenueFixture, key: 'lineIn' | 'lineOut'): readonly FixtureSide[] => FIXTURES[fixture.type][key] ?? [];
  const reached = new Set<number>();
  const next = new Map<number, number[]>();
  const queue = fixtures.filter(fixture => linked.has(fixture.id) && sides(fixture, 'lineOut').length > 0 && sides(fixture, 'lineIn').length === 0);
  for (const source of queue) reached.add(source.id);
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (isMachine(current) && !linked.has(current.id)) continue;
    for (const side of sides(current, 'lineOut')) {
      const offset = turned(SIDE_OFFSETS[side], current.rotation);
      const neighbour = at.get(keyOf(current.x + offset.x, current.y + offset.y));
      const facing = neighbour && sideToward(neighbour, current);
      if (!neighbour || !facing || !sides(neighbour, 'lineIn').includes(facing)) continue;
      next.set(current.id, [...(next.get(current.id) ?? []), neighbour.id]);
      if (reached.has(neighbour.id)) continue;
      reached.add(neighbour.id);
      queue.push(neighbour);
    }
  }
  const lined = new Set(fixtures.filter(fixture => reached.has(fixture.id) && roleOf(fixture) === 'exit').map(fixture => fixture.id));
  for (let grew = true; grew; ) {
    grew = false;
    for (const [id, targets] of next) {
      if (lined.has(id) || !targets.some(target => lined.has(target))) continue;
      lined.add(id);
      grew = true;
    }
  }
  return { lined, next, overfed: new Set() };
}

const matches = (fixture: VenueFixture, name: string): boolean => FIXTURES[fixture.type].family === name || roleOf(fixture) === name;

const reachableFrom = (source: number, next: ReadonlyMap<number, number[]>): Set<number> => {
  const seen = new Set<number>();
  const queue = [source];
  while (queue.length > 0) for (const id of next.get(queue.shift()!) ?? []) if (!seen.has(id)) {
    seen.add(id);
    queue.push(id);
  }
  return seen;
};

// The Line, once every Machine feeds no more Fixtures than its limit: of those it reaches, the lowest ids are fed and the others are left out, and so is what only they lead to.
function lineReach(fixtures: readonly VenueFixture[], at: ReadonlyMap<string, VenueFixture>, linked: ReadonlySet<number>): LineReach {
  const reach = feedLimitedReach(fixtures, at, linked);
  const stage = requiredStageOf(fixtures);
  return stage === undefined ? reach : throughStage(fixtures, reach, stage);
}

// The family a Line must pass through to count, for the building that these Fixtures belong to.
export const requiredStageOf = (fixtures: readonly VenueFixture[]): string | undefined => {
  const first = fixtures[0];
  return first === undefined ? undefined : interiorLayoutOf(FIXTURES[first.type].venue as BuildingType)?.requires;
};

// Keeps the Exits that Packets reach through a Fixture of the required family, and what leads to them.
function throughStage(fixtures: readonly VenueFixture[], reach: LineReach, stage: string): LineReach {
  const passed = new Set<number>();
  for (const fixture of fixtures) if (reach.lined.has(fixture.id) && FIXTURES[fixture.type].family === stage) for (const id of reachableFrom(fixture.id, reach.next)) passed.add(id);
  const lined = new Set(fixtures.filter(fixture => roleOf(fixture) === 'exit' && reach.lined.has(fixture.id) && passed.has(fixture.id)).map(fixture => fixture.id));
  for (let grew = true; grew; ) {
    grew = false;
    for (const [id, targets] of reach.next) {
      if (lined.has(id) || !reach.lined.has(id) || !targets.some(target => lined.has(target))) continue;
      lined.add(id);
      grew = true;
    }
  }
  return { ...reach, lined };
}

function feedLimitedReach(fixtures: readonly VenueFixture[], at: ReadonlyMap<string, VenueFixture>, linked: ReadonlySet<number>): LineReach {
  const limits = (fixture: VenueFixture) => interiorLayoutOf(FIXTURES[fixture.type].venue as BuildingType)?.feeds?.filter(feed => matches(fixture, feed.from)) ?? [];
  if (!fixtures.some(fixture => limits(fixture).length > 0)) return unlimitedLineReach(fixtures, at, linked);
  const overfed = new Set<number>();
  for (let round = 0; round < fixtures.length; round++) {
    const kept = fixtures.filter(fixture => !overfed.has(fixture.id));
    const reach = unlimitedLineReach(kept, placedOn(kept), linked);
    const before = overfed.size;
    for (const source of kept) for (const feed of limits(source)) {
      const reachable = reachableFrom(source.id, reach.next);
      const fed = kept.filter(fixture => reachable.has(fixture.id) && matches(fixture, feed.to)).sort((a, b) => a.id - b.id);
      for (const extra of fed.slice(feed.max)) overfed.add(extra.id);
    }
    if (overfed.size === before) return { ...reach, overfed };
  }
  return unlimitedLineReach(fixtures, at, linked);
}

// A Machine of a Mill with a second side for Flow hands it on, like a Pipe: the Cleaner and the Millstone sit in the chain with the Pump and the Tank. A Pump of a Mill also draws from the Machine behind it.
const passesFlow = (fixture: VenueFixture): boolean => FIXTURES[fixture.type].venue === 'mill' && sidesOf(fixture, 'flow').length > 1;

// The Fixtures that Flow reaches. A Tank only gives its fluid to the Pipes, up to the back of a Pump; a Pump that is handed Drive pushes it on
// out of its front, through Pipes and to the Machines, and to the back of the next Pump.
export interface FlowReach {
  reached: Set<number>;
  // What each pushing Pump puts its Flow into: the Fixtures it reaches, and the Pumps behind which it goes on.
  outputs: Map<number, { nodes: Set<number>; pumps: number[] }>;
  // The Cooling vats that no Tank has the strength to feed: past the three each Tank feeds, the highest ids first.
  starved: Set<number>;
}

function flowReach(fixtures: readonly VenueFixture[], at: ReadonlyMap<string, VenueFixture>, powered: ReadonlySet<number>): FlowReach {
  const reached = new Set<number>();
  const outputs = new Map<number, { nodes: Set<number>; pumps: number[] }>();
  const pushing: VenueFixture[] = [];
  const queued = new Set<number>();
  const fedByTank = new Map<number, number[]>();
  const walk = (start: VenueFixture, marksMachines: boolean): void => {
    const output = { nodes: new Set<number>(), pumps: [] as number[] };
    if (marksMachines) outputs.set(start.id, output);
    else fedByTank.set(start.id, output.pumps);
    const seen = new Set<number>([start.id]);
    const queue = [start];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const isStartingPump = current === start && roleOf(start) === 'pump';
      const pumpOutlet = isStartingPump ? neighbourOn(start, 'front', at) : undefined;
      const millIntake = isStartingPump && FIXTURES[start.type].venue === 'mill' ? neighbourOn(start, 'back', at) : undefined;
      const neighbours = isStartingPump ? [pumpOutlet, millIntake].filter((neighbour): neighbour is VenueFixture => neighbour !== undefined) : connectionsOf(current, 'flow', at);
      for (const next of neighbours) {
        if (seen.has(next.id)) continue;
        seen.add(next.id);
        if (roleOf(next) === 'tank') continue;
        if (roleOf(next) === 'pump') {
          reached.add(next.id);
          if (sideToward(next, current) !== 'back' || !powered.has(next.id)) continue;
          output.pumps.push(next.id);
          if (!queued.has(next.id)) {
            queued.add(next.id);
            pushing.push(next);
          }
          continue;
        }
        if (isMachine(next)) {
          if (marksMachines) reached.add(next.id);
          output.nodes.add(next.id);
          if (passesFlow(next)) queue.push(next);
          continue;
        }
        reached.add(next.id);
        output.nodes.add(next.id);
        queue.push(next);
      }
    }
  };
  for (const tank of fixtures.filter(fixture => roleOf(fixture) === 'tank')) {
    reached.add(tank.id);
    walk(tank, false);
  }
  for (const pump of fixtures.filter(fixture => roleOf(fixture) === 'pump' && powered.has(fixture.id) && FIXTURES[fixture.type].venue === 'mill')) {
    queued.add(pump.id);
    pushing.push(pump);
  }
  for (let index = 0; index < pushing.length; index++) walk(pushing[index]!, true);
  return { reached, outputs, starved: starvedVats(fixtures, fedByTank, outputs, reached) };
}

// The Cooling vats a Tank reaches through its Pumps, and the ones it cannot feed: each Tank feeds a few, the lowest ids first, and the vat no Tank feeds is cut from the Flow.
function starvedVats(fixtures: readonly VenueFixture[], fedByTank: ReadonlyMap<number, number[]>, outputs: FlowReach['outputs'], reached: Set<number>): Set<number> {
  // The Machines of a Farm interior that take Flow, the Washer and the Sprinklers, count with the Cooling vats against the strength of a Tank.
  const isVat = new Set(fixtures.filter(fixture => FIXTURES[fixture.type].coolant !== undefined || (FIXTURES[fixture.type].venue === 'farm' && isMachine(fixture) && FIXTURES[fixture.type].flow !== undefined)).map(fixture => fixture.id));
  const fed = new Set<number>();
  const wanted = new Set<number>();
  for (const pumps of fedByTank.values()) {
    const vats = new Set<number>();
    const seen = new Set<number>();
    const queue = [...pumps];
    while (queue.length > 0) {
      const pump = queue.shift()!;
      if (seen.has(pump)) continue;
      seen.add(pump);
      const output = outputs.get(pump);
      for (const id of output?.nodes ?? []) if (isVat.has(id)) vats.add(id);
      queue.push(...(output?.pumps ?? []));
    }
    const sorted = [...vats].sort((a, b) => a - b);
    sorted.forEach(id => wanted.add(id));
    sorted.slice(0, interiorBalance.tankCoolingVats).forEach(id => fed.add(id));
  }
  const starved = new Set([...wanted].filter(id => !fed.has(id)));
  for (const id of starved) reached.delete(id);
  return starved;
}

// Whether the Flow a Pump pushes ends in a Machine that is linked, in the Pipes behind it or behind the Pumps that follow.
function pushesToLinked(pump: number, flow: FlowReach, linked: ReadonlySet<number>, seen = new Set<number>()): boolean {
  if (seen.has(pump)) return false;
  seen.add(pump);
  const output = flow.outputs.get(pump);
  return output !== undefined && ([...output.nodes].some(id => linked.has(id)) || output.pumps.some(next => pushesToLinked(next, flow, linked, seen)));
}

// The Fixture a side of a Fixture faces, when that Fixture opens toward it for Flow.
function neighbourOn(fixture: VenueFixture, side: FixtureSide, at: ReadonlyMap<string, VenueFixture>): VenueFixture | undefined {
  const offset = turned(SIDE_OFFSETS[side], fixture.rotation);
  const neighbour = at.get(keyOf(fixture.x + offset.x, fixture.y + offset.y));
  return neighbour && opensToward(neighbour, 'flow', fixture) ? neighbour : undefined;
}

// The Pumps that are handed Drive, and so push their Flow on.
const poweredPumps = (fixtures: readonly VenueFixture[], drive: DriveReceipts): Set<number> => new Set(fixtures.filter(fixture => roleOf(fixture) === 'pump' && drive.received.has(fixture.id) && !drive.jammedMachines.has(fixture.id)).map(fixture => fixture.id));

function problemsOf(machine: VenueFixture, drive: DriveReceipts, flowing: ReadonlySet<number>, starved: ReadonlySet<number>): MachineProblem[] {
  const spec = FIXTURES[machine.type];
  const problems: MachineProblem[] = [];
  if (spec.drive) {
    const turns = drive.received.get(machine.id);
    if (drive.overloaded.has(machine.id)) problems.push('overloaded');
    else if (drive.jammedMachines.has(machine.id) || (turns?.size ?? 0) > 1) problems.push('jammed');
    else if (turns === undefined) problems.push('noDrive');
    else if (spec.turns !== undefined && !turns.has(spec.turns)) problems.push('wrongTurn');
  }
  if (spec.flow && starved.has(machine.id)) problems.push('tankFull');
  else if (spec.flow && !flowing.has(machine.id)) problems.push('noFlow');
  return problems;
}

// The Millstones at work: linked, with a Recipe, on the Pipes of a Pump that also reaches a linked Machine of the family at the intake and the one that takes what the Recipe makes.
function milledOf(fixtures: readonly VenueFixture[], flow: FlowReach, linked: ReadonlySet<number>): Set<number> {
  const milling = interiorLayoutOf('mill')?.milling;
  const milled = new Set<number>();
  if (!milling) return milled;
  const byId = new Map(fixtures.map(fixture => [fixture.id, fixture]));
  for (const { nodes } of flow.outputs.values()) {
    const fed = [...nodes].filter(id => linked.has(id)).map(id => byId.get(id)!);
    const has = (family: string): boolean => fed.some(fixture => FIXTURES[fixture.type].family === family);
    for (const stone of fed.filter(fixture => FIXTURES[fixture.type].family === 'millstone' && fixture.recipe !== undefined)) {
      const destination = milling.destinations[stone.recipe!];
      if (destination !== undefined && has(milling.input) && has(destination)) milled.add(stone.id);
    }
  }
  return milled;
}

// The Spinners at work: linked, with a Recipe. A Spinner needs nothing but its Drive, so a Textile mill has no Line or Flow to complete.
function spunOf(fixtures: readonly VenueFixture[], linked: ReadonlySet<number>): Set<number> {
  return new Set(fixtures.filter(fixture => linked.has(fixture.id) && FIXTURES[fixture.type].family === 'spinner' && fixture.recipe !== undefined).map(fixture => fixture.id));
}

// What is worked out once for a list of Fixtures: Drive, Flow and Links. A floor's list is replaced, never changed, when the player edits it,
// so each list is read once however many panels, bonuses and scenes ask.
export interface InteriorReport {
  fixtures: readonly VenueFixture[];
  at: ReadonlyMap<string, VenueFixture>;
  drive: DriveReceipts;
  powered: ReadonlySet<number>;
  flow: FlowReach;
  line: LineReach;
  links: InteriorLinks;
}

export const interiorReportOf = memoizedByLayout((allFixtures): InteriorReport => {
  const fixtures = allFixtures.filter(fixture => isFactoryFixture(fixture) && fixture.broken !== true);
  const at = placedOn(fixtures);
  const drive = driveReceipts(fixtures, at);
  const powered = poweredPumps(fixtures, drive);
  const flow = flowReach(fixtures, at, powered);
  const linked = new Set<number>();
  const problems = new Map<number, readonly MachineProblem[]>();
  for (const machine of fixtures.filter(isMachine)) {
    const lacking = problemsOf(machine, drive, flow.reached, flow.starved);
    if (lacking.length === 0) linked.add(machine.id);
    else problems.set(machine.id, lacking);
  }
  const line = lineReach(fixtures, at, linked);
  const lined = new Set([...line.lined, ...milledOf(fixtures, flow, linked), ...spunOf(fixtures, linked)]);
  return { fixtures, at, drive, powered, flow, line, links: { linked, jammed: drive.jammed, problems, lined, overfed: line.overfed } };
});

export const interiorLinksOf = (allFixtures: readonly VenueFixture[]): InteriorLinks => interiorReportOf(allFixtures).links;

// The Fixtures that turn, and the way they turn: whatever passes Drive in a group that is not jammed, and the Machines that are linked.
export const interiorMotionOf = memoizedByLayout((allFixtures): ReadonlyMap<number, InteriorMotion> => {
  const { fixtures, drive, powered, flow, links } = interiorReportOf(allFixtures);
  const motion = new Map<number, InteriorMotion>(drive.carried);
  for (const id of links.lined) motion.set(id, 'cw');
  for (const id of powered) if (pushesToLinked(id, flow, links.linked)) motion.set(id, 'cw');
  for (const machine of fixtures.filter(fixture => links.linked.has(fixture.id))) {
    const turns = drive.received.get(machine.id);
    motion.set(machine.id, turns ? [...turns][0]! : 'cw');
  }
  return motion;
});

// The Fixtures that run: what carries Drive, the linked Machines, and the Pumps and Pipes whose Flow reaches a linked Machine. Only they wear.
export const interiorUsageOf = memoizedByLayout((allFixtures): ReadonlySet<number> => {
  const { fixtures, flow, links } = interiorReportOf(allFixtures);
  const byId = new Map(fixtures.map(fixture => [fixture.id, fixture]));
  const used = new Set<number>(interiorMotionOf(allFixtures).keys());
  for (const id of links.lined) used.add(id);
  for (const [pump, output] of flow.outputs) {
    if (!pushesToLinked(pump, flow, links.linked)) continue;
    for (const id of output.nodes) if (links.linked.has(id) || !isMachine(byId.get(id)!)) used.add(id);
    for (const tank of fixtures.filter(fixture => roleOf(fixture) === 'tank')) if (flow.reached.has(tank.id)) used.add(tank.id);
  }
  return used;
});

// How much each Fixture that runs wears, as a share of the usual: what lies downstream of a Scanner wears less.
export const interiorUsageWeightsOf = memoizedByLayout((allFixtures): ReadonlyMap<number, number> => {
  const { fixtures, line } = interiorReportOf(allFixtures);
  const weights = new Map<number, number>([...interiorUsageOf(allFixtures)].map(id => [id, 1]));
  const scanned = new Set<number>();
  const queue = fixtures.filter(fixture => roleOf(fixture) === 'scanner' && line.lined.has(fixture.id)).flatMap(fixture => line.next.get(fixture.id) ?? []);
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (scanned.has(id) || !line.lined.has(id)) continue;
    scanned.add(id);
    queue.push(...(line.next.get(id) ?? []));
  }
  for (const id of scanned) if (weights.has(id)) weights.set(id, packhouseBalance.scannerWearFactor);
  return weights;
});

// The Machines that a circuit of Flow reaches from a Machine, through its Pipes and Pumps.
export function circuitOf(start: VenueFixture, at: ReadonlyMap<string, VenueFixture>): VenueFixture[] {
  const seen = new Set<number>([start.id]);
  const machines: VenueFixture[] = [];
  const queue = [start];
  while (queue.length > 0) {
    for (const next of connectionsOf(queue.shift()!, 'flow', at)) {
      if (seen.has(next.id)) continue;
      seen.add(next.id);
      if (isMachine(next)) machines.push(next);
      else queue.push(next);
    }
  }
  return machines;
}

// How many Machines and Pumps the Motor's group drives, how many its Motors can drive, and how many are left stopped past that.
export function interiorMotorLoadOf(allFixtures: readonly VenueFixture[], motor: VenueFixture): { driven: number; capacity: number; overloaded: number } {
  const share = interiorReportOf(allFixtures).drive.served.get(motor.id);
  return { driven: share?.handed.size ?? 0, capacity: (share?.motors ?? 1) * interiorBalance.motorCapacity, overloaded: share?.overloaded ?? 0 };
}

// The Machines and Pumps that no Motor has the strength to drive.
export const interiorOverloadedOf = (allFixtures: readonly VenueFixture[]): ReadonlySet<number> => interiorReportOf(allFixtures).drive.overloaded;

const NO_FIXTURES: readonly VenueFixture[] = [];

// The Fixtures of a Factory's floor, the same empty list each time when it has none, so what is cached on a list stays cached.
export const interiorFixturesOf = (building: Pick<Building, 'interior'>): readonly VenueFixture[] => building.interior?.fixtures ?? NO_FIXTURES;

