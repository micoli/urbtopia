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
  icon?: string;
}

export function FlyoutItem({ label, badge, cost, guided = false, onChoose, codexId, onInfo, preview, icon }: FlyoutItemProps) {
  const item = (
      <button type="button" className="flyout-item" data-guided={guided} data-codex-label={onInfo ? codexId : undefined} onClick={onInfo ?? onChoose}>
      <span>{label}</span>
      {badge ? <small className="flyout-badge">{badge}</small> : null}
    </button>
  );
  if (!onInfo && !icon) return item;
  const picture = icon ? `${import.meta.env.BASE_URL}assets/icons/${icon}` : preview;
  return (
    <div className="flyout-row">
      {item}
      <button type="button" className="flyout-info" data-codex-id={codexId} aria-label={onInfo ? t('codex.about').replace('{name}', label) : label} onClick={onChoose}>
        {cost ? <small className="flyout-cost">{cost}</small> : null}
        {picture ? <img src={picture} width={44} height={38} alt="" loading="lazy" /> : <span aria-hidden="true">📖</span>}
      </button>
    </div>
  );
}
