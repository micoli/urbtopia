import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, ECOLOGY, energyStats, greenBenefits, newGame, transportStats, type Building, type GameState } from './index';
import { parseEnvelope, serializeEnvelope } from '../persistence/envelope';
import currentSave from '../persistence/fixtures/save-v4.json';
import oldSave from '../persistence/fixtures/save-v3.json';

const H = ECOLOGY.hourMs;
const b = (id: number, type: Building['type'], x: number, y = 0, extra: Partial<Building> = {}) => ({ ...createBuilding(id, type, x, y, 0), ...extra });
const city = (buildings: Building[], now = 12 * H): GameState => ({ ...newGame({ seed: 'ecology', now }), buildings, nextId: 100, urbs: 10000, adaptationUntil: 0, roads: [], busLines: [] });

describe('ecological energy accounting', () => {
  it('reserves every solar Home own production before sharing', () => {
    const s = city([b(1, 'home', 0, 0, { solar: true }), b(2, 'home', 1, 0, { solar: true }), b(3, 'home', 2)]);
    const e = energyStats(s);
    expect(e.transfers.some(t => t.to === 2)).toBe(false);
    expect(e.supplied.get(3)).toBeCloseTo(1);
    expect([...e.supplied.values()].reduce((n, x) => n + x, 0) + e.surplus).toBeCloseTo(e.solar);
  });
  it('cannot recharge nearby batteries twice from a distant generator surplus', () => {
    const s = city([b(1, 'home', 0, 0, { solar: true }), b(2, 'solar', 100), b(3, 'battery', 1, 0, { storedEnergy: 0 }), b(4, 'battery', 2, 0, { storedEnergy: 0 })]);
    const e = energyStats(s);
    const localSurplus = 2 * Math.sin(Math.PI * 6.5 / 12) - 1;
    expect((e.batteryRates.get(3) ?? 0) + (e.batteryRates.get(4) ?? 0)).toBeCloseTo(localSurplus);
    const stored = advance(s, s.lastSeen + H).state.buildings.filter(b => b.type === 'battery').reduce((n, b) => n + (b.storedEnergy ?? 0), 0);
    expect(stored).toBeCloseTo(localSurplus);
  });
  it('bounds sharing by distance and unmet Demand and lets Homes precede industry', () => {
    const s = city([b(1, 'home', 0, 0, { solar: true }), b(2, 'home', 100), b(3, 'factory', 4)]);
    const e = energyStats(s);
    expect(e.transfers).toEqual([]);
    expect(e.supplied.get(2)).toBeGreaterThan(e.supplied.get(3) ?? 0);
    expect(e.unmet + [...e.supplied.values()].reduce((n, x) => n + x, 0)).toBeCloseTo(e.demand);
  });
  it('preserves storage and production under arbitrary tick partitioning', () => {
    const factory = b(4, 'factory', 3, 0, { queue: [{ item: 'planks', duration: 10 * 60_000, startedAt: 12 * H, done: false, quantity: 1 }, { item: 'planks', duration: 20 * 60_000, startedAt: null, done: false, quantity: 1 }] });
    const s = city([b(1, 'home', 0, 0, { solar: true }), b(2, 'battery', 2, 0, { storedEnergy: 1 }), factory]);
    const once = advance(s, 14 * H);
    let split = s; const events: unknown[] = [];
    for (let i = 1;i <= 120;i++) { const step = advance(split, 12 * H + i * 60_000); split = step.state; events.push(...step.events); }
    expect(split.lastSeen).toBe(once.state.lastSeen);
    expect(split.urbs).toBeCloseTo(once.state.urbs, 6);
    split.buildings.forEach((building, i) => {
      expect(building.storedEnergy ?? 0).toBeCloseTo(once.state.buildings[i]?.storedEnergy ?? 0, 6);
      expect(building.taxCitizenMs).toBeCloseTo(once.state.buildings[i]!.taxCitizenMs, 4);
      expect(building.queue.map(q => q.done)).toEqual(once.state.buildings[i]!.queue.map(q => q.done));
    });
    const a = once.events.filter(e => e.type === 'ProductionCompleted'), c = events.filter((e) => typeof e === 'object' && e !== null && 'type' in e && e.type === 'ProductionCompleted') as typeof a;
    expect(c.length).toBe(a.length);
    c.forEach((event, i) => { if ('at' in event && 'at' in a[i]!) expect(event.at).toBeCloseTo(a[i]!.at, 4); });
  });
  it('matches catch-up across storage, budget and production boundaries', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 24 }), fc.integer({ min: 0, max: 20 }), (hour, stored, urbs) => {
      const start = hour * H;
      const factory = b(5, 'factory', 4, 0, { queue: [{ item: 'planks', duration: 7 * 60_000, startedAt: start, done: false, quantity: 1 }, { item: 'planks', duration: 13 * 60_000, startedAt: null, done: false, quantity: 1 }] });
      const s = { ...city([b(1, 'home', 0, 0, { solar: true }), b(2, 'home', 2, 0, { tier: 3 }), b(3, 'battery', 3, 0, { storedEnergy: stored }), b(4, 'backup', 5), factory], start), urbs };
      const end = start + 6 * H, once = advance(s, end);
      let split = s;
      for (let time = start + 137_000;time < end;time += 137_000)split = advance(split, time).state;
      split = advance(split, end).state;
      expect(split.lastSeen).toBe(end);
      expect(split.urbs).toBeCloseTo(once.state.urbs, 5);
      split.buildings.forEach((building, i) => {
        expect(building.storedEnergy ?? 0).toBeCloseTo(once.state.buildings[i]?.storedEnergy ?? 0, 5);
        expect(building.taxCitizenMs).toBeCloseTo(once.state.buildings[i]!.taxCitizenMs, 2);
        expect(building.queue.map(q => q.done)).toEqual(once.state.buildings[i]!.queue.map(q => q.done));
      });
    }), { numRuns: 40 });
  });
  it('dispatches backup only for unmet demand and shuts down when funds exhaust', () => {
    const s = { ...city([b(1, 'home', 0), b(2, 'backup', 5)], 0), urbs: 0.25 };
    expect(energyStats(s).backup).toBe(1);
    const next = advance(s, H).state;
    expect(next.urbs).toBe(0);
    expect(next.buildings[0]!.taxCitizenMs).toBeCloseTo(6 * H / 2);
    expect(energyStats(next).backup).toBe(0);
  });
  it('finishes catch-up at epoch dates when the operating budget exhausts', () => {
    const now = 1791021600000;
    const s = { ...city([b(1, 'home', 0, 0, { tier: 8 }), b(2, 'factory', 2), b(3, 'backup', 6), b(4, 'backup', 9)], now), urbs: 0.2469134 };
    const next = advance(s, now + H).state;
    expect(next.lastSeen).toBe(now + H);
    expect(next.urbs).toBe(0);
    expect(energyStats(next).backup).toBe(0);
  });
  it('stops storage at capacity and resumes shortages after battery exhaustion', () => {
    const full = advance(city([b(1, 'solar', 0), b(2, 'battery', 2, 0, { storedEnergy: 23 })]), 13 * H).state;
    expect(full.buildings[1]!.storedEnergy).toBe(24);
    const dark = city([b(1, 'home', 0), b(2, 'battery', 1, 0, { storedEnergy: 0.5 })], 0);
    const depleted = advance(dark, H).state;
    expect(depleted.buildings[1]!.storedEnergy).toBe(0);
    expect(depleted.buildings[0]!.taxCitizenMs).toBeCloseTo(6 * H / 2);
  });
  it('does not penalize legacy cities during adaptation and caps catch-up', () => {
    const s = { ...city([b(1, 'home', 0)], 0), adaptationUntil: H };
    const next = advance(s, 2 * H).state;
    expect(next.buildings[0]!.taxCitizenMs).toBe(6 * H);
    const capped = advance(s, 100 * H);
    expect(capped.state.lastSeen).toBe(100 * H);
    expect(capped.events.some(e => e.type === 'OfflineTimeCapped')).toBe(true);
  });
});

