import { afterEach, describe, expect, it, vi } from 'vitest';
import { HighlightLayer, tileRect } from './HighlightLayer';

afterEach(() => vi.restoreAllMocks());

describe('HighlightLayer', () => {
  it('draws a pad and a beam per place', () => {
    const layer = new HighlightLayer(0xffffff);
    layer.set([tileRect({ x: 1, y: 2 }), tileRect({ x: 3, y: 4 })]);
    expect(layer.root.children).toHaveLength(4);
  });

  it('empties without complaining when there is nothing to highlight', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const layer = new HighlightLayer(0xffffff);
    layer.set([tileRect({ x: 1, y: 2 })]);
    layer.set([]);
    expect(layer.root.children).toHaveLength(0);
    expect(error).not.toHaveBeenCalled();
  });
});
