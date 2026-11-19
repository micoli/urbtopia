import { describe, expect, it } from 'vitest';
import { compileDemonstration } from '../demonstrations/scenario';
import { boardOf, scoreOfGame } from './districtGame';
import { districtDemonstration } from './districtDemonstration';
import { isHexValid } from './hex';

describe('the District plan demonstration', () => {
  const checkpoints = compileDemonstration(districtDemonstration);
  const officeOf = (index: number) => checkpoints[index]!.state.buildings.find(building => building.id === districtDemonstration.buildingId)!;

  it('plays six Hexes and every step checks the score it explains', () => {
    expect(officeOf(checkpoints.length - 1).district?.game?.placements).toHaveLength(6);
    const scores = checkpoints.map((_, index) => scoreOfGame({ seed: checkpoints[index]!.state.seed, officeId: districtDemonstration.buildingId }, officeOf(index).district!.game!));
    expect(scores).toEqual([0, 1, 4, 7, 10, 16, 16]);
  });

  it('only places valid Hexes', () => {
    const last = officeOf(checkpoints.length - 1);
    const board = boardOf({ seed: checkpoints[0]!.state.seed, officeId: districtDemonstration.buildingId }, last.district!.game!);
    expect(board.every(({ hex }) => isHexValid(hex))).toBe(true);
  });

  it('has a text in both languages for every part of every step', () => {
    for (const step of districtDemonstration.steps) {
      for (const part of [step.title, step.objective, step.action, step.explanation, step.result]) {
        expect(part[0].trim().length, step.id).toBeGreaterThan(0);
        expect(part[1].trim().length, step.id).toBeGreaterThan(0);
      }
    }
  });

  it('has steps with distinct ids', () => {
    const ids = districtDemonstration.steps.map(step => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('breaks on a score that no longer matches its explanation', () => {
    const outdated = { ...districtDemonstration, steps: districtDemonstration.steps.map(step => (step.id === 'park' ? { ...step, check: () => { throw new Error('expected a score of 5, got 4'); } } : step)) };
    expect(() => compileDemonstration(outdated)).toThrow(/park/);
  });
});
