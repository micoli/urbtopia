import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { useUi } from '../common/hooks';

export function StreetViewDropHint() {
  const picking = useUi((store) => store.streetViewPicking);
  const cancel = useUi((store) => store.cancelPickStreetView);
  if (!picking) return null;

  return (
    <>
      <ActionButton className="street-view-exit" onClick={cancel}>
        {t('streetView.cancelDrop')}
      </ActionButton>
      <p className="street-view-hint" role="status">{t('streetView.drop')}</p>
    </>
  );
}
