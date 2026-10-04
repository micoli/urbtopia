import type { Card } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { CardDeck } from '../../CardDeck.tsx';
import { CardHand } from '../../CardHand.tsx';
import { WinnerBadge } from './WinnerBadge.tsx';

export type BlackjackWinner = 'player' | 'dealer' | 'push';

interface BlackjackFeltProps {
  dealer: readonly Card[];
  player: readonly Card[];
  holeCardHidden: boolean;
  winner: BlackjackWinner | null;
}

export function BlackjackFelt({ dealer, player, holeCardHidden, winner }: BlackjackFeltProps) {
  return (
    <div className="felt">
      <div className="felt-dealer">
        <CardDeck />
        <CardHand label={t('casino.dealer')} cards={dealer} hideSecond={holeCardHidden && dealer.length > 1} firstDelay={160} badge={<WinnerBadge side="dealer" winner={winner} />} />
      </div>
      <p className="felt-rule" aria-hidden="true">{t('casino.feltRule')}</p>
      <br/>
      <CardHand label={t('casino.player')} cards={player} badge={<WinnerBadge side="player" winner={winner} />} />
    </div>
  );
}
