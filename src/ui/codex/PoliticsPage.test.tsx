import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DIFFICULTIES, FACTION_IDS, OBJECTIVE_ENTRIES, ORDINANCE_ENTRIES, POLITICS, type Difficulty, type GameState } from '../../core';
import { politicalCity } from '../../core/politics/testSupport';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { PoliticsPage } from './PoliticsPage';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

const render = (difficulty: Difficulty = 'medium') => {
  context.state = politicalCity(difficulty === 'cozy' ? 'easy' : difficulty);
  if (difficulty === 'cozy') context.state = { ...context.state, difficulty: 'cozy' };
  return renderToStaticMarkup(<PoliticsPage />).replaceAll('&#x27;', "'");
};

describe('PoliticsPage', () => {
  it.each(['en', 'fr'] as const)('details every rule of the politics in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = render();
    for (const heading of ['codex.politics.byDifficulty', 'codex.politics.approval', 'codex.politics.council', 'codex.politics.ordinances', 'codex.politics.objectives', 'codex.politics.petitions', 'codex.politics.term', 'codex.politics.city'] as const) expect(html).toContain(t(heading));
    expect(html).not.toContain('{');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('undefined');
  });

  it('lists every Difficulty and highlights the one of the city', () => {
    for (const difficulty of DIFFICULTIES) {
      const html = render(difficulty);
      for (const other of DIFFICULTIES) expect(html).toContain(t(`difficulty.${other}`));
      expect(html.match(/aria-current="true"/g)).toHaveLength(1);
      expect(html).toMatch(new RegExp(`aria-current="true">${t(`difficulty.${difficulty}`)}<`));
    }
  });

  it('marks, per Difficulty, exactly what the balance enables', () => {
    const html = render();
    const enabled = DIFFICULTIES.reduce((sum, difficulty) => sum + Object.values(POLITICS.difficulties[difficulty]).filter(Boolean).length, 0);
    expect(html.match(/✓/g)?.length ?? 0).toBe(enabled);
  });

  it('lists every Ordinance with its Faction stances and its effect', () => {
    const html = render();
    for (const entry of ORDINANCE_ENTRIES) expect(html).toContain(t(`ordinance.${entry.id}.name`));
    for (const faction of FACTION_IDS) expect(html).toContain(t(`faction.${faction}`));
    expect(html).toContain('Tax ×0.9');
    expect(html).toContain('Waste −25 %');
    expect(html).toContain('Congestion −20 %');
  });

  it('lists every Objective with its target and Grant', () => {
    const html = render();
    for (const entry of OBJECTIVE_ENTRIES) expect(html).toContain(t(`objective.${entry.id}.name`));
    expect(html).toContain('at most 20 %');
    expect(html).toContain('at least 100 %');
  });

  it('shows the numbers of the balance', () => {
    const html = render();
    expect(html).toContain(`lasts ${POLITICS.term.days} days of game time`);
    expect(html).toContain(`up to ${POLITICS.petitions.maxOpen} open`);
    expect(html).toContain(`after ${POLITICS.council.reproposeDelayDays} days`);
  });

  it('follows the balance: a changed number shows up with no UI change', () => {
    const term = POLITICS.term as { days: number };
    const before = term.days;
    try {
      term.days = 17;
      expect(render()).toContain('lasts 17 days of game time');
    } finally {
      term.days = before;
    }
  });

  it('says what is missing for the politics to start', () => {
    expect(render('cozy')).toContain(t('codex.politics.city.cozy'));
    context.state = { ...politicalCity('easy'), buildings: politicalCity('easy').buildings.filter(building => building.type !== 'townHall') };
    expect(renderToStaticMarkup(<PoliticsPage />)).toContain(t('codex.politics.city.noTownHall'));
  });

  it('shows the state of the city when the politics runs', () => {
    expect(render('medium')).toContain('Approval');
    expect(render('medium')).toContain('before the Election');
  });
});
