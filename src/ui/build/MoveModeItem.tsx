import { t } from '../../i18n/t';
import { FlyoutItem } from '../layout/FlyoutItem';
import { useReadOnly, useUi } from '../common/hooks';

export function MoveModeItem() {
  const moveMode = useUi((store) => store.moveMode);
  const toggleMoveMode = useUi((store) => store.toggleMoveMode);
  const readOnly = useReadOnly();
  return <FlyoutItem label={`✥ ${t('build.moveMode')}`} selected={moveMode} disabled={readOnly} onChoose={toggleMoveMode} />;
}
