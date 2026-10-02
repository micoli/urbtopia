import { useState } from 'react';
import { t } from '../i18n/t';
import { useNavActions } from './useNavActions';

const RADIUS_PX = 160;

export function RadialMenu() {
  const [open, setOpen] = useState(false);
  const actions = useNavActions();

  return (
    <div className="radial">
      {open
        ? actions.map((action, index) => {
            const angle = (index / (actions.length - 1)) * (Math.PI / 2);
            const x = Math.cos(angle) * RADIUS_PX;
            const y = -Math.sin(angle) * RADIUS_PX;
            return (
              <button
                key={action.id}
                type="button"
                className="radial-item"
                aria-label={action.label}
                aria-pressed={action.pressed}
                disabled={action.disabled}
                style={{ transform: `translate(${x}px, ${y}px)` }}
                onClick={() => {
                  setOpen(false);
                  action.onClick();
                }}
              >
                {action.icon}
              </button>
            );
          })
        : null}
      <button type="button" className="radial-fab" aria-label={t('radial.open')} aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? '✗' : '☰'}
      </button>
    </div>
  );
}
