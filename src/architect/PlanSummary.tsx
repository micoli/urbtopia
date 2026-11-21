import type { ReactNode } from 'react';
import { stats, type Plan } from '../core/architect/housePlan.ts';
import { t } from '../i18n/t';
import { UrbsSymbol } from '../ui/common/UrbsSymbol.tsx';
import { PlanThumbnail } from './PlanThumbnail.tsx';

interface PlanSummaryProps {
  name: string;
  plan: Plan;
  houses?: number;
  badge?: ReactNode;
}

// The picture, the name, the cost and the houses of a plan: the head of every card of the list.
export function PlanSummary({ name, plan, houses, badge }: PlanSummaryProps) {
  return (
    <div className="studio-saved__head">
      <PlanThumbnail plan={plan} />
      <div className="studio-saved__info">
        <span className="studio-saved__name">{name}</span>
        <span className="studio-saved__meta">
          <strong>{stats(plan).cost}</strong> <UrbsSymbol />
          {houses !== undefined && <> · {t(houses > 1 ? 'architect.plan.houses' : 'architect.plan.house').replace('{count}', String(houses))}</>}
        </span>
        {badge}
      </div>
    </div>
  );
}
