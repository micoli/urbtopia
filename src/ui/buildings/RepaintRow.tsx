import { ECOLOGY, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { UrbsAmount } from '../common/UrbsAmount';
import { HOME_COLOR_VARIANTS } from './homeColor';

interface RepaintRowProps {
  building: Building;
}

export function RepaintRow({ building }: RepaintRowProps) {
  const urbs = useGame(s => s.state.urbs);
  const cost = ECOLOGY.repaintCost * building.tier;
  const current = building.colorVariant ?? 'default';
  return <div>
    <p>{t('eco.repaint')} · <UrbsAmount value={cost} /></p>
    <RadioChipGroup
      className="home-color-picker"
      label={t('eco.repaint')}
      disabled={urbs < cost}
      options={HOME_COLOR_VARIANTS
          .filter(variant => variant !== current)
          .map(variant => ({
            value: variant,
            label: <>
              <span
                className={`home-color-swatch home-color-swatch-${variant}`}
                aria-hidden="true"
              /><span>
                {t(`build.homeColor.${variant}`)}
              </span>
            </>,
          }))
      }
      value={current}
      onChange={colorVariant => gameStore.getState().send({ type: 'RepaintHome', buildingId: building.id, colorVariant })}
    />
  </div>;
}
