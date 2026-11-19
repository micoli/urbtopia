import { HEX_EDGE_COUNT, type Hex } from '../../core';
import { cornerOf } from '../../scene/hexLayout';

interface HexGlyphProps {
  hex: Hex;
  label: string;
}

const CENTRE = { x: 0, z: 0 };

// A Hex seen from above: one wedge per edge, coloured by its category.
export function HexGlyph({ hex, label }: HexGlyphProps) {
  return (
    <svg className="hex-glyph" viewBox="-1.05 -1.05 2.1 2.1" role="img" aria-label={label}>
      {Array.from({ length: HEX_EDGE_COUNT }, (_, edge) => {
        const before = cornerOf(CENTRE, 1, (edge + HEX_EDGE_COUNT - 1) % HEX_EDGE_COUNT);
        const after = cornerOf(CENTRE, 1, edge);
        return <polygon key={edge} className={`hex-glyph__wedge hex-glyph__wedge--${hex.edges[edge]}`} points={`0,0 ${before.x},${before.z} ${after.x},${after.z}`} />;
      })}
    </svg>
  );
}
