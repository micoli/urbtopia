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

const licenseFiles = import.meta.glob<string>('../../assets/poly.pizza/*/license.txt', { query: '?raw', import: 'default', eager: true });

export const POLY_PIZZA_CREDITS: PolyPizzaCredit[] = parseLicenses(Object.values(licenseFiles));
