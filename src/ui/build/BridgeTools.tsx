import { BRIDGES, BRIDGE_LENGTHS, bridgeCost, isPedestrianBridge, totalCitizens } from '../../core';
import { t } from '../../i18n/t';
import { FlyoutItem } from '../layout/FlyoutItem';
import { useGame, useUi } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';

const CARRIERS = ['road', 'brt'] as const;

interface BridgeToolsProps {
  variant: 'maritime' | 'road' | 'footbridge';
}

export function BridgeTools({ variant }: BridgeToolsProps) {
  const citizens = useGame((store) => totalCitizens(store.state));
  const hasFootbridge = useGame((store) => (store.state.bridges ?? []).some(isPedestrianBridge));
  const chooseTool = useUi((store) => store.chooseTool);
  const openCodex = useUi((store) => store.openCodex);
  if (citizens < BRIDGES.unlockCitizens) return null;
  return (
    <>
      {variant === 'maritime' && BRIDGE_LENGTHS.map((length) => (
        <FlyoutItem icon="bridge.png" codexId="bridge" onInfo={() => openCodex('bridge')} key={length} label={`${length} ${t('water.bridgeTiles')}`} cost={<UrbsAmount value={BRIDGES.costs[length] ?? 0} />} onChoose={() => chooseTool({ kind: 'bridge', length })} />
      ))}
      {variant === 'footbridge' && BRIDGE_LENGTHS.map((length) => (
        <FlyoutItem icon="bridge.png" codexId="bridge" onInfo={() => openCodex('bridge')} key={length} label={`${t('water.footbridge')} ${length} ${t('water.bridgeTiles')}`} cost={<UrbsAmount value={bridgeCost(length, 'pedestrian') ?? 0} />} onChoose={() => chooseTool({ kind: 'bridge', length, carrier: 'pedestrian' })} />
      ))}
      {variant === 'footbridge' && hasFootbridge && <FlyoutItem icon="bridge.png" label={t('water.removeBridge')} onChoose={() => chooseTool({ kind: 'removeBridge' })} />}
      {variant === 'road' && CARRIERS.map((carrier) =>
        BRIDGE_LENGTHS.map((length) => (
          <FlyoutItem icon="bridge.png" codexId="bridge" onInfo={() => openCodex('bridge')} key={`${carrier}-${length}`} label={`${length} ${t('water.bridgeTiles')}`} cost={<UrbsAmount value={bridgeCost(length, carrier) ?? 0} />} onChoose={() => chooseTool({ kind: 'bridge', length, carrier })} />
        )),
      )}
    </>
  );
}
