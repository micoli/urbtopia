import { IntlMessageFormat } from 'intl-messageformat';

export type DescriptionLanguage = 'en' | 'fr';

export type DescriptionValues = Record<string, string | number>;

interface Element {
  type: number;
  value?: string;
  options?: Record<string, { value: Element[] }>;
  children?: Element[];
}

// Element types of the ICU parser that name no argument.
const LITERAL = 0;
const POUND = 7;

const formats = new Map<string, IntlMessageFormat>();

const formatOf = (template: string, language: DescriptionLanguage): IntlMessageFormat => {
  const key = `${language}:${template}`;
  const cached = formats.get(key);
  if (cached) return cached;
  const format = new IntlMessageFormat(template, language);
  formats.set(key, format);
  return format;
};

export const renderDescription = (template: string, language: DescriptionLanguage, values: DescriptionValues): string => formatOf(template, language).format(values) as string;

const argumentsOf = (elements: readonly Element[]): string[] =>
  elements.flatMap(element => {
    if (element.type === LITERAL || element.type === POUND) return [];
    const nested = [...Object.values(element.options ?? {}).flatMap(option => argumentsOf(option.value)), ...argumentsOf(element.children ?? [])];
    return element.value === undefined || element.type === 8 ? nested : [element.value, ...nested];
  });

// Every placeholder a template uses, or the parser's message when it is not valid ICU MessageFormat.
export function placeholdersOf(template: string): { placeholders: string[] } | { error: string } {
  try {
    return { placeholders: [...new Set(argumentsOf(formatOf(template, 'en').getAst() as Element[]))] };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
