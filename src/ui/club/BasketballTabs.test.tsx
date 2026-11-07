import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BASKETBALL_RULES, createBuilding, createClub, playBasketball, startBasketball, startChampionship, type Building, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { BasketballCourt } from './BasketballCourt';
import { BasketballFeed } from './BasketballFeed';
import { BasketballLineupTab } from './BasketballLineupTab';
import { BasketballMatchTab } from './BasketballMatchTab';
import { basketballJerseys } from './jerseyNumbers';

const context = vi.hoisted(() => ({ lastSeen: 0 }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: Pick<GameState, 'lastSeen'> }) => unknown) => selector({ state: { lastSeen: context.lastSeen } }),
}));
vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: () => {} }) } }));

afterEach(() => {
  prefsStore.getState().setLanguage('en');
  context.lastSeen = 0;
});

const arena = (): Building => ({ ...createBuilding(1, 'basketballArena', 60, 60, 0), club: startChampionship(createClub(BASKETBALL_RULES, 'Harbour Hoops', 'seed'), 0) });

describe('Basketball lineup tab', () => {
  it.each(['en', 'fr'] as const)('shows the formation, the tactic, the starters and the bench in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = renderToStaticMarkup(<BasketballLineupTab building={arena()} />);
    for (const key of ['club.formation', 'club.tactic', 'club.starters', 'club.bench', 'club.bestFive'] as const) expect(html).toContain(t(key));
    expect(html.match(/<li class="club-row(?! club-row--header)/g)).toHaveLength(13);
  });
});

describe('Basketball match tab', () => {
  it('waits for the Match to start', () => {
    const html = renderToStaticMarkup(<BasketballMatchTab building={arena()} />);
    expect(html).toContain(arena().club!.championship!.opponents[0]!.name);
    expect(html).not.toContain(t('club.match.play'));
  });

  it('offers the court and the controls once the Match has started', () => {
    context.lastSeen = arena().club!.championship!.fixtures[0]!.at + 1;
    const html = renderToStaticMarkup(<BasketballMatchTab building={arena()} />);
    expect(html).toContain(t('club.match.play'));
    expect(html).toContain(t('club.court'));
    expect(html).toContain(t('club.tactic'));
    expect(html).toContain(t('club.match.subsLeft').replace('{count}', '10'));
    expect(html).toContain(t('club.match.speed'));
  });
});

describe('Basketball feed', () => {
  it('writes each event of a Match in words, points included', () => {
    const club = arena().club!;
    const state = playBasketball(club, club.championship!.opponents[0]!, 3, [], 12);
    const html = renderToStaticMarkup(<BasketballFeed events={state.events} />);
    expect(state.events.length).toBeGreaterThan(0);
    expect(html.match(/<li/g)).toHaveLength(state.events.length);
    expect(html).not.toContain('{player}');
    expect(html).not.toContain('{points}');
  });
});

describe('Basketball court', () => {
  it('draws the ten players of the Match', () => {
    const club = arena().club!;
    const opponent = club.championship!.opponents[0]!;
    const state = playBasketball(club, opponent, 3, [], 5);
    const html = renderToStaticMarkup(<BasketballCourt state={state} seed={3} minuteMs={1000} jerseys={basketballJerseys(startBasketball(club, opponent, 3))} />);
    expect(html.match(/club-court__player club-court__player--/g)).toHaveLength(10);
  });
});
