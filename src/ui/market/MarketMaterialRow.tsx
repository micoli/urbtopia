import { useState } from 'react';
import type { MaterialId } from '../../core';
import { itemName } from '../../i18n/itemName';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { useGame, useReadOnly } from '../common/hooks';
import { DonationForm } from './DonationForm';

export function MarketMaterialRow({ material }: { material: MaterialId }) {
  const amount = useGame(store => store.state.storage.materials[material] ?? 0);
  const readOnly = useReadOnly();
  const [donating, setDonating] = useState(false);
  return <li className="market-row">
    <div>
      <strong>{itemName(material)} × {amount}</strong>
    </div>
    <ButtonRow align="stretch" spaced>
      <ActionButton disabled={readOnly} aria-expanded={donating} onClick={() => setDonating(value => !value)}>{t('solidarity.donate')}</ActionButton>
    </ButtonRow>
    {donating && <DonationForm item={material} onClose={() => setDonating(false)} />}
  </li>;
}
