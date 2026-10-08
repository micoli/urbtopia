import { describe, expect, it } from 'vitest';
import { AGENTS, clipSeconds, findPath, makeWorld, pickClip, reconcile, repath, roll, standPoint, stepAgent, type Agent, type Dice, type World } from './venueAgents';
import type { Figure } from './venueCrowd';

const entrance = { x: 3, y: 0 };
const world = (blocked: { x: number; y: number }[] = [], errands: { x: number; y: number }[] = []): World => makeWorld(6, entrance, blocked, errands);
const slot = (kind: Figure['kind'], x: number, y: number): Figure => ({ kind, x, y, facing: 0 });
const fill = (plan: Figure[], options = { initial: true, spawns: 0 }, base: Agent[] = [], w = world(), satisfaction = 0.7, nextId = 1) =>
  reconcile(base, plan, w, nextId, { rng: 7 }, options, satisfaction);
const run = (agent: Agent, w: World, seconds: number, dice: Dice = { rng: 3 }, mood = 0.7, step = 0.1): Agent | null => {
  let current: Agent | null = agent;
  for (let elapsed = 0; elapsed < seconds && current; elapsed += step) current = stepAgent(current, w, step, dice, mood);
  return current;
};

describe('Venue paths', () => {
  it('walks around the Fixtures', () => {
    const wall = [{ x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }];
    const path = findPath(world(wall), { x: 3, y: 0 }, { x: 3, y: 2 })!;
    expect(path.length).toBeGreaterThan(2);
    expect(path.some(cell => wall.some(blocked => blocked.x === cell.x && blocked.y === cell.y))).toBe(false);
    expect(path[path.length - 1]).toEqual({ x: 3, y: 2 });
  });

  it('goes in and out through the entrance only', () => {
    const inside = findPath(world(), { x: 3, y: -1 }, { x: 1, y: 3 })!;
    expect(inside[0]).toEqual({ x: 3, y: 0 });
    expect(findPath(world(), { x: 1, y: 3 }, { x: 0, y: -1 })).toBeNull();
    expect(findPath(world(), { x: 1, y: 3 }, { x: 3, y: -1 })!.slice(-2)).toEqual([{ x: 3, y: 0 }, { x: 3, y: -1 }]);
  });

  it('finds no way into a closed corner, and none to where it already is', () => {
    const closed = [{ x: 1, y: 0 }, { x: 0, y: 1 }];
    expect(findPath(world(closed), { x: 3, y: 3 }, { x: 0, y: 0 })).toBeNull();
    expect(findPath(world(), { x: 2, y: 2 }, { x: 2, y: 2 })).toEqual([]);
  });
});

