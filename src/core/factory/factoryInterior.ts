import floorBalance from '../../../assets/defs/balance/factoryFloor.json' with { type: 'json' };
import packhouseBalance from '../../../assets/defs/balance/packhouseFloor.json' with { type: 'json' };
import { FIXTURES } from '../venues/fixtures';
import { distanceBetween } from '../venues/layout';
import type { FixtureSide, PackSize } from '../venues/venueVocabulary';
import type { ItemId } from '../economy/items';
import type { Building, VenueFixture } from '../engine/state';

export type Turn = 'cw' | 'ccw';

// What a Machine that is not linked lacks.
export type MachineProblem = 'noDrive' | 'wrongTurn' | 'jammed' | 'noFlow' | 'overloaded' | 'tankFull';

export interface FloorLinks {
  // The Machines that receive every Drive and every Flow they need.
  linked: ReadonlySet<number>;
  // A group of Gears fed in two opposite directions: nothing in it turns.
  jammed: boolean;
  // Why each Machine that is not linked is not, by id.
  problems: ReadonlyMap<number, readonly MachineProblem[]>;
  // Packhouse floor: the Fixtures of a Line that carries Packets from a Packer, whose Drive is linked, to an Exit.
  lined: ReadonlySet<number>;
}

export interface FloorCaps {
  speed: number;
  yield: number;
}

export interface FloorBonus {
  speed: number;
  yield: number;
  // What the Motors of the floor ask of the city's power.
  power: number;
}

type Cell = { x: number; y: number };
type Kind = 'drive' | 'flow';

// Where each side of a Fixture drawn with rotation 0 faces; each quarter turn takes (x, y) to (-y, x).
const SIDE_OFFSETS: Record<FixtureSide, Cell> = { front: { x: 0, y: 1 }, right: { x: 1, y: 0 }, back: { x: 0, y: -1 }, left: { x: -1, y: 0 } };

const turned = ({ x, y }: Cell, quarterTurns: number): Cell => (quarterTurns % 4 === 0 ? { x, y } : turned({ x: -y, y: x }, quarterTurns - 1));

const keyOf = (x: number, y: number): string => `${x},${y}`;

const flip = (turn: Turn): Turn => (turn === 'cw' ? 'ccw' : 'cw');

const isFactoryFixture = (fixture: VenueFixture): boolean => (FIXTURES[fixture.type].venue === 'factory' || FIXTURES[fixture.type].venue === 'packhouse') && FIXTURES[fixture.type].role !== undefined;

const roleOf = (fixture: VenueFixture) => FIXTURES[fixture.type].role;

const sidesOf = (fixture: VenueFixture, kind: Kind): readonly FixtureSide[] => FIXTURES[fixture.type][kind] ?? [];

// The side of a Fixture that faces a neighbouring cell, if it is one of the four.
function sideToward(fixture: VenueFixture, target: Cell): FixtureSide | undefined {
  return (Object.keys(SIDE_OFFSETS) as FixtureSide[]).find(side => {
    const offset = turned(SIDE_OFFSETS[side], fixture.rotation);
    return fixture.x + offset.x === target.x && fixture.y + offset.y === target.y;
  });
}

const isRim = (fixture: VenueFixture, target: Cell): boolean => {
  const side = sideToward(fixture, target);
  return side !== undefined && (FIXTURES[fixture.type].rim ?? []).includes(side);
};

// Two Gears touch rim to rim or axle to axle, never rim to axle; a Motor, a Shaft or a Machine joins a Gear on any side.
const sameKindOfEdge = (a: VenueFixture, b: VenueFixture): boolean => roleOf(a) !== 'gear' || roleOf(b) !== 'gear' || isRim(a, b) === isRim(b, a);

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

const placedOn = (fixtures: readonly VenueFixture[]): Map<string, VenueFixture> => new Map(fixtures.map(fixture => [keyOf(fixture.x, fixture.y), fixture]));

// A Machine takes the Drive it is handed and passes none on.
const isMachine = (fixture: VenueFixture): boolean => roleOf(fixture) === 'machine';

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
export type FloorMotion = Turn | Readonly<Partial<Record<FixtureSide, Turn>>>;

