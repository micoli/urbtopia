import { t } from '../../../../i18n/t.ts';
import { UrbsAmount } from '../../../common/UrbsAmount.tsx';
import { BlockmatchStars } from './BlockmatchStars.tsx';

interface BlockmatchResultProps {
  stars: number;
  net: number;
}

export function BlockmatchResult({ stars, net }: BlockmatchResultProps) {
  const won = stars > 0;
  return (
    <section className="blockmatch-result" data-win={won} aria-live="polite">
      <h3>{won ? t('casino.victory') : t('casino.defeat')}</h3>
      <BlockmatchStars count={stars} />
      <p className="blockmatch-result-amount">
        {net > 0 ? '+' : net < 0 ? '−' : ''}<UrbsAmount value={Math.abs(net)} />
      </p>
      <small>{net > 0 ? t('casino.won') : t('casino.lost')}</small>
    </section>
  );
}
