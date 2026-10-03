import type { BuildingType, TutorialStep } from '../core';

export interface TutorialGuide {
  flyout: 'build' | 'roads' | null;
  buildings: readonly BuildingType[];
  road: boolean;
}

const BUILDING_STEPS: Partial<Record<TutorialStep, readonly BuildingType[]>> = {
  workshop: ['workshop'],
  factory: ['factory'],
  storehouse: ['storehouse'],
  shop: ['shop'],
  utilities: ['powerPlant', 'waterTower'],
  home: ['home'],
};

const NO_GUIDE: TutorialGuide = { flyout: null, buildings: [], road: false };

export function guideOf(step: TutorialStep | null): TutorialGuide {
  if (step === null) return NO_GUIDE;
  if (step === 'road') return { flyout: 'roads', buildings: [], road: true };
  const buildings = BUILDING_STEPS[step];
  return buildings ? { flyout: 'build', buildings, road: false } : NO_GUIDE;
}
