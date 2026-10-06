import { describe, expect, it } from 'vitest';
import { parseLicense, parseLicenses } from './polyPizzaCredits';

const barn = '"Barn" by Poly by Google\nSource: https://poly.pizza/m/0QTh_KUZRYE\nLicense: CC-BY 3.0\nhttps://creativecommons.org/licenses/by/3.0/\n';

describe('poly pizza credits', () => {
  it('parse a license file', () => {
    expect(parseLicense(barn)).toEqual({ title: 'Barn', author: 'Poly by Google', source: 'https://poly.pizza/m/0QTh_KUZRYE', licence: 'CC-BY 3.0', licenceUrl: 'https://creativecommons.org/licenses/by/3.0/' });
  });

  it('ignore a malformed file', () => {
    expect(parseLicense('nothing here')).toBeNull();
  });

  it('sort credits by title', () => {
    const bank = barn.replace('Barn', 'Bank');
    expect(parseLicenses([barn, bank, 'junk']).map((credit) => credit.title)).toEqual(['Bank', 'Barn']);
  });
});
