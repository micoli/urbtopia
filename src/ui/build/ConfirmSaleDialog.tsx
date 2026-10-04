import { t } from '../../i18n/t';
import { useUi } from '../common/hooks';
import { useConfirmKeys } from './useConfirmKeys';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';

export function ConfirmSaleDialog() {
  const pending = useUi((store) => store.pendingSaleId);
  const confirmSale = useUi((store) => store.confirmSale);
  const cancelSale = useUi((store) => store.cancelSale);
  useConfirmKeys({ active: pending !== null, onConfirm: confirmSale, onCancel: cancelSale });
  if (pending === null) return null;

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog">
        <p>{t('sale.confirm')}</p>
        <ButtonRow align="end">
          <ActionButton onClick={cancelSale}>
            {t('sale.no')}
          </ActionButton>
          <ActionButton variant="danger" onClick={confirmSale}>
            {t('sale.yes')}
          </ActionButton>
        </ButtonRow>
      </div>
    </div>
  );
}
