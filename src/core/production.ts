import type { GameEvent } from './events';
import { MATERIALS, type ItemId } from './items';
import type { Building, GameState, QueueEntry } from './state';

export function durationOf(item: ItemId): number {
  return MATERIALS[item].durationMs;
}

export function newQueueEntry(item: ItemId, now: number, isIdle: boolean): QueueEntry {
  return { item, duration: durationOf(item), startedAt: isIdle ? now : null, done: false };
}

export function isIdle(building: Building): boolean {
  return building.queue.every((entry) => entry.done);
}

interface Advanced {
  building: Building;
  events: GameEvent[];
}

function advanceBuilding(building: Building, now: number): Advanced {
  if (building.queue.length === 0) return { building, events: [] };
  const queue = building.queue.map((entry) => ({ ...entry }));
  const events: GameEvent[] = [];
  for (let index = 0; index < queue.length; index++) {
    const entry = queue[index];
    if (!entry || entry.done) continue;
    if (entry.startedAt === null) break;
    const finishedAt = entry.startedAt + entry.duration;
    if (finishedAt > now) break;
    entry.done = true;
    events.push({ type: 'ProductionCompleted', buildingId: building.id, item: entry.item, at: finishedAt });
    const next = queue.slice(index + 1).find((candidate) => !candidate.done);
    if (next) next.startedAt = finishedAt;
  }
  return { building: { ...building, queue }, events };
}

export function advanceProduction(state: GameState, now: number): { state: GameState; events: GameEvent[] } {
  const results = state.buildings.map((building) => advanceBuilding(building, now));
  const events = results.flatMap((result) => result.events).sort((a, b) => ('at' in a && 'at' in b ? a.at - b.at : 0));
  return { state: { ...state, buildings: results.map((result) => result.building) }, events };
}

export function restartRunningProduction(building: Building, now: number): Building {
  const runningIndex = building.queue.findIndex((entry) => !entry.done);
  if (runningIndex === -1) return building;
  return {
    ...building,
    queue: building.queue.map((entry, index) => (index === runningIndex ? { ...entry, startedAt: now } : entry)),
  };
}
