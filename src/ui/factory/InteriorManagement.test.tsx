import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createBuilding, type Building } from '../../core';
import { InteriorManagement } from './InteriorManagement';

vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: () => {} }) } }));

const bakery = (conditions: number[]): Building => ({
  ...createBuilding(1, 'bakery', 55, 50, 0),
  tier: 3,
  interior: { nextFixtureId: conditions.length + 1, fixtures: conditions.map((condition, index) => ({ id: index + 1, type: 'bakeryConveyor' as const, x: index, y: 1, rotation: 0 as const, condition })) },
});

describe('InteriorManagement', () => {
  it('lists what is worn under the button, with the number of each kind and its condition', () => {
    const html = renderToStaticMarkup(<InteriorManagement factory={bakery([0, 2])} />);
    expect(html).toContain('repair-detail');
    expect(html).toContain('2 × ');
    expect(html).toContain('0 %');
  });

  it('shows no repair section when nothing is worn', () => {
    const html = renderToStaticMarkup(<InteriorManagement factory={bakery([100])} />);
    expect(html).not.toContain('repair-detail');
    expect(html).not.toContain('Repair everything');
  });

  it('hides the repair section while the repairs stay under 90 % of what repairing everything from nothing would cost', () => {
    const html = renderToStaticMarkup(<InteriorManagement factory={bakery([40, 55, 100])} />);
    expect(html).not.toContain('Repair everything');
    expect(html).not.toContain('repair-detail');
  });

  it('shows the repair section once the repairs reach it', () => {
    const html = renderToStaticMarkup(<InteriorManagement factory={bakery([0, 0, 0])} />);
    expect(html).toContain('Repair everything');
  });
});

describe('InteriorManagement features', () => {
  it('describes the interior when nothing is worn', () => {
    const html = renderToStaticMarkup(<InteriorManagement factory={{ ...createBuilding(1, 'mill', 55, 50, 0), tier: 1 }} />);
    expect(html).not.toContain('Repair everything');
    expect(html).not.toContain('repair-detail');
    expect(html).toContain('millstones');
  });

  it('describes the interior even when Fixtures are worn', () => {
    const mill = { ...createBuilding(1, 'mill', 55, 50, 0), tier: 1, interior: { nextFixtureId: 2, fixtures: [{ id: 1, type: 'bakeryConveyor' as const, x: 0, y: 1, rotation: 0 as const, condition: 0 }] } };
    const html = renderToStaticMarkup(<InteriorManagement factory={mill} />);
    expect(html).toContain('repair-detail');
    expect(html).toContain('millstones');
  });
});
