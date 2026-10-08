import { useEffect, useRef } from 'react';
import { canPlaceFixture, fixtureTiles, gridSizeOf, isBroken, isVenue, venueLayout, type Building, type Coord, type VenueData } from '../../core';
import { VenueScene } from '../../scene/VenueScene';
import { gameStore } from '../../store/gameStore';
import { venueStore } from '../../store/venueStore';

const venueOf = (venueId: number): (Building & { venue: VenueData }) | undefined => {
  const building = gameStore.getState().state.buildings.find(candidate => candidate.id === venueId);
  return building && isVenue(building) ? building : undefined;
};

interface VenueCanvasProps {
  venueId: number;
}

export function VenueCanvas({ venueId }: VenueCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const initial = venueOf(venueId);
    if (!canvas || !initial) return;
    const scene = new VenueScene(canvas, gridSizeOf(initial.tier), initial.tier);
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
      const { hints } = venueLayout(venue);
      scene.setWarnings(venue.venue.fixtures.filter(fixture => hints.has(fixture.id) && !isBroken(fixture)).flatMap(fixtureTiles));
      scene.setBroken(venue.venue.fixtures.filter(isBroken).flatMap(fixtureTiles));
    };
    const sync = () => {
      const venue = venueOf(venueId);
      if (venue) scene.setFixtures(venue.venue.fixtures);
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
      if (selectedFixture) return send({ type: 'PlaceFixture', buildingId: venueId, fixture: selectedFixture, x: cell.x, y: cell.y });
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
  }, [venueId]);

  return <canvas ref={canvasRef} className="venue-canvas" />;
}
