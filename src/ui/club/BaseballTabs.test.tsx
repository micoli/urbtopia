import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BASEBALL_RULES, createBuilding, createClub, playBaseball, startChampionship, type Building, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { BaseballFeed } from './BaseballFeed';
import { BaseballField } from './BaseballField';
import { BaseballLineupTab } from './BaseballLineupTab';
import { BaseballMatchTab } from './BaseballMatchTab';

const context = vi.hoisted(() => ({ lastSeen: 0 }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: Pick<GameState, 'lastSeen'> }) => unknown) => selector({ state: { lastSeen: context.lastSeen } }),
}));
vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: () => {} }) } }));

afterEach(() => {
  prefsStore.getState().setLanguage('en');
  context.lastSeen = 0;
});

const field = (): Building => ({ ...createBuilding(1, 'baseballField', 60, 60, 0), club: startChampionship(createClub(BASEBALL_RULES, 'Harbour Herons', 'seed'), 0) });

describe('Baseball lineup tab', () => {
  it.each(['en', 'fr'] as const)('shows the approach, the starting pitcher, the batting order and the bench in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = renderToStaticMarkup(<BaseballLineupTab building={field()} />);
    for (const key of ['club.approach', 'club.pitcher', 'club.battingOrder', 'club.bench', 'club.bestLineup'] as const) expect(html).toContain(t(key));
    expect(html.match(/<li class="club-row/g)).toHaveLength(20);
  });
});

describe('Baseball match tab', () => {
  it('waits for the Match to start', () => {
    expect(renderToStaticMarkup(<BaseballMatchTab building={field()} />)).toContain(field().club!.championship!.opponents[0]!.name);
    expect(renderToStaticMarkup(<BaseballMatchTab building={field()} />)).not.toContain(t('club.match.play'));
  });

  it('offers the controls once the Match has started', () => {
    context.lastSeen = field().club!.championship!.fixtures[0]!.at + 1;
    const html = renderToStaticMarkup(<BaseballMatchTab building={field()} />);
    expect(html).toContain(t('club.match.play'));
    expect(html).toContain(t('club.approach'));
    expect(html).toContain(t('club.match.changesLeft').replace('{count}', '3'));
    expect(html).toContain(t('club.match.speed'));
    expect(html).toContain('×1');
  });
});

describe('Baseball feed', () => {
  it('writes each event of a Match in words, runs included', () => {
    const club = field().club!;
    const state = playBaseball(club, club.championship!.opponents[0]!, 3, [], 2);
    const html = renderToStaticMarkup(<BaseballFeed events={state.events} />);
    expect(html.match(/<li/g)).toHaveLength(state.events.length);
    expect(html).not.toContain('{player}');
  });
});

describe('Baseball field', () => {
  it('draws the diamond with nine fielders and the ball on the mound before the first play', () => {
    const club = field().club!;
    const state = playBaseball(club, club.championship!.opponents[0]!, 3, [], 0);
    const html = renderToStaticMarkup(<BaseballField state={state} seed={3} shown={0} />);
    expect(html).toContain(t('club.field'));
    expect(html).toContain(t('club.field.empty'));
    expect(html.match(/club-field__player /g)).toHaveLength(9);
    expect(html.match(/club-field__base/g)!.length).toBeGreaterThanOrEqual(4);
    expect(html).toContain('club-field__ball');
  });
});
