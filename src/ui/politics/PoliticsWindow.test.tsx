import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameState } from '../../core';
import { politicalCity } from '../../core/politics/testSupport';
import { prefsStore } from '../../i18n/prefsStore';
import { PoliticsWindow } from './PoliticsWindow';
import { TownHallPanel } from './TownHallPanel';

const context = vi.hoisted(() => ({ state: null as GameState | null, politicsOpen: true }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
  useUi: (selector: (store: { politicsOpen: boolean; closePolitics: () => void; openPolitics: () => void; openCodex: () => void }) => unknown) => selector({ politicsOpen: context.politicsOpen, closePolitics: () => {}, openPolitics: () => {}, openCodex: () => {} }),
}));
vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: vi.fn() }) } }));

afterEach(() => {
  context.politicsOpen = true;
  prefsStore.getState().setLanguage('en');
});

const townHall = (state: GameState) => state.buildings.find(building => building.type === 'townHall')!;

describe('Politics window', () => {
  it.each(['en', 'fr'] as const)('renders every section in %s', language => {
    prefsStore.getState().setLanguage(language);
    context.state = politicalCity('medium');
    const html = renderToStaticMarkup(<PoliticsWindow />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    for (const id of ['politics-summary', 'politics-council', 'politics-objectives', 'politics-ordinances', 'politics-petitions']) expect(html).toContain(`id="${id}"`);
    expect(html).toContain(language === 'fr' ? 'Ordonnances' : 'Ordinances');
    expect(html).toContain(language === 'fr' ? 'Résumé' : 'Summary');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('undefined');
  });

  it('opens on the summary of the current state', () => {
    context.state = politicalCity('medium');
    const html = renderToStaticMarkup(<PoliticsWindow />);
    expect(html.indexOf('id="politics-summary"')).toBeLessThan(html.indexOf('id="politics-council"'));
    expect(html).toContain('Approval');
    expect(html).toContain('before the Election');
  });

  it('draws the Council as a circle, with no left and no right', () => {
    context.state = politicalCity('medium');
    const html = renderToStaticMarkup(<PoliticsWindow />);
    expect(html).toContain('class="council-circle"');
    expect(html.toLowerCase()).not.toMatch(/hemicycle|left wing|right wing|\bgauche\b|\bdroite\b/);
  });

  it('offers to propose an Ordinance the city is ready for, with a forecast', () => {
    context.state = politicalCity('easy');
    const html = renderToStaticMarkup(<PoliticsWindow />);
    expect(html).toContain('Propose');
    expect(html).toContain('Forecast:');
  });

  it('offers to repeal an adopted Ordinance', () => {
    const city = politicalCity('easy');
    context.state = { ...city, politics: { ...city.politics!, adopted: ['transitSubsidy'] } };
    expect(renderToStaticMarkup(<PoliticsWindow />)).toContain('Repeal');
  });

  it('offers to claim the Grants due', () => {
    const city = politicalCity('easy');
    context.state = { ...city, politics: { ...city.politics!, grantsDue: 450 } };
    expect(renderToStaticMarkup(<PoliticsWindow />)).toContain('Claim 450 Urbs');
  });

  it('lists the open Petitions, and says when there are none', () => {
    const city = politicalCity('medium');
    context.state = city;
    expect(renderToStaticMarkup(<PoliticsWindow />)).toContain('No open Petition.');
    context.state = { ...city, politics: { ...city.politics!, petitions: [{ id: 1, cause: 'policeStation', parcel: { x: 3, y: 3 }, since: 0, escalated: true }], nextPetitionId: 2 } };
    const html = renderToStaticMarkup(<PoliticsWindow />);
    expect(html).toContain('Missing: Police station');
    expect(html).toContain('District 3, 3');
    expect(html).toContain('Demonstration');
  });

  it('says why there is no politics under Cozy', () => {
    context.state = { ...politicalCity('easy'), difficulty: 'cozy' };
    const html = renderToStaticMarkup(<PoliticsWindow />);
    expect(html).toContain('Politics starts from the Easy Difficulty');
    expect(html).not.toContain('id="politics-summary"');
  });

  it('renders nothing while closed', () => {
    context.politicsOpen = false;
    context.state = politicalCity('easy');
    expect(renderToStaticMarkup(<PoliticsWindow />)).toBe('');
  });
});

describe('Town hall panel', () => {
  it('shows the Approval and the Term, and opens the Politics window', () => {
    context.state = politicalCity('medium');
    const html = renderToStaticMarkup(<TownHallPanel building={townHall(context.state)} />);
    expect(html).toContain('Approval');
    expect(html).toContain('before the Election');
    expect(html).toContain('>Politics</button>');
  });

  it('shows no Term where the Difficulty has no Election', () => {
    context.state = politicalCity('easy');
    expect(renderToStaticMarkup(<TownHallPanel building={townHall(context.state)} />)).not.toContain('before the Election');
  });

  it('explains that politics has not started under Cozy', () => {
    context.state = { ...politicalCity('easy'), difficulty: 'cozy' };
    const html = renderToStaticMarkup(<TownHallPanel building={townHall(context.state)} />);
    expect(html).toContain('Politics starts from the Easy Difficulty');
    expect(html).not.toContain('<button');
  });
});
