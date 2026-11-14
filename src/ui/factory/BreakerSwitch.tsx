import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';

interface BreakerSwitchProps {
  building: Building;
}

export function BreakerSwitch({ building }: BreakerSwitchProps) {
  const on = !building.breakerOff;
  return (
    <button type="button" role="switch" aria-checked={on} data-action="breaker" className="dock-button" onClick={() => gameStore.getState().send({ type: 'SetInteriorBreaker', buildingId: building.id, off: on })}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <rect x="6" y="2" width="12" height="20" rx="2" style={{fill: on ? "green":"red"}} />
        {on ? <path d="M12 6v5" /> : <path d="M12 13v5" />}
        {on ? <rect x="9.5" y="6" width="5" height="5" fill="currentColor" /> : <rect x="9.5" y="13" width="5" height="5" fill="none" />}
      </svg>
      <span>{t('interior.breaker')}</span>
    </button>
  );
}
