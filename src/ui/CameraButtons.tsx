import { t } from '../i18n/t';
import { sceneHandle } from '../store/sceneHandle';

export function CameraButtons() {
  return (
    <div className="camera-buttons">
      <button type="button" aria-label={t('camera.rotateLeft')} onClick={() => sceneHandle.current?.camera.rotate(-1)}>
        ⟲
      </button>
      <button type="button" aria-label={t('camera.rotateRight')} onClick={() => sceneHandle.current?.camera.rotate(1)}>
        ⟳
      </button>
    </div>
  );
}
