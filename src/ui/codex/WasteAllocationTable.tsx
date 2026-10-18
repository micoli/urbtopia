import type { WasteKindFigures } from '../../core';
import { t } from '../../i18n/t';
import { WasteAllocationRow } from './WasteAllocationRow';

export function WasteAllocationTable({ kinds }: { kinds: readonly WasteKindFigures[] }) {
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th scope="col">{t('codex.waste.facility')}</th>
            <th scope="col">{t('codex.waste.buildings')}</th>
            <th scope="col">{t('codex.waste.capacity')}</th>
            <th scope="col">{t('codex.waste.usage')}</th>
            <th scope="col">{t('codex.waste.cost')}</th>
            <th scope="col">{t('codex.waste.state')}</th>
          </tr>
        </thead>
        <tbody>
          {kinds.map(figures => <WasteAllocationRow key={figures.kind} figures={figures} />)}
        </tbody>
      </table>
    </div>
  );
}
