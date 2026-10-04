import { t } from '../../i18n/t';
import { useUi } from '../common/hooks';
import { useConfirmKeys } from './useConfirmKeys';
import { ActionButton } from '../common/ActionButton';
import { Dialog } from '../common/Dialog';

export function ConfirmSaleDialog() {
  const pending = useUi((store) => store.pendingSaleId);
  const confirmSale = useUi((store) => store.confirmSale);
  const cancelSale = useUi((store) => store.cancelSale);
  useConfirmKeys({ active: pending !== null, onConfirm: confirmSale, onCancel: cancelSale });
  if (pending === null) return null;

  return (
    <Dialog>
      <Dialog.Body><p>{t('sale.confirm')}</p></Dialog.Body>
      <Dialog.Actions>
        <ActionButton onClick={cancelSale}>{t('sale.no')}</ActionButton>
        <ActionButton variant="danger" onClick={confirmSale}>{t('sale.yes')}</ActionButton>
      </Dialog.Actions>
    </Dialog>
  );
}
