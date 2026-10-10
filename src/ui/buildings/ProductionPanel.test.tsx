import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type GameState } from '../../core';
import { t } from '../../i18n/t';
import { ProductionPanel } from './ProductionPanel';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: () => {} }) } }));

vi.mock('../common/DrawerPanel', () => ({
  DrawerPanel: Object.assign(({ children }: { children?: React.ReactNode }) => <div>{children}</div>, {
    Upgrade: () => <p>upgrade</p>,
  }),
}));

const NOW = 1_000_000;

const render = (queue: { startedAt: number | null; done: boolean }[]) => {
  const base = createBuilding(900, 'workshop', 62, 66, 0);
  const building = { ...base, queue: queue.map(entry => ({ item: 'wood' as const, duration: 60_000, quantity: 1, ...entry })) };
  context.state = { ...newGame({ seed: 'production-panel', now: NOW }), buildings: [building], urbs: 100, lastSeen: NOW };
  return renderToStaticMarkup(<ProductionPanel building={building} />);
};

describe('ProductionPanel Rush', () => {
  it('offers a Rush only on the production that is running', () => {
    const html = render([{ startedAt: NOW, done: false }, { startedAt: null, done: false }]);
    expect(html.split(t('panel.rush'))).toHaveLength(2);
  });

  it('offers no Rush on a finished production', () => {
    expect(render([{ startedAt: NOW - 60_000, done: true }])).not.toContain(t('panel.rush'));
  });
});
