import { describe, expect, it } from 'vitest';
import { rulesContextFor } from './loadRulesPassages';

describe('rulesContextFor', () => {
  it('finds the Waste article for a question on landfills, in English', async () => {
    const { passages, aboutCity } = await rulesContextFor('How does a landfill treat waste?', 'en');
    expect(passages.length).toBeGreaterThan(0);
    expect(passages.some(({ title }) => title.startsWith('Waste'))).toBe(true);
    expect(aboutCity).toBe(false);
  });

  it('finds the Waste article in French', async () => {
    const { passages } = await rulesContextFor('Comment les déchets sont-ils collectés ?', 'fr');
    expect(passages.some(({ title }) => title.startsWith('Déchets'))).toBe(true);
  });

  it('finds nothing for a question the rules do not cover', async () => {
    expect((await rulesContextFor('Who wrote Hamlet in London?', 'en')).passages).toEqual([]);
  });
});
