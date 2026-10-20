import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createBuilding } from '../../core';
import { CodexLinks } from './CodexLinks';

vi.mock('../common/hooks', () => ({
  useUi: (selector: (store: { openCodex: () => void }) => unknown) => selector({ openCodex: () => {} }),
}));

describe('CodexLinks', () => {
  it('links the Town hall to the Politics page, besides its own entry', () => {
    const html = renderToStaticMarkup(<CodexLinks building={createBuilding(1, 'townHall', 8, 8, 0)} />);
    expect(html).toContain('Politics\u00a0?');
    expect(html).toContain('Town hall');
  });

  it('gives no Politics link to other buildings', () => {
    expect(renderToStaticMarkup(<CodexLinks building={createBuilding(1, 'school', 8, 8, 0)} />)).not.toContain('Politics');
  });
});
