import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBuilding } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { venueStore } from '../../store/venueStore';
import { VenueMenus } from './VenueMenus';
import { venueActionsOf } from './venueActions';

const arcade = createBuilding(1, 'arcade', 55, 50, 0);

vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: { urbs: number; buildings: unknown[] } }) => unknown) => selector({ state: { urbs: 1234, buildings: [] } }),
  useUi: () => undefined,
}));

vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: () => {}, state: { urbs: 0, buildings: [] } }) } }));
vi.mock('../stats/CityStats', () => ({ CityStats: () => null }));
vi.mock('../stats/MinimalStats', () => ({ MinimalStats: () => null }));

beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) });
});

afterEach(() => {
  vi.unstubAllGlobals();
  prefsStore.getState().setLanguage('en');
  prefsStore.getState().setLayout('C');
  venueStore.getState().close();
});

describe('Venue main menu', () => {
  it('has the buttons of an interior, with the return to the city kept apart', () => {
    const actions = venueActionsOf(null, () => {}, () => {});
    expect(actions.map(action => action.id)).toEqual(['build', 'staff', 'events', 'takings', 'back']);
    expect(actions.every(action => !action.pressed && !action.disabled)).toBe(true);
  });

  it('presses the button of the open panel only, and asks for the panel it stands for', () => {
    const toggled: string[] = [];
    const actions = venueActionsOf('staff', panel => toggled.push(panel), () => {});
    expect(actions.filter(action => action.pressed).map(action => action.id)).toEqual(['staff']);
    actions.find(action => action.id === 'events')!.onClick();
    expect(toggled).toEqual(['events']);
  });

  it('goes back to the city with its last button', () => {
    let back = 0;
    venueActionsOf(null, () => {}, () => back++).find(action => action.id === 'back')!.onClick();
    expect(back).toBe(1);
  });

  it('opens and closes a panel, closing the item being placed with it', () => {
    const store = venueStore.getState();
    store.open(1);
    expect(venueStore.getState().panel).toBeNull();
    store.togglePanel('build');
    store.selectFixture('barrelClimber');
    expect(venueStore.getState()).toMatchObject({ panel: 'build', selectedFixture: 'barrelClimber' });
    store.togglePanel('staff');
    expect(venueStore.getState()).toMatchObject({ panel: 'staff', selectedFixture: null });
    store.togglePanel('staff');
    expect(venueStore.getState().panel).toBeNull();
    store.togglePanel('build');
    store.selectFixture('barrelClimber');
    store.closePanel();
    expect(venueStore.getState()).toMatchObject({ panel: null, selectedFixture: null });
  });
});

describe('Choosing an item', () => {
  it('closes the menu and starts the add mode, and leaves the menu open when the choice is undone', () => {
    const store = venueStore.getState();
    store.open(1);
    store.togglePanel('build');
    store.chooseFixture('spaceShooter');
    expect(venueStore.getState()).toMatchObject({ panel: null, selectedFixture: 'spaceShooter', placedId: null, movingId: null });
    store.togglePanel('build');
    expect(venueStore.getState()).toMatchObject({ panel: 'build', selectedFixture: 'spaceShooter' });
    store.selectFixture(null);
    expect(venueStore.getState()).toMatchObject({ panel: 'build', selectedFixture: null });
  });
});

describe('Venue menus by layout', () => {
  const html = (layout: 'A' | 'B' | 'C' = 'C') => renderToStaticMarkup(<VenueMenus venue={arcade} layout={layout} />).replaceAll('&#x27;', "'");

  it('shows a dock in the side bar layout, without any panel until a button is pressed', () => {
    const markup = html('C');
    expect(markup).toContain('class="dock"');
    for (const id of ['build', 'staff', 'events', 'takings', 'back']) expect(markup).toContain(`data-action="${id}"`);
    expect(markup).toContain('dock__bottom');
    expect(markup).not.toContain('class="flyout"');
    expect(markup).not.toContain('class="sheet"');
    expect(markup).not.toContain('side-panel');
  });

  it('shows a top bar and a bottom bar in the bars layout', () => {
    const markup = html('A');
    expect(markup).toContain('class="top-bar"');
    expect(markup).toContain('class="bottom-bar"');
    expect(markup).not.toContain('class="dock"');
    expect(markup).not.toContain('class="sheet"');
  });

  it('shows the minimal figures and the round button in the minimal layout', () => {
    const markup = html('B');
    expect(markup).toContain('minimal-stats');
    expect(markup).toContain('radial-fab');
    expect(markup).not.toContain('class="dock"');
  });

  it('labels the buttons in both languages', () => {
    prefsStore.getState().setLanguage('fr');
    expect(html()).toContain(t('venue.staff'));
    expect(html()).toContain('Ville');
  });
});
