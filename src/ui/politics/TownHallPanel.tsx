import { approvalOf, difficultyOf, isPoliticsActive, politicsRuleOf, termDaysLeft, type Building } from '../../core';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { Note } from '../common/Note';
import { useGame, useUi } from '../common/hooks';

export function TownHallPanel({ building }: { building: Building }) {
  const state = useGame(store => store.state);
  const openPolitics = useUi(store => store.openPolitics);
  const approval = approvalOf(state);
  const politics = state.politics;
  if (building.type !== 'townHall') return null;
  if (!isPoliticsActive(state) || approval === null || !politics) return <Note tone="muted">{t('politics.inactive')}</Note>;
  const election = politicsRuleOf(difficultyOf(state)).election;
  return (
    <DrawerPanel>
      <DrawerPanel.LabelValue label={t('politics.approval')} value={Math.round(approval)} />
      {election && <DrawerPanel.LabelValue label={t('politics.term').replace('{number}', String(politics.term.number))} value={t('politics.termLeft').replace('{days}', String(termDaysLeft(politics, politics.day)))} />}
      <ActionButton variant="primary" block onClick={openPolitics}>{t('townHall.politics')}</ActionButton>
    </DrawerPanel>
  );
}
