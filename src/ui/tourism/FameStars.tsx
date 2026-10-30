import { MAX_FAME } from '../../core';
import { t } from '../../i18n/t';
import { Icon } from '../common/Icon';

export function FameStars({ fame }: { fame: number }) {
  return (
    <span className="fame-stars" role="img" aria-label={t('show.fame').replace('{fame}', `${fame}`)}>
      {Array.from({ length: MAX_FAME }, (_, index) => <Icon key={index} name="star" fill={index < fame ? 'currentColor' : 'none'} data-lit={index < fame} />)}
    </span>
  );
}
