import { BRIDGES, BRIDGE_LENGTHS, bridgeCost, totalCitizens } from '../../core';
import { t } from '../../i18n/t';
import { FlyoutItem } from '../layout/FlyoutItem';
import { useGame, useUi } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';

const CARRIERS = ['road', 'brt', 'pedestrian'] as const;

interface BridgeToolsProps {
  variant: 'maritime' | 'road';
}

export function BridgeTools({ variant }: BridgeToolsProps) {
  const citizens = useGame((store) => totalCitizens(store.state));
  const chooseTool = useUi((store) => store.chooseTool);
  const openCodex = useUi((store) => store.openCodex);
  if (citizens < BRIDGES.unlockCitizens) return null;
  return (
    <>
      {variant === 'maritime' && BRIDGE_LENGTHS.map((length) => (
        <FlyoutItem icon="bridge.png" codexId="bridge" onInfo={() => openCodex('bridge')} key={length} label={`${length} ${t('water.bridgeTiles')}`} cost={<UrbsAmount value={BRIDGES.costs[length] ?? 0} />} onChoose={() => chooseTool({ kind: 'bridge', length })} />
      ))}
      {variant === 'road' && CARRIERS.map((carrier) =>
        BRIDGE_LENGTHS.map((length) => (
          <FlyoutItem icon="bridge.png" codexId="bridge" onInfo={() => openCodex('bridge')} key={`${carrier}-${length}`} label={`${carrier === 'pedestrian' ? `${t('water.footbridge')} ` : ''}${length} ${t('water.bridgeTiles')}`} cost={<UrbsAmount value={bridgeCost(length, carrier) ?? 0} />} onChoose={() => chooseTool({ kind: 'bridge', length, carrier })} />
        )),
      )}
    </>
  );
}
