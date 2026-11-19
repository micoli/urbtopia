import { districtCapOf, districtRadiusOf, districtRankOf, officeBonusOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { districtStore } from '../../store/districtStore';
import { uiStore } from '../../store/uiStore';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { Icon } from '../common/Icon';
import { Note } from '../common/Note';

// The bonus is a share of a cap, so it can carry a long fraction: it shows with one decimal.
const oneDecimal = (value: number): number => Math.round(value * 10) / 10;

interface DistrictPanelProps {
  building: Building;
}

export function DistrictPanel({ building }: DistrictPanelProps) {
  const best = building.district?.best;
  const rank = best ? districtRankOf(best.score, best.game.deckSize) : undefined;
  const side = 2 * districtRadiusOf(building.tier);
  const open = () => {
    districtStore.getState().open(building.id);
    uiStore.getState().select(null);
  };
  return (
    <DrawerPanel>
      <Note>{t('district.panelIntro')}</Note>
      <DrawerPanel.LabelValue label={t('district.best')} value={best ? `${best.score}` : '—'} />
      <DrawerPanel.LabelValue label={t('district.rank')} value={rank ? t(`district.rank.${rank}`) : t('district.noRank')} />
      <DrawerPanel.LabelValue label={t('district.bonus')} value={`+${oneDecimal(officeBonusOf(building))} / ${districtCapOf(building.tier)}`} />
      <DrawerPanel.LabelValue label={t('facility.reach')} value={`${side} × ${side}`} />
      <ActionButton variant="primary" block onClick={open}><Icon name="play" /> {t('district.open')}</ActionButton>
    </DrawerPanel>
  );
}
