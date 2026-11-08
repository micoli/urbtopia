import { describe, expect, it } from 'vitest';
import { congestionStats, createBuilding, newGame, type Building, type GameState } from '../index';
import { diagnoseJobs } from './jobsDiagnosis';

const home: Building = { ...createBuilding(901, 'home', 55, 59, 0), tier: 4 };
const office = (tier: number, x = 60, y = 59): Building => ({ ...createBuilding(900 + x, 'office', x, y, 0), tier });
const city = (buildings: Building[]): GameState => ({ ...newGame({ seed: 'jobs-diagnosis', now: 0 }), tutorial: null, adaptationUntil: 0, buildings });
const diagnosis = (state: GameState) => diagnoseJobs(state, congestionStats(state));

describe('jobs diagnosis', () => {
  it('stays silent when every Citizen has a Job', () => {
    expect(diagnosis(city([home, office(4)])).causes).toEqual([]);
  });

  it('says the city lacks Jobs when it offers fewer than it has Citizens', () => {
    const [cause] = diagnosis(city([home, office(1)])).causes;
    expect(cause?.key).toBe('diagnosis.jobs.short');
    expect(cause?.focus).toEqual([{ x: home.x, y: home.y }]);
  });

  it('says the Jobs are out of reach when there are enough of them', () => {
    const [cause] = diagnosis(city([home, office(1), office(7, 20, 20)])).causes;
    expect(cause?.key).toBe('diagnosis.jobs.unreachable');
  });
});
