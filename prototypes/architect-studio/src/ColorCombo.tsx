import * as RadixSelect from '@radix-ui/react-select';
import type { Swatch } from './editorConstants.ts';

interface ColorComboProps {
  label: string;
  swatches: Swatch[];
  value: string;
  onPick: (color: string) => void;
}

function Option({ name, color, disabled }: Swatch & { disabled?: boolean }) {
  return (
    <RadixSelect.Item className="combo-item" value={color} disabled={disabled}>
      <i className="swatch-preview" style={{ background: color }} />
      <RadixSelect.ItemText>{name}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}

export function ColorCombo({ label, swatches, value, onPick }: ColorComboProps) {
  const known = swatches.some((swatch) => swatch.color.toLowerCase() === value.toLowerCase());
  const current = swatches.find((swatch) => swatch.color.toLowerCase() === value.toLowerCase())?.color ?? value;
  return (
    <div className="row combo">
      <span>{label}</span>
      <RadixSelect.Root value={current} onValueChange={onPick}>
        <RadixSelect.Trigger className="combo-trigger" aria-label={label}>
          <RadixSelect.Value />
          <RadixSelect.Icon>▾</RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content className="combo-content" position="popper" sideOffset={4}>
            <RadixSelect.Viewport>
              {!known && <Option name={`Personnalisée (${value})`} color={value} disabled />}
              {swatches.map((swatch) => (
                <Option key={swatch.color} {...swatch} />
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      <i className="swatch-preview" style={{ background: value }} />
    </div>
  );
}