describe('Venue people', () => {
  const plan = [slot('gamer', 1, 3), slot('gamer', 4, 4), slot('queue', 3, 2), slot('employee', 2, 1)];

  it('stands the people at their slots when the view opens', () => {
    const { agents } = fill(plan);
    expect(agents).toHaveLength(4);
    expect(agents.filter(agent => agent.kind === 'customer')).toHaveLength(3);
    for (const agent of agents) expect([agent.x, agent.y]).toEqual([standPoint(agent.slot!).x, standPoint(agent.slot!).y]);
    expect(agents.find(agent => agent.slot!.kind === 'gamer')!.mode).toBe('playing');
    expect(agents.find(agent => agent.slot!.kind === 'queue')!.mode).toBe('waiting');
    expect(agents.find(agent => agent.kind === 'employee')!.mode).toBe('idle');
  });

  it('lets new customers walk in from outside, one spawn at a time', () => {
    const first = fill(plan, { initial: false, spawns: 1 });
    const customers = first.agents.filter(agent => agent.kind === 'customer');
    expect(customers).toHaveLength(1);
    expect(customers[0]!.y).toBeLessThan(0);
    expect(customers[0]!.mode).toBe('walking');
    const second = fill(plan, { initial: false, spawns: 1 }, first.agents, world(), 0.7, first.nextId);
    expect(second.agents.filter(agent => agent.kind === 'customer')).toHaveLength(2);
  });

  it('keeps the people whose slot remains and sends the others away', () => {
    const start = fill(plan);
    const fewer = fill(plan.slice(1), { initial: false, spawns: 0 }, start.agents, world(), 0.7, start.nextId);
    expect(fewer.agents).toHaveLength(4);
    const leaving = fewer.agents.filter(agent => agent.mode === 'leaving');
    expect(leaving.length).toBeGreaterThanOrEqual(1);
    const kept = fewer.agents.filter(agent => agent.mode !== 'leaving');
    expect(new Set(kept.map(agent => `${agent.slot!.kind}${agent.slot!.x}${agent.slot!.y}`)).size).toBe(kept.length);
  });

  it('never gives two people the same slot', () => {
    const start = fill(plan);
    const shifted = plan.map(figure => ({ ...figure, x: figure.x === 1 ? 5 : figure.x }));
    const next = fill(shifted, { initial: false, spawns: 3 }, start.agents, world(), 0.7, start.nextId);
    const slots = next.agents.filter(agent => agent.slot).map(agent => `${agent.slot!.kind}${agent.slot!.x}${agent.slot!.y}`);
    expect(new Set(slots).size).toBe(slots.length);
  });

  it('walks at a steady speed along the path and arrives at its slot', () => {
    const w = world();
    const entering = fill([slot('gamer', 3, 3)], { initial: false, spawns: 1 }).agents[0]!;
    const halfway = run(entering, w, 0.95)!;
    expect(halfway.y).toBeGreaterThan(entering.y);
    expect(halfway.y - entering.y).toBeCloseTo(AGENTS.speed * 1.0, 0);
    const arrived = run(entering, w, 8)!;
    expect(arrived.mode).toBe('playing');
    expect([arrived.x, arrived.y]).toEqual([standPoint(arrived.slot!).x, standPoint(arrived.slot!).y]);
  });

  it('plays for a while, then leaves through the entrance and disappears', () => {
    const w = world();
    const player = fill([slot('gamer', 3, 2)]).agents[0]!;
    expect(run(player, w, AGENTS.playSeconds[0] - 1)!.mode).toBe('playing');
    let current: Agent | null = player;
    const dice = { rng: 3 };
    for (let elapsed = 0; elapsed < 40 && current && current.mode !== 'leaving'; elapsed += 0.1) current = stepAgent(current, w, 0.1, dice, 0.7);
    expect(current!.mode).toBe('leaving');
    expect(current!.slot).toBeNull();
    expect(run(player, w, 40)).toBeNull();
  });

  it('gets more impatient in the queue, and walks out when it has had enough', () => {
    const w = world();
    const waiting = fill([slot('queue', 3, 2)], undefined, [], w, 0.8).agents[0]!;
    const later = run(waiting, w, 5)!;
    expect(later.satisfaction).toBeLessThan(waiting.satisfaction);
    expect(later.mode).toBe('waiting');
    expect(run(waiting, w, 40)).toBeNull();
  });

  it('recovers its mood while it plays, toward the mood of the Venue', () => {
    const w = world();
    const happy = { ...fill([slot('gamer', 3, 2)]).agents[0]!, satisfaction: 0.2 };
    const later = run(happy, w, 5, { rng: 5 }, 0.9)!;
    expect(later.satisfaction).toBeGreaterThan(0.2);
    expect(later.satisfaction).toBeLessThanOrEqual(0.9);
  });

  it('has the employee go and check a Fixture, then come back to the post', () => {
    const w = world([], [{ x: 1, y: 3 }]);
    const employee = fill([slot('employee', 3, 1)], undefined, [], w).agents[0]!;
    const modes = new Set<string>();
    let current: Agent | null = employee;
    const dice = { rng: 11 };
    for (let elapsed = 0; elapsed < 40 && current; elapsed += 0.1) {
      current = stepAgent(current, w, 0.1, dice, 0.7);
      if (current) modes.add(current.mode);
    }
    expect([...modes]).toEqual(expect.arrayContaining(['idle', 'errand', 'checking', 'walking']));
    expect(current!.mode === 'idle' || current!.mode === 'walking' || current!.mode === 'errand' || current!.mode === 'checking').toBe(true);
    expect(current!.slot).toEqual(employee.slot);
  });

  it('stays at its post when there is nothing to check', () => {
    const w = world();
    const employee = fill([slot('employee', 3, 1)], undefined, [], w).agents[0]!;
    const later = run(employee, w, 30)!;
    expect(later.mode).toBe('idle');
    expect([later.x, later.y]).toEqual([standPoint(later.slot!).x, standPoint(later.slot!).y]);
  });

  it('draws the routes again when the Fixtures change', () => {
    const entering = fill([slot('gamer', 3, 4)], { initial: false, spawns: 1 }).agents[0]!;
    const blocked = world([{ x: 3, y: 1 }, { x: 3, y: 2 }]);
    const redrawn = repath([entering], blocked)[0]!;
    expect(redrawn.path.some(cell => cell.x === 3.5 && (cell.y === 1.5 || cell.y === 2.5))).toBe(false);
    expect(redrawn.path[redrawn.path.length - 1]).toEqual(standPoint(slot('gamer', 3, 4)));
  });

  it('is deterministic for a given seed', () => {
    const left = fill(plan, { initial: true, spawns: 0 }, [], world(), 0.6);
    const right = fill(plan, { initial: true, spawns: 0 }, [], world(), 0.6);
    expect(left).toEqual(right);
    const dice: Dice = { rng: 1 };
    const first = roll(dice);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(1);
  });

  it('keeps every mood between 0 and 1', () => {
    const { agents } = fill(plan, undefined, [], world(), 0.99);
    for (const agent of agents) {
      expect(agent.satisfaction).toBeGreaterThanOrEqual(0);
      expect(agent.satisfaction).toBeLessThanOrEqual(1);
    }
  });

  it('stands in front of the Fixture, toward it, and not in the middle of the cell', () => {
    const facing = Math.PI;
    const point = standPoint({ kind: 'gamer', x: 4, y: 4, facing });
    expect(point.x).toBeCloseTo(4.5, 9);
    expect(point.y).toBeLessThan(4.5);
    expect(4.5 - point.y).toBeCloseTo(0.38, 9);
    expect(standPoint({ kind: 'queue', x: 4, y: 4, facing })).toEqual({ x: 4.5, y: 4.5 });
    const east = standPoint({ kind: 'gamer', x: 4, y: 4, facing: Math.PI / 2 });
    expect(east.x).toBeGreaterThan(4.5);
    expect(Math.hypot(east.x - 4.5, east.y - 4.5)).toBeCloseTo(0.38, 9);
  });

  it('keeps the person inside its own cell', () => {
    for (let facing = 0; facing < 2 * Math.PI; facing += 0.4) {
      const point = standPoint({ kind: 'gamer', x: 2, y: 3, facing });
      expect(Math.floor(point.x)).toBe(2);
      expect(Math.floor(point.y)).toBe(3);
    }
  });
});

