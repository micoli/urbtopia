import { useEffect, useRef } from 'react';
import { canPlaceFixture, fixtureTiles, gridSizeOf, isVenue, type Building } from '../../core';
import { VenueScene } from '../../scene/VenueScene';
import { gameStore } from '../../store/gameStore';
import { venueStore } from '../../store/venueStore';

const venueOf = (venueId: number): Building | undefined => gameStore.getState().state.buildings.find(building => building.id === venueId);

interface VenueCanvasProps {
  venueId: number;
}

export function VenueCanvas({ venueId }: VenueCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const initial = venueOf(venueId);
    if (!canvas || !initial) return;
    const scene = new VenueScene(canvas, gridSizeOf(initial.tier));
    let hovered: { x: number; y: number } | null = null;

    const showGhost = () => {
      const venue = venueOf(venueId);
      const fixture = venueStore.getState().selectedFixture;
      if (!venue || !isVenue(venue) || !fixture || !hovered) return scene.setGhost(null);
      const candidate = { type: fixture, x: hovered.x, y: hovered.y, rotation: 0 as const };
      scene.setGhost({ tiles: fixtureTiles(candidate), valid: canPlaceFixture(venue, candidate) });
    };
    const syncFixtures = () => {
      const venue = venueOf(venueId);
      if (venue && isVenue(venue)) scene.setFixtures(venue.venue.fixtures);
      showGhost();
    };

    scene.onHoverCell = cell => {
      hovered = cell;
      showGhost();
    };
    scene.onTapCell = cell => {
      const fixture = venueStore.getState().selectedFixture;
      if (!fixture) return;
      gameStore.getState().send({ type: 'PlaceFixture', buildingId: venueId, fixture, x: cell.x, y: cell.y });
    };
    syncFixtures();
    const unsubscribeGame = gameStore.subscribe(syncFixtures);
    const unsubscribeVenue = venueStore.subscribe(showGhost);
    return () => {
      unsubscribeGame();
      unsubscribeVenue();
      scene.dispose();
    };
  }, [venueId]);

  return <canvas ref={canvasRef} className="venue-canvas" />;
}
