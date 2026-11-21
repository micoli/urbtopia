import { Dropdown, type DropdownOption } from '../ui/common/Dropdown.tsx';
import { type Swatch } from './editorConstants.ts';
import { t } from '../i18n/t';

interface ColorFieldProps {
  label: string;
  swatches: Swatch[];
  unlocked: number;
  value: string;
  onPick: (color: string) => void;
}

export function ColorField({ label, swatches, unlocked, value, onPick }: ColorFieldProps) {
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
