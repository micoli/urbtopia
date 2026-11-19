import { t } from '../../i18n/t';
import { districtSceneHandle } from '../../store/districtSceneHandle';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';

// Turns the board by a quarter turn, in the bottom right corner of the game, as in an interior.
export function DistrictViewButtons() {
  return (
    <div className="district-view-buttons">
      <IconButton size="md" tone="light" label={t('camera.rotateLeft')} onClick={() => districtSceneHandle.current?.rotate(-1)}>
        <Icon name="rotateLeft" />
      </IconButton>
      <IconButton size="md" tone="light" label={t('camera.rotateRight')} onClick={() => districtSceneHandle.current?.rotate(1)}>
        <Icon name="rotateRight" />
      </IconButton>
    </div>
  );
}
