import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type Difficulty, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { HomePanel } from './HomePanel';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: () => {} }) } }));

vi.mock('../common/DrawerPanel', () => ({
  DrawerPanel: Object.assign(({ children }: { children?: React.ReactNode }) => <div>{children}</div>, {
    LabelValue: ({ label, value }: { label: string; value: React.ReactNode }) => <p>{label}: {value}</p>,
    Upgrade: () => <p>upgrade</p>,
  }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

const render = (difficulty: Difficulty) => {
  const building = createBuilding(900, 'home', 56, 59, 0);
  context.state = { ...newGame({ seed: 'home-panel', now: 0 }), difficulty, adaptationUntil: 0, buildings: [building] };
  return renderToStaticMarkup(<HomePanel building={building} />);
};

describe('HomePanel Sanction', () => {
  it.each(['en', 'fr'] as const)('names the cause and the Tax lost of a sanctioned Home in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = render('easy');
    expect(html).toContain(t('home.sanction'));
    expect(html).toContain(t('needs.factor.electricity'));
    expect(html).toContain('−50%');
    expect(html).not.toContain('NaN');
  });

  it('shows nothing about a Sanction under Cozy', () => {
    expect(render('cozy')).not.toContain(t('home.sanction'));
  });
});

describe('HomePanel actions order', () => {
  it('puts Collect before Upgrade, like the other production panels', () => {
    const building = { ...createBuilding(900, 'home', 56, 59, 0), taxCitizenMs: 10 * 3_600_000 };
    context.state = { ...newGame({ seed: 'home-panel', now: 0 }), adaptationUntil: 0, buildings: [building] };
    const html = renderToStaticMarkup(<HomePanel building={building} />);
    expect(html.indexOf(t('panel.collect'))).toBeGreaterThan(-1);
    expect(html.indexOf(t('panel.collect'))).toBeLessThan(html.indexOf('upgrade'));
  });
});

describe('HomePanel Waste cause', () => {
  it.each(['en', 'fr'] as const)('names why a Home of Tier 7 has no Waste coverage in %s', language => {
    prefsStore.getState().setLanguage(language);
    const building = { ...createBuilding(900, 'home', 56, 59, 0), tier: 7 };
    context.state = { ...newGame({ seed: 'home-panel', now: 0 }), adaptationUntil: 0, buildings: [building, ...[1, 2, 3].map(index => ({ ...createBuilding(900 + index, 'home', 56 + 4 * index, 59, 0), tier: 7 }))] };
    const html = renderToStaticMarkup(<HomePanel building={building} />).replaceAll('&#x27;', "'");
    expect(html).toContain(t('service.waste'));
    expect(html).toContain(t('home.reason.outOfReach'));
  });
});
