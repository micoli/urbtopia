import floorBalance from '../../../assets/defs/balance/factoryFloor.json' with { type: 'json' };
import { FIXTURES } from '../venues/fixtures';
import { distanceBetween } from '../venues/layout';
import type { FixtureSide } from '../venues/venueVocabulary';
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

const isFactoryFixture = (fixture: VenueFixture): boolean => FIXTURES[fixture.type].venue === 'factory' && FIXTURES[fixture.type].role !== undefined;

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
  const fedByTank = new Map<number, number[]>();
  const walk = (start: VenueFixture, marksMachines: boolean): void => {
    const output = { nodes: new Set<number>(), pumps: [] as number[] };
    if (marksMachines) outputs.set(start.id, output);
    else fedByTank.set(start.id, output.pumps);
    const seen = new Set<number>([start.id]);
    const queue = [start];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const front = current === start && roleOf(start) === 'pump' ? neighbourOn(start, 'front', at) : undefined;
      for (const next of current === start && roleOf(start) === 'pump' ? (front ? [front] : []) : connectionsOf(current, 'flow', at)) {
        if (seen.has(next.id)) continue;
        seen.add(next.id);
        if (roleOf(next) === 'tank') continue;
        if (roleOf(next) === 'pump') {
          reached.add(next.id);
          if (sideToward(next, current) !== 'back' || !powered.has(next.id)) continue;
          output.pumps.push(next.id);
          if (!pushing.includes(next)) pushing.push(next);
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

export function floorLinksOf(allFixtures: readonly VenueFixture[]): FloorLinks {
  const fixtures = allFixtures.filter(fixture => isFactoryFixture(fixture) && fixture.broken !== true);
  const at = placedOn(fixtures);
  const drive = driveReceipts(fixtures, at);
  const flow = flowReach(fixtures, at, poweredPumps(fixtures, drive));
  const flowing = flow.reached;
  const linked = new Set<number>();
  const problems = new Map<number, readonly MachineProblem[]>();
  for (const machine of fixtures.filter(isMachine)) {
    const lacking = problemsOf(machine, drive, flowing, flow.starved);
    if (lacking.length === 0) linked.add(machine.id);
    else problems.set(machine.id, lacking);
  }
  return { linked, jammed: drive.jammed, problems };
}

// The Fixtures that turn, and the way they turn: whatever passes Drive in a group that is not jammed, and the Machines that are linked.
export function floorMotionOf(allFixtures: readonly VenueFixture[]): ReadonlyMap<number, FloorMotion> {
  const fixtures = allFixtures.filter(fixture => isFactoryFixture(fixture) && fixture.broken !== true);
  const at = placedOn(fixtures);
  const drive = driveReceipts(fixtures, at);
  const { linked } = floorLinksOf(allFixtures);
  const motion = new Map<number, FloorMotion>(drive.carried);
  const powered = poweredPumps(fixtures, drive);
  const flow = flowReach(fixtures, at, powered);
  for (const id of powered) if (pushesToLinked(id, flow, linked)) motion.set(id, 'cw');
  for (const machine of fixtures.filter(fixture => linked.has(fixture.id))) {
    const turns = drive.received.get(machine.id);
    motion.set(machine.id, turns ? [...turns][0]! : 'cw');
  }
  return motion;
}

// The Fixtures that run: what carries Drive, the linked Machines, and the Pumps and Pipes whose Flow reaches a linked Machine. Only they wear.
export function floorUsageOf(allFixtures: readonly VenueFixture[]): Set<number> {
  const fixtures = allFixtures.filter(fixture => isFactoryFixture(fixture) && fixture.broken !== true);
  const at = placedOn(fixtures);
  const { linked } = floorLinksOf(allFixtures);
  const used = new Set<number>(floorMotionOf(allFixtures).keys());
  const flow = flowReach(fixtures, at, poweredPumps(fixtures, driveReceipts(fixtures, at)));
  for (const [pump, output] of flow.outputs) {
    if (!pushesToLinked(pump, flow, linked)) continue;
    for (const id of output.nodes) used.add(id);
    for (const tank of fixtures.filter(fixture => roleOf(fixture) === 'tank')) if (flow.reached.has(tank.id)) used.add(tank.id);
  }
  return used;
}

export const tierValue = (values: readonly number[], tier: number): number => values[Math.min(tier, values.length) - 1]!;

const capOf = (caps: readonly number[], tier: number): number => caps[Math.min(tier, caps.length) - 1]!;

// The highest speed and yield bonus a floor can approach at a Tier.
export const floorCapsOf = (tier: number): FloorCaps => ({ speed: capOf(floorBalance.speedCaps, tier), yield: capOf(floorBalance.yieldCaps, tier) });

export const floorGridSizeOf = (tier: number): number => capOf(floorBalance.gridSizes, tier);

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
function saturate(total: number, cap: number): number {
  const knee = cap * floorBalance.bonusKnee;
  return total <= knee ? total : cap - (cap - knee) * Math.exp(-(total - knee) / (cap - knee));
}

// How the Cooling vats of a floor act on its Machines: a vat that is linked cools the Motors beside it, and a Boiler that runs on its circuit of Flow doubles that.
function coolingOf(allFixtures: readonly VenueFixture[]) {
  const fixtures = allFixtures.filter(fixture => isFactoryFixture(fixture) && fixture.broken !== true);
  const at = placedOn(fixtures);
  const { linked } = floorLinksOf(allFixtures);
  const drive = driveReceipts(fixtures, at);
  const machines = fixtures.filter(fixture => linked.has(fixture.id));
  const motors = fixtures.filter(fixture => roleOf(fixture) === 'motor');
  const coolants = machines.filter(fixture => FIXTURES[fixture.type].coolant !== undefined);
  const heated = (coolant: VenueFixture): boolean => circuitOf(coolant, at).some(next => linked.has(next.id) && FIXTURES[next.type].heat);
  const cooled = (coolant: VenueFixture): number => FIXTURES[coolant.type].coolant! * (heated(coolant) ? floorBalance.coolingLoopFactor : 1);
  const besideMotor = (coolant: VenueFixture): VenueFixture[] => motors.filter(motor => distanceBetween(coolant, motor) === 1);
  const coolingOfMotor = (motor: VenueFixture): number => Math.max(0, ...coolants.filter(coolant => distanceBetween(coolant, motor) === 1).map(cooled));
  const coolantOf = (machine: VenueFixture): number => Math.max(0, ...motors.filter(motor => drive.served.get(motor.id)?.handed.has(machine.id)).map(coolingOfMotor));
  return { fixtures, at, linked, drive, machines, motors, coolants, heated, cooled, besideMotor, coolingOfMotor, coolantOf };
}

// What the linked Machines add to the speed and to the yield of the Factory's Slots, each rising towards the cap of the Factory's Tier, and what the Motors draw, less what the Boilers that run save.
// A Motor drives only so many Machines and Pumps, and the others stop; the kinds of Machine that run add to the yield, and a Cooling vat beside a Motor adds to the Machines that Motor drives.
export function floorBonusOf(allFixtures: readonly VenueFixture[], tier: number): FloorBonus {
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
    variety: floorBalance.varietyYield * Math.max(0, kindsOf(context.machines) - 1),
    powerSaving: spec.heat ? floorBalance.boilerPowerSaving : 0,
  };
}

// How many Machines and Pumps the Motor's group drives, how many its Motors can drive, and how many are left stopped past that.
export function floorMotorLoadOf(allFixtures: readonly VenueFixture[], motor: VenueFixture): { driven: number; capacity: number; overloaded: number } {
  const fixtures = allFixtures.filter(fixture => isFactoryFixture(fixture) && fixture.broken !== true);
  const share = driveReceipts(fixtures, placedOn(fixtures)).served.get(motor.id);
  return { driven: share?.handed.size ?? 0, capacity: (share?.motors ?? 1) * floorBalance.motorCapacity, overloaded: share?.overloaded ?? 0 };
}

// The Machines and Pumps that no Motor has the strength to drive.
export function floorOverloadedOf(allFixtures: readonly VenueFixture[]): ReadonlySet<number> {
  const fixtures = allFixtures.filter(fixture => isFactoryFixture(fixture) && fixture.broken !== true);
  return driveReceipts(fixtures, placedOn(fixtures)).overloaded;
}

const NO_BONUS: FloorBonus = { speed: 0, yield: 0, power: 0 };

export const floorBonusOfBuilding = (building: Pick<Building, 'tier' | 'floor'>): FloorBonus => (building.floor ? floorBonusOf(building.floor.fixtures, building.tier) : NO_BONUS);
