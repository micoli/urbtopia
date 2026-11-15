import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, type Building, type FixtureId } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { venueStore, type VenueStore } from '../../store/venueStore';
import { VenuePlacementHint } from './VenuePlacementHint';

const context = vi.hoisted(() => ({ buildings: [] as Building[] }));
vi.mock('zustand', () => ({ useStore: (store: { getState: () => VenueStore }, selector: (state: VenueStore) => unknown) => selector(store.getState()) }));
vi.mock('../common/hooks', () => ({ useGame: (selector: (store: { state: { buildings: Building[] } }) => unknown) => selector({ state: { buildings: context.buildings } }) }));

afterEach(() => {
  venueStore.getState().close();
  context.buildings = [];
  prefsStore.getState().setLanguage('en');
});

describe('placement constraints', () => {
  it.each(['en', 'fr'] as const)('shows the applicable wall constraint while placing and moving in %s', language => {
    prefsStore.getState().setLanguage(language);
    const cases: [FixtureId, 'back' | 'exterior' | 'wall'][] = [
      ['packhousePacker', 'back'], ['workshopExtractor', 'back'],
      ['packhouseExitCrate', 'exterior'], ['homePaintingLandscape', 'wall'],
    ];
    for (const [type, wall] of cases) {
      venueStore.getState().selectFixture(type);
      expect(renderToStaticMarkup(<VenuePlacementHint />)).toContain(t(`venue.placeWall.${wall}`));
      context.buildings = [{ ...createBuilding(1, 'packhouse', 55, 50, 0), interior: { nextFixtureId: 2, fixtures: [{ id: 1, type, x: 0, y: 0, rotation: 0 }] } }];
      venueStore.getState().open(1);
      venueStore.getState().startMove(1);
      expect(renderToStaticMarkup(<VenuePlacementHint />)).toContain(t(`venue.placeWall.${wall}`));
    }
  });

  it('shows no wall constraint for a free-standing machine', () => {
    venueStore.getState().selectFixture('factoryMotor');
    expect(renderToStaticMarkup(<VenuePlacementHint />)).not.toContain('venue-hint__constraint');
  });

  it('disappears when placement or movement is cancelled', () => {
    venueStore.getState().selectFixture('packhousePacker');
    venueStore.getState().selectFixture(null);
    expect(renderToStaticMarkup(<VenuePlacementHint />)).toBe('');
  });
});
