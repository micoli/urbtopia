import type { InteriorFigures } from '../../codex/interiorFigures';
import { t } from '../../i18n/t';
import { formatBenefit } from './formatBenefit';

interface InteriorTiersTableProps {
  figures: InteriorFigures;
}

export function InteriorTiersTable({ figures }: InteriorTiersTableProps) {
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th scope="col">{t('codex.interiors.tier')}</th>
            <th scope="col">{t('codex.interiors.room')}</th>
            {figures.columns.map(column => <th key={column.label} scope="col">{t(column.label)}</th>)}
          </tr>
        </thead>
        <tbody>
          {figures.room.map((room, index) => (
            <tr key={index}>
              <th scope="row">{index + 1}</th>
              <td>{room} × {room}</td>
              {figures.columns.map(column => <td key={column.label}>{formatBenefit(column.values[index]!, column.format)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
