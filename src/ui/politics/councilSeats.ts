import { FACTION_IDS, type FactionId } from '../../core';

// The faction of each seat around the circle. Factions take turns, so no part of the circle belongs to one of them and nothing suggests a left or a right.
export function seatFactions(seats: Readonly<Record<FactionId, number>>): FactionId[] {
  const remaining = { ...seats };
  const order: FactionId[] = [];
  const total = FACTION_IDS.reduce((sum, faction) => sum + seats[faction], 0);
  while (order.length < total) {
    for (const faction of FACTION_IDS) {
      if (remaining[faction] <= 0) continue;
      remaining[faction] -= 1;
      order.push(faction);
    }
  }
  return order;
}

const FULL_TURN = 2 * Math.PI;

// Seat centres on a circle of the given radius, starting at the top.
export function seatPositions(count: number, radius: number): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (FULL_TURN * index) / count - Math.PI / 2;
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  });
}
