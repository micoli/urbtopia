import { describe, expect, it } from 'vitest';
import { passagesFromArticle } from './rulesPassages';

const article = `export const meta = {
  title: 'Waste',
  summary: 'What citizens throw away.',
  order: 30,
};

Intro with **bold** words.

## Three facilities

| Facility | Capacity |
| --- | --- |
| <EntryLink id="mound" /> | Small |

See <ArticleLink slug="mobility">the roads</ArticleLink> and <EntryLink id="incinerator">burners</EntryLink>.

## Your numbers

<LiveRules id="waste" />
`;

describe('passagesFromArticle', () => {
  const passages = passagesFromArticle(article, (id) => `Name of ${id}`);

  it('cuts an article at its headings, under the article title', () => {
    expect(passages.map(({ title }) => title)).toEqual(['Waste', 'Waste - Three facilities']);
  });

  it('turns entry links into names and drops components that render live figures', () => {
    const text = passages[1]!.text;
    expect(text).toContain('Name of mound');
    expect(text).toContain('the roads');
    expect(text).toContain('burners');
    expect(text).not.toContain('<');
    expect(text).not.toContain('---');
  });

  it('drops the metadata block and the emphasis marks', () => {
    expect(passages[0]!.text).toBe('Intro with bold words.');
  });

  it('keeps no passage that holds nothing but a live component', () => {
    expect(passages.some(({ title }) => title.includes('Your numbers'))).toBe(false);
  });
});
