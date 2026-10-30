import { clubRankOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { DrawerPanel } from '../common/DrawerPanel';
import { UrbsAmount } from '../common/UrbsAmount';

export function ClubSummary({ building }: { building: Building }) {
  const club = building.club!;
  return (
    <DrawerPanel>
      <DrawerPanel.LabelValue label={t('club.budget')} value={<UrbsAmount value={Math.floor(club.budget)} />} />
      <DrawerPanel.LabelValue label={t('club.year')} value={club.year} />
      <DrawerPanel.LabelValue label={t('club.fame')} value={`${club.fame} / 5`} />
      {club.championship ? <DrawerPanel.LabelValue label={t('club.rank')} value={clubRankOf(club.championship)} /> : null}
    </DrawerPanel>
  );
}
