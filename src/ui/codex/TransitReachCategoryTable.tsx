import type { TransitReachCategoryFigures } from '../../core';
import { t } from '../../i18n/t';
import { TransitReachCategoryRow } from './TransitReachCategoryRow';

export function TransitReachCategoryTable({ categories }: { categories: readonly TransitReachCategoryFigures[] }) {
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th scope="col">{t('codex.transitReach.category')}</th>
            <th scope="col">{t('codex.transitReach.facilities')}</th>
            <th scope="col">{t('codex.transitReach.direct')}</th>
            <th scope="col">{t('codex.transitReach.viaTransit')}</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(figures => <TransitReachCategoryRow key={figures.category} figures={figures} />)}
        </tbody>
      </table>
    </div>
  );
}
