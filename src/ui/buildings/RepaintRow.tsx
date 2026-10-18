import { ECOLOGY, colorVariantsOf, type Building } from '../../core';
import { colorChoiceOf } from './colorChoice';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { BlockedReason } from '../common/BlockedReason';
import { FirstUseHint } from '../common/FirstUseHint';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { UrbsAmount } from '../common/UrbsAmount';
import { urbsReason } from '../common/urbsReason';

interface RepaintRowProps {
  building: Building;
}

export function RepaintRow({ building }: RepaintRowProps) {
  const urbs = useGame(s => s.state.urbs);
  const cost = ECOLOGY.repaintCost * building.tier;
  const current = building.colorVariant ?? 'default';
  return <div>
    <FirstUseHint id="repaint">{t('hint.repaint')}</FirstUseHint>
    <p>{t('eco.repaint')} · <UrbsAmount value={cost} /></p>
    <BlockedReason reason={urbsReason(urbs, cost)} />
    <RadioChipGroup
      className="home-color-picker"
      label={t('eco.repaint')}
      disabled={urbs < cost}
      options={colorVariantsOf(building.type, building.tier)
          .filter(variant => variant !== current)
          .flatMap(variant => {
            const choice = colorChoiceOf(building.type, building.tier, variant);
            if (!choice) return [];
            return [{
              value: variant,
              label: <>
                <span
                  className={choice.swatchClassName}
                  style={choice.swatchColor ? { background: choice.swatchColor } : undefined}
                  aria-hidden="true"
                /><span>
                  {t(choice.label)}
                </span>
              </>,
            }];
          })
      }
      value={current}
      onChange={colorVariant => gameStore.getState().send({ type: 'RepaintBuilding', buildingId: building.id, colorVariant })}
    />
  </div>;
}
