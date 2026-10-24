import type { ColorVariant } from '../core';
import { t } from '../i18n/t';

interface ColorPickerProps {
  variants: readonly ColorVariant[];
  value: ColorVariant;
  onChange: (variant: ColorVariant) => void;
}

export function ColorPicker({ variants, value, onChange }: ColorPickerProps) {
  return (
    <div role="radiogroup" aria-label={t('build.homeColor')} className="flex flex-wrap gap-2">
      {variants.map(variant => (
        <button key={variant} type="button" role="radio" aria-checked={variant === value} className="guide-chip inline-flex items-center gap-2 aria-checked:border-accent" onClick={() => onChange(variant)}>
          <span className={`guide-swatch guide-swatch-${variant}`} aria-hidden="true" />
          {t(`build.homeColor.${variant}` as const)}
        </button>
      ))}
    </div>
  );
}
