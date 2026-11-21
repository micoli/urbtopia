import { useState } from 'react';
import { useStore } from 'zustand';
import { isArchitectOffice } from '../../core';
import { architectStore } from '../../store/architectStore';
import { ArchitectStudio } from '../../architect/ArchitectStudio';
import { t } from '../../i18n/t';
import { CloseButton } from '../common/CloseButton';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';
import { useGame } from '../common/hooks';
import { useFeatureFlag } from '../../featureFlags/useFeatureFlag';
import { useCityPlanLibrary } from './useCityPlanLibrary';

export function ArchitectDialog() {
  const officeId = useStore(architectStore, store => store.officeId);
  const enabled = useFeatureFlag('architect');
  const library = useCityPlanLibrary();
  const [full, setFull] = useState(true);
  const building = useGame(store => (officeId === null ? undefined : store.state.buildings.find(candidate => candidate.id === officeId)));
  if (!enabled || !building || !isArchitectOffice(building)) return null;
  return (
    <div className={`dialog-backdrop window-backdrop city-management-backdrop architect-backdrop${full ? ' architect-backdrop--full' : ''}`}>
      <div className="eco-dashboard architect-window" role="dialog" aria-modal="true" aria-labelledby="architect-heading">
        <header className="eco-header">
          <h2 id="architect-heading">{t('architect.title')}</h2>
          <IconButton label={t(full ? 'architect.exitFullScreen' : 'architect.fullScreen')} onClick={() => setFull(!full)}>
            <Icon name={full ? 'minimize' : 'maximize'} />
          </IconButton>
          <CloseButton onClick={() => architectStore.getState().close()} />
        </header>
        <div className="architect-screen">
          <ArchitectStudio library={library} tier={building.tier} />
        </div>
      </div>
    </div>
  );
}
