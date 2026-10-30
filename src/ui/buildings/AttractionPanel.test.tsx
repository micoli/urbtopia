import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type Building, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { AttractionPanel } from './AttractionPanel';

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

const render = (museum: Building) => {
  context.state = { ...newGame({ seed: 'attraction-panel', now: 0 }), buildings: [museum] };
  return renderToStaticMarkup(<AttractionPanel building={museum} />);
};

describe('AttractionPanel', () => {
  it.each(['en', 'fr'] as const)('shows the Tourists, the Ticket choice and the Takings in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = render({ ...createBuilding(900, 'masMuseum', 57, 56, 0), attraction: { takings: 42.7 } });
    expect(html).toContain(t('attraction.tourists'));
    expect(html).toContain(t('attraction.ticket'));
    expect(html).toContain(t('attraction.ticketPrice'));
    expect(html).toContain(t('attraction.takings'));
    expect(html).toMatch(/radiogroup/);
  });

  it('marks the current Ticket among the three and states its price', () => {
    const html = render({ ...createBuilding(900, 'masMuseum', 57, 56, 0), attraction: { takings: 0, ticket: 2 } });
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-checked="true"[^>]*>(?:(?!<button).)*14/);
    expect(html).toContain('choice-chips');
  });

  it('disables the collection while nothing was earned', () => {
    expect(render(createBuilding(900, 'masMuseum', 57, 56, 0))).toMatch(/disabled/);
  });
});