interface DriveReceipts {
  // The directions each Machine is handed, by id.
  received: Map<number, Set<Turn>>;
  jammed: boolean;
  // The Machines next to a jammed group.
  jammedMachines: Set<number>;
  // The way each Fixture that passes Drive turns, in the groups that are not jammed.
  carried: Map<number, FloorMotion>;
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
  const carried = new Map<number, FloorMotion>();
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
    const capacity = motors.length * floorBalance.motorCapacity;
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

interface LineReach {
  // The Fixtures from which Packets can come to an Exit.
  lined: Set<number>;
  // For each Fixture the Fixtures that Packets go on to.
  next: Map<number, number[]>;
}

// A Line: Packets come out of a Fixture by a side of its lineOut and go into the next one when that one takes them in on the side that faces back. They start from a Packer
// whose Drive is linked and stop at a Strapper that is not linked; only what leads to an Exit counts.
function lineReach(fixtures: readonly VenueFixture[], at: ReadonlyMap<string, VenueFixture>, linked: ReadonlySet<number>): LineReach {
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
  return { lined, next };
}

// The Fixtures that Flow reaches. A Tank only gives its fluid to the Pipes, up to the back of a Pump; a Pump that is handed Drive pushes it on
// out of its front, through Pipes and to the Machines, and to the back of the next Pump.
interface FlowReach {
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
      const pumpOutlet = current === start && roleOf(start) === 'pump' ? neighbourOn(start, 'front', at) : undefined;
      const neighbours = current === start && roleOf(start) === 'pump' ? (pumpOutlet ? [pumpOutlet] : []) : connectionsOf(current, 'flow', at);
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
  for (let index = 0; index < pushing.length; index++) walk(pushing[index]!, true);
  return { reached, outputs, starved: starvedVats(fixtures, fedByTank, outputs, reached) };
}

// The Cooling vats a Tank reaches through its Pumps, and the ones it cannot feed: each Tank feeds a few, the lowest ids first, and the vat no Tank feeds is cut from the Flow.
function starvedVats(fixtures: readonly VenueFixture[], fedByTank: ReadonlyMap<number, number[]>, outputs: FlowReach['outputs'], reached: Set<number>): Set<number> {
  const isVat = new Set(fixtures.filter(fixture => FIXTURES[fixture.type].coolant !== undefined).map(fixture => fixture.id));
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
    sorted.slice(0, floorBalance.tankCoolingVats).forEach(id => fed.add(id));
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

// What is worked out once for a list of Fixtures: Drive, Flow and Links. A floor's list is replaced, never changed, when the player edits it,
// so each list is read once however many panels, bonuses and scenes ask.
interface FloorReport {
  fixtures: readonly VenueFixture[];
  at: ReadonlyMap<string, VenueFixture>;
  drive: DriveReceipts;
  powered: ReadonlySet<number>;
  flow: FlowReach;
  line: LineReach;
  links: FloorLinks;
}

// What a result depends on is the layout of the Fixtures (what, where, turned how, broken or not), never their Condition. The wear of a floor that runs replaces its list at every
// tick, so a result is looked up by list first, then by layout, and worked out again only when the layout changed.
const layoutOf = (fixtures: readonly VenueFixture[]): string => fixtures.reduce((key, fixture) => `${key}${fixture.id},${fixture.type},${fixture.x},${fixture.y},${fixture.rotation},${fixture.broken === true ? 1 : 0};`, '');

const LAYOUTS_KEPT = 64;

const memoized = <Result>(compute: (fixtures: readonly VenueFixture[]) => Result): ((fixtures: readonly VenueFixture[]) => Result) => {
  const byList = new WeakMap<readonly VenueFixture[], Result>();
  const byLayout = new Map<string, Result>();
  return fixtures => {
    const cached = byList.get(fixtures);
    if (cached !== undefined) return cached;
    const layout = layoutOf(fixtures);
    let result = byLayout.get(layout);
    if (result === undefined) {
      result = compute(fixtures);
      if (byLayout.size >= LAYOUTS_KEPT) byLayout.clear();
      byLayout.set(layout, result);
    }
    byList.set(fixtures, result);
    return result;
  };
};

const reportOf = memoized((allFixtures): FloorReport => {
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
  return { fixtures, at, drive, powered, flow, line, links: { linked, jammed: drive.jammed, problems, lined: line.lined } };
});

export const floorLinksOf = (allFixtures: readonly VenueFixture[]): FloorLinks => reportOf(allFixtures).links;

// The Fixtures that turn, and the way they turn: whatever passes Drive in a group that is not jammed, and the Machines that are linked.
export const floorMotionOf = memoized((allFixtures): ReadonlyMap<number, FloorMotion> => {
  const { fixtures, drive, powered, flow, links } = reportOf(allFixtures);
  const motion = new Map<number, FloorMotion>(drive.carried);
  for (const id of links.lined) motion.set(id, 'cw');
  for (const id of powered) if (pushesToLinked(id, flow, links.linked)) motion.set(id, 'cw');
  for (const machine of fixtures.filter(fixture => links.linked.has(fixture.id))) {
    const turns = drive.received.get(machine.id);
    motion.set(machine.id, turns ? [...turns][0]! : 'cw');
  }
  return motion;
});

// The Fixtures that run: what carries Drive, the linked Machines, and the Pumps and Pipes whose Flow reaches a linked Machine. Only they wear.
export const floorUsageOf = memoized((allFixtures): ReadonlySet<number> => {
  const { fixtures, flow, links } = reportOf(allFixtures);
  const byId = new Map(fixtures.map(fixture => [fixture.id, fixture]));
  const used = new Set<number>(floorMotionOf(allFixtures).keys());
  for (const id of links.lined) used.add(id);
  for (const [pump, output] of flow.outputs) {
    if (!pushesToLinked(pump, flow, links.linked)) continue;
    for (const id of output.nodes) if (links.linked.has(id) || !isMachine(byId.get(id)!)) used.add(id);
    for (const tank of fixtures.filter(fixture => roleOf(fixture) === 'tank')) if (flow.reached.has(tank.id)) used.add(tank.id);
  }
  return used;
});

// How much each Fixture that runs wears, as a share of the usual: what lies downstream of a Scanner wears less.
export const floorUsageWeightsOf = memoized((allFixtures): ReadonlyMap<number, number> => {
  const { fixtures, line } = reportOf(allFixtures);
  const weights = new Map<number, number>([...floorUsageOf(allFixtures)].map(id => [id, 1]));
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

export const tierValue = (values: readonly number[], tier: number): number => values[Math.min(tier, values.length) - 1]!;

const capOf = (caps: readonly number[], tier: number): number => caps[Math.min(tier, caps.length) - 1]!;

// The highest speed and yield bonus a floor can approach at a Tier.
export const floorCapsOf = (tier: number): FloorCaps => ({ speed: capOf(floorBalance.speedCaps, tier), yield: capOf(floorBalance.yieldCaps, tier) });

export const floorGridSizeOf = (tier: number): number => capOf(floorBalance.gridSizes, tier);

export const packhouseGridSizeOf = (tier: number): number => capOf(packhouseBalance.gridSizes, tier);

// The most Exits of each size a Packhouse floor can have at a Tier.
export const packhouseExitLimitOf = (tier: number): number => capOf(packhouseBalance.exitLimits, tier);

// The Machines that a circuit of Flow reaches from a Machine, through its Pipes and Pumps.
function circuitOf(start: VenueFixture, at: ReadonlyMap<string, VenueFixture>): VenueFixture[] {
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

// A bonus counts in full up to a share of the cap of the Factory's Tier, then grows with every Machine but less and less, and never reaches the cap.
function saturate(total: number, cap: number, kneeShare = floorBalance.bonusKnee): number {
  const knee = cap * kneeShare;
  return total <= knee ? total : cap - (cap - knee) * Math.exp(-(total - knee) / (cap - knee));
}

// How the Cooling vats of a floor act on its Machines: a vat that is linked cools the Motors beside it, and a Boiler that runs on its circuit of Flow doubles that.
const coolingOf = memoized(allFixtures => {
  const { fixtures, at, drive, links } = reportOf(allFixtures);
  const { linked } = links;
  const machines = fixtures.filter(fixture => linked.has(fixture.id));
  const motors = fixtures.filter(fixture => roleOf(fixture) === 'motor');
  const coolants = machines.filter(fixture => FIXTURES[fixture.type].coolant !== undefined);
  const heated = (coolant: VenueFixture): boolean => circuitOf(coolant, at).some(next => linked.has(next.id) && FIXTURES[next.type].heat);
  const cooled = (coolant: VenueFixture): number => FIXTURES[coolant.type].coolant! * (heated(coolant) ? floorBalance.coolingLoopFactor : 1);
  const besideMotor = (coolant: VenueFixture): VenueFixture[] => motors.filter(motor => distanceBetween(coolant, motor) === 1);
  const coolingOfMotor = (motor: VenueFixture): number => Math.max(0, ...coolants.filter(coolant => distanceBetween(coolant, motor) === 1).map(cooled));
  const coolantOf = (machine: VenueFixture): number => Math.max(0, ...motors.filter(motor => drive.served.get(motor.id)?.handed.has(machine.id)).map(coolingOfMotor));
  return { fixtures, at, linked, drive, machines, motors, coolants, heated, cooled, besideMotor, coolingOfMotor, coolantOf };
});

// What the linked Machines add to the speed and to the yield of the Factory's Slots, each rising towards the cap of the Factory's Tier, and what the Motors draw, less what the Boilers that run save.
// A Motor drives only so many Machines and Pumps, and the others stop; the kinds of Machine that run add to the yield, and a Cooling vat beside a Motor adds to the Machines that Motor drives.
const bonuses = new WeakMap<readonly VenueFixture[], Map<number, FloorBonus>>();

export function floorBonusOf(allFixtures: readonly VenueFixture[], tier: number): FloorBonus {
  const perTier = bonuses.get(allFixtures) ?? new Map<number, FloorBonus>();
  bonuses.set(allFixtures, perTier);
  const cached = perTier.get(tier);
  if (cached) return cached;
  const bonus = bonusOf(allFixtures, tier);
  perTier.set(tier, bonus);
  return bonus;
}

function bonusOf(allFixtures: readonly VenueFixture[], tier: number): FloorBonus {
  const { machines, motors, drive, coolantOf } = coolingOf(allFixtures);
  const saving = Math.min(floorBalance.maxPowerSaving, floorBalance.boilerPowerSaving * machines.filter(fixture => FIXTURES[fixture.type].heat).length);
  const busy = motors.length === 0 ? 0 : Math.min(1, drive.received.size / (motors.length * floorBalance.motorCapacity));
  const sum = (key: 'speed' | 'yield') => machines.reduce((total, fixture) => total + (FIXTURES[fixture.type][key] ?? 0) * (1 + coolantOf(fixture)), 0);
  const variety = floorBalance.varietyYield * Math.max(0, kindsOf(machines) - 1);
  return {
    speed: saturate(sum('speed'), capOf(floorBalance.speedCaps, tier)),
    yield: saturate(sum('yield') + variety, capOf(floorBalance.yieldCaps, tier)),
    power: motors.length * floorBalance.motorPower * (floorBalance.idlePowerShare + (1 - floorBalance.idlePowerShare) * busy) * (1 - saving),
  };
}

// A way that Packets take on a Packhouse floor, as the points of the floor they go through, in cell units: from the mouth of a Packer, through the middle of each Fixture
// of its Line, to the hatch of an Exit. A Line that splits has a way for each Exit, which share their start, and Packets take them in turn.
export interface LinePath {
  source: number;
  points: readonly { x: number; y: number }[];
}

const MOUTH = 0.15;
const HATCH = 0.8;

export const linePathsOf = memoized((allFixtures): readonly LinePath[] => {
  const { fixtures, line } = reportOf(allFixtures);
  const byId = new Map(fixtures.map(fixture => [fixture.id, fixture]));
  const centre = (fixture: VenueFixture) => ({ x: fixture.x + 0.5, y: fixture.y + 0.5 });
  const toward = (fixture: VenueFixture, side: FixtureSide, distance: number) => {
    const offset = turned(SIDE_OFFSETS[side], fixture.rotation);
    return { x: fixture.x + 0.5 + offset.x * distance, y: fixture.y + 0.5 + offset.y * distance };
  };
  const sources = fixtures.filter(fixture => line.lined.has(fixture.id) && (FIXTURES[fixture.type].lineOut?.length ?? 0) > 0 && FIXTURES[fixture.type].lineIn === undefined);
  const paths: LinePath[] = [];
  const walk = (source: VenueFixture, current: VenueFixture, points: readonly { x: number; y: number }[], seen: ReadonlySet<number>): void => {
    const nexts = (line.next.get(current.id) ?? []).filter(id => line.lined.has(id) && !seen.has(id));
    if (nexts.length === 0) {
      if (roleOf(current) === 'exit') paths.push({ source: source.id, points: [...points, toward(current, 'back', HATCH)] });
      return;
    }
    for (const id of nexts) {
      const next = byId.get(id);
      if (next) walk(source, next, [...points, centre(next)], new Set([...seen, id]));
    }
  };
  for (const source of sources) walk(source, source, [toward(source, 'front', MOUTH)], new Set([source.id]));
  return paths;
});

// Why a Fixture of a Line carries no Packets: following what should feed it backwards, where the chain stops.
export type LineFault =
  // The Fixture that feeds the chain is broken: repair it.
  | { kind: 'broken'; fixture: VenueFixture }
  // A Packer or a Strapper along the way gets no Drive.
  | { kind: 'noDrive'; fixture: VenueFixture }
  // The Fixture next to the entry does not carry toward it: turn it, or replace it.
  | { kind: 'misfacing'; fixture: VenueFixture }
  // Nothing at all lies next to the entry.
  | { kind: 'deadEnd'; cell: { x: number; y: number }; of: VenueFixture };

export function lineFaultOf(allFixtures: readonly VenueFixture[], start: VenueFixture): LineFault | undefined {
  const { links } = reportOf(allFixtures);
  if (links.lined.has(start.id)) return undefined;
  const sides = (fixture: VenueFixture, key: 'lineIn' | 'lineOut'): readonly FixtureSide[] => FIXTURES[fixture.type][key] ?? [];
  const at = placedOn(allFixtures.filter(isFactoryFixture));
  const cellAt = (fixture: VenueFixture, side: FixtureSide) => {
    const offset = turned(SIDE_OFFSETS[side], fixture.rotation);
    return { x: fixture.x + offset.x, y: fixture.y + offset.y };
  };
  const seen = new Set<number>();
  let current = start;
  for (;;) {
    seen.add(current.id);
    if (isMachine(current) && !links.linked.has(current.id) && current.broken !== true) return { kind: 'noDrive', fixture: current };
    const entries = sides(current, 'lineIn');
    if (entries.length === 0) return undefined;
    const feeders = entries.flatMap(side => {
      const cell = cellAt(current, side);
      const neighbour = at.get(keyOf(cell.x, cell.y));
      const facing = neighbour && sideToward(neighbour, current);
      return neighbour && facing && sides(neighbour, 'lineOut').includes(facing) ? [neighbour] : [];
    });
    const feeder = feeders.find(candidate => !seen.has(candidate.id));
    if (!feeder) {
      const first = entries.map(side => cellAt(current, side)).find(cell => !at.has(keyOf(cell.x, cell.y))) ?? cellAt(current, entries[0]!);
      const wrong = entries.map(side => at.get(keyOf(cellAt(current, side).x, cellAt(current, side).y))).find(neighbour => neighbour !== undefined);
      return wrong ? { kind: 'misfacing', fixture: wrong } : { kind: 'deadEnd', cell: first, of: current };
    }
    if (feeder.broken === true) return { kind: 'broken', fixture: feeder };
    current = feeder;
  }
}

// The Exits of a Packhouse floor that Packets reach.
export const linkedExitsOf = memoized((allFixtures): readonly VenueFixture[] => {
  const { lined } = floorLinksOf(allFixtures);
  return allFixtures.filter(fixture => lined.has(fixture.id) && roleOf(fixture) === 'exit');
});

// What the Motors of a Packhouse floor ask of the city's power, as those of a Factory floor do: all of it when the Machines they drive run, a share of it at rest.
function packhousePowerOf(allFixtures: readonly VenueFixture[]): number {
  const { fixtures, drive } = reportOf(allFixtures);
  const motors = fixtures.filter(fixture => roleOf(fixture) === 'motor');
  if (motors.length === 0) return 0;
  const busy = Math.min(1, drive.received.size / (motors.length * floorBalance.motorCapacity));
  return motors.length * floorBalance.motorPower * (floorBalance.idlePowerShare + (1 - floorBalance.idlePowerShare) * busy);
}

// What the Motors of a building's floor ask of the city's power.
export const floorPowerOfBuilding = (building: Pick<Building, 'type' | 'tier' | 'floor'>): number => {
  if (!building.floor) return 0;
  return building.type === 'packhouse' ? packhousePowerOf(building.floor.fixtures) : floorBonusOf(building.floor.fixtures, building.tier).power;
};

const packBonuses = new WeakMap<readonly VenueFixture[], Map<string, FloorBonus>>();

export const packSizeOf = (item: ItemId): PackSize | null => (['Crate', 'Box', 'Pallet'] as const).find(size => item.endsWith(size)) ?? null;

// What the Line of a Packhouse floor adds to the speed and the yield of the Slots that pack a size of Goods: only the Packers and Strappers that Packets leave through
// an Exit of that size count, each Strapper beyond the first adds to the yield, and with no size asked it is the best that a size gets. The power its Motors draw is
// told apart, by `floorPowerOfBuilding`.
export function packhouseBonusOf(allFixtures: readonly VenueFixture[], tier: number, size?: PackSize | null): FloorBonus {
  const perKey = packBonuses.get(allFixtures) ?? new Map<string, FloorBonus>();
  packBonuses.set(allFixtures, perKey);
  const key = `${tier}:${size === undefined ? 'any' : size === null ? 'none' : size}`;
  const cached = perKey.get(key);
  if (cached) return cached;
  const bonus = packhouseBonusUncached(allFixtures, tier, size);
  perKey.set(key, bonus);
  return bonus;
}

function packhouseBonusUncached(allFixtures: readonly VenueFixture[], tier: number, size?: PackSize | null): FloorBonus {
  const { fixtures, links } = reportOf(allFixtures);
  const lined = fixtures.filter(fixture => links.lined.has(fixture.id));
  const served = new Set(lined.filter(fixture => roleOf(fixture) === 'exit').map(fixture => FIXTURES[fixture.type].packSize));
  if (size === null || (size === undefined ? served.size === 0 : !served.has(size))) return NO_BONUS;
  const machines = lined.filter(isMachine);
  const strappers = machines.filter(fixture => FIXTURES[fixture.type].family === 'strapper').length;
  const sum = (key: 'speed' | 'yield') => machines.reduce((total, fixture) => total + (FIXTURES[fixture.type][key] ?? 0), 0);
  return {
    speed: saturate(sum('speed'), capOf(packhouseBalance.speedCaps, tier), packhouseBalance.bonusKnee),
    yield: saturate(sum('yield') + packhouseBalance.strapperSeriesYield * Math.max(0, strappers - 1), capOf(packhouseBalance.yieldCaps, tier), packhouseBalance.bonusKnee),
    power: 0,
  };
}

const kindsOf = (machines: readonly VenueFixture[]): number => new Set(machines.map(fixture => FIXTURES[fixture.type].family ?? fixture.type)).size;

export interface FloorBenefits {
  // What a linked Machine adds to the speed and to the yield, cooling included.
  speed: number;
  yield: number;
  // The share of cooling that reaches a Machine, or that a Motor passes to the Machines it drives, or that a Cooling vat gives.
  cooling: number;
  // The Motors beside a Cooling vat, and the linked Machines they drive.
  coolsMotors: number;
  coolsMachines: number;
  // A Cooling vat on a circuit with a Boiler that runs.
  doubled: boolean;
  // A Boiler: the Cooling vats on its circuit.
  heatsVats: number;
  // The yield that the kinds of Machine that run add to the floor.
  variety: number;
  // A Boiler: the share of the Motors' power it saves.
  powerSaving: number;
}

// What a Fixture of a Factory floor brings to the floor, beyond the Drive and the Flow it passes on.
export function floorBenefitsOf(allFixtures: readonly VenueFixture[], fixture: VenueFixture): FloorBenefits {
  const context = coolingOf(allFixtures);
  const spec = FIXTURES[fixture.type];
  const isLinked = context.linked.has(fixture.id);
  const none: FloorBenefits = { speed: 0, yield: 0, cooling: 0, coolsMotors: 0, coolsMachines: 0, doubled: false, heatsVats: 0, variety: 0, powerSaving: 0 };
  if (roleOf(fixture) === 'motor') return { ...none, cooling: context.coolingOfMotor(fixture), coolsMachines: [...(context.drive.served.get(fixture.id)?.handed ?? [])].filter(id => context.linked.has(id)).length };
  if (!isLinked) return none;
  const cooling = context.coolantOf(fixture);
  const vatMotors = spec.coolant === undefined ? [] : context.besideMotor(fixture);
  const circuit = spec.heat ? circuitOf(fixture, context.at).filter(next => context.linked.has(next.id) && FIXTURES[next.type].coolant !== undefined) : [];
  return {
    speed: (spec.speed ?? 0) * (1 + cooling),
    yield: (spec.yield ?? 0) * (1 + cooling),
    cooling: spec.coolant === undefined ? cooling : context.cooled(fixture),
    coolsMotors: vatMotors.length,
    coolsMachines: new Set(vatMotors.flatMap(motor => [...(context.drive.served.get(motor.id)?.handed ?? [])].filter(id => context.linked.has(id)))).size,
    doubled: spec.coolant !== undefined && context.heated(fixture),
    heatsVats: circuit.length,
    variety: spec.venue === 'packhouse' ? 0 : floorBalance.varietyYield * Math.max(0, kindsOf(context.machines) - 1),
    powerSaving: spec.heat ? floorBalance.boilerPowerSaving : 0,
  };
}

// How many Machines and Pumps the Motor's group drives, how many its Motors can drive, and how many are left stopped past that.
export function floorMotorLoadOf(allFixtures: readonly VenueFixture[], motor: VenueFixture): { driven: number; capacity: number; overloaded: number } {
  const share = reportOf(allFixtures).drive.served.get(motor.id);
  return { driven: share?.handed.size ?? 0, capacity: (share?.motors ?? 1) * floorBalance.motorCapacity, overloaded: share?.overloaded ?? 0 };
}

// The Machines and Pumps that no Motor has the strength to drive.
export const floorOverloadedOf = (allFixtures: readonly VenueFixture[]): ReadonlySet<number> => reportOf(allFixtures).drive.overloaded;

const NO_BONUS: FloorBonus = { speed: 0, yield: 0, power: 0 };

const NO_FIXTURES: readonly VenueFixture[] = [];

// The Fixtures of a Factory's floor, the same empty list each time when it has none, so what is cached on a list stays cached.
export const floorFixturesOf = (building: Pick<Building, 'floor'>): readonly VenueFixture[] => building.floor?.fixtures ?? NO_FIXTURES;

// The bonus of a building's floor; for a Packhouse, the one that applies to the packed Goods `item` when it is given.
export function floorBonusOfBuilding(building: Pick<Building, 'type' | 'tier' | 'floor'>, item?: ItemId): FloorBonus {
  if (!building.floor) return NO_BONUS;
  if (building.type === 'packhouse') return packhouseBonusOf(building.floor.fixtures, building.tier, item === undefined ? undefined : packSizeOf(item));
  return floorBonusOf(building.floor.fixtures, building.tier);
}
