import { useState } from 'react';
import { marketQuote, type GoodId } from '../../core';
import { itemName } from '../../i18n/itemName';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { useGame, useReadOnly } from '../common/hooks';
import { DonationForm } from './DonationForm';

export function MarketGoodRow({ good }: { good: GoodId }) {
  const state = useGame(store => store.state);
  const readOnly = useReadOnly();
  const [donating, setDonating] = useState(false);
  const amount = state.storage.goods[good] ?? 0;
  const one = marketQuote(state, good, 1, state.lastSeen).total;
  const all = marketQuote(state, good, amount, state.lastSeen).total;
  const send = gameStore.getState().send;
  return <li className="market-row">
    <div>
      <strong>{itemName(good)} × {amount}</strong>
      <div className="market-price">{t('market.price')}: {one}</div>
    </div>
    <ButtonRow align="stretch" spaced>
      <ActionButton disabled={readOnly} onClick={() => send({ type: 'SellToMarket', good, quantity: 1 })}>{t('market.sellOne')} (+{one})</ActionButton>
      <ActionButton disabled={readOnly} onClick={() => send({ type: 'SellToMarket', good, quantity: amount })}>{t('market.sellAll')} (+{all})</ActionButton>
      <ActionButton disabled={readOnly} aria-expanded={donating} onClick={() => setDonating(value => !value)}>{t('solidarity.donate')}</ActionButton>
    </ButtonRow>
    {donating && <DonationForm good={good} onClose={() => setDonating(false)} />}
  </li>;
}
