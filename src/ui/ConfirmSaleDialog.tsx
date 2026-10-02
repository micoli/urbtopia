import { t } from '../i18n/t';
import { useUi } from './hooks';

export function ConfirmSaleDialog() {
  const pending = useUi((store) => store.pendingSaleId);
  const confirmSale = useUi((store) => store.confirmSale);
  const cancelSale = useUi((store) => store.cancelSale);
  if (pending === null) return null;

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog">
        <p>{t('sale.confirm')}</p>
        <div className="dialog-actions">
          <button type="button" onClick={cancelSale}>
            {t('sale.no')}
          </button>
          <button type="button" className="dialog-danger" onClick={confirmSale}>
            {t('sale.yes')}
          </button>
        </div>
      </div>
    </div>
  );
}
