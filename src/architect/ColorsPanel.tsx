import { Dropdown, type DropdownOption } from '../ui/common/Dropdown.tsx';
import { ROOF_SWATCHES, WALL_SWATCHES, type Swatch } from './editorConstants.ts';
import { t } from '../i18n/t';
import { roofSwatchCountOf, wallSwatchCountOf } from '../core/architect/architectTiers.ts';
import { useStudioTier } from './studioTier.ts';

type ColorKey = 'wallColor' | 'roofColor';

function ColorField({ label, swatches, unlocked, value, onPick }: { label: string; swatches: Swatch[]; unlocked: number; value: string; onPick: (color: string) => void }) {
  const entry = (name: string, color: string, disabled = false): DropdownOption<string> => ({
    value: color,
    disabled,
    label: (
      <>
        <i className="studio-swatch" style={{ background: color }} />
        {name}
      </>
    ),
  });
  const known = swatches.some((swatch) => swatch.color.toLowerCase() === value.toLowerCase());
  const options = [...(known ? [] : [entry(`${t('architect.color.custom')} (${value})`, value, true)]), ...swatches.map(({ name, color }, index) => entry(name, color, index >= unlocked))];
  const selected = swatches.find((swatch) => swatch.color.toLowerCase() === value.toLowerCase())?.color ?? value;
  return (
    <div className="studio-colour">
      <span>{label}</span>
      <Dropdown label={label} className="dropdown--fill" options={options} value={selected} onChange={onPick} />
    </div>
  );
}

interface ColorsPanelProps {
  wallColor: string;
  roofColor: string;
  onPick: (key: ColorKey, value: string) => void;
}

export function ColorsPanel({ wallColor, roofColor, onPick }: ColorsPanelProps) {
  const tier = useStudioTier();
  return (
    <div>
      <ColorField label={t('architect.color.wall')} swatches={WALL_SWATCHES} unlocked={wallSwatchCountOf(tier)} value={wallColor} onPick={(value) => onPick('wallColor', value)} />
      <ColorField label={t('architect.color.roof')} swatches={ROOF_SWATCHES} unlocked={roofSwatchCountOf(tier)} value={roofColor} onPick={(value) => onPick('roofColor', value)} />
    </div>
  );
}
