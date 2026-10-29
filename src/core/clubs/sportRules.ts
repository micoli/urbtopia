import type { SportRules } from './clubTypes';

// The rules of the sport each stadium hosts, registered by the sports themselves so the Club engine knows none of them.
const rulesByStadium = new Map<string, SportRules>();

export const registerSportRules = (stadiumType: string, rules: SportRules): void => {
  rulesByStadium.set(stadiumType, rules);
};

export const sportRulesOf = (stadiumType: string): SportRules | undefined => rulesByStadium.get(stadiumType);

export const hasClub = (stadiumType: string): boolean => rulesByStadium.has(stadiumType);

export const unregisterSportRules = (stadiumType: string): void => {
  rulesByStadium.delete(stadiumType);
};
