import { useState } from 'react';
import type { DeletionBlocker } from '../../persistence/cityDeletion';
import type { DeleteOutcome } from '../../persistence/cityLifecycle';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { Note } from '../common/Note';
import { TextField } from '../common/TextField';

interface DeleteCityButtonProps {
  cityName: string;
  isLast: boolean;
  onDelete: () => Promise<DeleteOutcome>;
}

export function DeleteCityButton({ cityName, isLast, onDelete }: DeleteCityButtonProps) {
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState('');
  const [blockers, setBlockers] = useState<DeletionBlocker[]>([]);

  if (isLast) return <Note tone="muted">{t('cities.deleteLast')}</Note>;
  if (!typing) {
    return (
      <>
        <ActionButton onClick={() => { setBlockers([]); setTyping(true); }}>{t('cities.delete')}</ActionButton>
        <Blockers blockers={blockers} />
      </>
    );
  }

  const confirm = async () => {
    const outcome = await onDelete();
    if (outcome.kind !== 'blocked') return;
    setBlockers(outcome.blockers);
    setTyping(false);
    setTyped('');
  };

  return (
    <div className="city-delete">
      <Note tone="muted">{t('cities.deleteTyped')}</Note>
      <TextField label={t('cities.nameLabel')} value={typed} placeholder={cityName} onChange={setTyped} />
      <ActionButton onClick={() => setTyping(false)}>{t('sale.no')}</ActionButton>
      <ActionButton variant="danger" disabled={typed !== cityName} onClick={() => void confirm()}>
        {t('cities.delete')}
      </ActionButton>
    </div>
  );
}

function Blockers({ blockers }: { blockers: DeletionBlocker[] }) {
  if (blockers.length === 0) return null;
  return (
    <Note>
      {t('cities.blockedTitle')} {blockers.map((blocker) => t(`cities.blocked.${blocker}`)).join(', ')}
    </Note>
  );
}
