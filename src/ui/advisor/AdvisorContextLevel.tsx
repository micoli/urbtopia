import { useId } from 'react';
import { useStore } from 'zustand';
import { CONTEXT_LEVELS, isContextLevel } from '../../advisor/contextLevel';
import { prefsStore } from '../../i18n/prefsStore';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';

export function AdvisorContextLevel() {
  const id = useId();
  const level = useStore(prefsStore, (store) => store.advisorContextLevel);
  const first = CONTEXT_LEVELS[0];
  const last = CONTEXT_LEVELS[CONTEXT_LEVELS.length - 1];
  return (
    <div className="advisor-context-level">
      <label htmlFor={id}>{t('advisor.context.label')}: <strong>{t(`advisor.context.level.${level}` as MessageKey)}</strong></label>
      <div className="advisor-context-level__track">
        <input
          id={id}
          type="range"
          min={first}
          max={last}
          step={1}
          value={level}
          aria-valuetext={t(`advisor.context.level.${level}` as MessageKey)}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (isContextLevel(next)) prefsStore.getState().setAdvisorContextLevel(next);
          }}
        />
        <div className="advisor-context-level__ticks" aria-hidden="true">
          {CONTEXT_LEVELS.map((tick) => <span key={tick} className={tick <= level ? 'is-reached' : undefined} />)}
        </div>
      </div>
      <small>{t('advisor.context.hint')}</small>
    </div>
  );
}
