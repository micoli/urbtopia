import { useState } from 'react';
import { EVENT, eventBudgetOf, hiredOf, inCooldown, isEventActive, isVenue } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { useGame } from '../common/hooks';
import { NumberStepper } from '../common/NumberStepper';
import { UrbsAmount } from '../common/UrbsAmount';
import { formatDuration } from '../common/formatDuration';

interface VenueEventsProps {
  venueId: number;
}

export function VenueEvents({ venueId }: VenueEventsProps) {
  const building = useGame(store => store.state.buildings.find(candidate => candidate.id === venueId));
  const now = useGame(store => store.state.lastSeen);
  const [startsIn, setStartsIn] = useState(1);
  if (!building || !isVenue(building)) return null;
  const { send } = gameStore.getState();
  const venue = building.venue;
  const active = isEventActive(venue, now);
  return (
    <section className="venue-build" aria-label={t('venue.events')}>
      <h3>{t('venue.events')}</h3>
      {hiredOf(venue, 'manager') === 0 ? <p className="note note--muted">{t('venue.eventNeedsManager')}</p> : null}
      {venue.event ? (
        <>
          <p className="note note--muted">{active ? t('venue.eventActive') : t('venue.eventScheduled')} · {formatDuration(Math.max(0, (active ? venue.event.endsAt : venue.event.startsAt) - now))}</p>
          {active ? null : <ActionButton block onClick={() => send({ type: 'CancelEvent', buildingId: venueId })}>{t('venue.eventCancel')}</ActionButton>}
        </>
      ) : inCooldown(venue, now) ? (
        <p className="note note--muted">{t('venue.eventCooldown')} {formatDuration((venue.cooldownUntil ?? now) - now)}</p>
      ) : (
        <>
          <NumberStepper label={t('venue.eventStartsIn')} value={startsIn} min={0} max={EVENT.maxDelayHours} onChange={setStartsIn} />
          <ActionButton variant="primary" block disabled={hiredOf(venue, 'manager') === 0} onClick={() => send({ type: 'ScheduleEvent', buildingId: venueId, startsInHours: startsIn })}>
            {t('venue.eventTournament')} · {t('venue.eventCost')} <UrbsAmount value={eventBudgetOf(building.tier)} />
          </ActionButton>
        </>
      )}
    </section>
  );
}
