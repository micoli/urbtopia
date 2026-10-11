import type { EnergySource } from '../../core';
import { t } from '../../i18n/t';

interface EnergySourceRowProps {
  source: EnergySource;
  factor: number;
  demand: number;
}

const percent = (value: number) => `${Math.round(value * 100)}%`;

export function EnergySourceRow({ source, factor, demand }: EnergySourceRowProps) {
  return (
    <tr>
      <th scope="row">{t(`eco.${source.id}`)}</th>
      <td>{source.copies}</td>
      <td>{source.capacity.toFixed(1)}</td>
      <td>{percent(factor)}</td>
      <td>{source.output.toFixed(1)}</td>
      <td>{demand > 0 ? percent(source.output / demand) : '—'}</td>
    </tr>
  );
}
