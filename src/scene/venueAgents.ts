import { nextRandom } from '../core/engine/random';
import type { Coord } from '../core';
import type { Figure } from './venueCrowd';

// The people of the interior are a visual projection of the aggregate model: they walk on the grid, play, wait and leave,
// but nothing they do is saved or feeds back into the economy.

export type AgentMode = 'walking' | 'playing' | 'waiting' | 'leaving' | 'idle' | 'errand' | 'checking';

export interface Agent {
  id: number;
  kind: 'customer' | 'employee';
  // The slot of the plan this agent serves; customers leave it when they are done.
  slot: Figure | null;
  // Position in cell units: the centre of cell (x, y) is (x + 0.5, y + 0.5).
  x: number;
  y: number;
  path: Coord[];
  goal: Coord | null;
  mode: AgentMode;
  timer: number;
  satisfaction: number;
  facing: number;
}

export interface World {
  size: number;
  entrance: Coord;
  blocked: ReadonlySet<string>;
  // Cells in front of the Fixtures an employee can go and check.
  errands: readonly Coord[];
}

export const AGENTS = {
  speed: 1.15,
  playSeconds: [7, 16] as const,
  idleSeconds: [6, 12] as const,
  errandSeconds: [2, 4] as const,
  waitPatience: 0.035,
  playRecovery: 0.05,
  floor: 0.04,
  jitter: 0.18,
};

const keyOf = (cell: Coord): string => `${cell.x}:${cell.y}`;
const outside = (world: World): Coord => ({ x: world.entrance.x, y: world.entrance.y - 1 });
const centre = (cell: Coord): Coord => ({ x: cell.x + 0.5, y: cell.y + 0.5 });
const cellOf = (agent: Pick<Agent, 'x' | 'y'>): Coord => ({ x: Math.floor(agent.x), y: Math.floor(agent.y) });
const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export interface Dice {
  rng: number;
}

export function roll(dice: Dice): number {
  const draw = nextRandom(dice.rng);
  dice.rng = draw.rngState;
  return draw.value;
}

const between = (dice: Dice, [low, high]: readonly [number, number]): number => low + roll(dice) * (high - low);

export function findPath(world: World, from: Coord, to: Coord): Coord[] | null {
  if (keyOf(from) === keyOf(to)) return [];
  const door = outside(world);
  const walkable = (cell: Coord) => keyOf(cell) === keyOf(door) || (cell.x >= 0 && cell.y >= 0 && cell.x < world.size && cell.y < world.size && !world.blocked.has(keyOf(cell)));
  const previous = new Map<string, Coord | null>([[keyOf(from), null]]);
  const queue: Coord[] = [from];
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head]!;
    if (keyOf(current) === keyOf(to)) {
      const path: Coord[] = [];
      for (let step: Coord | null = current; step && keyOf(step) !== keyOf(from); step = previous.get(keyOf(step)) ?? null) path.unshift(step);
      return path;
    }
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]] as const) {
      const next = { x: current.x + dx, y: current.y + dy };
      if (previous.has(keyOf(next)) || !walkable(next)) continue;
      // The only way out of the grid is through the entrance.
      if (next.y < 0 && !(next.x === door.x && current.x === door.x && current.y === world.entrance.y)) continue;
      previous.set(keyOf(next), current);
      queue.push(next);
    }
  }
  return null;
}

function routeTo(world: World, agent: Agent, goal: Coord): Agent {
  const route = findPath(world, cellOf(agent), goal) ?? [goal];
  return { ...agent, goal, path: route.map(centre) };
}

export function makeWorld(size: number, entrance: Coord, blockedCells: readonly Coord[], errands: readonly Coord[]): World {
  return { size, entrance, blocked: new Set(blockedCells.map(keyOf)), errands };
}

const customerKinds = new Set<Figure['kind']>(['gamer', 'queue']);

const sameSlot = (a: Figure | null, b: Figure): boolean => a !== null && a.kind === b.kind && a.x === b.x && a.y === b.y;

export interface Reconciled {
  agents: Agent[];
  nextId: number;
}

