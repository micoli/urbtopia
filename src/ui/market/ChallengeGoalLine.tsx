import type { ItemId } from '../../core';
import { itemName } from '../../i18n/itemName';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { ItemIcon } from '../common/ItemIcon';

interface ChallengeGoalLineProps {
  item: string;
  quantity: number;
  setAside?: number;
  available?: number;
  onSetAside?: (quantity: number) => void;
}

export function ChallengeGoalLine({ item, quantity, setAside, available = 0, onSetAside }: ChallengeGoalLineProps) {
  const remaining = quantity - (setAside ?? 0);
  const stock = Math.floor(available);
  const giveable = Math.min(remaining, available);
  return (
    <li className="challenge-line">
      <ItemIcon item={item as ItemId} />
      <div className="challenge-line-text">
        <span>
            {setAside === undefined
                ? `${quantity} × `
                : t('challenge.progress').replace('{done}', String(setAside)).replace('{total}', String(quantity))
            }
            <strong>{itemName(item as ItemId)}</strong>
        </span>
        {stock >= 1 ? <small>{t('challenge.inStorage').replace('{count}', String(stock))}</small> : null}
      </div>
      {onSetAside && remaining > 0 ? (
        <div className="challenge-line-actions">
          <ActionButton disabled={giveable < 1} onClick={() => onSetAside(1)}>
            {t('challenge.setAsideOne')}
          </ActionButton>
          {giveable > 1 ? <ActionButton onClick={() => onSetAside(giveable)}>{t('challenge.setAsideMax').replace('{count}', String(giveable))}</ActionButton> : null}
        </div>
      ) : null}
    </li>
  );
}
