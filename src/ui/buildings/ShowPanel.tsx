import { useState } from 'react';
import { GATHERING, artistOffer, inGatheringCooldown, previewGathering, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { BlockedReason } from '../common/BlockedReason';
import { DrawerPanel } from '../common/DrawerPanel';
import { Icon } from '../common/Icon';
import { ProgressBar } from '../common/ProgressBar';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { UrbsAmount } from '../common/UrbsAmount';
import { formatTimeLeft } from '../common/formatDuration';
import { useGame } from '../common/hooks';
import { ArtistChoice } from '../tourism/ArtistChoice';
import { GatheringResultNote } from '../tourism/GatheringResultNote';
import { GatheringStatus } from '../tourism/GatheringStatus';
import { ShowForecast } from '../tourism/ShowForecast';
import { useForecastState } from '../tourism/useForecastState';

const START_DELAYS = [0, 1, 3, 6, 12, 24] as const;

interface ShowPanelProps {
  building: Building;
}

export function ShowPanel({ building }: ShowPanelProps) {
  const now = useGame(store => store.state.lastSeen);
  const urbs = useGame(store => store.state.urbs);
  const forecastState = useForecastState();
  const [startsInHours, setStartsInHours] = useState<number>(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const gathering = building.attraction?.gathering;
  if (gathering) {
    return (
      <DrawerPanel>
        <div className="show-section">
          <GatheringStatus building={building} gathering={gathering} now={now} />
          <GatheringResultNote building={building} />
        </div>
      </DrawerPanel>
    );
  }
  if (inGatheringCooldown(building, now)) {
    const left = (building.attraction?.cooldownUntil ?? 0) - now;
    const label = t('show.cooldown').replace('{time}', formatTimeLeft(left));
    return (
      <DrawerPanel>
        <div className="show-section">
          <p className="tourism-label">{label}</p>
          <ProgressBar value={GATHERING.cooldownMs - left} max={GATHERING.cooldownMs} label={label} />
          <GatheringResultNote building={building} />
        </div>
      </DrawerPanel>
    );
  }
  const offer = building.type === 'concertHall' ? artistOffer(forecastState, building) : [];
  const artist = offer.find(candidate => candidate.id === chosen) ?? offer[0];
  const preview = previewGathering(forecastState, building, artist);
  const startOptions = START_DELAYS.map(hours => ({ value: hours, label: hours === 0 ? t('show.startNow') : t('show.startIn').replace('{hours}', `${hours}`) }));
  const short = Math.ceil(preview.cost - urbs);
  return (
    <DrawerPanel>
      <div className="show-section">
        <p className="show-title"><Icon name="music" /> {t('show.title')}</p>
        {artist ? <ArtistChoice state={forecastState} building={building} artist={artist} onChange={setChosen} /> : null}
        <ShowForecast building={building} preview={preview} />
        <div className="show-starts">
          <p className="tourism-label">{t('show.startsIn')}</p>
          <RadioChipGroup className="choice-chips" label={t('show.startsIn')} options={startOptions} value={startsInHours} onChange={setStartsInHours} />
        </div>
        <ActionButton variant="primary" block disabled={short > 0} onClick={() => gameStore.getState().send({ type: 'ScheduleShow', buildingId: building.id, startsInHours, ...(artist ? { artistId: artist.id } : {}) })}>
          {t('show.schedule')} · <UrbsAmount value={preview.cost} />
        </ActionButton>
        {short > 0 ? <BlockedReason reason={t('show.missing').replace('{amount}', `${short}`)} /> : null}
        <GatheringResultNote building={building} />
      </div>
    </DrawerPanel>
  );
}
