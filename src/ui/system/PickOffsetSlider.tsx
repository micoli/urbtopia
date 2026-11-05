import { useId } from 'react';
import { useStore } from 'zustand';
import { DEBUG_OFFSET_LIMIT, prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';

// A tick every 5 pixels, from one limit to the other.
const TICKS = Array.from({ length: (2 * DEBUG_OFFSET_LIMIT) / 5 + 1 }, (_, index) => index * 5 - DEBUG_OFFSET_LIMIT);

const tickClass = (tick: number): string | undefined => (tick === 0 ? 'is-zero' : tick % 10 === 0 ? 'is-ten' : undefined);

// How far a click or a touch is moved, in pixels, along one axis of the screen, with a button that brings it back to zero.
export function PickOffsetSlider({ axis }: { axis: 'x' | 'y' }) {
  const id = useId();
  const value = useStore(prefsStore, (store) => (axis === 'x' ? store.debugOffsetX : store.debugOffsetY));
  const label = t(axis === 'x' ? 'prefs.debugOffsetX' : 'prefs.debugOffsetY');
  const reset = () => prefsStore.getState().setDebugOffset(axis, 0);
  return (
    <div className="pick-offset">
      <label htmlFor={id}>{label}: <strong>{value}</strong></label>
      <div className="pick-offset__row">
        <div className="pick-offset__track">
          <input id={id} type="range" min={-DEBUG_OFFSET_LIMIT} max={DEBUG_OFFSET_LIMIT} step={1} value={value} onChange={(event) => prefsStore.getState().setDebugOffset(axis, Number(event.target.value))} />
          <div className="pick-offset__ticks" aria-hidden="true">
            {TICKS.map((tick) => <span key={tick} className={tickClass(tick)} style={{ left: `${((tick + DEBUG_OFFSET_LIMIT) / (2 * DEBUG_OFFSET_LIMIT)) * 100}%` }} />)}
          </div>
        </div>
        <ActionButton size="sm" disabled={value === 0} onClick={reset}>{t(axis === 'x' ? 'prefs.debugOffsetResetX' : 'prefs.debugOffsetResetY')}</ActionButton>
      </div>
    </div>
  );
}
