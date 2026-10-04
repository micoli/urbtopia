import type { ReactNode } from 'react';
import type { Card } from '../../core';
import { t } from '../../i18n/t';
import { CardDeck } from './CardDeck';
import { CardHand } from './CardHand';

interface BlackjackFeltProps {
  dealer: readonly Card[];
  player: readonly Card[];
  holeCardHidden: boolean;
  stake: ReactNode;
}

export function BlackjackFelt({ dealer, player, holeCardHidden, stake }: BlackjackFeltProps) {
  return (
    <div className="felt">
      <div className="felt-dealer">
        <CardDeck />
        <CardHand label={t('casino.dealer')} cards={dealer} hideSecond={holeCardHidden && dealer.length > 1} firstDelay={160} />
      </div>
      <p className="felt-rule" aria-hidden="true">{t('casino.feltRule')}</p>
      <div className="felt-stake">{stake}</div>
      <CardHand label={t('casino.player')} cards={player} />
    </div>
  );
}