describe('green spaces and equipment', () => {
  it('advances energy cycles and adaptation when time is skipped', () => {
    const s = { ...city([b(1, 'home', 0)], 12 * H), adaptationUntil: 36 * H };
    const result = dispatch(s, { type: 'SkipTime', hours: 6 }, s.lastSeen);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.lastSeen).toBe(s.lastSeen);
    expect(result.state.timeOffset).toBe(6 * H);
    expect(result.state.adaptationUntil).toBe(30 * H);
  });
  it('rewards local connected spaces with bounded diminishing benefits', () => {
    const home = b(1, 'home', 0), tree = b(2, 'tree', 1), second = b(3, 'tree', 2);
    const one = greenBenefits(city([home, tree]), home), two = greenBenefits(city([home, tree, second]), home);
    expect(two.wellbeing).toBeGreaterThan(one.wellbeing);
    expect(two.wellbeing).toBeLessThan(2 * one.wellbeing);
    expect(greenBenefits(city([home, b(2, 'park', 100)]), home).wellbeing).toBe(0);
  });
  it('charges insulation once and preserves it on a Home', () => {
    const s = city([b(1, 'home', 55, 57), b(2, 'waterTower', 70)]);
    const result = dispatch(s, { type: 'EquipHome', buildingId: 1, equipment: 'insulation' }, s.lastSeen);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.urbs).toBe(s.urbs - 80);
    expect(energyStats(result.state).demand).toBeCloseTo(0.7);
    expect(dispatch(result.state, { type: 'EquipHome', buildingId: 1, equipment: 'insulation' }, s.lastSeen).ok).toBe(false);
  });
});

