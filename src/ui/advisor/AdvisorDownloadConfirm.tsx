import { ADVISOR_MODEL } from '../../advisor/advisorModel';
import { advisorStore } from '../../advisor/advisorStore';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { Dialog } from '../common/Dialog';
import { useAdvisor } from './useAdvisor';

export function AdvisorDownloadConfirm() {
  const confirming = useAdvisor((store) => store.phase === 'confirming');
  if (!confirming) return null;
  const { cancelEnable, confirmEnable } = advisorStore.getState();
  return (
    <Dialog>
      <Dialog.Title>{t('advisor.confirm.title')}</Dialog.Title>
      <Dialog.Body>
        <p>{t('advisor.confirm.body').replace('{size}', String(ADVISOR_MODEL.downloadMb))}</p>
      </Dialog.Body>
      <Dialog.Actions>
        <ActionButton onClick={cancelEnable}>{t('advisor.confirm.cancel')}</ActionButton>
        <ActionButton variant="primary" onClick={() => void confirmEnable()}>{t('advisor.confirm.download')}</ActionButton>
      </Dialog.Actions>
    </Dialog>
  );
}
