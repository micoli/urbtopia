import { useSyncExternalStore } from 'react';
import { forcedAnnualEventDay, subscribeForcedAnnualEventDay } from '../../core';

export const useForcedAnnualEventDay = (): number | undefined => useSyncExternalStore(subscribeForcedAnnualEventDay, forcedAnnualEventDay, forcedAnnualEventDay);
