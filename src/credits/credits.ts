import { MODEL_DEFINITIONS } from '../scene/modelDefinitions';
import { parseLicenses, type PolyPizzaCredit } from './polyPizzaCredits';

export interface PackCredit {
  name: string;
  url: string;
  licence: string;
}

export const PACK_CREDITS: PackCredit[] = [
  { name: 'Kenney', url: 'https://kenney.nl', licence: 'CC0' },
  { name: 'Quaternius', url: 'https://quaternius.com', licence: 'CC0' },
];

export interface ModelCredit {
  model: string;
  author: string;
  url?: string;
  license: string;
}

export const OTHER_MODEL_CREDITS: ModelCredit[] = Object.entries(MODEL_DEFINITIONS)
  .filter(([, definition]) => definition.source === 'managed' && definition.author)
  .map(([model, definition]) => ({ model, author: definition.author!, url: definition.url, license: definition.license }));

const licenseFiles = import.meta.glob<string>('../../assets/poly.pizza/*/license.txt', { query: '?raw', import: 'default', eager: true });

export const POLY_PIZZA_CREDITS: PolyPizzaCredit[] = parseLicenses(Object.values(licenseFiles));
