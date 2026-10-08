import { WATER } from '../../core';
import { t } from '../../i18n/t';
import { FlyoutItem } from '../layout/FlyoutItem';
import { useUi } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';

export function WaterTools() {
  const chooseTool = useUi((store) => store.chooseTool);
  return <FlyoutItem label={t('water.lay')} cost={<UrbsAmount value={WATER.tileCost} />} onChoose={() => chooseTool({ kind: 'brush', action: 'layWater', tiles: [] })} />;
}
