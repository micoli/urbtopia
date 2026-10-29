import { describe, expect, it } from 'vitest';
import { selectionFocus } from './selectionFocus';

describe('selectionFocus', () => {
  it('is the selected building outside the analysis', () => {
    expect(selectionFocus({ selectedBuildingId: 4, analyticsLayer: null, analyticsBuildingId: null })).toEqual({ buildingId: 4, studyingFlows: false });
  });

  it('is the building whose flows are studied, since the analysis clears the selection', () => {
    expect(selectionFocus({ selectedBuildingId: null, analyticsLayer: 'movement.flows', analyticsBuildingId: 9 })).toEqual({ buildingId: 9, studyingFlows: true });
  });

  it('is nothing when the flows layer has no building, or for another analysis layer', () => {
    expect(selectionFocus({ selectedBuildingId: null, analyticsLayer: 'movement.flows', analyticsBuildingId: null })).toEqual({ buildingId: null, studyingFlows: false });
    expect(selectionFocus({ selectedBuildingId: null, analyticsLayer: 'movement.cars', analyticsBuildingId: 9 })).toEqual({ buildingId: null, studyingFlows: false });
  });
});
