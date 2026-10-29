import { useState } from 'react';
import { GATHERING, TAKINGS, artistOffer, feeOfArtist, inGatheringCooldown, previewGathering, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { NumberStepper } from '../common/NumberStepper';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { UrbsAmount } from '../common/UrbsAmount';
import { useGame } from '../common/hooks';

interface ShowPanelProps {
  building: Building;
}

export function ShowPanel({ building }: ShowPanelProps) {
  const state = useGame(store => store.state);
  const [startsInHours, setStartsInHours] = useState(1);
  const [chosen, setChosen] = useState<string | null>(null);
  const gathering = building.attraction?.gathering;
  if (gathering) return <p className="note note--muted">{t('show.scheduled').replace('{crowd}', `${Math.round(gathering.crowd)}`)}</p>;
  if (inGatheringCooldown(building, state.lastSeen)) {
    const hours = Math.ceil(((building.attraction?.cooldownUntil ?? 0) - state.lastSeen) / TAKINGS.hourMs);
    return <p className="note note--muted">{t('show.cooldown').replace('{hours}', `${hours}`)}</p>;
  }
  const offer = building.type === 'concertHall' ? artistOffer(state, building) : [];
  const artist = offer.find(candidate => candidate.id === chosen) ?? offer[0];
  const preview = previewGathering(state, building, artist);
  return (
    <DrawerPanel>
      {artist ? (
        <RadioChipGroup
          label={t('show.artist')}
          options={offer.map(candidate => ({ value: candidate.id, label: <>{candidate.name} · {t('show.fame').replace('{fame}', `${candidate.fame}`)} · <UrbsAmount value={feeOfArtist(candidate)} /></> }))}
          value={artist.id}
          onChange={setChosen}
        />
      ) : null}
      <DrawerPanel.LabelValue label={t('show.crowd')} value={Math.round(preview.crowd)} />
      <NumberStepper label={t('show.startsIn')} value={startsInHours} min={0} max={GATHERING.maxDelayHours} onChange={setStartsInHours} />
      <ActionButton variant="primary" block disabled={state.urbs < preview.cost} onClick={() => gameStore.getState().send({ type: 'ScheduleShow', buildingId: building.id, startsInHours, ...(artist ? { artistId: artist.id } : {}) })}>
        {t('show.schedule')} · <UrbsAmount value={preview.cost} />
      </ActionButton>
    </DrawerPanel>
  );
}
