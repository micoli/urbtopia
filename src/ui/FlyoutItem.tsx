import type { ReactNode } from 'react';
import { t } from '../i18n/t';
import type { CodexId } from '../codex/catalog';

interface FlyoutItemProps {
  label: string;
  cost?: ReactNode;
  guided?: boolean;
  onChoose: () => void;
  codexId?: CodexId;
  onInfo?: () => void;
}

export function FlyoutItem({ label, cost, guided = false, onChoose, codexId, onInfo }: FlyoutItemProps) {
  const item = (
    <button type="button" className="flyout-item" data-guided={guided} onClick={onChoose}>
      <span>{label}</span>
      {cost ? <span className="flyout-cost">{cost}</span> : null}
    </button>
  );
  if (!onInfo) return item;
  return (
    <div className="flyout-row">
      {item}
      <button type="button" className="flyout-info" data-codex-id={codexId} aria-label={t('codex.about').replace('{name}', label)} onClick={onInfo}>?</button>
    </div>
  );
}
