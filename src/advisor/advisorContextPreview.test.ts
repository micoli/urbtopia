import { describe, expect, it } from 'vitest';
import { newGame } from '../core';
import { advisorContextPreview } from './advisorContextPreview';

describe('advisorContextPreview', () => {
  const state = newGame({ seed: 'preview', now: 0 });

  it('shows the system prompt then the city figures and the question', () => {
    const preview = advisorContextPreview(state, 'en', 5, 'Why?');
    expect(preview.startsWith('[system]\n')).toBe(true);
    expect(preview).toContain('[user]\nCity figures:');
    expect(preview.endsWith('Question: Why?')).toBe(true);
  });

  it('follows the language and defaults to the first-step question', () => {
    expect(advisorContextPreview(state, 'fr', 3)).toContain('Que dois-je faire en premier ?');
  });
});
