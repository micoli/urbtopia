import type { Tile as TileData } from '../../../core/leisure/blockmatch/types';
import { Gem } from './Gem';
import { SpecialIcon } from './SpecialIcon';

type Props = { tile: TileData; row: number; col: number; selected: boolean; hinted: boolean };

export const Tile = ({ tile, row, col, selected, hinted }: Props) => {
  const classes = [
    'tile',
    tile.drop > 0 && 'tile--drop',
    tile.pop && 'tile--pop',
    selected && 'tile--selected',
    hinted && 'tile--hint',
    tile.clearing && 'tile--clearing',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="tile-slot" style={{ '--r': row, '--c': col }}>
      <div className={classes} style={{ '--drop': tile.drop }}>
        {tile.special ? <SpecialIcon special={tile.special} /> : <Gem color={tile.color} />}
      </div>
    </div>
  );
};
