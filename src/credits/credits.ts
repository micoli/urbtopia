import { MODEL_DEFINITIONS, type ModelDefinition, type ModelSource } from '../scene/modelDefinitions';
import { MODEL_KEYS } from '../scene/renderItems';

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
  title: string;
  author: string;
  url?: string;
  license: string;
  licenseUrl?: string;
}

const LICENSE_URLS: Record<string, string> = {
  'CC-BY 3.0': 'https://creativecommons.org/licenses/by/3.0/',
  'CC0 1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
};

export function creditsOf(source: ModelSource, usedKeys: readonly string[], definitions: Record<string, ModelDefinition>): ModelCredit[] {
  return usedKeys
    .flatMap((model) => {
      const definition = definitions[model];
      if (definition?.source !== source || !definition.author) return [];
      return [{ model, title: definition.note ?? model, author: definition.author, url: definition.url, license: definition.license, licenseUrl: LICENSE_URLS[definition.license] }];
    })
    .sort((a, b) => a.title.localeCompare(b.title) || a.author.localeCompare(b.author));
}

export const POLY_PIZZA_CREDITS = creditsOf('poly.pizza', MODEL_KEYS, MODEL_DEFINITIONS);
export const OTHER_MODEL_CREDITS = creditsOf('managed', MODEL_KEYS, MODEL_DEFINITIONS);
