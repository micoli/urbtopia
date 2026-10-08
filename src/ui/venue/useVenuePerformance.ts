import { useMemo } from 'react';
import { isVenue, venuePerformance, type VenuePerformance } from '../../core';
import { useGame } from '../common/hooks';

export function useVenuePerformance(venueId: number): VenuePerformance | undefined {
  const state = useGame(store => store.state);
  return useMemo(() => {
    const building = state.buildings.find(candidate => candidate.id === venueId);
    return building && isVenue(building) ? venuePerformance(state, building) : undefined;
  }, [state, venueId]);
}