describe('Venue gestures', () => {
  const sample = (mode: Parameters<typeof pickClip>[0], kind: Parameters<typeof pickClip>[1], satisfaction: number) =>
    new Set(Array.from({ length: 50 }, (_, index) => pickClip(mode, kind, satisfaction, index / 50)));

  it('walks while moving, always', () => {
    for (const mode of ['walking', 'leaving', 'errand'] as const) expect([...sample(mode, 'customer', 0.5)]).toEqual(['walk']);
  });

  it('draws different gestures for a player, not always the same arm', () => {
    const clips = sample('playing', 'customer', 0.8);
    expect(clips.size).toBeGreaterThanOrEqual(4);
    expect(clips.has('interact-right')).toBe(true);
    expect(clips.has('interact-left')).toBe(true);
    expect(clips.has('emote-yes')).toBe(true);
    expect(clips.has('emote-no')).toBe(false);
    expect(sample('playing', 'customer', 0.2).has('emote-no')).toBe(true);
  });

  it('lets an impatient customer complain, and a calm one wait', () => {
    expect([...sample('waiting', 'customer', 0.8)]).toEqual(['idle']);
    expect(sample('waiting', 'customer', 0.1).has('emote-no')).toBe(true);
  });

  it('keeps an employee mostly at ease, and sometimes busy with their hands', () => {
    const clips = sample('idle', 'employee', 0.5);
    expect(clips.has('idle')).toBe(true);
    expect(clips.has('interact-right')).toBe(true);
    expect([...sample('idle', 'customer', 0.5)]).toEqual(['idle']);
    expect(sample('checking', 'employee', 0.5).size).toBeGreaterThan(1);
  });

  it('holds a gesture for a few seconds', () => {
    expect(clipSeconds(0)).toBeGreaterThan(1);
    expect(clipSeconds(1)).toBeLessThan(5);
  });
});
