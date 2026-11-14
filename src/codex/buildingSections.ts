import { BUILD_SECTION_TITLES, type BuildSection } from '../core/buildings/buildSections';
import { BUILDING_ENTRIES, type BuildingEntry } from '../core/buildings/buildingDefinitions';
import { FACILITIES, SERVICE_CATEGORIES, isFacilityType, type BuildingType } from '../core';

export type { BuildSection };

const sectionOf = ({ family, section }: BuildingEntry): BuildSection => (family ? (family === 'decoration' ? 'build.decoration' : 'build.greenSpaces') : section!);

const typesOf = (title: BuildSection): BuildingType[] => BUILDING_ENTRIES.filter(entry => !entry.retired && sectionOf(entry) === title).map(({ id }) => id);

const byServiceCategory = (types: BuildingType[]): BuildingType[] => SERVICE_CATEGORIES.flatMap(category => types.filter(type => isFacilityType(type) && FACILITIES[type].category === category));

// Leisure lists its attractions first, then the cultural facilities under one Culture heading.
const leisureOrder = (types: BuildingType[]): BuildingType[] => [...types.filter(type => !isFacilityType(type)), ...byServiceCategory(types)];

const orderedTypesOf = (title: BuildSection): BuildingType[] => (title === 'build.publicFacilities' ? byServiceCategory(typesOf(title)) : title === 'build.leisure' ? leisureOrder(typesOf(title)) : typesOf(title));

export const BUILDING_SECTIONS: readonly { title: BuildSection; types: readonly BuildingType[] }[] = BUILD_SECTION_TITLES.map(title => ({
  title,
  types: orderedTypesOf(title),
}));
