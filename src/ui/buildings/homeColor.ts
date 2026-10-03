import type { HomeColorVariant } from '../../core';

export const HOME_COLOR_KEY = 'urbtopia-home-color';
export const HOME_COLOR_VARIANTS: HomeColorVariant[] = ['default', 'a', 'b', 'c'];

export function readHomeColor(): HomeColorVariant {
  try {
    const stored = localStorage.getItem(HOME_COLOR_KEY);
    return HOME_COLOR_VARIANTS.find(variant => variant === stored) ?? 'default';
  } catch {
    return 'default';
  }
}

export function writeHomeColor(variant: HomeColorVariant): void {
  try {
    localStorage.setItem(HOME_COLOR_KEY, variant);
  } catch {
    return;
  }
}
