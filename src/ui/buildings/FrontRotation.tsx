import { annualEventOf, boatsOfMarina, nextFront, placementIssue, validFronts, type Building, type Rotation } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { useGame } from '../common/hooks';

export function FrontRotation({ building }: { building: Building }) {
  const state = useGame((store) => store.state);
  if (building.type === 'marina' && boatsOfMarina(state, building.id).length > 0) return null;
  const withoutBuilding = { ...state, buildings: state.buildings.filter((candidate) => candidate.id !== building.id) };
  const turnsFreely = building.type === 'ferris-wheel' || building.type === 'tubularRollerCoaster' || annualEventOf(building.type) !== undefined;
  const rotations = turnsFreely
    ? [0, 1, 2, 3] as Rotation[]
    : validFronts(withoutBuilding, building.type, building.x, building.y, building.tier);
  const fronts = rotations
    .filter((rotation) => placementIssue(withoutBuilding, building.type, building.x, building.y, rotation, { isMove: true, tier: building.tier }) === null);
  if (!fronts.some((rotation) => rotation !== building.rotation)) return null;
  const turn = (step: 1 | -1) => gameStore.getState().send({ type: 'MoveBuilding', id: building.id, x: building.x, y: building.y, rotation: nextFront(fronts, building.rotation, step) });
  return (
    <ButtonRow align="stretch" spaced className="side-panel-actions">
      <ActionButton aria-label={t('panel.rotateLeft')} onClick={() => turn(-1)}>⟲</ActionButton>
      <ActionButton aria-label={t('panel.rotateRight')} onClick={() => turn(1)}>⟳</ActionButton>
    </ButtonRow>
  );
}
