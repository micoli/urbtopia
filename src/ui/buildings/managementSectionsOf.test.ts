import { describe, expect, it } from 'vitest';
import type { BuildingType } from '../../core';
import { managementSectionsOf } from './managementSectionsOf';
import { MANAGEMENT_SECTIONS, groupOfSection } from '../stats/management/managementSections';

const sectionsOf = (type: string) => managementSectionsOf({ type: type as BuildingType });

describe('managementSectionsOf', () => {
  it.each([
    ['home', ['eco-needs', 'eco-services', 'eco-jobs']],
    ['workshop', ['eco-production', 'eco-interiors']],
    ['mill', ['eco-production', 'eco-interiors']],
    ['waterTower', ['eco-water']],
    ['powerPlant', ['eco-energy']],
    ['coalPlant', ['eco-energy', 'eco-emissions', 'eco-interiors']],
    ['backup', ['eco-energy', 'eco-emissions']],
    ['school', ['eco-services', 'eco-interiors']],
    ['mound', ['eco-waste']],
    ['incinerator', ['eco-waste', 'eco-emissions']],
    ['recyclingPlant', ['eco-waste', 'eco-interiors']],
    ['busStop', ['eco-transport']],
    ['railStation', ['eco-railMetro']],
    ['casino', ['eco-tourism']],
    ['arcade', ['eco-tourism', 'eco-interiors']],
  ])('links %s to its sections', (type, expected) => {
    expect(sectionsOf(type)).toEqual(expected);
  });

  it('links a building with nothing to say in City management to none', () => {
    expect(sectionsOf('road')).toEqual([]);
  });

  it('only points at sections City management has, each in a group', () => {
    for (const id of Object.keys(MANAGEMENT_SECTIONS)) expect(groupOfSection(id), id).not.toBeNull();
  });
});
