import { FlyoutItem } from '../layout/FlyoutItem';
import { useReadOnly, useUi } from '../common/hooks';

export function MoveModeItem() {
  const moveMode = useUi((store) => store.moveMode);
  const toggleMoveMode = useUi((store) => store.toggleMoveMode);
  const readOnly = useReadOnly();
  return <FlyoutItem label={`✥`} selected={moveMode} disabled={readOnly} onChoose={toggleMoveMode} />;
}
