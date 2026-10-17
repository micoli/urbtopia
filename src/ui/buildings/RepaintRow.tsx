import { ECOLOGY, colorVariantsOf, paintKitAt, toneLabelOf, type Building, type PaintKit } from '../../core';
import type { MessageKey } from '../../i18n/messages';
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

const KIT_STYLE: Record<PaintKit, { labels: string; swatch: string }> = {
  suburban: { labels: 'build.homeColor', swatch: '' },
  palette: { labels: 'build.homeColor', swatch: '' },
  commercial: { labels: 'build.commercialColor', swatch: 'commercial-' },
  industrial: { labels: 'build.industrialColor', swatch: 'industrial-' },
};

export function RepaintRow({ building }: RepaintRowProps) {
  const urbs = useGame(s => s.state.urbs);
  const cost = ECOLOGY.repaintCost * building.tier;
  const current = building.colorVariant ?? 'default';
  const kit = paintKitAt(building.type, building.tier) ?? 'suburban';
  const style = KIT_STYLE[kit];
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
          .map(variant => {
            const tone = kit === 'palette' ? toneLabelOf(building.type, building.tier, variant) : undefined;
            return {
              value: variant,
              label: <>
                <span
                  className={tone ? 'home-color-swatch' : `home-color-swatch home-color-swatch-${style.swatch}${variant}`}
                  style={tone ? { background: tone.color } : undefined}
                  aria-hidden="true"
                /><span>
                  {t((tone ? `color.${tone.name}` : `${style.labels}.${variant}`) as MessageKey)}
                </span>
              </>,
            };
          })
      }
      value={current}
      onChange={colorVariant => gameStore.getState().send({ type: 'RepaintBuilding', buildingId: building.id, colorVariant })}
    />
  </div>;
}
