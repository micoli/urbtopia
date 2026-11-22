import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EntryAchievements } from './EntryAchievements';

describe('the Achievements of a Codex entry', () => {
  it('names the Achievement a building is the subject of', () => {
    expect(renderToStaticMarkup(<EntryAchievements id="library" />)).toContain('Culture at hand');
  });

  it('says nothing for a building no Achievement is about', () => {
    expect(renderToStaticMarkup(<EntryAchievements id="workshop" />)).toBe('');
  });
});
