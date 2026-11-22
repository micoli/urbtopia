import { describe, expect, it } from 'vitest';
import { engineRoomReportOf } from '../../factory/engineRoomCircuits';
import { demonstrationsOf } from '../catalog';
import { roomOf } from '../lineInterior';
import { compileDemonstration } from '../scenario';
import { coalPlantAdvanced, coalPlantSimple } from './coalPlant';
import { geothermalPlantSimple } from './geothermalPlant';
import { hydroPlantSimple } from './hydroPlant';

describe('the guided demonstrations of an Engine room', () => {
  it.each([coalPlantSimple, hydroPlantSimple, geothermalPlantSimple, coalPlantAdvanced])('$id replays and ends on a complete Circuit', scenario => {
    const checkpoints = compileDemonstration(scenario);
    expect(engineRoomReportOf(roomOf(checkpoints.at(-1)!.state)).circuits).toHaveLength(1);
  });

  it('shows the faulty Coal circuit as incomplete before the elbow is turned', () => {
    const checkpoints = compileDemonstration(coalPlantAdvanced);
    expect(engineRoomReportOf(roomOf(checkpoints.at(-2)!.state)).circuits).toHaveLength(0);
  });

  it('are offered by the three plants, and by the Large geothermal plant through the Geothermal one', () => {
    expect(demonstrationsOf('coalPlant').map(scenario => scenario.level)).toEqual(['simple', 'advanced']);
    expect(demonstrationsOf('hydroPlant')).toHaveLength(1);
    expect(demonstrationsOf('largeGeothermalPlant')).toEqual(demonstrationsOf('geothermalPlant'));
  });
});
