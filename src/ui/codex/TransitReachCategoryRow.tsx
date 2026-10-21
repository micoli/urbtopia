import type { TransitReachCategoryFigures } from '../../core';
import { t } from '../../i18n/t';

export function TransitReachCategoryRow({ figures }: { figures: TransitReachCategoryFigures }) {
  return (
    <tr>
      <th scope="row">{t(`service.${figures.category}`)}</th>
      <td>{figures.facilities}</td>
      <td>{figures.direct}</td>
      <td>{figures.viaTransit}</td>
    </tr>
  );
}
