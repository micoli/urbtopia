import { useEffect, useState } from 'react';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { useUi } from '../common/hooks';

const HINT_DURATION_MS = 3000;

export function StreetViewHud() {
  const exitStreetView = useUi((store) => store.exitStreetView);
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    const handle = setTimeout(() => setHintVisible(false), HINT_DURATION_MS);
    return () => clearTimeout(handle);
  }, []);

  return (
    <>
      <ActionButton variant="primary" className="street-view-exit" onClick={exitStreetView}>
        {t('streetView.exit')}
      </ActionButton>
      {hintVisible ? <p className="street-view-hint" role="status">{t('streetView.hint')}</p> : null}
    </>
  );
}
