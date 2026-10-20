import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type Building, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { OfficePanel } from './OfficePanel';

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

const render = (office: Building) => {
  context.state = { ...newGame({ seed: 'office-panel', now: 0 }), buildings: [office] };
  return renderToStaticMarkup(<OfficePanel building={office} />);
};

describe('OfficePanel', () => {
  it.each(['en', 'fr'] as const)('shows the income and the Urbs earned in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = render({ ...createBuilding(900, 'office', 57, 56, 2), taxCitizenMs: 3 * 3_600_000 });
    expect(html).toContain(t('office.income'));
    expect(html).toContain(`${t('office.due')}: 3`);
    expect(html).toContain(`${t('panel.collect')} (+3)`);
  });

  it('offers no collection while nothing was earned', () => {
    expect(render(createBuilding(900, 'office', 57, 56, 2))).not.toContain(t('panel.collect'));
  });
});
