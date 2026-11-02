import { t } from '../../i18n/t';
import { sceneHandle } from '../../store/sceneHandle';
import { IconButton } from '../common/IconButton';
import { Icon } from '../common/Icon';

export function StaticButtons() {
  return (
    <div className="camera-buttons">
      <IconButton size="md" tone="light" label={t('camera.rotateLeft')} onClick={() => sceneHandle.current?.camera.rotate(-1)}>
        <Icon name="rotateLeft" />
      </IconButton>
      <IconButton size="md" tone="light" label={t('camera.rotateRight')} onClick={() => sceneHandle.current?.camera.rotate(1)}>
        <Icon name="rotateRight" />
      </IconButton>
    </div>
  );
}
