import { describe, expect, it } from 'vitest';
import { BUILDING_SPECS, COAL_CAPACITY, ECOLOGY, TAX, WASTE, WASTE_FACILITIES, WASTE_REQUIRED_TIER, climateStats, createBuilding, economicPower, energyStats, facilitiesUnlockedBetween, homeBenefits, incineratorPenaltyOf, missingServicesOf, needsPyramid, newGame, odorPenaltyOf, wasteCapacity, wasteEmissions, wasteReport, type Building, type GameState } from '../index';
import { definitionOf, tiersOf } from '../buildings/buildingDefinitions';

const home = (id: number, x: number, y: number, tier = 1): Building => ({ ...createBuilding(id, 'home', x, y, 0), tier });
const place = (id: number, type: 'mound' | 'incinerator' | 'recyclingPlant' | 'coalPlant', x: number, y: number, tier = 1): Building => ({ ...createBuilding(id, type, x, y, 0), tier });
const roadRow = (from: number, to: number, y: number) => Array.from({ length: to - from + 1 }, (_, index) => ({ x: from + index, y, kind: 'road' as const }));
const city = (buildings: Building[], extra: Partial<GameState> = {}): GameState => ({
  ...newGame({ seed: 'waste-buildings', now: 0 }), buildings, nextId: 1000, urbs: 1_000_000, tutorial: null, roads: roadRow(30, 90, 49), roundabouts: [], pedestrianWays: [], adaptationUntil: 0, ...extra,
});
const bigHomes = (): Building[] => [home(20, 34, 50, 8), home(21, 38, 50, 8)];
const target = home(10, 64, 48, 2);
const grid = (count = 1): Building[] => Array.from({ length: count }, (_, index) => createBuilding(900 + index, 'backup', 1, 1 + 3 * index, 0));

describe('Waste building definitions', () => {
  it('declares the three facilities with their Tiers, unlocks, footprints and Waste category', () => {
    const expected = [['mound', 3, 800, [1, 1]], ['incinerator', 4, 1000, [2, 2]], ['recyclingPlant', 4, 1500, [3, 2]]] as const;
    for (const [id, tiers, unlock, footprint] of expected) {
      const definition = definitionOf(id);
      expect(definition.category).toBe('waste');
      expect(definition.section).toBe('build.publicFacilities');
      expect(tiersOf(id)).toHaveLength(tiers);
      expect(definition.unlockCitizens).toBe(unlock);
      expect([BUILDING_SPECS[id].footprint.width, BUILDING_SPECS[id].footprint.depth]).toEqual(footprint);
      expect(definition.requiresRoad).toBe(true);
    }
  });

  it('has the capacities of the specification', () => {
    expect([1, 2, 3].map(tier => wasteCapacity('mound', tier))).toEqual([60, 120, 200]);
    expect([1, 2, 3, 4].map(tier => wasteCapacity('incinerator', tier))).toEqual([800, 1500, 2500, 4000]);
    expect([1, 2, 3, 4].map(tier => wasteCapacity('recyclingPlant', tier))).toEqual([400, 800, 1400, 2200]);
  });

  it('keeps the Odor radius larger than the collection reach, and only the Mound smells', () => {
    expect(WASTE_FACILITIES.mound.odor!.radius).toBeGreaterThan(WASTE_FACILITIES.mound.reach);
    expect(WASTE_FACILITIES.incinerator.odor).toBeNull();
    expect(WASTE_FACILITIES.recyclingPlant.odor).toBeNull();
    expect(WASTE_FACILITIES.recyclingPlant.pollution).toBeNull();
  });

  it('only lets the Mound reach a Pedestrian way', () => {
    expect(BUILDING_SPECS.mound.accessModes).toContain('pedestrianWay');
    expect(BUILDING_SPECS.incinerator.accessModes).toEqual(['road']);
    expect(BUILDING_SPECS.recyclingPlant.accessModes).toEqual(['road']);
  });
});

describe('Waste unlock notifications', () => {
  const at = (citizens: number): GameState => city(Array.from({ length: citizens / 100 }, (_, index) => home(index + 1, 30 + 3 * index, 50, 5)));

  it.each([[800, 'mound'], [1000, 'incinerator'], [1500, 'recyclingPlant']] as const)('announces the %s Citizens unlock', (citizens, type) => {
    expect(facilitiesUnlockedBetween(at(citizens - 100), at(citizens))).toContain(type);
    expect(facilitiesUnlockedBetween(at(citizens), at(citizens + 100))).not.toContain(type);
  });
});

