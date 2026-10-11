import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type GameState } from '../../core';
import { BuildLimitFacts } from './BuildLimitFacts';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

const render = (state: GameState, id: Parameters<typeof BuildLimitFacts>[0]['id']) => {
  context.state = state;
  return renderToStaticMarkup(<BuildLimitFacts id={id} />);
};

describe('BuildLimitFacts', () => {
  const base = newGame({ seed: 'build-limit-facts', now: 0 });

  it('lists the Citizens threshold of every Farm copy and the next price', () => {
    const state: GameState = { ...base, nextId: base.nextId + 1, buildings: [...base.buildings, createBuilding(base.nextId, 'farm', 56, 59, 0)] };
    const html = render(state, 'farm');
    expect(html).toContain('1/3');
    expect(html).toContain('🔒 from 20 Citizens');
    expect(html).toContain('🔒 from 300 Citizens');
    expect(html).toContain('🔒 from 800 Citizens');
    expect(html).toContain('400');
  });

  it('renders nothing for a building without a Build limit', () => {
    expect(render(base, 'home')).toBe('');
  });
});
