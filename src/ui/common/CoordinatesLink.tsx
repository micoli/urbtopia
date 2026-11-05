import { buildingAt, type Coord } from '../../core';
import { t } from '../../i18n/t';
import { useGame, useUi } from './hooks';

// Shows the tile on the map and makes it blink, or the building standing on it.
export function CoordinatesLink({ x, y }: Coord) {
  const state = useGame(store => store.state);
  const showBuilding = useUi(store => store.showBuilding);
  const showTile = useUi(store => store.showTile);
  const show = () => {
    const id = buildingAt(state, { x, y });
    if (id === undefined) return showTile({ x, y });
    showBuilding(id);
  };
  return <button type="button" className="coordinates-link" title={t('eco.showOnMap')} onClick={show}>({x}, {y})</button>;
}
