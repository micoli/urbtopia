import type { ReactNode } from 'react';
import { t } from '../../i18n/t';
import { Icon } from '../common/Icon';

interface MiniBarProps {
  icon: ReactNode;
  title: string;
  onExpand: () => void;
}

export function MiniBar({ icon, title, onExpand }: MiniBarProps) {
  return (
    <button type="button" className="selection-mini-bar" aria-label={t('selection.expand')} onClick={onExpand}>
      {icon}
      <span className="selection-mini-bar__title">{title}</span>
      <Icon name="chevronUp" />
    </button>
  );
}
