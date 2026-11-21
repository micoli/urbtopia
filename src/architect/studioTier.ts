import { createContext, useContext } from 'react';
import { ARCHITECT_TIER_COUNT } from '../core/architect/architectTiers.ts';

// The Tier of the Architect office the studio runs in; the standalone page has no office and unlocks everything.
export const StudioTierContext = createContext<number>(ARCHITECT_TIER_COUNT);

export const useStudioTier = (): number => useContext(StudioTierContext);
