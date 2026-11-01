import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { FACILITIES, categoryCoverageRatio, coveredCategories, createBuilding, facilitiesOfCategory, facilityCapacity, facilityRadius, footprintOf, isServiceCovered, missingServices, newGame, serviceCoverage, type Building, type GameState } from '../index';
import { coveredServiceUnits } from './services';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const b = (id: number, type: Building['type'], x: number, y = 0, extra: Partial<Building> = {}) => ({ ...createBuilding(id, type, x + 50, y + 50, 0), ...extra });
const city = (buildings: Building[]): GameState => ({
  ...newGame({ seed: 'library', now: 0 }), buildings, nextId: 100, urbs: 1_000_000, tutorial: null, adaptationUntil: 0,
});

describe('Library', () => {
  it('has five Tiers that raise capacity and reach', () => {
    expect([1, 2, 3, 4, 5].map(tier => facilityCapacity('library', tier))).toEqual([300, 500, 800, 1200, 1800]);
    expect([1, 2, 3, 4, 5].map(tier => facilityRadius('library', tier))).toEqual([10, 12, 14, 16, 18]);
    expect(FACILITIES.library.radius).toBe(10);
  });

  it('keeps the radius of the building for facilities whose Tiers do not set one', () => {
    expect([1, 2, 8].map(tier => facilityRadius('school', tier))).toEqual([10, 10, 10]);
  });

  it('grows its footprint with its Tier', () => {
    const sizeAt = (tier: number) => footprintOf('library', 0, tier);
    expect([1, 2, 3, 4, 5].map(sizeAt).map(({ width, depth }) => [width, depth])).toEqual([[2, 2], [2, 2], [3, 2], [3, 2], [4, 2]]);
  });

  it('covers the Homes in its reach, further as it is upgraded', () => {
    const home = b(2, 'home', 14);
    expect(isServiceCovered(serviceCoverage(city([b(1, 'library', 0), home])), 2, 'library')).toBe(false);
    expect(isServiceCovered(serviceCoverage(city([b(1, 'library', 0, 0, { tier: 3 }), home])), 2, 'library')).toBe(true);
  });

  it('serves Homes up to the capacity of its Tier', () => {
    const homes = [2, 3, 4, 5].map((x, index) => b(10 + index, 'home', x, 0, { tier: 6 }));
    const covered = (tier: number) => [...serviceCoverage(city([b(1, 'library', 0, 0, { tier }), ...homes]))].filter(([, types]) => types.has('library')).length;
    expect(covered(1)).toBeLessThan(covered(5));
  });
});

describe('Library and the Education category', () => {
  const homes = [b(2, 'home', 3)];

  it('does not stand for Education coverage', () => {
    const coverage = serviceCoverage(city([b(1, 'library', 0), ...homes]));
    expect(isServiceCovered(coverage, 2, 'library')).toBe(true);
    expect(coveredCategories(coverage, 2)).not.toContain('education');
    expect(facilitiesOfCategory('education')).not.toContain('library');
  });

  it('leaves the School required at Tier 3', () => {
    const coverage = serviceCoverage(city([b(1, 'library', 0), ...homes]));
    expect(missingServices(coverage, homes[0]!, 3)).toContain('school');
  });

  it('adds no Well-being service unit, while a School does', () => {
    const library = serviceCoverage(city([b(1, 'library', 0), ...homes]));
    const school = serviceCoverage(city([b(1, 'school', 0), ...homes]));
    expect(coveredServiceUnits(library, 2)).toBe(0);
    expect(coveredServiceUnits(school, 2)).toBe(1);
  });

  it('does not raise the Education coverage ratio', () => {
    expect(categoryCoverageRatio(city([b(1, 'library', 0), ...homes]), 'education')).toBe(0);
    expect(categoryCoverageRatio(city([b(1, 'school', 0), ...homes]), 'education')).toBe(1);
  });
});
