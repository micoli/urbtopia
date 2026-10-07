import { definitionOf } from '../core/buildings/buildingDefinitions';
import { FACILITIES, FACILITY_TYPES, MAX_FACILITY_TIER, facilityCapacity, SERVICE_CATEGORIES, type FacilityType, type ServiceCategory } from '../core/services/facilities';

type FacilityMessageKey = `codex.description.${FacilityType}` | `event.unlocked.${FacilityType}` | `service.${ServiceCategory}`;

const categoryNames: Record<ServiceCategory, readonly [string, string]> = {
  education: ['Education', 'Éducation'],
  administration: ['Administration', 'Administration'],
  culture: ['Culture', 'Culture'],
  health: ['Health', 'Santé'],
  safety: ['Safety', 'Sécurité'],
};

function coverageSentence(type: FacilityType, index: number): string {
  const { radius, cost, unlockCitizens, power, water } = FACILITIES[type];
  const top = facilityCapacity(type, MAX_FACILITY_TIER);
  const base = facilityCapacity(type, 1);
  const reach = radius === null ? ['Covers the whole city', 'Couvre toute la ville'][index] : [`Square reach of ${2 * radius} tiles`, `Portée carrée de ${2 * radius} cases`][index];
  const served = base === null
    ? ['unlimited capacity', 'capacité illimitée'][index]
    : [`capacity ${base} Citizens, up to ${top} at Tier ${MAX_FACILITY_TIER}`, `capacité ${base} citoyens, jusqu’à ${top} au niveau ${MAX_FACILITY_TIER}`][index];
  const demand = [`demand ${power} power${water ? ` and ${water} water` : ''}`, `consomme ${power} d’électricité${water ? ` et ${water} d’eau` : ''}`][index];
  const tail = [`unlocks at ${unlockCitizens} Citizens, costs ${cost} Urbs, no operating cost.`, `se débloque à ${unlockCitizens} citoyens, coûte ${cost} Urbs, sans coût de fonctionnement.`][index];
  return `${reach}, ${served}; ${demand}; ${tail}`;
}

export function facilityMessages(language: 'en' | 'fr'): Record<FacilityMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = FACILITY_TYPES.flatMap(type => [
    [`codex.description.${type}`, `${definitionOf(type).description![language]} ${coverageSentence(type, index)}`],
    [`event.unlocked.${type}`, language === 'en' ? `New public facility available: ${definitionOf(type).name.en}.` : `Nouvel équipement public disponible : ${definitionOf(type).name.fr}.`],
  ]);
  const categories = SERVICE_CATEGORIES.map(category => [`service.${category}`, categoryNames[category][index]]);
  return Object.fromEntries([...entries, ...categories]) as Record<FacilityMessageKey, string>;
}
