import type { TransitLine, TransitVehicle } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { gameStore } from '../../../../store/gameStore.ts';
import { Dropdown } from '../../../common/Dropdown.tsx';
import { IconButton } from '../../../common/IconButton.tsx';
import { UrbsAmount } from '../../../common/UrbsAmount.tsx';
import type { LineSummary } from './LineMetrics.tsx';
import { vehicleStatusKey } from './vehicleStatusKey.ts';

interface FleetRowProps {
  vehicle: TransitVehicle;
  compatibleLines: readonly TransitLine[];
  summary: LineSummary | undefined;
}

export function FleetRow({ vehicle, compatibleLines, summary }: FleetRowProps) {
  const assign = (lineId: number | '') => gameStore.getState().send({ type: 'AssignTransitVehicle', id: vehicle.id, lineId: lineId === '' ? undefined : lineId });
  return <tr>
    <td data-label={t('transit.vehicle')}>{t(`transit.${vehicle.kind}`)} #{vehicle.id}</td>
    <td data-label={t('transit.line')}>
      <Dropdown<number | ''>
        label={`${t('transit.line')} #${vehicle.id}`}
        value={vehicle.lineId ?? ''}
        options={[
          { value: '', label: t('transit.unassigned') },
          ...compatibleLines.map(line => ({ value: line.id, label: `#${line.id} · ${line.stops.join(' → ')}` })),
        ]}
        onChange={assign}
      />
    </td>
    <td data-label={t('transit.status')}>{t(vehicleStatusKey(vehicle, summary))}</td>
    <td className="transit-sell" data-label={t('transit.sell')}>
      <UrbsAmount value={vehicle.purchasePrice / 2} />
      <IconButton label={t('transit.sell')} tone="danger" onClick={() => gameStore.getState().send({ type: 'SellTransitVehicle', id: vehicle.id })}>✕</IconButton>
    </td>
  </tr>;
}
