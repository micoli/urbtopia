import { t } from '../../i18n/t';
import { sceneHandle } from '../../store/sceneHandle';
import { useGame, useReadOnly } from '../common/hooks';
import { useCoarsePointer } from './useCoarsePointer';

export function StaticButtons() {
  const touch = useCoarsePointer();
  const undo = useGame((store) => store.undo);
  const canUndo = useGame((store) => store.deletionUndo !== null);
  const readOnly = useReadOnly();
  return (
    <div className="camera-buttons">
      <button type="button" data-action="undo" aria-label={t('action.undo')} disabled={!canUndo || readOnly} onClick={undo}>
        ↶
      </button>
      <button type="button" aria-label={t('camera.rotateLeft')} onClick={() => sceneHandle.current?.camera.rotate(-1)}>
        ⟲
      </button>
      <button type="button" aria-label={t('camera.rotateRight')} onClick={() => sceneHandle.current?.camera.rotate(1)}>
        ⟳
      </button>
    </div>
  );
}
