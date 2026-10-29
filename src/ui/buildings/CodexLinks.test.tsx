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
    expect(html).toContain('Politics');
    expect(html).toContain('Town hall');
    expect(html.match(/lucide-info/g)).toHaveLength(2);
    expect(html).not.toContain('?');
    expect(html.match(/class="truncate"/g)).toHaveLength(2);
    expect(html).toContain('title="Politics"');
  });

  it('gives no Politics link to other buildings', () => {
    expect(renderToStaticMarkup(<CodexLinks building={createBuilding(1, 'school', 8, 8, 0)} />)).not.toContain('Politics');
  });
});
