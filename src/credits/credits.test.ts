import { describe, expect, it } from 'vitest';
import type { ModelDefinition } from '../scene/modelDefinitions';
import { creditsOf } from './credits';

const definitions: Record<string, ModelDefinition> = {
  'poly.pizza/barn': { source: 'poly.pizza', license: 'CC-BY 3.0', author: 'Poly by Google', url: 'https://poly.pizza/m/0QTh_KUZRYE', note: 'Barn' },
  'poly.pizza/bank': { source: 'poly.pizza', license: 'CC-BY 3.0', author: 'Poly by Google', url: 'https://poly.pizza/m/bank', note: 'Bank' },
  'poly.pizza/unused': { source: 'poly.pizza', license: 'CC-BY 3.0', author: 'Someone', note: 'Unused' },
  'farm/Barn': { source: 'managed', license: 'CC0', author: 'Me' },
  'roads/road-straight': { source: 'kenney', license: 'CC0' },
};

describe('model credits', () => {
  it('list only used models of the source, sorted by title', () => {
    const credits = creditsOf('poly.pizza', ['poly.pizza/barn', 'poly.pizza/bank', 'farm/Barn'], definitions);
    expect(credits.map((credit) => credit.title)).toEqual(['Bank', 'Barn']);
    expect(credits[1]).toMatchObject({ author: 'Poly by Google', url: 'https://poly.pizza/m/0QTh_KUZRYE', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' });
  });

  it('fall back to the model key without a note', () => {
    expect(creditsOf('managed', ['farm/Barn'], definitions)[0]).toMatchObject({ title: 'farm/Barn', author: 'Me', url: undefined });
  });

  it('skip models without an author', () => {
    expect(creditsOf('kenney', ['roads/road-straight'], definitions)).toEqual([]);
  });
});
