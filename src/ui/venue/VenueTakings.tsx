import { VENUE, isVenue, playsCapacityPerHour, takingsDue, takingsPerHour, visitorsPerHour, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { useGame } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';

interface VenueTakingsProps {
  building: Building;
}

export function VenueTakings({ building }: VenueTakingsProps) {
  const state = useGame(store => store.state);
  if (!isVenue(building)) return null;
  const due = takingsDue(building.venue);
  const full = building.venue.takings >= VENUE.takingsCap;
  return (
    <>
      <DrawerPanel.LabelValue label={t('venue.visitors')} value={visitorsPerHour(state, building).toFixed(1)} />
      <DrawerPanel.LabelValue label={t('venue.capacity')} value={playsCapacityPerHour(building.venue)} />
      <DrawerPanel.LabelValue label={t('venue.earnings')} value={<UrbsAmount value={takingsPerHour(state, building)} />} />
      {building.venue.fixtures.length === 0 ? <p className="note note--warn">{t('venue.noFixture')}</p> : null}
      {full ? <p className="note note--warn">{t('venue.cap')}</p> : null}
      <ActionButton variant="primary" block disabled={due === 0} onClick={() => gameStore.getState().send({ type: 'Collect', buildingId: building.id })}>
        {t('venue.collect')} · <UrbsAmount value={due} />
      </ActionButton>
    </>
  );
}
