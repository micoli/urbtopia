import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createBuilding, type Building } from '../../core';
import { InteriorRecipes } from './InteriorRecipes';

vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: () => {} }) } }));

const bakery = (conditions: number[]): Building => ({
  ...createBuilding(1, 'bakery', 55, 50, 0),
  tier: 3,
  interior: { nextFixtureId: conditions.length + 1, fixtures: conditions.map((condition, index) => ({ id: index + 1, type: 'bakeryConveyor' as const, x: index, y: 1, rotation: 0 as const, condition })) },
});

describe('InteriorRecipes repairs', () => {
  it('lists what is worn under the button, with the number of each kind and its condition', () => {
    const html = renderToStaticMarkup(<InteriorRecipes factory={bakery([40, 55, 100])} />);
    expect(html).toContain('repair-detail');
    expect(html).toContain('2 × ');
    expect(html).toContain('40 %');
  });

  it('shows no detail and a disabled button when nothing is worn', () => {
    const html = renderToStaticMarkup(<InteriorRecipes factory={bakery([100])} />);
    expect(html).not.toContain('repair-detail');
    expect(html).toMatch(/<button[^>]*disabled/);
  });
});
