import { useState } from 'react';
import { donationQuote, isGood, type ItemId } from '../../core';
import { itemName } from '../../i18n/itemName';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { NumberStepper } from '../common/NumberStepper';
import { formatSolidarityDuration } from './formatSolidarityDuration';
import { useCloud, useGame, useReadOnly, useSolidarity } from '../common/hooks';
import { SolidarityProgress } from '../social/SolidarityProgress';

interface DonationFormProps {
  item: ItemId;
  onClose: () => void;
}

export function DonationForm({ item, onClose }: DonationFormProps) {
  const state = useGame(store => store.state);
  const accountId = useCloud(store => store.account?.email ? store.account.userId : undefined);
  const total = useSolidarity(store => store.value);
  const readOnly = useReadOnly();
  const [quantity, setQuantity] = useState(1);
  const stock: Partial<Record<ItemId, number>> = isGood(item) ? state.storage.goods : state.storage.materials;
  const available = stock[item] ?? 0;
  const amount = Math.min(quantity, available);
  const valid = Number.isSafeInteger(amount) && amount > 0 && amount <= available;
  const quote = donationQuote(state, item, valid ? amount : 0);
  const stockText = t('solidarity.stock').replace('{quantity}', String(amount)).replace('{good}', itemName(item));
  return <form className="donation-form" onSubmit={event => {
    event.preventDefault();
    if (!valid || readOnly) return;
    gameStore.getState().send({ type: 'DonateItems', id: crypto.randomUUID(), item, quantity: amount, accountId });
    if (!gameStore.getState().lastError) onClose();
  }}>
    <NumberStepper label={t('solidarity.quantity')} value={amount} min={1} max={available} onChange={setQuantity} />
    {valid && <div className="donation-preview" aria-live="polite">
      <p>{stockText}</p>
      {!isGood(item) && <p>{t('solidarity.materialNote')}</p>}
      <p>{t('solidarity.value').replace('{value}', String(quote.value))}</p>
      <p>{t('solidarity.added').replace('{duration}', formatSolidarityDuration(quote.addedMs))}</p>
      <p>{t('solidarity.after').replace('{duration}', formatSolidarityDuration(quote.remainingMs))}</p>
      {quote.excessValue > 0 && <p className="note">{quote.addedMs === 0 ? t('solidarity.full') : t('solidarity.excess').replace('{value}', String(Math.round(quote.excessValue * 100) / 100))}</p>}
      <h4>{t('solidarity.medal.projected')}</h4>
      <SolidarityProgress value={total + quote.value} />
    </div>}
    <ButtonRow align="stretch" spaced>
      <ActionButton type="submit" variant="primary" disabled={!valid || readOnly}>{t('solidarity.confirm').replace('{quantity}', valid ? String(amount) : '—').replace('{good}', itemName(item))}</ActionButton>
      <ActionButton onClick={onClose}>{t('solidarity.cancel')}</ActionButton>
    </ButtonRow>
  </form>;
}
