import { FISH_MATERIAL } from '../economy/items';
import { storageCapacity, storageUsed } from '../economy/storage';
import type { CommandOutcome } from '../engine/commands';
import type { Boat, GameState } from '../engine/state';
import { boatsOfMarina, marinaOf } from './boats';

export const FISHING = {
  cycleMs: FISH_MATERIAL.durationMs,
  yield: 1,
  slotsByMarinaTier: [2, 3, 5] as readonly number[],
};

export function fishingSlots(marinaTier: number): number {
  return FISHING.slotsByMarinaTier[marinaTier - 1] ?? FISHING.slotsByMarinaTier[0]!;
}

export function readyCycles(state: GameState, boat: Boat): number {
  const marina = marinaOf(state, boat.marinaId);
  if (boat.family !== 'fishing' || boat.catchSince === undefined || !marina) return 0;
  const elapsed = Math.max(0, state.lastSeen - boat.catchSince);
  return Math.min(fishingSlots(marina.tier), Math.floor(elapsed / FISHING.cycleMs));
}

export function readyFish(state: GameState, marinaId: number): number {
  return boatsOfMarina(state, marinaId).reduce((sum, boat) => sum + readyCycles(state, boat) * FISHING.yield, 0);
}

export function collectCatch(state: GameState, marinaId: number): CommandOutcome {
  const marina = marinaOf(state, marinaId);
  if (!marina) return { key: 'error.unknownBuilding' };
  const fishers = boatsOfMarina(state, marinaId).filter((boat) => readyCycles(state, boat) > 0);
  if (fishers.length === 0) return { key: 'error.nothingToCollect' };
  let room = storageCapacity(state).materials - storageUsed(state.storage).materials;
  let collected = 0;
  const taken = new Map<number, number>();
  for (const boat of fishers) {
    const cycles = Math.min(readyCycles(state, boat), Math.floor(room / FISHING.yield));
    if (cycles <= 0) continue;
    taken.set(boat.id, cycles);
    room -= cycles * FISHING.yield;
    collected += cycles * FISHING.yield;
  }
  if (collected === 0) return { key: 'error.storageFull' };
  const slots = fishingSlots(marina.tier);
  const boats = (state.boats ?? []).map((boat) => {
    const cycles = taken.get(boat.id);
    if (!cycles) return boat;
    const wasFull = readyCycles(state, boat) >= slots;
    return { ...boat, catchSince: wasFull && cycles >= slots ? state.lastSeen : (boat.catchSince ?? state.lastSeen) + cycles * FISHING.cycleMs };
  });
  const materials = { ...state.storage.materials, fish: (state.storage.materials.fish ?? 0) + collected };
  return { state: { ...state, boats, storage: { ...state.storage, materials } }, events: [] };
}
