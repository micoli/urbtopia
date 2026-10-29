interface SelectionFocusInput {
  selectedBuildingId: number | null;
  analyticsLayer: string | null;
  analyticsBuildingId: number | null;
}

// The building drawn with its blue footprint: the selected one, or the one whose flows are being studied.
export function selectionFocus({ selectedBuildingId, analyticsLayer, analyticsBuildingId }: SelectionFocusInput): { buildingId: number | null; studyingFlows: boolean } {
  if (selectedBuildingId !== null) return { buildingId: selectedBuildingId, studyingFlows: false };
  const studyingFlows = analyticsLayer === 'movement.flows' && analyticsBuildingId !== null;
  return { buildingId: studyingFlows ? analyticsBuildingId : null, studyingFlows };
}
