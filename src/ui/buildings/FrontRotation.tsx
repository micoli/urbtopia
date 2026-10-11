import { nextFront, validFronts, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { useGame } from '../common/hooks';

export function FrontRotation({ building }: { building: Building }) {
  const state = useGame((store) => store.state);
  const fronts = validFronts(state, building.type, building.x, building.y, building.tier);
  if (fronts.length < 2) return null;
  const turn = (step: 1 | -1) => gameStore.getState().send({ type: 'MoveBuilding', id: building.id, x: building.x, y: building.y, rotation: nextFront(fronts, building.rotation, step) });
  return (
    <ButtonRow align="stretch" spaced className="side-panel-actions">
      <ActionButton aria-label={t('panel.rotateLeft')} onClick={() => turn(-1)}>←</ActionButton>
      <ActionButton aria-label={t('panel.rotateRight')} onClick={() => turn(1)}>→</ActionButton>
    </ButtonRow>
  );
}
