import { useEffect } from 'react';
import { useStore } from 'zustand';
import { t } from '../../i18n/t';
import { toastStore } from '../../store/toastStore';
import { uiStore } from '../../store/uiStore';
import { ActionButton } from '../common/ActionButton';
import { CurrencyText } from '../common/CurrencyText';

const TOAST_DURATION_MS = 3000;
const TOAST_WITH_TARGET_DURATION_MS = 7000;

export function Toast() {
  const toast = useStore(toastStore, (store) => store.toast);
  const text = useStore(toastStore, (store) => store.text);
  const target = useStore(toastStore, (store) => store.target);
  const dismiss = useStore(toastStore, (store) => store.dismiss);

  useEffect(() => {
    if (!toast && !text) return;
    const handle = setTimeout(dismiss, target === null ? TOAST_DURATION_MS : TOAST_WITH_TARGET_DURATION_MS);
    return () => clearTimeout(handle);
  }, [toast, text, target, dismiss]);

  const message = toast ? t(toast) : text;
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <CurrencyText text={message} />
      {target === null ? null : (
        <ActionButton size="xs" className="toast-action" onClick={() => {
          uiStore.getState().select(target);
          uiStore.getState().showBuilding(target);
          dismiss();
        }}>
          {t('toast.see')}
        </ActionButton>
      )}
    </div>
  );
}
