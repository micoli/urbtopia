import { exportCurrentCity } from '../../persistence/exportCity';
import { t } from '../../i18n/t';
import { dialogStore } from '../../store/dialogStore';
import { useDialogs } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';

export function SaveFailedDialog() {
  const open = useDialogs((store) => store.saveFailed);
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="alertdialog" aria-modal="true">
      <div className="dialog">
        <h2>{t('saveFailed.title')}</h2>
        <p>{t('saveFailed.text')}</p>
        <ButtonRow align="end">
          <ActionButton onClick={() => dialogStore.getState().setSaveFailed(false)}>
            {t('saveFailed.close')}
          </ActionButton>
          <ActionButton variant="primary" onClick={exportCurrentCity}>
            {t('menu.export')}
          </ActionButton>
        </ButtonRow>
      </div>
    </div>
  );
}
