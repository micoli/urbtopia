import { useState } from 'react';
import { t } from '../../i18n/t';
import { NavActionButton } from './NavActionButton';
import { useNavActions, type NavAction } from './useNavActions';
import { Icon } from '../common/Icon';

const RING_RADII_PX = [200, 120, 50];
const ITEMS_PER_RINGS = [5, 3 , 1];

function ringPosition(index: number, count: number): { x: number; y: number } {
  const lastRing = ITEMS_PER_RINGS.length - 1;
  let ring = 0;
  let ringStart = 0;
  while (ring < lastRing && index >= ringStart + ITEMS_PER_RINGS[ring]!) {
    ringStart += ITEMS_PER_RINGS[ring]!;
    ring += 1;
  }
  const ringCount = ring < lastRing ? Math.min(ITEMS_PER_RINGS[ring]!, count - ringStart) : count - ringStart;
  const rank = index - ringStart;
  const angle = ringCount === 1 ? Math.PI / 4 : (1 - rank / (ringCount - 1)) * (Math.PI / 2);
  const radius = RING_RADII_PX[ring]!;
  return { x: Math.cos(angle) * radius, y: -Math.sin(angle) * radius };
}

interface RadialMenuProps {
  actions?: NavAction[];
}

export function RadialMenu({ actions: provided }: RadialMenuProps) {
  const [open, setOpen] = useState(false);
  const cityActions = useNavActions();
  const actions = provided ?? cityActions;

  return (
    <div className="radial">
      {open
        ? actions.map((action, index) => {
            const { x, y } = ringPosition(index, actions.length);
            return (
              <NavActionButton
                key={action.id}
                action={action}
                variant="radial"
                style={{ transform: `translate(${x}px, ${y}px)` }}
                onClick={() => {
                  setOpen(false);
                  action.onClick();
                }}
              />
            );
          })
        : null}
      <button type="button" className="radial-fab" aria-label={t('radial.open')} aria-expanded={open} data-guided={!open && actions.some((action) => action.guided)} onClick={() => setOpen(!open)}>
        <Icon name={open ? 'close' : 'menu'} />
      </button>
    </div>
  );
}
