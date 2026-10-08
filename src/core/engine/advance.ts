import { ECOLOGY, homePower } from '../environment/ecology';
import { homeBenefits, wellbeingTaxFactor } from '../environment/wellbeing';
import { congestionStats } from '../traffic/congestion';
import { energyStats } from '../environment/energy';
import { poweredCasinoIds } from '../leisure/poweredCasinos';
import { serviceCoverage } from '../services/services';
import { hasBrtOnlyAccess } from '../map/placement';
import { transportStats } from '../transit/transport';
import { GAME_CONFIG } from './config';
import type { GameEvent } from './events';
import { advanceProduction, shiftRunningTimers } from '../economy/production';
import type { Building, GameState } from './state';
import { progressTutorial } from '../progression/tutorial';

export interface AdvanceResult {
  state: GameState;
  events: GameEvent[];
}

export function advance(state: GameState, now: number): AdvanceResult {
  const effectiveNow = Math.max(now, state.lastSeen);
  const gap = effectiveNow - state.lastSeen;
  if (gap <= GAME_CONFIG.offlineCapMs) return replay(state, effectiveNow);

  const forfeitedMs = gap - GAME_CONFIG.offlineCapMs;
  const replayed = replay(state, state.lastSeen + GAME_CONFIG.offlineCapMs);
  return {
    state: { ...shiftRunningTimers(replayed.state, forfeitedMs), lastSeen: effectiveNow },
    events: [...replayed.events, { type: 'OfflineTimeCapped', forfeitedMs }],
  };
}

function idleShopIds(state: GameState, now: number): ReadonlySet<number> {
  const brtOnlyShops = state.buildings.filter(b => b.type === 'shop' && hasBrtOnlyAccess(state, b));
  if (brtOnlyShops.length === 0) return new Set();
  const { coveredActivities } = transportStats(state, now);
  return new Set(brtOnlyShops.filter(b => !coveredActivities.has(b.id)).map(b => b.id));
}

function replay(state: GameState, until: number): AdvanceResult {
  let current = state;
  const events: GameEvent[] = [];
  while (current.lastSeen < until) {
    const now = current.lastSeen;
    const idleShops = idleShopIds(current, now);
    const overdue = current.buildings.some(b => b.queue.some(q => !q.done && q.startedAt !== null && q.startedAt + q.duration <= now) || (!idleShops.has(b.id) && b.stacks.some(stack => stack.stock > 0 && stack.nextSaleAt !== null && stack.nextSaleAt <= now)));
    if (overdue) {
      const caught = advanceProduction(current, now, 0, 1, new Map(), idleShops);
      current = caught.state;
      events.push(...caught.events);
    }
    const energy = energyStats(current, now), transport = transportStats(current, now);
    let end = Math.min(until, (Math.floor((now + (current.timeOffset ?? 0)) / ECOLOGY.hourMs) + 1) * ECOLOGY.hourMs - (current.timeOffset ?? 0));
    if ((current.adaptationUntil ?? 0) > now) end = Math.min(end, current.adaptationUntil!);
    const batteryEnds = new Map<number, number>();
    for (const battery of current.buildings.filter(b => b.type === 'battery')) {
      const rate = energy.batteryRates.get(battery.id) ?? 0;
      if (Math.abs(rate) < 1e-9) continue;
      const remaining = rate > 0 ? ECOLOGY.batteryCapacity - (battery.storedEnergy ?? 0) : battery.storedEnergy ?? 0;
      const boundary = now + remaining / Math.abs(rate) * ECOLOGY.hourMs;
      batteryEnds.set(battery.id, boundary);
      end = Math.min(end, boundary);
    }
    const adapting = now < (current.adaptationUntil ?? 0);
    const ratio = adapting ? 1 : energy.economicRatio;
    if (ratio > 0) for (const b of current.buildings) {
      const running = b.queue.find(q => !q.done && q.startedAt !== null);
      if (running?.startedAt != null) end = Math.min(end, now + Math.max(0, running.duration - (now - running.startedAt)) / ratio);
      if (!idleShops.has(b.id)) for (const stack of b.stacks) if (stack.nextSaleAt !== null && stack.stock > 0) end = Math.min(end, now + Math.max(0, stack.nextSaleAt - now) / ratio);
    }
    const cost = energy.costPerHour + transport.costPerHour;
    const budgetEnd = cost > 0 ? now + current.urbs / cost * ECOLOGY.hourMs : Infinity;
    end = Math.min(end, budgetEnd);
    const coalEnd = transport.coalPerHour > 0 ? now + (current.storage.materials.coal ?? 0) / transport.coalPerHour * ECOLOGY.hourMs : Infinity;
    end = Math.min(end, coalEnd);
    const elapsed = end - now;
    if (elapsed <= 0) {
      current = {
        ...current, storage: coalEnd <= now ? { ...current.storage, materials: { ...current.storage.materials, coal: 0 } } : current.storage, urbs: budgetEnd <= now ? 0 : current.urbs,
        buildings: current.buildings.map(b => updateBattery(b, energy.batteryRates.get(b.id) ?? 0, batteryEnds.get(b.id), now, 0))
      };
      continue;
    }
    const poweredCasinos = poweredCasinoIds(current, energy.supplied);
    const coverage = serviceCoverage(current);
    const congestion = congestionStats(current, now);
    const homeRatios = new Map(current.buildings.filter(b => b.type === 'home').map(b => [b.id,
    (adapting ? 1 : homePower(b) > 0 ? (energy.supplied.get(b.id) ?? 0) / homePower(b) : 1) * wellbeingTaxFactor(homeBenefits(current, b, energy.coalRates, coverage, poweredCasinos, congestion).wellbeing)]));
    const produced = advanceProduction(current, end, elapsed, adapting ? 1 : energy.economicRatio, homeRatios, idleShops);
    events.push(...produced.events);
    current = {
      ...produced.state, storage: transport.coalPerHour > 0 ? { ...produced.state.storage, materials: { ...produced.state.storage.materials, coal: end === coalEnd ? 0 : remainingCoal(current, transport.coalPerHour, elapsed) } } : produced.state.storage, lastSeen: end, urbs: end === budgetEnd ? 0 : Math.max(0, current.urbs - cost * elapsed / ECOLOGY.hourMs),
      buildings: produced.state.buildings.map(b => updateBattery(b, energy.batteryRates.get(b.id) ?? 0, batteryEnds.get(b.id), end, elapsed))
    };
  }
  return { state: progressTutorial(current), events };
}

function updateBattery(building: Building, rate: number, boundary: number | undefined, now: number, elapsedMs: number): Building {
  if (building.type !== 'battery') return building;
  const atBoundary = boundary !== undefined && boundary <= now;
  const storedEnergy = atBoundary
    ? rate > 0 ? ECOLOGY.batteryCapacity : 0
    : Math.max(0, Math.min(ECOLOGY.batteryCapacity, (building.storedEnergy ?? 0) + rate * elapsedMs / ECOLOGY.hourMs));
  return { ...building, storedEnergy };
}

function remainingCoal(state: GameState, rate: number, elapsed: number): number {
  const remaining = (state.storage.materials.coal ?? 0) - rate * elapsed / ECOLOGY.hourMs;
  return remaining < 1e-9 ? 0 : remaining;
}
