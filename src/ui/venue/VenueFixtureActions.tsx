import { useStore } from 'zustand';
import { fixtureRefund, isVenue, venuePerformance } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { venueStore } from '../../store/venueStore';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { useGame } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';

interface VenueFixtureActionsProps {
  venueId: number;
}

export function VenueFixtureActions({ venueId }: VenueFixtureActionsProps) {
  const placedId = useStore(venueStore, store => store.placedId);
  const movingId = useStore(venueStore, store => store.movingId);
  const fixture = useGame(store => {
    const building = store.state.buildings.find(candidate => candidate.id === venueId);
    return building && isVenue(building) ? building.venue.fixtures.find(candidate => candidate.id === (movingId ?? placedId)) : undefined;
  });
  const earnings = useGame(store => {
    const building = store.state.buildings.find(candidate => candidate.id === venueId);
    return fixture && building && isVenue(building) ? venuePerformance(store.state, building).earningsByFixture.get(fixture.id) : undefined;
  });
  if (!fixture) return null;
  const { startMove, stopMove, selectPlaced } = venueStore.getState();
  const send = gameStore.getState().send;
  return (
    <section className="venue-build">
      <h3>{t(`venue.fixture.${fixture.type}`)}</h3>
      {earnings !== undefined ? <p><strong>{t('venue.fixtureEarnings')}</strong>: <UrbsAmount value={earnings} /></p> : null}
      {movingId !== null ? (
        <>
          <p className="note note--muted">{t('venue.moveHint')}</p>
          <ActionButton block onClick={stopMove}>{t('panel.close')}</ActionButton>
        </>
      ) : (
        <ButtonRow align="stretch" spaced>
          <ActionButton onClick={() => startMove(fixture.id)}>✥ {t('venue.move')}</ActionButton>
          <ActionButton onClick={() => send({ type: 'MoveFixture', buildingId: venueId, fixtureId: fixture.id, x: fixture.x, y: fixture.y, rotation: ((fixture.rotation + 1) % 4) as 0 | 1 | 2 | 3 })}>⟳ {t('venue.rotate')}</ActionButton>
          <ActionButton
            onClick={() => {
              send({ type: 'RemoveFixture', buildingId: venueId, fixtureId: fixture.id });
              selectPlaced(null);
            }}
          >
            ❌ +<UrbsAmount value={fixtureRefund(fixture.type)} />
          </ActionButton>
        </ButtonRow>
      )}
    </section>
  );
}
