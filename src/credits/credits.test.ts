import { describe, expect, it } from 'vitest';
import type { ModelDefinition } from '../scene/modelDefinitions';
import { creditsOf } from './credits';

const definitions: Record<string, ModelDefinition> = {
  'town/barn': { source: 'managed', license: 'CC-BY 3.0', author: 'Someone', url: 'https://example.com/barn', note: 'Barn' },
  'town/bank': { source: 'managed', license: 'CC-BY 3.0', author: 'Someone', url: 'https://example.com/bank', note: 'Bank' },
  'town/unused': { source: 'managed', license: 'CC-BY 3.0', author: 'Someone else', note: 'Unused' },
  'farm/Barn': { source: 'managed', license: 'CC0', author: 'Me' },
  'roads/road-straight': { source: 'quaternius', license: 'CC0' },
};

describe('model credits', () => {
  it('list only used models of the source, sorted by title', () => {
    const credits = creditsOf('managed', ['town/barn', 'town/bank', 'farm/Barn'], definitions);
    expect(credits.map((credit) => credit.title)).toEqual(['Bank', 'Barn', 'farm/Barn']);
    expect(credits[1]).toMatchObject({ author: 'Someone', url: 'https://example.com/barn', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' });
  });

  it('fall back to the model key without a note', () => {
    expect(creditsOf('managed', ['farm/Barn'], definitions)[0]).toMatchObject({ title: 'farm/Barn', author: 'Me', url: undefined });
  });

  it('skip models without an author', () => {
    expect(creditsOf('quaternius', ['roads/road-straight'], definitions)).toEqual([]);
  });
});
