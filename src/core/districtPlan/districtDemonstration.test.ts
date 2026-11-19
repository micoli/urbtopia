import { describe, expect, it } from 'vitest';
import { compileDemonstration } from '../demonstrations/scenario';
import { boardOf, scoreOfGame } from './districtGame';
import { districtDemonstration } from './districtDemonstration';
import { isHexValid } from './hex';

describe('the District plan demonstration', () => {
  const checkpoints = compileDemonstration(districtDemonstration);
  const officeOf = (index: number) => checkpoints[index]!.state.buildings.find(building => building.id === districtDemonstration.buildingId)!;
  const contextOf = (index: number) => ({ seed: checkpoints[index]!.state.seed, officeId: districtDemonstration.buildingId });

  it('plays six Hexes, and every step checks the score it explains', () => {
    expect(officeOf(checkpoints.length - 1).district?.game?.placements).toHaveLength(6);
    const scores = checkpoints.map((_, index) => scoreOfGame(contextOf(index), officeOf(index).district!.game!));
    expect(scores[0]).toBe(0);
    expect(scores.slice(1).every((score, index) => score >= scores[index]!)).toBe(true);
  });

  it('earns something with each Hex it places', () => {
    const scores = checkpoints.map((_, index) => scoreOfGame(contextOf(index), officeOf(index).district!.game!));
    for (let index = 2; index < 6; index++) expect(scores[index]!, `Hex ${index + 1}`).toBeGreaterThan(scores[index - 1]!);
  });

  it('only places valid Hexes', () => {
    const last = officeOf(checkpoints.length - 1);
    expect(boardOf(contextOf(checkpoints.length - 1), last.district!.game!).every(({ hex }) => isHexValid(hex))).toBe(true);
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

  it('says in each step the pairs it makes, in the language of the player', () => {
    const step = districtDemonstration.steps[2]!;
    expect(step.explanation[0]).toMatch(/beside .* (is worth|costs)/);
    expect(step.explanation[1]).toMatch(/à côté (de|d’).* (vaut|coûte|ne vaut rien)/);
    expect(step.explanation[1]).not.toMatch(/de [AEIOUH]/);
  });

  it('breaks on a score that no longer matches its explanation', () => {
    const outdated = { ...districtDemonstration, steps: districtDemonstration.steps.map((step, index) => (index === 2 ? { ...step, check: () => { throw new Error('expected a score of 5, got 4'); } } : step)) };
    expect(() => compileDemonstration(outdated)).toThrow(/hex-3/);
  });
});
