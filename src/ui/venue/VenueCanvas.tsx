import { useEffect, useRef } from 'react';
import { canPlaceFixture, canStandOnFloor, entranceCell, fixtureTiles, floorGridSizeOf, gridSizeOf, hiredOf, isBroken, isFactory, isVenue, venuePerformance, FRONT_ROLE, type Building, type Coord, type VenueFixture, type VenueType } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { VenueScene } from '../../scene/VenueScene';
import { planCrowd } from '../../scene/venueCrowd';
import { gameStore } from '../../store/gameStore';
import { venueSceneHandle } from '../../store/venueSceneHandle';
import { venueStore } from '../../store/venueStore';

// What the canvas edits: the interior of a Venue, or the floor of a Factory.
interface Interior {
  building: Building;
  fixtures: readonly VenueFixture[];
  floor: boolean;
}

const interiorOf = (venueId: number): Interior | undefined => {
  const building = gameStore.getState().state.buildings.find(candidate => candidate.id === venueId);
  if (!building) return undefined;
  if (isFactory(building)) return { building, fixtures: building.floor?.fixtures ?? [], floor: true };
  return isVenue(building) ? { building, fixtures: building.venue.fixtures, floor: false } : undefined;
};

const moveCommandOf = (venueId: number): 'MoveFixture' | 'MoveFloorFixture' => (interiorOf(venueId)?.floor ? 'MoveFloorFixture' : 'MoveFixture');

const sizeOf = (interior: Interior, venueType: VenueType | 'factory'): number => (interior.floor ? floorGridSizeOf(interior.building.tier) : gridSizeOf(venueType as VenueType, interior.building.tier));

// The piece of furniture a tap picked: the one whose model it hit, else the one on the cell.
const fixtureAt = (venueId: number, cell: Coord, fixtureId: number | null) => {
  const fixtures = interiorOf(venueId)?.fixtures ?? [];
  const modelled = fixtureId === null ? undefined : fixtures.find(candidate => candidate.id === fixtureId);
  return modelled ?? fixtures.find(candidate => fixtureTiles(candidate).some(tile => tile.x === cell.x && tile.y === cell.y));
};

interface VenueCanvasProps {
  venueId: number;
  venueType: VenueType | 'factory';
}

