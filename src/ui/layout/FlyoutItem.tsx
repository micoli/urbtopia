import type { ReactNode } from 'react';
import { t } from '../../i18n/t';
import type { CodexId } from '../../codex/catalog';

interface FlyoutItemProps {
  label: string;
  badge?: string;
  cost?: ReactNode;
  guided?: boolean;
  onChoose: () => void;
  codexId?: CodexId;
  onInfo?: () => void;
  preview?: string;
}

export function FlyoutItem({ label, badge, cost, guided = false, onChoose, codexId, onInfo, preview }: FlyoutItemProps) {
  const item = (
      <button type="button" className="flyout-item" data-guided={guided} data-codex-label={onInfo ? codexId : undefined} onClick={onInfo ?? onChoose}>
      <span>{label}</span>
      {badge ? <small className="flyout-badge">{badge}</small> : null}
    </button>
  );
  if (!onInfo) return item;
  return (
    <div className="flyout-row">
      {item}
      <button type="button" className="flyout-info" data-codex-id={codexId} aria-label={t('codex.about').replace('{name}', label)} onClick={onChoose}>
        {cost ? <small className="flyout-cost">{cost}</small> : null}
        {preview ? <img src={preview} width={44} height={38} alt="" loading="lazy" /> : <span aria-hidden="true">📖</span>}
      </button>
    </div>
  );
}
