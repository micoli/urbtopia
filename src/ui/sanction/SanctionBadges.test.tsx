import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type Difficulty, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { SanctionBadges } from './SanctionBadges';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));
vi.mock('../common/useProjectedPosition', () => ({ useProjectedPosition: () => {} }));

afterEach(() => prefsStore.getState().setLanguage('en'));

const render = (difficulty: Difficulty, adaptationUntil = 0) => {
  context.state = { ...newGame({ seed: 'sanction-badges', now: 0 }), difficulty, adaptationUntil, buildings: [createBuilding(900, 'home', 56, 59, 0)] };
  return renderToStaticMarkup(<SanctionBadges />);
};

describe('SanctionBadges', () => {
  it.each(['en', 'fr'] as const)('marks a sanctioned Home with its cause and Tax lost in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = render('easy');
    expect(html).toContain('class="sanction-badge"');
    expect(html).toContain(language === 'fr' ? 'Électricité' : 'Electricity');
    expect(html).toContain(language === 'fr' ? '−50 %' : '−50%');
    expect(html).not.toContain('{');
  });

  it('shows nothing under Cozy', () => {
    expect(render('cozy')).toBe('');
  });

  it('shows nothing during the Adaptation period', () => {
    expect(render('easy', 24 * 3_600_000)).toBe('');
  });
});
