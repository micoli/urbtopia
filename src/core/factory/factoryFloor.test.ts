import { describe, expect, it } from 'vitest';
import type { FixtureId, Rotation, VenueFixture } from '../engine/state';
import { floorBonusOf, floorLinksOf } from './factoryFloor';

let nextId = 1;
const put = (type: FixtureId, x: number, y: number, rotation: Rotation = 0, broken = false): VenueFixture => ({ id: nextId++, type, x, y, rotation, ...(broken ? { broken: true as const } : {}) });
const linkedTypes = (fixtures: VenueFixture[]) => fixtures.filter(fixture => floorLinksOf(fixtures).linked.has(fixture.id)).map(fixture => fixture.type);

describe('Drive', () => {
  it('reaches a Machine through a Shaft', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryShaft', 3, 4), put('factoryPress', 3, 5, 2)];
    expect(linkedTypes(fixtures)).toEqual(['factoryPress']);
  });

  it('does not reach a Machine whose input faces away', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryShaft', 3, 4), put('factoryPress', 3, 5, 0)];
    expect(linkedTypes(fixtures)).toEqual([]);
  });

  it('does not pass a Shaft sideways', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryShaft', 3, 4), put('factoryPress', 4, 4, 1)];
    expect(linkedTypes(fixtures)).toEqual([]);
  });

  it('turns the other way through each meshed Gear', () => {
    const chain = (lathe: FixtureId) => [put('factoryMotor', 3, 3), put('factoryGear', 3, 4), put('factoryGear', 3, 5), put(lathe, 3, 6, 2)];
    expect(linkedTypes(chain('factoryLatheCcw'))).toEqual(['factoryLatheCcw']);
    expect(linkedTypes(chain('factoryLatheCw'))).toEqual([]);
  });

  it('turns the same way through a single Gear fed by the Motor', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryGear', 3, 4), put('factoryLatheCw', 3, 5, 2)];
    expect(linkedTypes(fixtures)).toEqual(['factoryLatheCw']);
  });

  it('jams a chain that is fed in two opposite directions', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryGear', 3, 4), put('factoryGear', 4, 4), put('factoryMotor', 4, 3), put('factoryPress', 3, 5, 2)];
    const links = floorLinksOf(fixtures);
    expect(links.linked.size).toBe(0);
    expect(links.jammed).toBe(true);
  });

  it('stops at a broken Fixture', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryShaft', 3, 4, 0, true), put('factoryPress', 3, 5, 2)];
    expect(linkedTypes(fixtures)).toEqual([]);
  });

  it('needs a Motor', () => {
    expect(linkedTypes([put('factoryShaft', 3, 4), put('factoryPress', 3, 5, 2)])).toEqual([]);
  });
});

describe('Flow', () => {
  it('reaches a Machine through Pipes', () => {
    const fixtures = [put('factoryPump', 3, 3), put('factoryPipe', 3, 4), put('factoryMixingVat', 3, 5, 2)];
    expect(linkedTypes(fixtures)).toEqual(['factoryMixingVat']);
  });

  it('turns a corner through an Elbow', () => {
    const fixtures = [put('factoryPump', 3, 3), put('factoryPipeElbow', 3, 4, 3), put('factoryMixingVat', 4, 4, 1)];
    expect(linkedTypes(fixtures)).toEqual(['factoryMixingVat']);
  });

  it('branches through a Tee', () => {
    const fixtures = [put('factoryPump', 3, 3), put('factoryPipeTee', 3, 4, 2), put('factoryMixingVat', 2, 4, 3), put('factoryMixingVat', 4, 4, 1)];
    expect(linkedTypes(fixtures).length).toBe(2);
  });

  it('does not mix with Drive: a Shaft carries no Flow', () => {
    const fixtures = [put('factoryPump', 3, 3), put('factoryShaft', 3, 4), put('factoryMixingVat', 3, 5, 2)];
    expect(linkedTypes(fixtures)).toEqual([]);
  });
});

describe('Machines that need both', () => {
  const boiler = () => put('factoryBoiler', 3, 5, 0);
  const driveFeed = () => [put('factoryMotor', 3, 2), put('factoryShaft', 3, 3), put('factoryShaft', 3, 4)];
  const flowFeed = () => [put('factoryPump', 3, 8, 2), put('factoryPipe', 3, 7), put('factoryPipe', 3, 6)];

  it('is linked only when it receives both', () => {
    expect(linkedTypes([boiler(), ...driveFeed()])).toEqual([]);
    expect(linkedTypes([boiler(), ...flowFeed()])).toEqual([]);
    expect(linkedTypes([boiler(), ...driveFeed(), ...flowFeed()])).toEqual(['factoryBoiler']);
  });
});

describe('floorBonusOf', () => {
  const lathe = () => [put('factoryMotor', 3, 3), put('factoryShaft', 3, 4), put('factoryLatheCw', 3, 5, 2)];

  it('is nothing on an empty floor', () => {
    expect(floorBonusOf([], 5)).toEqual({ speed: 0, yield: 0 });
  });

  it('adds what each linked Machine brings', () => {
    expect(floorBonusOf(lathe(), 5)).toEqual({ speed: 0.15, yield: 0.05 });
  });

  it('leaves out a Machine that is not linked', () => {
    expect(floorBonusOf([put('factoryPress', 3, 5, 2)], 5)).toEqual({ speed: 0, yield: 0 });
  });

  it('is capped by the Tier of the Factory', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryShaft', 3, 4), put('factoryPress', 3, 5, 2)];
    expect(floorBonusOf(fixtures, 1).speed).toBeCloseTo(0.1);
    expect(floorBonusOf(fixtures, 5).speed).toBeCloseTo(0.2);
  });
});
