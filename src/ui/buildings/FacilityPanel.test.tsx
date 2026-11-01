import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type Building, type FacilityType, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { FacilityPanel } from './FacilityPanel';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

vi.mock('../common/ReachToggle.tsx', () => ({ ReachToggle: () => null }));

vi.mock('../common/DrawerPanel', () => ({
  DrawerPanel: Object.assign(({ children }: { children?: React.ReactNode }) => <div>{children}</div>, {
    LabelValue: ({ label, value }: { label: string; value: React.ReactNode }) => <p>{label}: {value}</p>,
  }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

const render = (type: FacilityType, extra: Building[] = []) => {
  const building = createBuilding(900, type, 56, 59, 0);
  context.state = { ...newGame({ seed: 'facility-panel', now: 0 }), adaptationUntil: 0, buildings: [building, ...extra] };
  return renderToStaticMarkup(<FacilityPanel building={building as Building & { type: FacilityType }} />);
};

describe('FacilityPanel Knowledge', () => {
  it.each(['en', 'fr'] as const)('shows the Knowledge of the city on an Education facility in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = render('library', [createBuilding(901, 'home', 60, 59, 0)]);
    expect(html).toContain(`${t('facility.knowledge')}: 6`);
    expect(html).not.toContain('NaN');
  });

  it('shows nothing about Knowledge on a facility of another category', () => {
    expect(render('hospital', [createBuilding(901, 'home', 60, 59, 0)])).not.toContain(t('facility.knowledge'));
  });

  it('shows nothing about Knowledge in a city without Citizens', () => {
    expect(render('library')).not.toContain(t('facility.knowledge'));
  });
});
