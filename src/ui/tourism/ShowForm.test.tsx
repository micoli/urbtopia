import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type Building, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { ShowForm } from './ShowForm';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ state: context.state, send: () => {} }) } }));

afterEach(() => prefsStore.getState().setLanguage('en'));

const render = (hall: Building, urbs = 10_000) => {
  context.state = { ...newGame({ seed: 'show-form', now: 0 }), urbs, lastSeen: 0, buildings: [hall, createBuilding(901, 'home', 56, 60, 0)] };
  return renderToStaticMarkup(<ShowForm building={hall} />);
};

describe('ShowForm', () => {
  it.each(['en', 'fr'] as const)('states the crowd, the Ticket and the cost of the Show in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = render(createBuilding(900, 'concertHall', 60, 60, 0));
    expect(html).toContain(t('show.crowd'));
    expect(html).toContain(t('attraction.ticket'));
    expect(html).toContain(t('show.schedule'));
  });

  it('offers three Artists for the Concert hall only', () => {
    const hall = render(createBuilding(900, 'concertHall', 60, 60, 0));
    expect(hall.match(/class="artist-choice"[\s\S]*?class="tourism-help"/)![0].match(/role="radio"/g)).toHaveLength(3);
    expect(render(createBuilding(900, 'theater', 60, 60, 0))).not.toContain(t('show.artist'));
  });

  it('disables the confirmation and states the Urbs missing when they are short', () => {
    const html = render(createBuilding(900, 'theater', 60, 60, 0), 0);
    expect(html).toContain('disabled=""');
    expect(html).toContain(t('show.missing').split('{amount}')[0]!);
  });

  it('warns that the Ticket of the Colosseum also applies to its visits', () => {
    expect(render(createBuilding(900, 'colosseum', 60, 60, 0))).toContain(t('show.ticketVisits'));
    expect(render(createBuilding(900, 'theater', 60, 60, 0))).not.toContain(t('show.ticketVisits'));
  });
});