describe('Missing Waste coverage', () => {
  const uncoveredCity = () => city([target, ...bigHomes()]);
  const coveredCity = () => city([target, ...bigHomes(), place(1, 'incinerator', 66, 47)]);

  it('lowers Well-being', () => {
    expect(homeBenefits(uncoveredCity(), target).servicePenalty).toBe(10);
    expect(homeBenefits(coveredCity(), target).servicePenalty).toBe(0);
  });

  it('asks nothing of a city below the first unlock, nor during an Adaptation period', () => {
    expect(homeBenefits(city([target]), target).servicePenalty).toBe(0);
    expect(homeBenefits(city([target, ...bigHomes()], { adaptationUntil: 5, lastSeen: 0 }), target).servicePenalty).toBe(0);
  });

  it('blocks Home Tier upgrades from the required Tier, and only when the Home is uncovered', () => {
    const state = uncoveredCity();
    expect(missingServicesOf(state, target, WASTE_REQUIRED_TIER)).toContain('waste');
    expect(missingServicesOf(state, target, WASTE_REQUIRED_TIER - 1)).not.toContain('waste');
    expect(missingServicesOf(coveredCity(), target, WASTE_REQUIRED_TIER)).not.toContain('waste');
    expect(missingServicesOf(city([target]), target, WASTE_REQUIRED_TIER)).not.toContain('waste');
  });

  it('feeds the Vital Need level, only once Waste is expected', () => {
    const vital = (state: GameState) => needsPyramid(state).levels.find(level => level.id === 'vital')!.factors.find(factor => factor.id === 'waste')!.satisfaction;
    expect(vital(city([target]))).toBeNull();
    expect(vital(uncoveredCity())).toBe(0);
    expect(vital(coveredCity())).toBeGreaterThan(0);
  });
});

describe('Mound Odor', () => {
  const mounds = (...positions: [number, number][]) => positions.map(([x, y], index) => place(index + 1, 'mound', x, y));
  const smelling = (state: GameState) => odorPenaltyOf(state, state.buildings.find(building => building.id === 10)!);

  it('reaches Homes beyond the collection reach, within the Odor radius', () => {
    const { reach, odor } = WASTE_FACILITIES.mound;
    const x = 64 + reach + 2;
    expect(odor!.radius).toBeGreaterThanOrEqual(reach + 2);
    expect(smelling(city([target, ...mounds([x, 50])]))).toBe(0);
    expect(smelling(city([target, home(12, x + 1, 48, 2), ...mounds([x, 50])]))).toBe(odor!.malus);
    expect(smelling(city([target, home(12, 64 + odor!.radius + 4, 48, 2), ...mounds([64 + odor!.radius + 3, 50])]))).toBe(0);
  });

  it('is the worst Mound around a Home, never summed', () => {
    const one = smelling(city([target, ...mounds([66, 50])]));
    expect(smelling(city([target, ...mounds([66, 50], [68, 50], [70, 50])]))).toBe(one);
  });

  it('lowers the Well-being and joins the Pollution factor', () => {
    const state = city([target, ...mounds([66, 50])]);
    const clean = city([target]);
    expect(homeBenefits(state, target).odorPenalty).toBeGreaterThan(0);
    expect(homeBenefits(state, target).wellbeing).toBeLessThan(homeBenefits(clean, target).wellbeing);
    const pollution = (s: GameState) => needsPyramid(s).levels.flatMap(level => level.factors).find(factor => factor.id === 'pollution')!.satisfaction!;
    expect(pollution(state)).toBeLessThan(pollution(clean));
  });

  it('gives no Climate emissions', () => {
    const base = city([target]);
    const withMound = city([target, ...mounds([66, 50])]);
    expect(wasteEmissions(withMound)).toBe(0);
    expect(climateStats(withMound).emissions).toBe(climateStats(base).emissions);
  });
});

describe('Incinerator', () => {
  const homes = (count: number) => Array.from({ length: count }, (_, index) => home(10 + index, 64 + 3 * index, 50, 4));
  const burning = (count: number) => city([place(1, 'incinerator', 66, 47), ...homes(count)]);

  it('weighs less on a Home next to it than a coal plant at full load', () => {
    const state = burning(1);
    const near = state.buildings.find(building => building.id === 10)!;
    expect(incineratorPenaltyOf(state, near)).toBeGreaterThan(0);
    expect(WASTE_FACILITIES.incinerator.pollution!.malus).toBeLessThan(ECOLOGY.coalWellbeingPenalty);
    expect(WASTE_FACILITIES.incinerator.pollution!.radius).toBeLessThanOrEqual(ECOLOGY.coalPollutionRadius);
  });

  it('emits in proportion to the Waste burnt', () => {
    const one = wasteEmissions(burning(1));
    expect(one).toBeGreaterThan(0);
    expect(wasteEmissions(burning(2))).toBeCloseTo(2 * one, 9);
    expect(climateStats(burning(2)).emissions).toBeGreaterThan(climateStats(burning(1)).emissions);
  });

  it('emits less than a coal plant of the same Tier at full load', () => {
    const full = place(1, 'incinerator', 66, 47, 1);
    const capacityPerHour = wasteCapacity('incinerator', 1) / WASTE.dayHours;
    expect(capacityPerHour * WASTE_FACILITIES.incinerator.emissionsPerUnit).toBeLessThan(COAL_CAPACITY[0]! * ECOLOGY.coalEmissions);
    expect(full.type).toBe('incinerator');
  });
});

