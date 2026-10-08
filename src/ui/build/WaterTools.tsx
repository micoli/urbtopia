import { WATER } from '../../core';
import { t } from '../../i18n/t';
import type { Tool } from '../../tools/tools';
import { FlyoutItem } from '../layout/FlyoutItem';
import { useGame, useUi } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';

export function WaterTools() {
  const hasWater = useGame((store) => (store.state.waterTiles ?? []).length > 0);
  const chooseTool = useUi((store) => store.chooseTool);
  const brush = (action: 'layWater' | 'removeWater'): Tool => ({ kind: 'brush', action, tiles: [] });
  return (
    <>
      <FlyoutItem label={t('water.lay')} cost={<UrbsAmount value={WATER.tileCost} />} onChoose={() => chooseTool(brush('layWater'))} />
      {hasWater ? <FlyoutItem label={t('water.remove')} onChoose={() => chooseTool(brush('removeWater'))} /> : null}
    </>
  );
}
