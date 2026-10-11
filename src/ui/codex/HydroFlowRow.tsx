import { ECOLOGY, UTILITY_CAPACITY } from '../../core';

interface HydroFlowRowProps {
  tier: number;
  tiles: number;
}

export function HydroFlowRow({ tier, tiles }: HydroFlowRowProps) {
  const capacity = UTILITY_CAPACITY.hydroPlant[tier - 1] ?? 0;
  const flow = Math.min(1, tiles / ECOLOGY.hydroFullFlowTiles);
  return (
    <tr>
      <th scope="row">{tier}</th>
      <td>{capacity}</td>
      <td>{(capacity * flow).toFixed(1)}</td>
    </tr>
  );
}
