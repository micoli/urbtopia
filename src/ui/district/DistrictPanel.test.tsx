import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type Building, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { DistrictPanel } from './DistrictPanel';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
  useUi: (selector: (store: { select: () => void }) => unknown) => selector({ select: () => {} }),
}));
vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: () => {} }) } }));
vi.mock('../../store/uiStore', () => ({ uiStore: { getState: () => ({ select: () => {} }) } }));

afterEach(() => prefsStore.getState().setLanguage('en'));

const render = (tier: number, score?: number): string => {
  const office: Building = {
    ...createBuilding(1, 'planningOffice', 50, 50, 0),
    tier,
    ...(score === undefined ? {} : { district: { gameNumber: 1, best: { score, game: { number: 1, deckSize: 24, placements: [] } } } }),
  };
  context.state = { ...newGame({ seed: 'district-panel', now: 0 }), buildings: [office], urbs: 10_000, adaptationUntil: 0, tutorial: null };
  return renderToStaticMarkup(<DistrictPanel building={office} />);
};

describe('the Planning office panel', () => {
  it('shows an unplayed office with no Rank and no bonus', () => {
    const html = render(1);
    expect(html).toContain(t('district.noRank'));
    expect(html).toContain('+0 / 3');
  });

  it('shows the Rank of the best score and the bonus it gives out of the cap of the Tier', () => {
    const html = render(3, 84);
    expect(html).toContain(t('district.rank.silver'));
    expect(html).toContain('+4.2 / 6');
  });

  it('shows the reach of the Tier as a square', () => {
    expect(render(2)).toContain('10 × 10');
  });

  it('offers to open the game', () => {
    expect(render(1)).toContain(t('district.open'));
  });
});
