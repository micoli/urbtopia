import { useRef } from 'react';
import { footprintOf, isHomeInteriorUnlocked, isHomeType, isInteriorBuilding, isInteriorUnlocked, isPlanningOffice, isVenue, nextFront, officeYieldMultiplierOf, type Building, type GameState } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { sceneHandle } from '../../store/sceneHandle';
import { openInterior } from '../../store/openInterior';
import { collectBadgeLabel } from '../collect/CollectBadge';
import { useGame, useUi } from '../common/hooks';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';
import { placeProjected, useFrameLoop } from '../common/useProjectedPosition';
import { FloatingMenuItems } from '../layout/FloatingMenuItems';
import { useFloatingActions } from '../layout/useFloatingActions';
import { otherFronts } from './FrontRotation';
import { useSelectedBuilding } from './useSelectedBuilding';

const FOOTPRINT_CORNERS = [[0, 0], [1, 0], [0, 1], [1, 1]] as const;

type InteriorAccess = 'none' | 'locked' | 'open';

// Whether a building has an interior to open, and whether the city has grown enough to open it; a plain string keeps the store selector stable.
function interiorAccessOf(state: GameState, building: Building): InteriorAccess {
  if (isVenue(building) || isPlanningOffice(building)) return 'open';
  if (isInteriorBuilding(building)) return isInteriorUnlocked(state, building.type) ? 'open' : 'locked';
  if (isHomeType(building.type)) return isHomeInteriorUnlocked(state) ? 'open' : 'locked';
  return 'none';
}

// Collect, interior, move, rotate and sell, right under the selected building of the city.
export function BuildingFloatingBar() {
  const building = useSelectedBuilding();
  const tool = useUi(store => store.tool);
  const moveSelected = useUi(store => store.moveSelected);
  const sellSelected = useUi(store => store.sellSelected);
  const canTurn = useGame(store => building !== null && otherFronts(store.state, building).some(rotation => rotation !== building.rotation));
  const collectable = useGame(store => building !== null && collectBadgeLabel(building, officeYieldMultiplierOf(store.state)) !== null);
  const interiorAccess = useGame(store => (building ? interiorAccessOf(store.state, building) : 'none'));
  const floating = useFloatingActions();
  const bar = useRef<HTMLDivElement>(null);

  useFrameLoop(() => {
    const scene = sceneHandle.current;
    if (!bar.current || !scene || !building) return;
    const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
    const corners = FOOTPRINT_CORNERS.map(([cx, cy]) => scene.project(building.x + cx * width, 0, building.y + cy * depth));
    const left = Math.min(...corners.map(corner => corner.x)), right = Math.max(...corners.map(corner => corner.x));
    placeProjected(bar.current, { x: (left + right) / 2, y: Math.max(...corners.map(corner => corner.y)), visible: corners.every(corner => corner.visible) }, 'below');
  }, [building]);

  if (!building || tool) return null;
  const canCollect = floating.collect && (collectable || floating.showDisabled);
  const canOpenInterior = floating.interior && (interiorAccess !== 'none' || floating.showDisabled);
  if (!canCollect && !canOpenInterior && !floating.move && !floating.rotate && !floating.sellBuilding) return null;
  const turn = () => {
    const fronts = otherFronts(gameStore.getState().state, building);
    gameStore.getState().send({ type: 'MoveBuilding', id: building.id, x: building.x, y: building.y, rotation: nextFront(fronts, building.rotation, 1) });
  };
  return (
    <div ref={bar} className={`building-floating-bar${floating.radial ? ' floating-menu--radial' : ''}`}>
      <FloatingMenuItems radial={floating.radial}>
      {canCollect ? <IconButton size="md" tone="accent" label={t('panel.collect')} disabled={!collectable} onClick={() => gameStore.getState().send({ type: 'Collect', buildingId: building.id })}><Icon name="money" /></IconButton> : null}
      {canOpenInterior ? <IconButton size="md" tone="light" label={isPlanningOffice(building) ? t('district.title') : t('panel.interior')} disabled={interiorAccess !== 'open'} onClick={() => openInterior(building)}><Icon name="build" /></IconButton> : null}
      {floating.move ? <IconButton size="md" tone="light" label={t('panel.move')} onClick={moveSelected}><Icon name="move" /></IconButton> : null}
      {floating.rotate ? <IconButton size="md" tone="light" label={t('panel.rotateRight')} disabled={!canTurn} onClick={turn}><Icon name="rotateRight" /></IconButton> : null}
      {floating.sellBuilding ? <IconButton size="md" tone="danger" label={t('panel.sell')} onClick={sellSelected}><Icon name="trash" /></IconButton> : null}
      </FloatingMenuItems>
    </div>
  );
}
