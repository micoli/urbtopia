import { ActionButton } from '../ui/common/ActionButton.tsx';
import { Icon } from '../ui/common/Icon.tsx';
import { IconButton } from '../ui/common/IconButton.tsx';
import { t } from '../i18n/t';
import type { Plan } from '../core/architect/housePlan.ts';
import { PlanSummary } from './PlanSummary.tsx';

interface SavedPlanCardProps {
  name: string;
  plan: Plan;
  houses?: number;
  disabled?: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

export function SavedPlanCard({ name, plan, houses, disabled = false, onOpen, onDelete }: SavedPlanCardProps) {
  return (
    <li className="studio-saved" aria-disabled={disabled || undefined}>
      <PlanSummary name={name} plan={plan} houses={houses} />
      <div className="studio-saved__actions">
        <ActionButton size="sm" disabled={disabled} onClick={onOpen}>
          {t('architect.plans.openSaved')}
        </ActionButton>
        <IconButton label={t('architect.delete')} disabled={disabled} onClick={onDelete}>
          <Icon name="close" />
        </IconButton>
      </div>
    </li>
  );
}
