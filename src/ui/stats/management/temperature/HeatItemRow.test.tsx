import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createBuilding } from '../../../../core';
import { HeatItemRow } from './HeatItemRow';

vi.mock('../../../common/hooks', () => ({
  useUi: (selector: (store: { showBuilding: () => void }) => unknown) => selector({ showBuilding: () => {} }),
}));

const row = (element: React.ReactElement) => renderToStaticMarkup(<table><tbody>{element}</tbody></table>);

describe('heat item row', () => {
  it('names a building by type, level and offers to show it on the map', () => {
    const html = row(<HeatItemRow item={{ kind: 'building', building: createBuilding(1, 'factory', 4, 5, 0), impact: 2, degrees: 0.2 }} />);
    expect(html).toContain('Level 1');
    expect(html).toContain('Show on map');
  });

  it('offers no map link for citizens', () => {
    const html = row(<HeatItemRow item={{ kind: 'citizens', impact: 1, degrees: 0.1 }} />);
    expect(html).toContain('Citizens not using public transport');
    expect(html).not.toContain('Show on map');
  });
});
