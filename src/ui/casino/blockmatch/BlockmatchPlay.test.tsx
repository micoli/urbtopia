import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { BlockmatchPlay } from './BlockmatchPlay';

vi.mock('../../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: () => {} }) } }));

describe('blockmatch round screen', () => {
  it('draws the board, the moves left and the goals of the level built from the round seed', () => {
    const html = renderToStaticMarkup(<BlockmatchPlay buildingId={1} tier={3} roundSeed={123} />);
    expect(html).toContain('class="blockmatch casino-game"');
    expect(html).toContain('class="board ');
    expect(html).toContain('blockmatch-moves');
    expect((html.match(/class="tile-slot"/g) ?? []).length).toBeGreaterThan(30);
    expect(html).toContain('goal');
  });

  it('builds the same screen for the same round seed and another one for another seed', () => {
    const render = (seed: number) => renderToStaticMarkup(<BlockmatchPlay buildingId={1} tier={3} roundSeed={seed} />);
    expect(render(5)).toBe(render(5));
    expect(render(5)).not.toBe(render(6));
  });
});
