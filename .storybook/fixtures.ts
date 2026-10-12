import { BUILDING_SPECS, createBuilding, fixtureIdsOf, isVenue, newGame, type Building, type BuildingType, type GameState } from '../src/core';
import { buildEvolvedCity } from '../src/saves/evolvedCity';

const FIXTURE_NOW = 1_790_000_000_000;

function starterCity(): GameState {
  return newGame({ seed: 'storybook-starter', now: FIXTURE_NOW, tutorial: false });
}

function tutorialCity(): GameState {
  return newGame({ seed: 'storybook-tutorial', now: FIXTURE_NOW, tutorial: true });
}

function richCity(): GameState {
  return { ...starterCity(), urbs: 5_000_000 };
}

function poorCity(): GameState {
  return { ...starterCity(), urbs: 0 };
}

function powerShortageCity(): GameState {
  const city = buildEvolvedCity();
  return { ...city, buildings: city.buildings.filter((building) => building.type !== 'powerPlant') };
}

function brokeEvolvedCity(): GameState {
  const city = buildEvolvedCity();
  return { ...city, urbs: 0, storage: { ...city.storage, goods: {} } };
}

const SHOWCASE_COLUMNS = 10;

const SHOWCASE_FIXTURES_PER_VENUE = 3;

function withFixtures(building: Building): Building {
  if (!isVenue(building)) return building;
  const fixtures = fixtureIdsOf(building.type)
    .slice(0, SHOWCASE_FIXTURES_PER_VENUE)
    .map((type, index) => ({ id: index + 1, type, x: 1 + index * 2, y: 1, rotation: 0 as const }));
  return { ...building, venue: { ...building.venue, fixtures, nextFixtureId: fixtures.length + 1 } };
}

function showcaseCity(): GameState {
  const city = buildEvolvedCity();
  const present = new Set(city.buildings.map((building) => building.type));
  const missing = (Object.keys(BUILDING_SPECS) as BuildingType[]).filter((type) => !present.has(type));
  const added = missing.map((type, index) => createBuilding(city.nextId + index, type, 4 + (index % SHOWCASE_COLUMNS) * 4, 4 + Math.floor(index / SHOWCASE_COLUMNS) * 4, 0));
  return { ...city, buildings: [...city.buildings, ...added].map(withFixtures), nextId: city.nextId + added.length };
}

export const GAME_FIXTURES = {
  starter: starterCity,
  tutorial: tutorialCity,
  rich: richCity,
  poor: poorCity,
  powerShortage: powerShortageCity,
  evolved: buildEvolvedCity,
  showcase: showcaseCity,
  brokeEvolved: brokeEvolvedCity,
} as const;

export type GameFixtureName = keyof typeof GAME_FIXTURES;
