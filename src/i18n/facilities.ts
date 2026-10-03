import { FACILITIES, FACILITY_TYPES, SERVICE_CATEGORIES, type FacilityType, type ServiceCategory } from '../core/facilities';

type FacilityMessageKey = `building.${FacilityType}` | `codex.description.${FacilityType}` | `event.unlocked.${FacilityType}` | `service.${ServiceCategory}`;

const texts: Record<FacilityType, { name: readonly [string, string]; help: readonly [string, string] }> = {
  school: {
    name: ['School', 'École'],
    help: ['Teaches the nearby Citizens. Homes cannot reach Tier 3 without School coverage.', 'Instruit les citoyens proches. Les logements ne peuvent pas atteindre le niveau 3 sans couverture d’une école.'],
  },
  middleSchool: {
    name: ['Middle school', 'Collège'],
    help: ['Continues the education of nearby Citizens. Optional: it raises Well-being.', 'Poursuit l’éducation des citoyens proches. Facultatif : il augmente le bien-être.'],
  },
  highSchool: {
    name: ['High school', 'Lycée'],
    help: ['Prepares nearby Citizens for higher studies. Required for Home Tier 5.', 'Prépare les citoyens proches aux études supérieures. Requis pour les logements de niveau 5.'],
  },
  university: {
    name: ['University', 'Université'],
    help: ['Serves the whole city; several Universities add their capacity. Optional: it raises Well-being.', 'Dessert toute la ville ; plusieurs universités additionnent leur capacité. Facultative : elle augmente le bien-être.'],
  },
  townHall: {
    name: ['Town hall', 'Hôtel de ville'],
    help: ['Administers the whole city, with no capacity limit. Only one can be built. Required for Home Tier 6.', 'Administre toute la ville, sans limite de capacité. Un seul peut être construit. Requis pour les logements de niveau 6.'],
  },
  communityHall: {
    name: ['Community hall', 'Salle des fêtes'],
    help: ['A small Culture facility for nearby Citizens. Different Culture facilities stack their Well-being.', 'Un petit équipement culturel pour les citoyens proches. Les équipements culturels différents cumulent leur bien-être.'],
  },
  theater: {
    name: ['Theater', 'Théâtre'],
    help: ['A Culture facility for nearby Citizens. Different Culture facilities stack their Well-being.', 'Un équipement culturel pour les citoyens proches. Les équipements culturels différents cumulent leur bien-être.'],
  },
  concertHall: {
    name: ['Concert hall', 'Salle de concert'],
    help: ['A large Culture facility. Optional: it raises Well-being.', 'Un grand équipement culturel. Facultatif : il augmente le bien-être.'],
  },
  hospital: {
    name: ['Hospital', 'Hôpital'],
    help: ['Cares for nearby Citizens and needs water. Required for Home Tier 5. Sends ambulances to covered Homes.', 'Soigne les citoyens proches et consomme de l’eau. Requis pour les logements de niveau 5. Envoie des ambulances vers les logements couverts.'],
  },
  fireStation: {
    name: ['Fire station', 'Caserne de pompiers'],
    help: ['Protects nearby Citizens. Required for Home Tier 6. Sends fire trucks to covered Homes.', 'Protège les citoyens proches. Requise pour les logements de niveau 6. Envoie des camions de pompiers vers les logements couverts.'],
  },
  policeStation: {
    name: ['Police station', 'Commissariat'],
    help: ['Protects nearby Citizens. Required for Home Tier 6. Sends police cars to covered Homes.', 'Protège les citoyens proches. Requis pour les logements de niveau 6. Envoie des voitures de police vers les logements couverts.'],
  },
};

const categoryNames: Record<ServiceCategory, readonly [string, string]> = {
  education: ['Education', 'Éducation'],
  administration: ['Administration', 'Administration'],
  culture: ['Culture', 'Culture'],
  health: ['Health', 'Santé'],
  safety: ['Safety', 'Sécurité'],
};

function coverageSentence(type: FacilityType, index: number): string {
  const { radius, capacity, cost, unlockCitizens } = FACILITIES[type];
  const reach = radius === null ? ['Covers the whole city', 'Couvre toute la ville'][index] : [`Radius ${radius} tiles`, `Rayon ${radius} cases`][index];
  const served = capacity === null ? ['unlimited capacity', 'capacité illimitée'][index] : [`capacity ${capacity} Citizens`, `capacité ${capacity} citoyens`][index];
  const tail = [`unlocks at ${unlockCitizens} Citizens, costs ${cost} Urbs, no operating cost.`, `se débloque à ${unlockCitizens} citoyens, coûte ${cost} Urbs, sans coût de fonctionnement.`][index];
  return `${reach}, ${served}; ${tail}`;
}

export function facilityMessages(language: 'en' | 'fr'): Record<FacilityMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = FACILITY_TYPES.flatMap(type => [
    [`building.${type}`, texts[type].name[index]],
    [`codex.description.${type}`, `${texts[type].help[index]} ${coverageSentence(type, index)}`],
    [`event.unlocked.${type}`, language === 'en' ? `New public facility available: ${texts[type].name[0]}.` : `Nouvel équipement public disponible : ${texts[type].name[1]}.`],
  ]);
  const categories = SERVICE_CATEGORIES.map(category => [`service.${category}`, categoryNames[category][index]]);
  return Object.fromEntries([...entries, ...categories]) as Record<FacilityMessageKey, string>;
}