describe('public transport', () => {
  const transportCity = () => ({ ...city([b(1, 'home', 0, 2, { tier: 3 }), b(2, 'factory', 15, 2), b(3, 'busStop', 0, 1, { rotation: 0 }), b(4, 'busStop', 15, 1, { rotation: 0 })]), roads: Array.from({ length: 16 }, (_, x) => ({ x, y: 0, kind: 'road' as const })), busLines: [{ id: 20, stops: [3, 4] }, { id: 21, stops: [3, 4] }] });
  it('deduplicates riders across useful overlapping lines and keeps operating costs', () => {
    const s = transportCity(), stats = transportStats(s);
    expect(stats.riders).toBeCloseTo(32 * 0.7);
    expect(stats.lines[1]!.riders).toBe(0);
    expect(stats.costPerHour).toBe(4);
    expect(transportStats({ ...s, urbs: 0 }).riders).toBe(0);
  });
  it('disables disconnected services but retains their configuration', () => {
    const s = transportCity(), broken = { ...s, roads: s.roads.filter(r => r.x !== 8) };
    expect(transportStats(broken).activeLines).toBe(0);
    expect(transportStats(broken).riders).toBe(0);
    expect(broken.busLines).toEqual(s.busLines);
  });
  it('rejects invalid and duplicate stops and persists a valid line', () => {
    const s = { ...transportCity(), busLines: [] };
    expect(dispatch(s, { type: 'SetBusLine', stops: [3, 3] }, s.lastSeen).ok).toBe(false);
    const result = dispatch(s, { type: 'SetBusLine', stops: [3, 4] }, s.lastSeen);
    expect(result.ok).toBe(true);
    if (result.ok) expect(parseEnvelope(serializeEnvelope(result.state, s.lastSeen))).toMatchObject({ ok: true, state: { busLines: [{ id: 100, stops: [3, 4] }] } });
  });
});

describe('ecological save migration', () => {
  it('loads and round-trips the frozen ecological save', () => {
    const loaded = parseEnvelope(JSON.stringify(currentSave));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state.timeOffset).toBe(3 * H);
    expect(loaded.state.buildings.find(b => b.type === 'battery')?.storedEnergy).toBe(12);
    expect(loaded.state.busLines).toHaveLength(1);
    expect(parseEnvelope(serializeEnvelope(loaded.state, loaded.savedAt))).toEqual(loaded);
  });
  it('retains legacy city contents and grants the announced adaptation period', () => {
    const loaded = parseEnvelope(JSON.stringify(oldSave));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state.buildings.length).toBe(oldSave.state.buildings.length);
    expect(loaded.state.storage).toEqual(oldSave.state.storage);
    expect(loaded.state.adaptationUntil).toBe(oldSave.state.lastSeen + 24 * H);
    expect(parseEnvelope(serializeEnvelope(loaded.state, loaded.savedAt))).toEqual(loaded);
  });
});
