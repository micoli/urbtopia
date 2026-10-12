import { ECOLOGY, colorVariantsOf, paintKitAt, type Building, type PaintKit } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { UrbsAmount } from '../common/UrbsAmount';

interface RepaintRowProps {
  building: Building;
}

const KIT_STYLE: Record<PaintKit, { labels: string; swatch: string }> = {
  suburban: { labels: 'build.homeColor', swatch: '' },
  mansard: { labels: 'build.homeColor', swatch: '' },
  commercial: { labels: 'build.commercialColor', swatch: 'commercial-' },
  industrial: { labels: 'build.industrialColor', swatch: 'industrial-' },
};

export function RepaintRow({ building }: RepaintRowProps) {
  const urbs = useGame(s => s.state.urbs);
  const cost = ECOLOGY.repaintCost * building.tier;
  const current = building.colorVariant ?? 'default';
  const style = KIT_STYLE[paintKitAt(building.type, building.tier) ?? 'suburban'];
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
                className={`home-color-swatch home-color-swatch-${style.swatch}${variant}`}
                aria-hidden="true"
              /><span>
                {t(`${style.labels}.${variant}` as MessageKey)}
              </span>
            </>,
          }))
      }
      value={current}
      onChange={colorVariant => gameStore.getState().send({ type: 'RepaintBuilding', buildingId: building.id, colorVariant })}
    />
  </div>;
}
