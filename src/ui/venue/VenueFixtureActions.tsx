import { useStore } from 'zustand';
import { FIXTURES, conditionOf, fixtureRefund, homeFixtureRefund, isBroken, isFloorBuilding, isHomeType, repairCost, WEAR } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { venueStore } from '../../store/venueStore';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { useGame } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';
import { VenueShelfStock } from './VenueShelfStock';
import { useVenuePerformance } from './useVenuePerformance';
import { Icon } from '../common/Icon';
import { FloorMachineStatus } from '../factory/FloorMachineStatus';

interface VenueFixtureActionsProps {
  venueId: number;
}

export function VenueFixtureActions({ venueId }: VenueFixtureActionsProps) {
  const placedId = useStore(venueStore, store => store.placedId);
  const movingId = useStore(venueStore, store => store.movingId);
  const fixture = useGame(store => {
    const building = store.state.buildings.find(candidate => candidate.id === venueId);
    return (building?.venue?.fixtures ?? building?.floor?.fixtures)?.find(candidate => candidate.id === (movingId ?? placedId));
  });
  const floorOwner = useGame(store => store.state.buildings.find(candidate => candidate.id === venueId && (candidate.type === 'factory' || candidate.type === 'packhouse')));
  const onFloor = useGame(store => store.state.buildings.some(candidate => candidate.id === venueId && isFloorBuilding(candidate)));
  const inHome = useGame(store => store.state.buildings.some(candidate => candidate.id === venueId && isHomeType(candidate.type)));
  const performance = useVenuePerformance(venueId);
  const earnings = fixture ? performance?.earningsByFixture.get(fixture.id) : undefined;
  const hints = fixture ? performance?.layout.hints.get(fixture.id) ?? [] : [];
  if (!fixture) return null;
  const partition = FIXTURES[fixture.type].partition === true || inHome;
  const { startMove, stopMove, selectPlaced } = venueStore.getState();
  const send = gameStore.getState().send;
  return (
    <section className="venue-build">
      <h3>{t(`venue.fixture.${fixture.type}`)}</h3>
      {partition ? null : <p><strong>{t('venue.condition')}</strong>: {Math.round(conditionOf(fixture))} %</p>}
      {partition ? null : isBroken(fixture) ? <p className="note note--danger">{t('venue.broken')}</p> : conditionOf(fixture) < WEAR.breakdownBelow ? <p className="note note--warn">{t('venue.worn')}</p> : null}
      {floorOwner ? <FloorMachineStatus factory={floorOwner} fixture={fixture} /> : null}
      {hints.map(hint => <p key={hint} className="note note--warn">{t(`venue.hint.${hint}`)}</p>)}
      {movingId === null ? <VenueShelfStock venueId={venueId} fixture={fixture} /> : null}
      {earnings !== undefined ? <p><strong>{t('venue.fixtureEarnings')}</strong>: <UrbsAmount value={earnings} /></p> : null}
      {movingId !== null ? (
        <>
          <p className="note note--muted">{t('venue.moveHint')}</p>
          <ActionButton block onClick={stopMove}>{t('panel.close')}</ActionButton>
        </>
      ) : (
        <ButtonRow align="stretch" spaced>
          {!inHome && Math.round(100-conditionOf(fixture)) > 2
              ? <ActionButton variant="primary" onClick={() => send({ type: onFloor ? 'RepairFloorFixture' : 'RepairFixture', buildingId: venueId, fixtureId: fixture.id })}>
                <Icon name="repair" /> {t('venue.repair')} <UrbsAmount value={repairCost(fixture)} />
                </ActionButton>
              : null
          }
          <ActionButton onClick={() => startMove(fixture.id)}><Icon name="move" /> {t('venue.move')}</ActionButton>
          {FIXTURES[fixture.type].wall ? null : <ActionButton onClick={() => send({ type: onFloor ? 'MoveFloorFixture' : 'MoveFixture', buildingId: venueId, fixtureId: fixture.id, x: fixture.x, y: fixture.y, rotation: ((fixture.rotation + 1) % 4) as 0 | 1 | 2 | 3 })}><Icon name="rotateRight" /> {t('venue.rotate')}</ActionButton>}
          <ActionButton
            onClick={() => {
              send({ type: onFloor ? 'RemoveFloorFixture' : 'RemoveFixture', buildingId: venueId, fixtureId: fixture.id });
              selectPlaced(null);
            }}
          >
            <Icon name="trash" /> {t('panel.sell')} · +<UrbsAmount value={inHome ? homeFixtureRefund(fixture.type) : fixtureRefund(fixture.type)} />
          </ActionButton>
        </ButtonRow>
      )}
    </section>
  );
}
