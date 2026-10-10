import { TRANSIT, type GameState, type transportStats } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { FleetRow } from './FleetRow.tsx';

interface FleetTableProps {
  state: GameState;
  transport: ReturnType<typeof transportStats>;
}

export function FleetTable({ state, transport }: FleetTableProps) {
  const fleet = state.transitFleet ?? [];
  if (!fleet.length) return <p>{t('transit.noVehicles')}</p>;
  const lines = state.transitLines ?? [];
  return <table className="transit-table">
    <thead>
      <tr>
        <th>{t('transit.vehicle')}</th>
        <th>{t('transit.line')}</th>
        <th>{t('transit.status')}</th>
        <th>{t('transit.sell')}</th>
      </tr>
    </thead>
    <tbody>
      {fleet.map(vehicle => <FleetRow
        key={vehicle.id}
        vehicle={vehicle}
        compatibleLines={lines.filter(line => line.mode === TRANSIT[vehicle.kind].mode)}
        summary={transport.lines.find(line => line.id === vehicle.lineId)}
      />)}
    </tbody>
  </table>;
}
