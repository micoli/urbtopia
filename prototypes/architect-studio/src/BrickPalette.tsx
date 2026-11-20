import { BRICKS, BRICK_LABEL, BRICK_PRICE, type Brick } from './model.ts';
import { BRICK_COLOR } from './editorConstants.ts';

interface BrickPaletteProps {
  brick: Brick;
  onPick: (brick: Brick) => void;
}

export function BrickPalette({ brick, onPick }: BrickPaletteProps) {
  return (
    <div className="palette">
      {BRICKS.map((b) => (
        <button key={b} className={b === brick ? 'brick on' : 'brick'} onClick={() => onPick(b)}>
          <i style={{ background: BRICK_COLOR[b] }} />
          {BRICK_LABEL[b]} · {BRICK_PRICE[b]}€
        </button>
      ))}
    </div>
  );
}
