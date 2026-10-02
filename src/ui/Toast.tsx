import { useEffect } from 'react';
import { t } from '../i18n/t';
import { useUi } from './hooks';

const TOAST_DURATION_MS = 3000;

export function Toast() {
  const toast = useUi((store) => store.toast);
  const dismiss = useUi((store) => store.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const handle = setTimeout(dismiss, TOAST_DURATION_MS);
    return () => clearTimeout(handle);
  }, [toast, dismiss]);

  if (!toast) return null;
  return (
    <div className="toast" role="status">
      {t(toast)}
    </div>
  );
}
