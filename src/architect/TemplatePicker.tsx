import { useMemo } from 'react';
import { ActionButton } from '../ui/common/ActionButton.tsx';
import { t } from '../i18n/t';
import { SHAPE_LABEL } from './labels.ts';
import { SHAPES, newPlan, type Shape } from '../core/architect/housePlan.ts';
import { tierRequiredBy } from '../core/architect/architectTiers.ts';
import { useStudioTier } from './studioTier.ts';
import { PlanThumbnail } from './PlanThumbnail.tsx';

interface TemplatePickerProps {
  onPick: (shape: Shape) => void;
  onCancel: () => void;
}

export function TemplatePicker({ onPick, onCancel }: TemplatePickerProps) {
  const tier = useStudioTier();
  const models = useMemo(() => SHAPES.map((shape) => { const plan = newPlan(shape); return { shape, plan, tierNeeded: tierRequiredBy(plan) }; }), []);
  return (
    <div>
      <p className="studio-hint">{t('architect.plans.pickShape')}</p>
      <div className="studio-templates">
        {models.map(({ shape, plan, tierNeeded }) => (
          <button key={shape} type="button" className="studio-template" disabled={tierNeeded > Math.max(1, tier)} onClick={() => onPick(shape)}>
            <PlanThumbnail plan={plan} />
            <span>{SHAPE_LABEL[shape]}</span>
            {tierNeeded > 1 && <span className="studio-template__tier">{t('architect.tierNeeded')} {tierNeeded}</span>}
          </button>
        ))}
      </div>
      <ActionButton size="sm" onClick={onCancel}>
        {t('architect.plans.cancel')}
      </ActionButton>
    </div>
  );
}
