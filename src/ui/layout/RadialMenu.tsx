import { useState } from 'react';
import { t } from '../../i18n/t';
import { NavActionButton } from './NavActionButton';
import { useNavActions } from './useNavActions';

const RADIUS_PX = 224;

export function RadialMenu() {
  const [open, setOpen] = useState(false);
  const actions = useNavActions();

  return (
    <div className="radial">
      {open
        ? actions.reverse().map((action, index) => {
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
