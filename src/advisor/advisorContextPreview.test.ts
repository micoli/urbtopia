import { describe, expect, it } from 'vitest';
import { newGame } from '../core';
import { advisorContextPreview } from './advisorContextPreview';

describe('advisorContextPreview', () => {
  const state = newGame({ seed: 'preview', now: 0 });

  it('shows the system prompt then the city figures and the question', async () => {
    const preview = await advisorContextPreview(state, 'en', 5, 'Why?');
    expect(preview.startsWith('[system]\n')).toBe(true);
    expect(preview).toContain('[user]\nCity figures:');
    expect(preview.endsWith('Question: Why?')).toBe(true);
  });

  it('follows the language and defaults to the first-step question', async () => {
    expect(await advisorContextPreview(state, 'fr', 3)).toContain('Que dois-je faire en premier ?');
  });
});

describe('advisorContextPreview production chains', () => {
  const state = newGame({ seed: 'chains', now: 0 });

  it('lists the unlocked productions with their inputs at the full context level', async () => {
    const preview = await advisorContextPreview(state, 'en', 5);
    expect(preview).toContain('Unlocked production chains');
    expect(preview).toMatch(/- Factory: .*Planks \(2 Wood\)/);
  });

  it('keeps locked items out of the chains', async () => {
    expect(await advisorContextPreview(state, 'en', 5)).not.toContain('Steel');
  });

  it('leaves the chains out below the full context level', async () => {
    expect(await advisorContextPreview(state, 'en', 4)).not.toContain('Unlocked production chains');
  });

  it('follows the language', async () => {
    expect(await advisorContextPreview(state, 'fr', 5)).toMatch(/- Usine: .*Planches \(2 Bois\)/);
  });
});
