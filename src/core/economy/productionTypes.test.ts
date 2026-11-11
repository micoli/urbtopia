import { describe, expect, it } from 'vitest';
import { createBuilding } from '../buildings/buildingSpecs';
import { economicPower } from '../environment/ecology';
import { tiersOf } from '../buildings/buildingDefinitions';
import { productionTierOf } from './tiers';
import { jobsOf, workplaceTypes } from '../traffic/jobs';
import { INDUSTRY_TYPES, PRODUCTION_TYPES, compartmentProducedBy, industryEmissionsOf, industryWeightOf, isIndustryType, isProductionType, scalesRecipeWithYield } from './productionTypes';

describe('production family', () => {
  it('is every building defined with the production kind', () => {
    expect([...PRODUCTION_TYPES].sort()).toEqual(['bakery', 'dairy', 'factory', 'knitwearFactory', 'livestockFarm', 'mill', 'packhouse', 'textileMill', 'workshop']);
    expect(isProductionType('mill')).toBe(true);
    expect(isProductionType('shop')).toBe(false);
  });

  it('counts as industry every production building but the Packhouse', () => {
    expect([...INDUSTRY_TYPES].sort()).toEqual(['bakery', 'dairy', 'factory', 'knitwearFactory', 'livestockFarm', 'mill', 'textileMill', 'workshop']);
    expect(isIndustryType('packhouse')).toBe(false);
    expect(isIndustryType('home')).toBe(false);
  });

  it('weighs the factory class twice the workshop class, and the Packhouse at nothing', () => {
    expect(['workshop', 'mill', 'factory', 'bakery', 'packhouse', 'home'].map(industryWeightOf)).toEqual([1, 1, 2, 2, 0, 0]);
  });

  it('feeds economic power and workplaces from the same family', () => {
    const at = (type: Parameters<typeof createBuilding>[1], tier: number) => ({ ...createBuilding(1, type, 50, 50, 0), tier });
    expect(economicPower(at('workshop', 3))).toBe(3);
    expect(economicPower(at('bakery', 3))).toBe(6);
    expect(economicPower(at('packhouse', 3))).toBe(0);
    for (const type of INDUSTRY_TYPES) expect(workplaceTypes).toContain(type);
    expect(workplaceTypes).not.toContain('packhouse');
    expect(jobsOf(at('packhouse', 3))).toBe(0);
  });

  it('gives each production building its emissions, its compartment and its recipe rule', () => {
    expect(['workshop', 'mill', 'factory', 'bakery', 'packhouse', 'home'].map(industryEmissionsOf)).toEqual([0.5, 0.5, 2, 2, 0, 0]);
    expect(PRODUCTION_TYPES.filter((type) => compartmentProducedBy(type) === 'materials').sort()).toEqual(['livestockFarm', 'mill', 'textileMill', 'workshop']);
    expect(PRODUCTION_TYPES.filter(scalesRecipeWithYield).sort()).toEqual(['bakery', 'dairy', 'livestockFarm', 'mill', 'textileMill']);
    expect(scalesRecipeWithYield('home')).toBe(false);
  });

  it('gives the last Tier of each production building a gain: a faster cycle, or one more Pen for the Livestock farm', () => {
    for (const type of PRODUCTION_TYPES) {
      const [before, last] = [4, 5].map((tier) => ({ ...productionTierOf({ type, tier }), pens: tiersOf(type)[tier - 1]?.penCount ?? 0 }));
      const gained = type === 'livestockFarm' ? last!.pens > before!.pens : last!.durationFactor < before!.durationFactor;
      expect(gained, type).toBe(true);
    }
  });
});
