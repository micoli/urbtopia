import type { Building, Rotation } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { Icon } from '../common/Icon';

export function DecorationRotation({ building }: { building: Building }) {
  const turn = (step: 1 | 3) => gameStore.getState().send({ type: 'MoveBuilding', id: building.id, x: building.x, y: building.y, rotation: ((building.rotation + step) % 4) as Rotation });
  return (
    <ButtonRow align="stretch" spaced className="side-panel-actions">
      <ActionButton aria-label={t('panel.rotateLeft')} onClick={() => turn(3)}><Icon name="arrowLeft" /></ActionButton>
      <ActionButton aria-label={t('panel.rotateRight')} onClick={() => turn(1)}><Icon name="arrowRight" /></ActionButton>
    </ButtonRow>
  );
}
