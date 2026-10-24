const normalized = (text: string): string => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase();

export function matchesSearch(value: string, query: string): boolean {
  const normalizedValue = normalized(value);
  const terms = normalized(query).trim().split(/\s+/).filter(Boolean);
  return terms.every(term => normalizedValue.includes(term));
}