// Matches the agents to the slots of the plan: keeps those whose slot still exists, sends the others away, fills the free
// slots with new customers walking in (or standing there already, when the view has just opened).
export function reconcile(agents: readonly Agent[], plan: readonly Figure[], world: World, nextId: number, dice: Dice, options: { initial: boolean; spawns: number }, satisfaction: number): Reconciled {
  let current = agents.map(agent => ({ ...agent }));
  const free: Figure[] = [];
  for (const figure of plan) {
    const owner = current.find(agent => agent.mode !== 'leaving' && sameSlot(agent.slot, figure));
    if (!owner) free.push(figure);
  }
  const unmatched = current.filter(agent => agent.mode !== 'leaving' && agent.slot !== null && !plan.some(figure => sameSlot(agent.slot, figure)));
  const retired = new Set<number>();
  const taken = new Set<number>();
  const kindOf = (figure: Figure): Agent['kind'] => (customerKinds.has(figure.kind) ? 'customer' : 'employee');
  const stillFree: Figure[] = [];
  for (const figure of free) {
    const candidate = unmatched
      .filter(agent => !taken.has(agent.id) && agent.kind === kindOf(figure))
      .sort((a, b) => Math.hypot(a.x - figure.x - 0.5, a.y - figure.y - 0.5) - Math.hypot(b.x - figure.x - 0.5, b.y - figure.y - 0.5))[0];
    if (!candidate) {
      stillFree.push(figure);
      continue;
    }
    taken.add(candidate.id);
    current = current.map(agent => (agent.id === candidate.id ? routeTo(world, { ...agent, slot: figure, mode: 'walking', timer: 0 }, figure) : agent));
  }
  for (const agent of unmatched) {
    if (taken.has(agent.id)) continue;
    retired.add(agent.id);
    current = current.map(other => (other.id === agent.id ? leave(world, other) : other));
  }
  let id = nextId;
  let spawns = options.spawns;
  for (const figure of stillFree) {
    const kind = kindOf(figure);
    if (!options.initial && kind === 'customer' && spawns <= 0) continue;
    const door = centre(outside(world));
    const jitter = (roll(dice) - 0.5) * 2 * AGENTS.jitter;
    const placed = options.initial || kind === 'employee';
    const agent: Agent = {
      id: id++, kind, slot: figure,
      x: placed ? figure.x + 0.5 : door.x, y: placed ? figure.y + 0.5 : door.y,
      path: [], goal: null,
      mode: 'walking', timer: 0, satisfaction: clamp01(satisfaction + jitter), facing: figure.facing,
    };
    if (!placed) spawns--;
    current.push(placed ? arrive(agent, dice) : routeTo(world, agent, figure));
  }
  return { agents: current, nextId: id };
}

function leave(world: World, agent: Agent): Agent {
  const door = outside(world);
  return { ...routeTo(world, agent, door), slot: null, mode: 'leaving', timer: 0 };
}

// What an agent does on reaching its slot.
function arrive(agent: Agent, dice: Dice): Agent {
  const slot = agent.slot;
  if (!slot) return agent;
  const base = { ...agent, path: [], goal: null, facing: slot.facing };
  if (slot.kind === 'gamer') return { ...base, mode: 'playing', timer: between(dice, AGENTS.playSeconds) };
  if (slot.kind === 'queue') return { ...base, mode: 'waiting', timer: 0 };
  return { ...base, mode: 'idle', timer: between(dice, AGENTS.idleSeconds) };
}

export function stepAgent(agent: Agent, world: World, dt: number, dice: Dice, mood: number): Agent | null {
  let current = agent;
  if (current.mode === 'walking' || current.mode === 'leaving' || current.mode === 'errand') {
    let remaining = dt;
    while (remaining > 1e-9 && current.path.length > 0) {
      const target = current.path[0]!;
      const dx = target.x - current.x, dy = target.y - current.y;
      const distance = Math.hypot(dx, dy);
      const reach = AGENTS.speed * remaining;
      if (distance <= reach) {
        remaining -= distance / AGENTS.speed;
        current = { ...current, x: target.x, y: target.y, path: current.path.slice(1) };
      } else {
        current = { ...current, x: current.x + dx / distance * reach, y: current.y + dy / distance * reach, facing: Math.atan2(dx, dy) };
        remaining = 0;
      }
    }
    if (current.path.length > 0) return current;
    if (current.mode === 'leaving') return null;
    if (current.mode === 'errand') return { ...current, mode: 'checking', goal: null, timer: between(dice, AGENTS.errandSeconds) };
    return arrive(current, dice);
  }
  const timer = current.timer - dt;
  if (current.mode === 'playing') {
    const satisfaction = current.satisfaction + (mood - current.satisfaction) * Math.min(1, AGENTS.playRecovery * dt * 4);
    return timer <= 0 ? leave(world, { ...current, satisfaction }) : { ...current, timer, satisfaction };
  }
  if (current.mode === 'waiting') {
    const satisfaction = Math.max(AGENTS.floor, current.satisfaction - AGENTS.waitPatience * dt);
    return satisfaction <= AGENTS.floor + 1e-9 ? leave(world, { ...current, satisfaction }) : { ...current, satisfaction };
  }
  if (current.mode === 'idle' && current.slot) {
    if (timer > 0) return { ...current, timer };
    if (world.errands.length === 0) return { ...current, timer: between(dice, AGENTS.idleSeconds) };
    return { ...routeTo(world, { ...current, mode: 'errand' }, world.errands[Math.floor(roll(dice) * world.errands.length)]!), timer: 0 };
  }
  if (current.mode === 'checking' && current.slot) {
    return timer > 0 ? { ...current, timer } : routeTo(world, { ...current, mode: 'walking' }, current.slot);
  }
  return current;
}

// After a Fixture is placed, moved or removed, the routes in progress are drawn again.
export function repath(agents: readonly Agent[], world: World): Agent[] {
  return agents.map(agent => (agent.goal && agent.path.length > 0 ? routeTo(world, agent, agent.goal) : agent));
}
