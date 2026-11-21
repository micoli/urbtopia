import { ActionButton } from '../ui/common/ActionButton.tsx';
import { t } from '../i18n/t';
import { SHAPE_LABEL } from './labels.ts';
import { SHAPES, type Shape } from '../core/architect/housePlan.ts';
import { ShapePreview } from './ShapePreview.tsx';

interface TemplatePickerProps {
  onPick: (shape: Shape) => void;
  onCancel: () => void;
}

export function TemplatePicker({ onPick, onCancel }: TemplatePickerProps) {
  return (
    <div>
      <p className="studio-hint">{t('architect.plans.pickShape')}</p>
      <div className="studio-templates">
        {SHAPES.map((shape) => (
          <button key={shape} type="button" className="studio-template" onClick={() => onPick(shape)}>
            <ShapePreview shape={shape} />
            <span>{SHAPE_LABEL[shape]}</span>
          </button>
        ))}
      </div>
      <ActionButton size="sm" onClick={onCancel}>
        {t('architect.plans.cancel')}
      </ActionButton>
    </div>
  );
}
