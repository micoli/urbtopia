import { t } from '../../i18n/t';
import { venueSceneHandle } from '../../store/venueSceneHandle';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';

export function VenueRotateButtons() {
  return (
    <div className="venue-rotate-buttons">
      <IconButton size="md" tone="light" label={t('camera.rotateLeft')} onClick={() => venueSceneHandle.current?.rotate(-1)}>
        <Icon name="rotateLeft" />
      </IconButton>
      <IconButton size="md" tone="light" label={t('camera.rotateRight')} onClick={() => venueSceneHandle.current?.rotate(1)}>
        <Icon name="rotateRight" />
      </IconButton>
    </div>
  );
}
