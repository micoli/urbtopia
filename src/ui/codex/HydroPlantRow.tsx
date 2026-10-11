import { connectedWaterKeys, flowFactor, generatorOutput, type Building, type GameState } from '../../core';

interface HydroPlantRowProps {
  state: GameState;
  plant: Building;
}

export function HydroPlantRow({ state, plant }: HydroPlantRowProps) {
  return (
    <tr>
      <th scope="row">#{plant.id} · {plant.tier}</th>
      <td>{connectedWaterKeys(state, plant).size}</td>
      <td>{Math.round(flowFactor(state, plant) * 100)}%</td>
      <td>{generatorOutput(state, plant).toFixed(1)}</td>
    </tr>
  );
}
