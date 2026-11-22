import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type Command, type GameEvent, type GameState } from '../index';
import { ACHIEVEMENTS, CATEGORY_NAMES } from './achievements';
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_SIGNALS, type AchievementTrigger } from './achievementTypes';
import { counterValue, isKnownCounter } from './counters';
import { latchAchievements } from './latch';
import { categoryProgress } from './progress';
import { isProvenBy, isRaised } from './triggers';

const city = () => newGame({ seed: 'amber-fox-4821', now: 1_700_000_000_000 });
const withBuilding = (state: GameState, type: Parameters<typeof createBuilding>[1], id = 900): GameState => ({ ...state, buildings: [...state.buildings, createBuilding(id, type, 56, 50, 0)] });
const raised = (trigger: AchievementTrigger, before: GameState, after: GameState, events: GameEvent[] = [], command?: Command) => isRaised(trigger, { before, after, events, command });

describe('counters', () => {
  it('counts the buildings of a kind, of listed types and of a service category', () => {
    const state = withBuilding(withBuilding(city(), 'library', 900), 'hydroPlant', 901);
    expect(counterValue(state, 'kind:facility')).toBe(1);
    expect(counterValue(state, 'category:education')).toBe(1);
    expect(counterValue(state, 'building:hydroPlant,geothermalPlant')).toBe(1);
    expect(counterValue(state, 'building:library')).toBe(1);
    expect(counterValue(city(), 'kind:home')).toBe(0);
  });

  it('counts the Fixtures held by Homes apart from those of every interior', () => {
    const home = { ...createBuilding(900, 'home', 56, 50, 0), interior: { fixtures: [{ id: 1, type: 'lamp', x: 0, y: 0, rotation: 0 }], nextFixtureId: 2 } };
    const factory = { ...createBuilding(901, 'factory', 60, 50, 0), interior: { fixtures: [{ id: 1, type: 'lamp', x: 0, y: 0, rotation: 0 }, { id: 2, type: 'lamp', x: 1, y: 0, rotation: 0 }], nextFixtureId: 3 } };
    const state = { ...city(), buildings: [home, factory] } as unknown as GameState;
    expect(counterValue(state, 'homeFixtures')).toBe(1);
    expect(counterValue(state, 'interiorFixtures')).toBe(3);
  });
});

describe('triggers', () => {
  it('raises a created trigger when the counter grows, not when it only holds', () => {
    const trigger: AchievementTrigger = { type: 'created', counter: 'kind:home' };
    const placed = withBuilding(city(), 'home');
    expect(raised(trigger, city(), placed)).toBe(true);
    expect(raised(trigger, placed, placed)).toBe(false);
  });

  it('raises a threshold trigger once the counter reaches the value', () => {
    const trigger: AchievementTrigger = { type: 'threshold', counter: 'kind:home', atLeast: 1 };
    expect(raised(trigger, city(), city())).toBe(false);
    expect(raised(trigger, city(), withBuilding(city(), 'home'))).toBe(true);
  });

  it('raises a command trigger only for the listed Commands', () => {
    const trigger: AchievementTrigger = { type: 'command', commands: ['SellToMarket'] };
    expect(raised(trigger, city(), city(), [], { type: 'SellToMarket', good: 'planks', quantity: 1 } as Command)).toBe(true);
    expect(raised(trigger, city(), city(), [], { type: 'SkipTime', hours: 1 } as Command)).toBe(false);
    expect(raised(trigger, city(), city())).toBe(false);
  });

  it('raises a sim trigger from an event, with or without a Command', () => {
    const trigger: AchievementTrigger = { type: 'sim', event: 'CropsHarvested' };
    expect(raised(trigger, city(), city(), [{ type: 'CropsHarvested', tiles: [] }])).toBe(true);
    expect(raised(trigger, city(), city(), [{ type: 'BuildingPlaced', id: 1 }])).toBe(false);
  });

  it('raises a signal trigger only for its own Signal', () => {
    const trigger: AchievementTrigger = { type: 'signal', signal: 'interiorOpened' };
    expect(raised(trigger, city(), city(), [], { type: 'Signal', signal: 'interiorOpened' })).toBe(true);
    expect(raised(trigger, city(), city(), [], { type: 'Signal', signal: 'demonstrationFinished' })).toBe(false);
  });

  it('proves from the state only what a counter can prove', () => {
    expect(isProvenBy({ type: 'created', counter: 'kind:home' }, withBuilding(city(), 'home'))).toBe(true);
    expect(isProvenBy({ type: 'created', counter: 'kind:home' }, city())).toBe(false);
    expect(isProvenBy({ type: 'sim', event: 'CropsHarvested' }, city())).toBe(false);
    expect(isProvenBy({ type: 'signal', signal: 'interiorOpened' }, city())).toBe(false);
  });

  it('latches the Achievement of a Signal', () => {
    const result = latchAchievements(city(), city(), [], { type: 'Signal', signal: 'interiorOpened' });
    expect(result.unlocked).toEqual(['interiors.open']);
  });
});

describe('the catalogue', () => {
  it('names a category for each Achievement and fills every declared category', () => {
    for (const category of ACHIEVEMENT_CATEGORIES) {
      expect(CATEGORY_NAMES[category]).toBeDefined();
      expect(ACHIEVEMENTS.some((achievement) => achievement.category === category)).toBe(true);
    }
  });

  it('uses only counters and Signals the game knows', () => {
    for (const { id, trigger } of ACHIEVEMENTS) {
      if ('counter' in trigger) expect(isKnownCounter(trigger.counter), `${id}: ${trigger.counter}`).toBe(true);
      if (trigger.type === 'signal') expect(ACHIEVEMENT_SIGNALS).toContain(trigger.signal);
    }
  });

  it.each(ACHIEVEMENT_CATEGORIES)('completes the %s category when each of its Achievements is acquired', (category) => {
    const ids = ACHIEVEMENTS.filter((achievement) => achievement.category === category).map(({ id }) => id);
    expect(categoryProgress({ ...city(), achievements: ids }, category).complete).toBe(true);
    expect(categoryProgress({ ...city(), achievements: ids.slice(1) }, category).complete).toBe(false);
  });
});
