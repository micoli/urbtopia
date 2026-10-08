import { useState } from 'react';
import { t } from '../../i18n/t';
import { NavActionButton } from './NavActionButton';
import { useNavActions, type NavAction } from './useNavActions';

const RADIUS_PX = 224;

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
        ? actions.toReversed().map((action, index) => {
            const angle = (index / (actions.length - 1)) * (Math.PI / 2);
            const x = Math.cos(angle) * RADIUS_PX;
            const y = -Math.sin(angle) * RADIUS_PX;
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
        {open ? '✗' : '☰'}
      </button>
    </div>
  );
}
