import { BRIDGES, BRIDGE_LENGTHS, WATER, totalCitizens } from '../../core';
import { t } from '../../i18n/t';
import type { Tool } from '../../tools/tools';
import { FlyoutItem } from '../layout/FlyoutItem';
import { useGame, useUi } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';

export function WaterTools() {
  const hasWater = useGame((store) => (store.state.waterTiles ?? []).length > 0);
  const hasBridge = useGame((store) => (store.state.bridges ?? []).length > 0);
  const citizens = useGame((store) => totalCitizens(store.state));
  const chooseTool = useUi((store) => store.chooseTool);
  const brush = (action: 'layWater' | 'removeWater'): Tool => ({ kind: 'brush', action, tiles: [] });
  return (
    <>
      <FlyoutItem label={t('water.lay')} cost={<UrbsAmount value={WATER.tileCost} />} onChoose={() => chooseTool(brush('layWater'))} />
      {hasWater ? <FlyoutItem label={t('water.remove')} onChoose={() => chooseTool(brush('removeWater'))} /> : null}
      {citizens >= BRIDGES.unlockCitizens
        ? BRIDGE_LENGTHS.map((length) => (
            <FlyoutItem key={length} label={`${t('water.bridge')} · ${length} ${t('water.bridgeTiles')}`} cost={<UrbsAmount value={BRIDGES.costs[length] ?? 0} />} onChoose={() => chooseTool({ kind: 'bridge', length })} />
          ))
        : null}
      {hasBridge ? <FlyoutItem label={t('water.removeBridge')} onChoose={() => chooseTool({ kind: 'removeBridge' })} /> : null}
    </>
  );
}
