import type { Special } from '../../../core/leisure/blockmatch/types';

const ICONS: Record<Special, string> = {
  rocketH: '🚀',
  rocketV: '🚀',
  bomb: '🧨',
  lightball: '🔮',
};

export const SpecialIcon = ({ special }: { special: Special }) => <span className={`special special--${special}`}>{ICONS[special]}</span>;
