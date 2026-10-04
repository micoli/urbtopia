import { t } from '../../i18n/t';
import { sceneHandle } from '../../store/sceneHandle';
import { IconButton } from '../common/IconButton';
import { useGame, useReadOnly } from '../common/hooks';

export function StaticButtons() {
  const undo = useGame((store) => store.undo);
  const canUndo = useGame((store) => store.deletionUndo !== null);
  const readOnly = useReadOnly();
  return (
    <div className="camera-buttons">
      <IconButton data-action="undo" size="md" tone="light" label={t('action.undo')} disabled={!canUndo || readOnly} onClick={undo}>
        ↶
      </IconButton>
      <IconButton size="md" tone="light" label={t('camera.rotateLeft')} onClick={() => sceneHandle.current?.camera.rotate(-1)}>
        ⟲
      </IconButton>
      <IconButton size="md" tone="light" label={t('camera.rotateRight')} onClick={() => sceneHandle.current?.camera.rotate(1)}>
        ⟳
      </IconButton>
    </div>
  );
}
