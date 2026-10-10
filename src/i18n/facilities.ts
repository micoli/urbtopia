import { definitionOf } from '../core/buildings/buildingDefinitions';
import { FACILITY_TYPES, SERVICE_CATEGORIES, type FacilityType, type ServiceCategory } from '../core/services/facilities';

type FacilityMessageKey = `event.unlocked.${FacilityType}` | `service.${ServiceCategory}`;

const categoryNames: Record<ServiceCategory, readonly [string, string]> = {
  education: ['Education', 'Éducation'],
  administration: ['Administration', 'Administration'],
  culture: ['Culture', 'Culture'],
  health: ['Health', 'Santé'],
  safety: ['Safety', 'Sécurité'],
};

export function facilityMessages(language: 'en' | 'fr'): Record<FacilityMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = FACILITY_TYPES.flatMap(type => [
    [`event.unlocked.${type}`, language === 'en' ? `New public facility available: ${definitionOf(type).name.en}.` : `Nouvel équipement public disponible : ${definitionOf(type).name.fr}.`],
  ]);
  const categories = SERVICE_CATEGORIES.map(category => [`service.${category}`, categoryNames[category][index]]);
  return Object.fromEntries([...entries, ...categories]) as Record<FacilityMessageKey, string>;
}
