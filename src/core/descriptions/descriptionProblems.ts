import type { FlatBuilding } from '../buildings/buildingDefinition.ts';
import { computedValuesOf, fieldValuesOf } from './descriptionValues.ts';
import { placeholdersOf, type DescriptionLanguage } from './messageFormat.ts';

export interface DescriptionProblem {
  path: string;
  message: string;
}

const LANGUAGES: readonly DescriptionLanguage[] = ['en', 'fr'];

// A template must be valid ICU MessageFormat and use only the placeholders its Game object offers.
export function templateProblems(template: string, available: ReadonlySet<string>, path: string): DescriptionProblem[] {
  const parsed = placeholdersOf(template);
  if ('error' in parsed) return [{ path, message: `invalid message: ${parsed.error}` }];
  return parsed.placeholders.filter(name => !available.has(name)).map(name => ({ path, message: `unknown placeholder {${name}}` }));
}

export function descriptionProblemsOf(definition: FlatBuilding): DescriptionProblem[] {
  const description = definition.description;
  if (!description) return [];
  const available = new Set([...Object.keys(fieldValuesOf(definition)), ...Object.keys(computedValuesOf(definition))]);
  return LANGUAGES.flatMap(language => templateProblems(description[language], available, `description.${language}`));
}
