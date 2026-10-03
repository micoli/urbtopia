import { useEffect } from 'react';
import { useStore } from 'zustand';
import { t } from '../i18n/t';
import { toastStore } from '../store/toastStore';
import { CurrencyText } from './CurrencyText';

const TOAST_DURATION_MS = 3000;

export function Toast() {
  const toast = useStore(toastStore, (store) => store.toast);
  const dismiss = useStore(toastStore, (store) => store.dismiss);

  useEffect(() => {
    if (!toast) return;
    const handle = setTimeout(dismiss, TOAST_DURATION_MS);
    return () => clearTimeout(handle);
  }, [toast, dismiss]);

  if (!toast) return null;
  return (
    <div className="toast" role="status">
      <CurrencyText text={t(toast)} />
    </div>
  );
}
