import { describe, expect, it } from 'vitest';
import { createBuilding } from '../buildings/buildingSpecs';
import { ENERGY_SOURCES, PLANT_TYPES, generatedSourceOf, isGeneratingPlant } from './generators';

const at = (type: Parameters<typeof createBuilding>[1]) => createBuilding(1, type, 50, 50, 0);

describe('generators', () => {
  it('names the source each generating building feeds', () => {
    expect(generatedSourceOf(at('powerPlant'))).toBe('wind');
    expect(generatedSourceOf(at('hydroPlant'))).toBe('hydro');
    expect(generatedSourceOf(at('geothermalPlant'))).toBe('geothermal');
    expect(generatedSourceOf(at('solar'))).toBe('solar');
  });

  it('counts a Home with solar panels as solar, and a plain Home as nothing', () => {
    expect(generatedSourceOf({ ...at('home'), solar: true })).toBe('solar');
    expect(generatedSourceOf(at('home'))).toBeNull();
  });

  it('leaves the Coal plant out: it only covers what the others leave short', () => {
    expect(generatedSourceOf(at('coalPlant'))).toBeNull();
    expect(isGeneratingPlant('coalPlant')).toBe(false);
  });

  it('has a plant for every source but solar, and gives back the same source', () => {
    for (const source of ENERGY_SOURCES.filter((id) => id !== 'solar' && id !== 'coal')) {
      expect(generatedSourceOf(at(PLANT_TYPES[source]))).toBe(source);
    }
    expect(Object.keys(PLANT_TYPES).sort()).toEqual(ENERGY_SOURCES.filter((id) => id !== 'solar').sort());
  });
});