export function VenueCanvas({ venueId, venueType }: VenueCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const initial = interiorOf(venueId);
    if (!canvas || !initial) return;
    const scene = new VenueScene(canvas, sizeOf(initial, venueType), initial.building.tier, venueType, venueId);
    venueSceneHandle.current = scene;
    scene.setPickMode(prefsStore.getState().pickMode);
    const unsubscribePrefs = prefsStore.subscribe((prefs, previous) => {
      if (prefs.pickMode !== previous.pickMode) scene.setPickMode(prefs.pickMode);
    });
    let hovered: Coord | null = null;
    // The piece of furniture under a press, and where inside it the press landed.
    let grab: { id: number; offset: Coord; carrying: boolean } | null = null;

    const showGhost = () => {
      const interior = interiorOf(venueId);
      const { selectedFixture, movingId } = venueStore.getState();
      const moving = interior?.fixtures.find(fixture => fixture.id === movingId);
      const type = moving?.type ?? selectedFixture;
      if (!interior || !type || !hovered) return scene.setGhost(null);
      const candidate = { type, x: hovered.x, y: hovered.y, rotation: moving?.rotation ?? (0 as const) };
      const building = interior.building;
      const valid = isFactory(building) ? canStandOnFloor(building, candidate, moving?.id) : isVenue(building) && canPlaceFixture(building, candidate, moving?.id);
      scene.setGhost({ tiles: fixtureTiles(candidate), valid });
    };
    const showSelection = () => {
      const { placedId, movingId } = venueStore.getState();
      const fixture = interiorOf(venueId)?.fixtures.find(candidate => candidate.id === (movingId ?? placedId));
      scene.setSelection(fixture ? fixtureTiles(fixture) : []);
    };
    const showWarnings = () => {
      const interior = interiorOf(venueId);
      if (!interior) return;
      const hints = isVenue(interior.building) ? venuePerformance(gameStore.getState().state, interior.building).layout.hints : new Map<number, readonly string[]>();
      scene.setWarnings(interior.fixtures.filter(fixture => hints.has(fixture.id) && !isBroken(fixture)).flatMap(fixtureTiles));
      scene.setBroken(interior.fixtures.filter(isBroken).flatMap(fixtureTiles));
      scene.setWear([...interior.fixtures]);
    };
    const showCrowd = () => {
      const venue = interiorOf(venueId)?.building;
      if (!venue || !isVenue(venue)) return;
      const performance = venuePerformance(gameStore.getState().state, venue);
      const demandRatio = performance.capacity > 0 ? performance.accepted / performance.capacity : performance.accepted > 0 ? 2 : 0;
      scene.setCrowd(planCrowd({
        size: gridSizeOf(venueType as VenueType, venue.tier),
        entrance: entranceCell(venue.tier),
        fixtures: venue.venue.fixtures,
        usageByFixture: performance.usageByFixture,
        saturation: performance.capacity > 0 ? performance.served / performance.capacity : 0,
        demandRatio,
        employees: performance.powered && !performance.closed ? hiredOf(venue.venue, FRONT_ROLE[venueType as VenueType]) : 0,
      }), performance.satisfaction);
    };
    const sync = () => {
      const interior = interiorOf(venueId);
      if (interior) {
        scene.setSize(sizeOf(interior, venueType));
        scene.setFixtures([...interior.fixtures]);
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
    scene.onGrab = (cell, fixtureId) => {
      grab = null;
      const { selectedFixture, movingId } = venueStore.getState();
      if (selectedFixture || movingId !== null) return false;
      const fixture = fixtureAt(venueId, cell, fixtureId);
      if (!fixture) return false;
      const onFloor = fixtureTiles(fixture).some(tile => tile.x === cell.x && tile.y === cell.y);
      grab = { id: fixture.id, offset: onFloor ? { x: cell.x - fixture.x, y: cell.y - fixture.y } : { x: 0, y: 0 }, carrying: false };
      return true;
    };
    scene.onGrabMove = cell => {
      if (!grab) return;
      if (!grab.carrying) {
        grab.carrying = true;
        venueStore.getState().startMove(grab.id);
      }
      hovered = { x: cell.x - grab.offset.x, y: cell.y - grab.offset.y };
      showGhost();
    };
    scene.onDrop = cell => {
      const carried = grab;
      grab = null;
      if (!carried?.carrying) return;
      venueStore.getState().stopMove();
      if (!cell) return;
      gameStore.getState().send({ type: moveCommandOf(venueId), buildingId: venueId, fixtureId: carried.id, x: cell.x - carried.offset.x, y: cell.y - carried.offset.y });
    };
    scene.onTapCell = (cell, repeat, fixtureId) => {
      const interior = interiorOf(venueId);
      if (!interior) return;
      const { selectedFixture, movingId, selectPlaced, stopMove } = venueStore.getState();
      const { send } = gameStore.getState();
      if (selectedFixture) {
        const before = interior.fixtures.length;
        send({ type: interior.floor ? 'PlaceFloorFixture' : 'PlaceFixture', buildingId: venueId, fixture: selectedFixture, x: cell.x, y: cell.y });
        // Once the item is placed the add mode ends, unless Shift is held, to put several in a row; a refused placement keeps it, to try another cell.
        if (!repeat && (interiorOf(venueId)?.fixtures.length ?? before) > before) venueStore.getState().selectFixture(null);
        return;
      }
      if (movingId !== null) {
        send({ type: moveCommandOf(venueId), buildingId: venueId, fixtureId: movingId, x: cell.x, y: cell.y });
        return stopMove();
      }
      const tapped = fixtureAt(venueId, cell, fixtureId);
      selectPlaced(tapped?.id ?? null);
    };
    sync();
    const unsubscribeGame = gameStore.subscribe(sync);
    const unsubscribeVenue = venueStore.subscribe(sync);
    return () => {
      unsubscribePrefs();
      unsubscribeGame();
      unsubscribeVenue();
      if (venueSceneHandle.current === scene) venueSceneHandle.current = null;
      scene.dispose();
    };
  }, [venueId, venueType]);

  return <canvas ref={canvasRef} className="venue-canvas" />;
}
