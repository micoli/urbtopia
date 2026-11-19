import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '../../i18n/t';
import { DistrictHud } from './DistrictHud';
import type { DistrictView } from './useDistrictGame';

const view = (overrides: Partial<DistrictView> = {}): DistrictView => ({
  office: { gameNumber: 1 },
  game: { number: 1, deckSize: 24, placements: [] },
  over: false,
  board: [],
  current: undefined,
  upcoming: [],
  score: 12,
  rank: undefined,
  hexesLeft: 20,
  candidates: [],
  picked: null,
  gain: null,
  bestScore: undefined,
  bestRank: undefined,
  ...overrides,
});

describe('the District plan HUD', () => {
  it('shows the score, the Hexes left and the scores that earn each Rank on this Deck', () => {
    const html = renderToStaticMarkup(<DistrictHud view={view()} />);
    expect(html).toContain('<strong>12</strong>');
    expect(html).toContain('<strong>20</strong>');
    expect(html).toContain(`${t('district.rank.bronze')} 60 · ${t('district.rank.silver')} 84 · ${t('district.rank.gold')} 108`);
  });

  it('scales the scores of the Ranks with the Deck', () => {
    expect(renderToStaticMarkup(<DistrictHud view={view({ game: { number: 1, deckSize: 40, placements: [] } })} />)).toContain(`${t('district.rank.gold')} 180`);
  });

  it('shows what the picked cell would give, and marks a loss', () => {
    expect(renderToStaticMarkup(<DistrictHud view={view({ gain: 3 })} />)).toContain('>+3<');
    const loss = renderToStaticMarkup(<DistrictHud view={view({ gain: -2 })} />);
    expect(loss).toContain('district-hud__gain--loss');
    expect(loss).toContain('>-2<');
  });

  it('shows nothing for a gain when no cell is picked', () => {
    expect(renderToStaticMarkup(<DistrictHud view={view({ gain: null })} />)).not.toContain('district-hud__gain');
  });

  it('shows a dash for the best score before any game ends, then the score and its Rank', () => {
    expect(renderToStaticMarkup(<DistrictHud view={view()} />)).toContain('<strong>—</strong>');
    expect(renderToStaticMarkup(<DistrictHud view={view({ bestScore: 80, bestRank: 'silver' })} />)).toContain(`80 · ${t('district.rank.silver')}`);
  });

  it('shows no thresholds without a game', () => {
    expect(renderToStaticMarkup(<DistrictHud view={view({ game: undefined, hexesLeft: 0 })} />)).not.toContain('district-hud__thresholds');
  });
});
