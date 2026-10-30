import type { ReactNode } from 'react';
import { cn } from '../common/cn';

interface SettingRowProps {
  label: string;
  description?: string;
  stacked?: boolean;
  children: ReactNode;
}

export function SettingRow({ label, description, stacked = false, children }: SettingRowProps) {
  return (
    <div className={cn('setting-row', stacked && 'setting-row--stacked')}>
      <div className="setting-text">
        <span className="setting-text__label">{label}</span>
        {description ? <small className="setting-text__description">{description}</small> : null}
      </div>
      <div className="setting-row__control">{children}</div>
    </div>
  );
}
