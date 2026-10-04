import { saveSession } from '../../persistence/instance';
import { t } from '../../i18n/t';
import { dialogStore } from '../../store/dialogStore';
import { gameStore } from '../../store/gameStore';
import { useDialogs } from '../common/hooks';
import { useConfirmKeys } from '../build/useConfirmKeys';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';

export function ImportConfirmDialog() {
  const pending = useDialogs((store) => store.pendingImport);
  const close = () => dialogStore.getState().setPendingImport(null);
  const replace = () => {
    if (!pending) return;
    saveSession.unlock();
    gameStore.getState().replaceState(pending);
    saveSession.save(pending, Date.now());
    close();
  };
  useConfirmKeys({ active: pending !== null, onConfirm: replace, onCancel: close });
  if (!pending) return null;

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog">
        <p>{t('import.confirm')}</p>
        <ButtonRow align="end">
          <ActionButton onClick={close}>
            {t('sale.no')}
          </ActionButton>
          <ActionButton variant="danger" onClick={replace}>
            {t('import.yes')}
          </ActionButton>
        </ButtonRow>
      </div>
    </div>
  );
}
