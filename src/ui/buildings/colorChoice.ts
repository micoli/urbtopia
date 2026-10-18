import { colorVariantsOf, paintKitAt, toneLabelOf, type BuildingType, type ColorVariant, type PaintKit } from '../../core';
import type { MessageKey } from '../../i18n/messages';

const KIT_STYLE: Record<PaintKit, { labels: string; swatch: string }> = {
  suburban: { labels: 'build.homeColor', swatch: '' },
  palette: { labels: 'build.homeColor', swatch: '' },
  commercial: { labels: 'build.commercialColor', swatch: 'commercial-' },
  industrial: { labels: 'build.industrialColor', swatch: 'industrial-' },
};

export interface ColorChoice {
  label: MessageKey;
  swatchClassName: string;
  swatchColor?: string;
}

export function colorChoiceOf(type: BuildingType, tier: number, variant: ColorVariant): ColorChoice | undefined {
  const kit = paintKitAt(type, tier);
  if (!kit || !colorVariantsOf(type, tier).includes(variant)) return undefined;
  const style = KIT_STYLE[kit];
  const tone = kit === 'palette' ? toneLabelOf(type, tier, variant) : undefined;
  return tone
    ? { label: `color.${tone.name}` as MessageKey, swatchClassName: 'home-color-swatch', swatchColor: tone.color }
    : { label: `${style.labels}.${variant}` as MessageKey, swatchClassName: `home-color-swatch home-color-swatch-${style.swatch}${variant}` };
}
