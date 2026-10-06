export interface PolyPizzaCredit {
  title: string;
  author: string;
  source: string;
  licence: string;
  licenceUrl?: string;
}

const LINE = /^"(.+)" by (.+)$/;

export function parseLicense(text: string): PolyPizzaCredit | null {
  const [heading = '', source = '', licenceLine = '', licenceUrl] = text.trim().split('\n');
  const match = LINE.exec(heading);
  if (!match || !source.startsWith('Source: ') || !licenceLine.startsWith('License: ')) return null;
  return { title: match[1]!, author: match[2]!, source: source.slice('Source: '.length), licence: licenceLine.slice('License: '.length), licenceUrl };
}

export function parseLicenses(texts: string[]): PolyPizzaCredit[] {
  return texts
    .map(parseLicense)
    .filter((credit): credit is PolyPizzaCredit => credit !== null)
    .sort((a, b) => a.title.localeCompare(b.title) || a.author.localeCompare(b.author));
}
