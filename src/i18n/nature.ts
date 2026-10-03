import { NATURE_NAMES } from './natureNames';
import { NATURE_MODELS, NATURE_FAMILIES, type NatureFamily, type NatureType } from '../core/nature';

type NatureMessageKey = `building.${NatureType}` | `codex.description.nature.${NatureFamily}`;

const descriptions: Record<NatureFamily, readonly [string, string]> = {
  tree: ['Trees strongly improve cooling, biodiversity and nearby Citizen well-being.', 'Les arbres améliorent fortement la fraîcheur, la biodiversité et le bien-être des citoyens proches.'],
  conifer: ['Forest trees strongly improve cooling, biodiversity and nearby Citizen well-being.', 'Les arbres forestiers améliorent fortement la fraîcheur, la biodiversité et le bien-être des citoyens proches.'],
  palm: ['Palms improve cooling, biodiversity and nearby Citizen well-being.', 'Les palmiers améliorent la fraîcheur, la biodiversité et le bien-être des citoyens proches.'],
  shrub: ['Shrubs support biodiversity, cooling and nearby Citizen well-being.', 'Les buissons et plantes favorisent la biodiversité, la fraîcheur et le bien-être des citoyens proches.'],
  flower: ['Flowers, mushrooms and lilies strongly support biodiversity and Citizen well-being, with a small cooling benefit.', 'Les fleurs, champignons et nénuphars favorisent fortement la biodiversité et le bien-être, avec un petit bénéfice de fraîcheur.'],
  grass: ['Grass improves cooling, biodiversity and nearby Citizen well-being.', 'L’herbe améliore la fraîcheur, la biodiversité et le bien-être des citoyens proches.'],
  habitat: ['Rocks, logs and stumps support biodiversity only within two tiles of vegetation. They provide no cooling or direct well-being.', 'Les rochers, troncs et souches favorisent la biodiversité uniquement à deux cases maximum de végétation. Ils n’apportent ni fraîcheur ni bien-être direct.'],
};

export function natureMessages(language: 'en' | 'fr'): Record<NatureMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const names = NATURE_MODELS.map(([type]) => [`building.${type}`, NATURE_NAMES[type][index]]);
  const help = Object.entries(NATURE_FAMILIES).map(([family, profile]) => [
    `codex.description.nature.${family}`,
    language === 'en'
      ? `${descriptions[family as NatureFamily][index]} Range: ${profile.radius} tiles. Adjacent vegetation gains 20%; benefits have diminishing returns and never cancel emissions. No road, power, water or maintenance required.`
      : `${descriptions[family as NatureFamily][index]} Rayon : ${profile.radius} cases. La végétation adjacente gagne 20 % ; les bénéfices ont un rendement décroissant et ne compensent jamais les émissions. Aucune route, électricité, eau ou entretien requis.`,
  ]);
  return Object.fromEntries([...names, ...help]) as Record<NatureMessageKey, string>;
}
