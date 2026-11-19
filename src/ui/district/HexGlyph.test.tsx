import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HexGlyph } from './HexGlyph';

describe('a Hex glyph', () => {
  it('draws one wedge per edge, in the order of the edges, coloured by category', () => {
    const html = renderToStaticMarkup(<HexGlyph label="Hex" hex={{ edges: ['habitat', 'habitat', 'park', 'park', 'water', 'water'] }} />);
    const wedges = [...html.matchAll(/hex-glyph__wedge--(\w+)/g)].map(match => match[1]);
    expect(wedges).toEqual(['habitat', 'habitat', 'park', 'park', 'water', 'water']);
  });

  it('is named for assistive technology', () => {
    expect(renderToStaticMarkup(<HexGlyph label="Hex to place" hex={{ edges: ['park', 'park', 'park', 'park', 'park', 'park'] }} />)).toContain('aria-label="Hex to place"');
  });
});
