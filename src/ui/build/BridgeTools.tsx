import { BRIDGES, BRIDGE_LENGTHS, totalCitizens } from '../../core';
import { t } from '../../i18n/t';
import { FlyoutItem } from '../layout/FlyoutItem';
import { useGame, useUi } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';

export function BridgeTools() {
  const citizens = useGame((store) => totalCitizens(store.state));
  const chooseTool = useUi((store) => store.chooseTool);
  if (citizens < BRIDGES.unlockCitizens) return null;
  return (
    <>
      {BRIDGE_LENGTHS.map((length) => (
        <FlyoutItem icon="bridge.png" key={length} label={`${t('water.bridge')} · ${length} ${t('water.bridgeTiles')}`} cost={<UrbsAmount value={BRIDGES.costs[length] ?? 0} />} onChoose={() => chooseTool({ kind: 'bridge', length })} />
      ))}
    </>
  );
}
