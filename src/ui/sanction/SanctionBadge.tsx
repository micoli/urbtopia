import { useRef } from 'react';
import { footprintOf, type SanctionedHome } from '../../core';
import { useProjectedPosition } from '../common/useProjectedPosition';
import { sanctionBadgeText } from './sanctionBadgeText';
import { Icon } from '../common/Icon';

const BADGE_HEIGHT = 2.6;

export function SanctionBadge({ entry }: { entry: SanctionedHome }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { home } = entry;
  const { width, depth } = footprintOf(home.type, home.rotation, home.tier);
  useProjectedPosition(ref, home.x + width / 2, BADGE_HEIGHT, home.y + depth / 2, 'above');
  const text = sanctionBadgeText(entry);
  return <span ref={ref} className="sanction-badge" role="img" aria-label={text} title={text}><Icon name="warning" /></span>;
}
