import { useState } from 'react';
import { artistOffer, previewGathering, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { showDialogStore } from '../../store/showDialogStore';
import { ActionButton } from '../common/ActionButton';
import { BlockedReason } from '../common/BlockedReason';
import { Dialog } from '../common/Dialog';
import { Icon } from '../common/Icon';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { UrbsAmount } from '../common/UrbsAmount';
import { useGame } from '../common/hooks';
import { ArtistChoice } from './ArtistChoice';
import { ShowForecast } from './ShowForecast';
import { ShowTicketChoice } from './ShowTicketChoice';
import { useForecastState } from './useForecastState';

const START_DELAYS = [0, 1, 3, 6, 12, 24] as const;

export function ShowForm({ building }: { building: Building }) {
  const urbs = useGame(store => store.state.urbs);
  const forecastState = useForecastState();
  const [startsInHours, setStartsInHours] = useState<number>(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const offer = building.type === 'concertHall' ? artistOffer(forecastState, building) : [];
  const artist = offer.find(candidate => candidate.id === chosen) ?? offer[0];
  const preview = previewGathering(forecastState, building, artist);
  const startOptions = START_DELAYS.map(hours => ({ value: hours, label: hours === 0 ? t('show.startNow') : t('show.startIn').replace('{hours}', `${hours}`) }));
  const short = Math.ceil(preview.cost - urbs);
  const close = () => showDialogStore.getState().close();
  const schedule = () => {
    gameStore.getState().send({ type: 'ScheduleShow', buildingId: building.id, startsInHours, ...(artist ? { artistId: artist.id } : {}) });
    close();
  };
  return (
    <Dialog className="show-dialog">
      <Dialog.Title><Icon name="music" /> {t('show.title')}</Dialog.Title>
      <Dialog.Body>
        <div className="show-dialog-body show-section">
          <p className="tourism-label">{t(`building.${building.type}`)}</p>
          {artist ? <ArtistChoice state={forecastState} building={building} artist={artist} onChange={setChosen} /> : null}
          <ShowTicketChoice building={building} />
          <div className="show-starts">
            <p className="tourism-label">{t('show.startsIn')}</p>
            <RadioChipGroup className="choice-chips" label={t('show.startsIn')} options={startOptions} value={startsInHours} onChange={setStartsInHours} />
          </div>
          <ShowForecast building={building} preview={preview} />
          {short > 0 ? <BlockedReason reason={t('show.missing').replace('{amount}', `${short}`)} /> : null}
        </div>
      </Dialog.Body>
      <Dialog.Actions>
        <ActionButton onClick={close}>{t('show.close')}</ActionButton>
        <ActionButton variant="primary" disabled={short > 0} onClick={schedule}>
          {t('show.schedule')} · <UrbsAmount value={preview.cost} />
        </ActionButton>
      </Dialog.Actions>
    </Dialog>
  );
}
