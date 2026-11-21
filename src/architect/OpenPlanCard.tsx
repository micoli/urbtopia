import type { ReactNode } from 'react';
import { ActionButton } from '../ui/common/ActionButton.tsx';
import { Icon } from '../ui/common/Icon.tsx';
import { TextFieldWithEditor } from '../ui/common/TextFieldWithEditor.tsx';
import { t } from '../i18n/t';
import type { Plan } from '../core/architect/housePlan.ts';
import { PlanSummary } from './PlanSummary.tsx';

export type OpenPlanStatus = 'new' | 'edited' | 'saved';

interface OpenPlanCardProps {
  name: string;
  plan: Plan;
  status: OpenPlanStatus;
  houses?: number;
  onName: (name: string) => void;
  onContinue: () => void;
  onSave: () => void;
  onClosePlan: () => void;
  children?: ReactNode;
}

// The plan being edited, at the top of the list: its status, the way back to the editor and what saves or closes it.
export function OpenPlanCard({ name, plan, status, houses, onName, onContinue, onSave, onClosePlan, children }: OpenPlanCardProps) {
  return (
    <li className="studio-saved studio-saved--open" aria-current="true">
      <PlanSummary
        name={name || t('architect.plan.name')}
        plan={plan}
        houses={houses}
        badge={
          <span className="studio-saved__badge" data-status={status}>
            {t(`architect.plans.status.${status}`)}
          </span>
        }
      />
      <TextFieldWithEditor label={t('architect.plan.name')} placeholder={t('architect.plan.name')} value={name} onChange={onName} onSubmit={onSave} />
      <div className="studio-saved__actions">
        <ActionButton variant="primary" size="sm" onClick={onContinue}>
          <Icon name="edit" /> {t('architect.plans.continue')}
        </ActionButton>
        <ActionButton size="sm" disabled={status === 'saved' || name.trim() === ''} onClick={onSave}>
          {t('architect.save')}
        </ActionButton>
        <ActionButton size="sm" onClick={onClosePlan}>
          {t('architect.plans.closePlan')}
        </ActionButton>
      </div>
      {children}
    </li>
  );
}
