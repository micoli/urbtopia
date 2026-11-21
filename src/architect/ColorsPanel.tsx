import { CheckboxField } from '../ui/common/CheckboxField.tsx';
import { ROOF_SWATCHES, WALL_SWATCHES } from './editorConstants.ts';
import { t } from '../i18n/t';
import { ColorField } from './ColorField.tsx';
import { roofSwatchCountOf, wallSwatchCountOf } from '../core/architect/architectTiers.ts';
import { useStudioTier } from './studioTier.ts';

type ColorKey = 'wallColor' | 'roofColor';

interface ColorsPanelProps {
  wallColor: string;
  roofColor: string;
  plinth: boolean;
  onPick: (key: ColorKey, value: string) => void;
  onPlinth: (on: boolean) => void;
}

export function ColorsPanel({ wallColor, roofColor, plinth, onPick, onPlinth }: ColorsPanelProps) {
  const tier = useStudioTier();
  return (
    <div>
      <ColorField label={t('architect.color.wall')} swatches={WALL_SWATCHES} unlocked={wallSwatchCountOf(tier)} value={wallColor} onPick={(value) => onPick('wallColor', value)} />
      <ColorField label={t('architect.color.roof')} swatches={ROOF_SWATCHES} unlocked={roofSwatchCountOf(tier)} value={roofColor} onPick={(value) => onPick('roofColor', value)} />
      <CheckboxField label={t('architect.plinth')} checked={plinth} onChange={onPlinth} />
    </div>
  );
}
