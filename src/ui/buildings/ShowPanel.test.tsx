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

vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ state: context.state, send: () => {} }) } }));

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
  it.each(['en', 'fr'] as const)('offers to schedule a Show, leaving the form to the dialog, in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = render(createBuilding(900, 'concertHall', 60, 60, 0));
    expect(html).toContain(t('show.schedule'));
    expect(html).not.toContain(t('show.crowd'));
    expect(html).not.toContain(t('show.artist'));
    expect(html).not.toContain('disabled=""');
  });

  it('disables the button and states the time left during the cooldown', () => {
    const html = render({ ...createBuilding(900, 'concertHall', 60, 60, 0), attraction: { takings: 0, cooldownUntil: 5 * 3_600_000 } });
    expect(html).toContain(t('show.cooldown').replace('{time}', '5 h'));
    expect(html).toContain('disabled=""');
  });

  const scheduled = { kind: 'show' as const, startsAt: 5 * 3_600_000, endsAt: 8 * 3_600_000, cost: 40, quality: 0.5, crowd: 321.4, tourists: 1, citizens: 1, revenue: 1 };

  it('follows a Show already scheduled, which can still be cancelled', () => {
    const html = render({ ...createBuilding(900, 'concertHall', 60, 60, 0), attraction: { takings: 0, gathering: scheduled } });
    expect(html).toContain('321');
    expect(html).toContain(t('gathering.phase.planned'));
    expect(html).toContain(t('show.cancel').replace('{amount}', '20'));
  });

  it('no longer offers to cancel a Show under way', () => {
    const html = render({ ...createBuilding(900, 'concertHall', 60, 60, 0), attraction: { takings: 0, gathering: scheduled } }, 10_000, 6 * 3_600_000);
    expect(html).toContain(t('gathering.until.live').replace('{time}', '2 h'));
    expect(html).not.toContain(t('show.cancel').replace('{amount}', '20'));
  });

  it('shows the result of the last Show during the cooldown', () => {
    const html = render({ ...createBuilding(900, 'theater', 60, 60, 0), attraction: { takings: 0, cooldownUntil: 3_600_000, lastGathering: { kind: 'show', at: 0, crowd: 77, revenue: 500, cost: 60 } } });
    expect(html).toContain(t('gathering.lastCrowd').replace('{crowd}', '77'));
    expect(html).toContain('gain');
  });
});
