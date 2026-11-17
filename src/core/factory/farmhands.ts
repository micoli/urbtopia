import { ECOLOGY } from '../environment/ecology';
import type { GameEvent } from '../engine/events';
import type { GameState, VenueFixture } from '../engine/state';
import { harvestFields } from '../farming/fields';
import { isCropReady } from '../farming/growth';
import { assignedFixturesOf } from '../interiors/interiorAssignments';
import { interiorLayoutOf, interiorWagesPerHour } from '../interiors/interiorStaff';
import { valueByTier } from '../interiors/valueByTier';
import { isError } from '../engine/commands';
import { interiorLinksOf } from './interiorLinks';
import { withFixture } from './restock';

const withoutCredit = (bin: VenueFixture): VenueFixture => Object.fromEntries(Object.entries(bin).filter(([name]) => name !== 'restockedAt')) as unknown as VenueFixture;

// One turn of the farmhand of a Harvest bin: he harvests, among the ready Fields of the species picked on his bin, as many as the hours since his last harvest allow at the rate of the Tier.
// `restockedAt` is the moment up to which his hours are paid: an idle hour is never banked, so the credit starts over once nothing is left to harvest.
function harvestTurn(state: GameState, farmId: number, binId: number, from: number, end: number): { state: GameState; events: GameEvent[] } {
  const farm = state.buildings.find(candidate => candidate.id === farmId)!;
  const bin = farm.interior!.fixtures.find(fixture => fixture.id === binId)!;
  const rate = valueByTier(interiorLayoutOf('farm')?.harvestPerHour ?? [], farm.tier);
  const idle = { state: withFixture(state, farmId, withoutCredit(bin)), events: [] as GameEvent[] };
  const ready = state.fields.filter(field => field.crop !== undefined && (field.crop.species as string) === bin.recipe && isCropReady(field.crop, end));
  if (rate <= 0 || ready.length === 0) return bin.restockedAt === undefined ? { state, events: [] } : idle;
  const since = bin.restockedAt ?? from;
  const credits = Math.floor(((end - since) * rate) / ECOLOGY.hourMs + 1e-9);
  if (credits < 1) return { state: bin.restockedAt === undefined ? withFixture(state, farmId, { ...bin, restockedAt: since }) : state, events: [] };
  const tiles = ready.slice(0, credits).map(({ x, y }) => ({ x, y }));
  const outcome = harvestFields({ ...state, lastSeen: end }, tiles);
  if (isError(outcome)) return idle;
  const harvested = outcome.events.flatMap(event => (event.type === 'CropsHarvested' ? event.tiles : [])).length;
  const unfinished = harvested === tiles.length && ready.length > credits;
  const harvestedState = { ...outcome.state, lastSeen: state.lastSeen };
  return {
    state: withFixture(harvestedState, farmId, unfinished ? { ...bin, restockedAt: since + (harvested * ECOLOGY.hourMs) / rate } : withoutCredit(bin)),
    events: outcome.events,
  };
}

// Runs the farmhands of every Farm interior up to `end`: they harvest by themselves the species picked on the Harvest bin they are assigned to, when its Line is complete and the city can pay an hour of their wages.
export function advanceFarmhands(state: GameState, from: number, end: number): { state: GameState; events: GameEvent[] } {
  const farms = state.buildings.filter(building => building.type === 'farm' && !building.breakerOff && building.interior !== undefined && assignedFixturesOf(building.interior, 'farmhand').some(bin => bin.recipe !== undefined));
  if (farms.length === 0) return { state, events: [] };
  let current = state;
  const events: GameEvent[] = [];
  for (const { id } of farms) {
    const farm = current.buildings.find(building => building.id === id)!;
    if (current.urbs < interiorWagesPerHour(farm)) continue;
    const { lined } = interiorLinksOf(farm.interior!.fixtures);
    const bins = assignedFixturesOf(farm.interior, 'farmhand').filter(bin => bin.recipe !== undefined && lined.has(bin.id)).sort((a, b) => a.id - b.id);
    for (const bin of bins) {
      const turn = harvestTurn(current, id, bin.id, from, end);
      current = turn.state;
      events.push(...turn.events);
    }
  }
  return { state: current, events };
}
