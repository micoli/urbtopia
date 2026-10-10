import { BUILD_SECTION_TITLES, type BuildSection } from '../core/buildings/buildSections';
import { BUILDING_ENTRIES, type BuildingEntry } from '../core/buildings/buildingDefinitions';
import { FACILITIES, SERVICE_CATEGORIES, isFacilityType, type BuildingType } from '../core';

export type { BuildSection };

const sectionOf = ({ family, section }: BuildingEntry): BuildSection => (family ? (family === 'decoration' ? 'build.decoration' : 'build.greenSpaces') : section!);

const typesOf = (title: BuildSection): BuildingType[] => BUILDING_ENTRIES.filter(entry => !entry.retired && sectionOf(entry) === title).map(({ id }) => id);

const byServiceCategory = (types: BuildingType[]): BuildingType[] => SERVICE_CATEGORIES.flatMap(category => types.filter(type => isFacilityType(type) && FACILITIES[type].category === category));

export const BUILDING_SECTIONS: readonly { title: BuildSection; types: readonly BuildingType[] }[] = BUILD_SECTION_TITLES.map(title => ({
  title,
  types: title === 'build.publicFacilities' ? byServiceCategory(typesOf(title)) : typesOf(title),
}));
