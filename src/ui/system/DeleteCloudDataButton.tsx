import { useState } from 'react';
import { t } from '../../i18n/t';
import { InlineConfirm } from '../common/InlineConfirm';

interface DeleteCloudDataButtonProps {
  onDelete: () => void;
}

export function DeleteCloudDataButton({ onDelete }: DeleteCloudDataButtonProps) {
  const [confirming, setConfirming] = useState(false);
  return (
    <InlineConfirm
      confirming={confirming}
      triggerLabel={t('cloud.delete')}
      confirmLabel={t('cloud.delete')}
      message={t('cloud.deleteConfirm')}
      onRequest={() => setConfirming(true)}
      onCancel={() => setConfirming(false)}
      onConfirm={() => {
        setConfirming(false);
        onDelete();
      }}
    />
  );
}
