import { useEffect, useRef } from 'react';
import { canPlaceFixture, entranceCell, fixtureTiles, gridSizeOf, hiredOf, isBroken, isVenue, venuePerformance, FRONT_ROLE, type Building, type Coord, type VenueData, type VenueType } from '../../core';
import { VenueScene } from '../../scene/VenueScene';
import { planCrowd } from '../../scene/venueCrowd';
import { gameStore } from '../../store/gameStore';
import { venueStore } from '../../store/venueStore';

const venueOf = (venueId: number): (Building & { venue: VenueData }) | undefined => {
  const building = gameStore.getState().state.buildings.find(candidate => candidate.id === venueId);
  return building && isVenue(building) ? building : undefined;
};

interface VenueCanvasProps {
  venueId: number;
  venueType: VenueType;
}

export function VenueCanvas({ venueId, venueType }: VenueCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const initial = venueOf(venueId);
    if (!canvas || !initial) return;
    const scene = new VenueScene(canvas, gridSizeOf(initial.tier), initial.tier, venueType, venueId);
    let hovered: Coord | null = null;

    const showGhost = () => {
      const venue = venueOf(venueId);
      const { selectedFixture, movingId } = venueStore.getState();
      const moving = venue?.venue.fixtures.find(fixture => fixture.id === movingId);
      const type = moving?.type ?? selectedFixture;
      if (!venue || !type || !hovered) return scene.setGhost(null);
      const candidate = { type, x: hovered.x, y: hovered.y, rotation: moving?.rotation ?? (0 as const) };
      scene.setGhost({ tiles: fixtureTiles(candidate), valid: canPlaceFixture(venue, candidate, moving?.id) });
    };
    const showSelection = () => {
      const { placedId, movingId } = venueStore.getState();
      const fixture = venueOf(venueId)?.venue.fixtures.find(candidate => candidate.id === (movingId ?? placedId));
      scene.setSelection(fixture ? fixtureTiles(fixture) : []);
    };
    const showWarnings = () => {
      const venue = venueOf(venueId);
      if (!venue) return;
      const { hints } = venuePerformance(gameStore.getState().state, venue).layout;
      scene.setWarnings(venue.venue.fixtures.filter(fixture => hints.has(fixture.id) && !isBroken(fixture)).flatMap(fixtureTiles));
      scene.setBroken(venue.venue.fixtures.filter(isBroken).flatMap(fixtureTiles));
    };
    const showCrowd = () => {
      const venue = venueOf(venueId);
      if (!venue) return;
      const performance = venuePerformance(gameStore.getState().state, venue);
      const demandRatio = performance.capacity > 0 ? performance.accepted / performance.capacity : performance.accepted > 0 ? 2 : 0;
      scene.setCrowd(planCrowd({
        size: gridSizeOf(venue.tier),
        entrance: entranceCell(venue.tier),
        fixtures: venue.venue.fixtures,
        usageByFixture: performance.usageByFixture,
        saturation: performance.capacity > 0 ? performance.served / performance.capacity : 0,
        demandRatio,
        employees: performance.powered && !performance.closed ? hiredOf(venue.venue, FRONT_ROLE[venueType]) : 0,
      }), performance.satisfaction);
    };
    const sync = () => {
      const venue = venueOf(venueId);
      if (venue) {
        scene.setSize(gridSizeOf(venue.tier));
        scene.setFixtures(venue.venue.fixtures);
      }
      showCrowd();
      showSelection();
      showWarnings();
      showGhost();
    };

    scene.onHoverCell = cell => {
      hovered = cell;
      showGhost();
    };
    scene.onTapCell = cell => {
      const venue = venueOf(venueId);
      if (!venue) return;
      const { selectedFixture, movingId, selectPlaced, stopMove } = venueStore.getState();
      const { send } = gameStore.getState();
      if (selectedFixture) {
        const before = venue.venue.fixtures.length;
        send({ type: 'PlaceFixture', buildingId: venueId, fixture: selectedFixture, x: cell.x, y: cell.y });
        // Once the item is placed the add mode ends; a refused placement keeps it, to try another cell.
        if ((venueOf(venueId)?.venue.fixtures.length ?? before) > before) venueStore.getState().selectFixture(null);
        return;
      }
      if (movingId !== null) {
        send({ type: 'MoveFixture', buildingId: venueId, fixtureId: movingId, x: cell.x, y: cell.y });
        return stopMove();
      }
      const tapped = venue.venue.fixtures.find(fixture => fixtureTiles(fixture).some(tile => tile.x === cell.x && tile.y === cell.y));
      selectPlaced(tapped?.id ?? null);
    };
    sync();
    const unsubscribeGame = gameStore.subscribe(sync);
    const unsubscribeVenue = venueStore.subscribe(sync);
    return () => {
      unsubscribeGame();
      unsubscribeVenue();
      scene.dispose();
    };
  }, [venueId, venueType]);

  return <canvas ref={canvasRef} className="venue-canvas" />;
}
