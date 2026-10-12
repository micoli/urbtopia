import { ECOLOGY, colorVariantsOf, paintKitAt, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { UrbsAmount } from '../common/UrbsAmount';

interface RepaintRowProps {
  building: Building;
}

export function RepaintRow({ building }: RepaintRowProps) {
  const urbs = useGame(s => s.state.urbs);
  const cost = ECOLOGY.repaintCost * building.tier;
  const current = building.colorVariant ?? 'default';
  const kit = paintKitAt(building.type, building.tier);
  const ownPalette = kit === 'commercial' || kit === 'industrial';
  const swatchKit = ownPalette ? `${kit}-` : '';
  return <div>
    <p>{t('eco.repaint')} · <UrbsAmount value={cost} /></p>
    <RadioChipGroup
      className="home-color-picker"
      label={t('eco.repaint')}
      disabled={urbs < cost}
      options={colorVariantsOf(building.type, building.tier)
          .filter(variant => variant !== current)
          .map(variant => ({
            value: variant,
            label: <>
              <span
                className={`home-color-swatch home-color-swatch-${swatchKit}${variant}`}
                aria-hidden="true"
              /><span>
                {t(kit === 'commercial' ? `build.commercialColor.${variant as 'default' | 'a' | 'b'}` : kit === 'industrial' ? `build.industrialColor.${variant}` : `build.homeColor.${variant}`)}
              </span>
            </>,
          }))
      }
      value={current}
      onChange={colorVariant => gameStore.getState().send({ type: 'RepaintBuilding', buildingId: building.id, colorVariant })}
    />
  </div>;
}
