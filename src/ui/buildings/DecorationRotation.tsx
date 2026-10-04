import type { Building, Rotation } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';

export function DecorationRotation({ building }: { building: Building }) {
  const turn = (step: 1 | 3) => gameStore.getState().send({ type: 'MoveBuilding', id: building.id, x: building.x, y: building.y, rotation: ((building.rotation + step) % 4) as Rotation });
  return (
    <div className="side-panel-actions">
      <button type="button" aria-label={t('panel.rotateLeft')} onClick={() => turn(3)}>←</button>
      <button type="button" aria-label={t('panel.rotateRight')} onClick={() => turn(1)}>→</button>
    </div>
  );
}
