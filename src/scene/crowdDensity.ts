import type { CrowdDensity } from '../i18n/prefsStore';

const FACTORS: Record<CrowdDensity, number> = { low: 0.5, normal: 1, high: 2 };

export function crowdFactor(density: CrowdDensity): number {
  return FACTORS[density];
}