describe('Recycling plant', () => {
  it('demands power per Tier, shed like an economic building', () => {
    expect([1, 2, 3, 4].map(tier => economicPower(place(1, 'recyclingPlant', 66, 47, tier)))).toEqual([2, 4, 7, 10]);
    const state = city([place(1, 'recyclingPlant', 66, 47, 4)]);
    const energy = energyStats(state);
    expect(energy.demand).toBe(10);
    expect(energy.supplied.get(1)).toBe(0);
    expect(energy.economicRatio).toBe(0);
  });

  it('has no malus and no emissions', () => {
    const state = city([target, place(1, 'recyclingPlant', 66, 47)]);
    const clean = city([target]);
    expect(homeBenefits(state, target).pollutionPenalty).toBe(0);
    expect(homeBenefits(state, target).odorPenalty).toBe(0);
    expect(wasteEmissions(state)).toBe(0);
    expect(climateStats(state).emissions).toBe(climateStats(clean).emissions);
  });

  it('does not demand power from the Mound nor the Incinerator', () => {
    expect(economicPower(place(1, 'mound', 66, 50))).toBe(0);
    expect(economicPower(place(1, 'incinerator', 66, 47, 4))).toBe(0);
  });
});

describe('Waste usage-cost calibration', () => {
  const taxPerCitizenPerDay = TAX.urbsPerCitizenPerHour * WASTE.dayHours;

  it('weighs 10 to 20 % of the Tax for a representative mix of facilities', () => {
    const { mound, incinerator, recyclingPlant } = WASTE_FACILITIES;
    const mix = [[0.3, recyclingPlant], [0.5, incinerator], [0.2, mound]] as const;
    const costPerCitizen = mix.reduce((sum, [share, facility]) => sum + share * facility.tariff * WASTE.unitsPerCitizenPerDay, 0);
    expect(costPerCitizen / taxPerCitizenPerDay).toBeGreaterThanOrEqual(0.1);
    expect(costPerCitizen / taxPerCitizenPerDay).toBeLessThanOrEqual(0.2);
  });

  it('charges the real Urbs through the report, 1:3:6 across the facilities', () => {
    const cost = (type: 'mound' | 'incinerator' | 'recyclingPlant') => wasteReport(city([place(1, type, 66, type === 'mound' ? 50 : 47), target, ...grid()])).costPerDay;
    const unit = cost('mound');
    expect([cost('incinerator') / unit, cost('recyclingPlant') / unit]).toEqual([3, 6]);
  });
});

describe('Recycling plant under a power shortage', () => {
  const plant = (tier = 4) => place(1, 'recyclingPlant', 66, 47, tier);
  const crowd = (count: number) => Array.from({ length: count }, (_, index) => home(100 + index, 34 + 3 * index, 52, 2));
  const facilityOf = (state: GameState) => wasteReport(state).facilities.get(1)!;

  it('processes at full capacity when it is fully powered', () => {
    const facility = facilityOf(city([plant(), target, ...grid()]));
    expect([facility.powerRatio, facility.capacity, facility.nominalCapacity]).toEqual([1, 2200, 2200]);
  });

  it('scales its capacity with the power ratio it receives', () => {
    const state = city([plant(), target, ...crowd(9), ...grid()]);
    const ratio = energyStats(state).supplied.get(1)! / economicPower(plant());
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThan(1);
    const facility = facilityOf(state);
    expect(facility.powerRatio).toBeCloseTo(ratio, 12);
    expect(facility.capacity).toBeCloseTo(2200 * ratio, 6);
    expect(facility.nominalCapacity).toBe(2200);
  });

  it('processes nothing with no power and leaves the Home uncovered as stopped', () => {
    const state = city([plant(), target]);
    const report = wasteReport(state);
    expect([facilityOf(state).powerRatio, facilityOf(state).capacity, report.processed]).toEqual([0, 0, 0]);
    expect(report.homes.get(10)?.cause).toBe('facilityStopped');
  });

  it('is not shed during the Adaptation period', () => {
    const state = city([plant(), target], { adaptationUntil: 10 * ECOLOGY.hourMs });
    expect([facilityOf(state).powerRatio, wasteReport(state).homes.get(10)?.cause]).toEqual([1, null]);
  });

  it('hands its Homes over to the Incinerator when it has no power', () => {
    const state = city([plant(), place(2, 'incinerator', 62, 47), place(3, 'mound', 70, 50), target]);
    expect(wasteReport(state).homes.get(10)?.facilityId).toBe(2);
  });

  it('hands its Homes over to the Mound when no Incinerator can take them', () => {
    const state = city([plant(), place(3, 'mound', 70, 50), target]);
    expect(wasteReport(state).homes.get(10)?.facilityId).toBe(3);
  });

  it('keeps the capacityFull cause when a running facility is full', () => {
    const state = city([place(3, 'mound', 66, 50), plant(), ...Array.from({ length: 4 }, (_, index) => home(10 + index, 60 + 2 * index, 48, 3))]);
    expect(wasteReport(state).homes.get(10)?.cause).toBe('capacityFull');
  });
});
