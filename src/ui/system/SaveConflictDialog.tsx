import { t } from '../../i18n/t';
import type { SaveConflict, SaveConflictChoice } from '../../persistence/cloud/cloudSync';
import { Dialog } from '../common/Dialog';
import { ConflictCity } from './ConflictCity';

interface SaveConflictDialogProps {
  conflict: SaveConflict;
  onChoose: (choice: SaveConflictChoice) => void;
}

export function SaveConflictDialog({ conflict, onChoose }: SaveConflictDialogProps) {
  return (
    <Dialog role="alertdialog">
      <Dialog.Title>{t('cloud.conflict.title')}</Dialog.Title>
      <Dialog.Body>
        <p>{t('cloud.conflict.text')}</p>
        <div className="conflict-cities">
          <ConflictCity title={t('cloud.conflict.local')} city={conflict.local} keepLabel={t('cloud.conflict.keepLocal')} onKeep={() => onChoose('local')} />
          <ConflictCity title={t('cloud.conflict.cloud')} city={conflict.cloud} keepLabel={t('cloud.conflict.keepCloud')} onKeep={() => onChoose('cloud')} />
        </div>
      </Dialog.Body>
    </Dialog>
  );
}
