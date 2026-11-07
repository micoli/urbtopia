import { useEffect } from 'react';
import { useStore } from 'zustand';
import { useFeatureFlag } from '../../featureFlags/useFeatureFlag';
import { t } from '../../i18n/t';
import { clubStore, type ClubTabId } from '../../store/clubStore';
import { sceneHandle } from '../../store/sceneHandle';
import { ActionButton } from '../common/ActionButton';
import { useGame } from '../common/hooks';
import { Tabs } from '../common/Tabs';
import { BaseballLineupTab } from './BaseballLineupTab';
import { BaseballMatchTab } from './BaseballMatchTab';
import { BasketballLineupTab } from './BasketballLineupTab';
import { BasketballMatchTab } from './BasketballMatchTab';
import { ClubLineupTab } from './ClubLineupTab';
import { ClubMarketTab } from './ClubMarketTab';
import { ClubMatchTab } from './ClubMatchTab';
import { ClubSquadTab } from './ClubSquadTab';
import { ClubSummary } from './ClubSummary';
import { ClubTableTab } from './ClubTableTab';
import type { IconName } from '../common/iconRegistry';

const TABS: readonly { id: ClubTabId; icon: IconName }[] = [
  { id: 'squad', icon: 'citizens' },
  { id: 'lineup', icon: 'needs' },
  { id: 'market', icon: 'recruit' },
  { id: 'match', icon: 'medal' },
  { id: 'table', icon: 'trophy' },
];

const LINEUP_TABS = { football: ClubLineupTab, baseball: BaseballLineupTab, basketball: BasketballLineupTab };
const MATCH_TABS = { football: ClubMatchTab, baseball: BaseballMatchTab, basketball: BasketballMatchTab };

export function ClubDialog() {
  const buildingId = useStore(clubStore, store => store.buildingId);
  const tab = useStore(clubStore, store => store.tab);
  const building = useGame(store => (buildingId === null ? undefined : store.state.buildings.find(candidate => candidate.id === buildingId)));
  const enabled = useFeatureFlag('clubs');
  const open = enabled && building?.club !== undefined;

  useEffect(() => {
    if (!open) return;
    sceneHandle.current?.setPaused(true);
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && clubStore.getState().close();
    window.addEventListener('keydown', onKey);
    return () => {
      sceneHandle.current?.setPaused(false);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open || !building?.club) return null;
  const LineupTab = LINEUP_TABS[building.club.sport];
  const MatchTab = MATCH_TABS[building.club.sport];
  return (
    <div className="club-view" role="dialog" aria-modal="true" aria-label={t('club.title')}>
      <header className="club-view__header">
        <h2>{building.club.name}</h2>
        <ActionButton variant="default" onClick={() => clubStore.getState().close()}>{t('club.close')}</ActionButton>
      </header>
      <ClubSummary building={building} />
      <Tabs label={t('club.title')} idPrefix="club-tab" panelId="club-panel" tabs={TABS.map(({ id, icon }) => ({ id, icon, label: t(`club.tab.${id}`) }))} selected={tab} onSelect={id => clubStore.getState().select(id)} />
      <div id="club-panel" role="tabpanel" aria-labelledby={`club-tab-${tab}`} className="club-view__panel">
        {tab === 'squad' ? <ClubSquadTab building={building} /> : null}
        {tab === 'lineup' ? <LineupTab building={building} /> : null}
        {tab === 'market' ? <ClubMarketTab building={building} /> : null}
        {tab === 'match' ? <MatchTab building={building} /> : null}
        {tab === 'table' ? <ClubTableTab building={building} /> : null}
      </div>
    </div>
  );
}
