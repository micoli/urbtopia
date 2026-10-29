import { useEffect } from 'react';
import { useStore } from 'zustand';
import { t } from '../../i18n/t';
import { clubStore, type ClubTabId } from '../../store/clubStore';
import { sceneHandle } from '../../store/sceneHandle';
import { ActionButton } from '../common/ActionButton';
import { useGame } from '../common/hooks';
import { Tabs } from '../common/Tabs';
import { ClubLineupTab } from './ClubLineupTab';
import { ClubMarketTab } from './ClubMarketTab';
import { ClubMatchTab } from './ClubMatchTab';
import { ClubSquadTab } from './ClubSquadTab';
import { ClubSummary } from './ClubSummary';
import { ClubTableTab } from './ClubTableTab';

const TABS: ClubTabId[] = ['squad', 'lineup', 'market', 'match', 'table'];

export function ClubDialog() {
  const buildingId = useStore(clubStore, store => store.buildingId);
  const tab = useStore(clubStore, store => store.tab);
  const building = useGame(store => (buildingId === null ? undefined : store.state.buildings.find(candidate => candidate.id === buildingId)));
  const open = building?.club !== undefined;

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

  if (!building?.club) return null;
  return (
    <div className="club-view" role="dialog" aria-modal="true" aria-label={t('club.title')}>
      <header className="club-view__header">
        <h2>{building.club.name}</h2>
        <ActionButton variant="default" onClick={() => clubStore.getState().close()}>{t('club.close')}</ActionButton>
      </header>
      <ClubSummary building={building} />
      <Tabs label={t('club.title')} idPrefix="club-tab" panelId="club-panel" tabs={TABS.map(id => ({ id, label: t(`club.tab.${id}`) }))} selected={tab} onSelect={id => clubStore.getState().select(id)} />
      <div id="club-panel" role="tabpanel" aria-labelledby={`club-tab-${tab}`} className="club-view__panel">
        {tab === 'squad' ? <ClubSquadTab building={building} /> : null}
        {tab === 'lineup' ? <ClubLineupTab building={building} /> : null}
        {tab === 'market' ? <ClubMarketTab building={building} /> : null}
        {tab === 'match' ? <ClubMatchTab building={building} /> : null}
        {tab === 'table' ? <ClubTableTab building={building} /> : null}
      </div>
    </div>
  );
}
