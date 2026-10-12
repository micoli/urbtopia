import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DIFFICULTIES, SANCTIONABLE_FACTOR_IDS, SANCTIONS, createBuilding, newGame, type Difficulty, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { SanctionsPage } from './SanctionsPage';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

const HOUR = 3_600_000;

const render = (difficulty?: Difficulty, adaptationUntil = 0) => {
  context.state = { ...newGame({ seed: 'sanctions-page', now: 0 }), ...(difficulty ? { difficulty } : {}), adaptationUntil, buildings: [createBuilding(900, 'home', 56, 59, 0)] };
  return renderToStaticMarkup(<SanctionsPage />).replaceAll('&#x27;', "'");
};

describe('SanctionsPage', () => {
  it.each(['en', 'fr'] as const)('lists every Difficulty and the sanctionable factors in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = render('easy');
    expect(html).toContain(t('codex.sanctions.title'));
    for (const difficulty of DIFFICULTIES) expect(html).toContain(t(`difficulty.${difficulty}`));
    for (const factor of SANCTIONABLE_FACTOR_IDS) expect(html).toContain(t(`needs.factor.${factor}`));
    expect(html).not.toContain('{');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('undefined');
  });

  it.each(DIFFICULTIES)('highlights %s as the Difficulty of the city', difficulty => {
    const html = render(difficulty);
    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
    expect(html).toMatch(new RegExp(`aria-current="true">${t(`difficulty.${difficulty}`)}<`));
    expect(html).toContain(t('codex.sanctions.current').replace('{difficulty}', t(`difficulty.${difficulty}`)));
  });

  it('marks, per Difficulty, exactly the factors of the Sanctions balance', () => {
    const html = render('easy');
    const checks = html.match(/✓/g)?.length ?? 0;
    expect(checks).toBe(DIFFICULTIES.reduce((sum, difficulty) => sum + SANCTIONS[difficulty].factors.length, 0));
  });

  it('shows the floor of each Difficulty that sanctions, and none for Cozy', () => {
    const html = render('easy');
    expect(html).toContain(t('codex.sanctions.noSanction'));
    expect(html.match(/data-current="(?:true|false)">50%</g)).toHaveLength(3);
  });

  it('follows the balance: a changed floor and an added factor show up with no UI change', () => {
    const easy = SANCTIONS.easy as unknown as { factors: string[]; taxFloor: number };
    const before = { factors: [...easy.factors], taxFloor: easy.taxFloor };
    try {
      easy.taxFloor = 0.3;
      easy.factors.push('climate');
      const html = render('easy');
      expect(html).toContain('30%');
      expect(html.match(/✓/g)?.length).toBe(DIFFICULTIES.reduce((sum, difficulty) => sum + SANCTIONS[difficulty].factors.length, 0));
    } finally {
      easy.factors = before.factors;
      easy.taxFloor = before.taxFloor;
    }
  });

  it('says nothing is sanctioned under Cozy', () => {
    const html = render();
    expect(html).toContain(t('codex.sanctions.cozyCity'));
    expect(html).not.toContain(t('codex.sanctions.homes'));
  });

  it('lists the sanctioned Homes with their cause and the Tax lost from Easy', () => {
    const html = render('easy');
    expect(html).toContain(t('codex.sanctions.homes'));
    expect(html).toContain(t('needs.factor.electricity'));
    expect(html).toContain('0%');
  });

  it('says so when the Adaptation period suspends the Sanctions', () => {
    const html = render('easy', 10 * HOUR);
    expect(html).toContain(t('codex.sanctions.adapting').replace('{hours}', '10.0'));
    expect(html).not.toContain(t('codex.sanctions.homes'));
  });
});
