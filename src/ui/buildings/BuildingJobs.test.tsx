import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, jobsOf, newGame, type Building, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { BuildingJobs } from './BuildingJobs';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

vi.mock('../common/DrawerPanel', () => ({
  DrawerPanel: Object.assign(({ children }: { children?: React.ReactNode }) => <div>{children}</div>, {
    LabelValue: ({ label, value }: { label: string; value: React.ReactNode }) => <p>{label}: {value}</p>,
  }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

const base = newGame({ seed: 'building-jobs', now: 0 });

const render = (building: Building, buildings: Building[] = [building]) => {
  context.state = { ...base, buildings };
  return renderToStaticMarkup(<BuildingJobs building={building} />);
};

describe('BuildingJobs', () => {
  it.each(['en', 'fr'] as const)('shows the filled Jobs out of the offered Jobs of a workplace in %s', language => {
    prefsStore.getState().setLanguage(language);
    const factory = createBuilding(900, 'factory', 56, 56, 2);
    const home = { ...createBuilding(901, 'home', 56, 59, 0), tier: 1 };
    const html = render(factory, [factory, home]);
    expect(html).toContain(t('panel.jobs'));
    expect(html).toContain(`/ ${jobsOf(factory)}`);
  });

  it('counts none filled without a Home to commute from', () => {
    const office = createBuilding(900, 'office', 57, 56, 2);
    expect(render(office)).toContain(`0 / ${jobsOf(office)}`);
  });

  it('shows nothing for a building that offers no Job', () => {
    const home = createBuilding(900, 'home', 56, 59, 0);
    expect(render(home)).toBe('');
  });
});
