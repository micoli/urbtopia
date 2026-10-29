import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type Building, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { ShowPanel } from './ShowPanel';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: () => {} }) } }));

vi.mock('../common/DrawerPanel', () => ({
  DrawerPanel: Object.assign(({ children }: { children?: React.ReactNode }) => <div>{children}</div>, {
    LabelValue: ({ label, value }: { label: string; value: React.ReactNode }) => <p>{label}: {value}</p>,
  }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

const render = (hall: Building, urbs = 10_000, lastSeen = 0) => {
  context.state = { ...newGame({ seed: 'show-panel', now: 0 }), urbs, lastSeen, buildings: [hall, createBuilding(901, 'home', 56, 60, 0)] };
  return renderToStaticMarkup(<ShowPanel building={hall} />);
};

describe('ShowPanel', () => {
  it.each(['en', 'fr'] as const)('offers to schedule a Show with its crowd and cost in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = render(createBuilding(900, 'concertHall', 60, 60, 0));
    expect(html).toContain(t('show.crowd'));
    expect(html).toContain(t('show.schedule'));
  });

  it('offers three Artists with their Fame for the Concert hall only', () => {
    const hall = render(createBuilding(900, 'concertHall', 60, 60, 0));
    expect(hall).toContain(t('show.artist'));
    expect(hall.match(/role="radio"/g)).toHaveLength(3);
    expect(render(createBuilding(900, 'theater', 60, 60, 0))).not.toContain(t('show.artist'));
  });

  it('disables scheduling when the Urbs are short', () => {
    expect(render(createBuilding(900, 'concertHall', 60, 60, 0), 0)).toMatch(/disabled/);
  });

  it('shows the cooldown instead of the form after a Show', () => {
    const html = render({ ...createBuilding(900, 'concertHall', 60, 60, 0), attraction: { takings: 0, cooldownUntil: 5 * 3_600_000 } });
    expect(html).toContain(t('show.cooldown').replace('{hours}', '5'));
    expect(html).not.toContain(t('show.schedule'));
  });

  it('shows the crowd of a Show already scheduled', () => {
    const gathering = { kind: 'show' as const, startsAt: 1, endsAt: 2, cost: 1, quality: 0.5, crowd: 321.4, tourists: 1, citizens: 1, revenue: 1 };
    expect(render({ ...createBuilding(900, 'concertHall', 60, 60, 0), attraction: { takings: 0, gathering } })).toContain(t('show.scheduled').replace('{crowd}', '321'));
  });
});
