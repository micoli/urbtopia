import { nextMeetingSlot, type Building } from '../../core';
import { t } from '../../i18n/t';
import { DrawerPanel } from '../common/DrawerPanel';
import { formatTimeLeft } from '../common/formatDuration';
import { useGame } from '../common/hooks';
import { GatheringResultNote } from '../tourism/GatheringResultNote';
import { GatheringStatus } from '../tourism/GatheringStatus';
import { StadiumTicketChoice } from '../tourism/StadiumTicketChoice';
import { useForecastState } from '../tourism/useForecastState';

export function StadiumPanel({ building }: { building: Building }) {
  const now = useGame(store => store.state.lastSeen);
  const forecastState = useForecastState();
  const gathering = building.attraction?.gathering;
  return (
    <DrawerPanel>
      <div className="show-section">
        {gathering ? <GatheringStatus building={building} gathering={gathering} now={now} /> : null}
        {!gathering && !building.club ? <p className="tourism-label">{t('gathering.nextMeeting').replace('{time}', formatTimeLeft(nextMeetingSlot(now) - now))}</p> : null}
        <StadiumTicketChoice state={forecastState} building={building} />
        <GatheringResultNote building={building} />
      </div>
    </DrawerPanel>
  );
}
