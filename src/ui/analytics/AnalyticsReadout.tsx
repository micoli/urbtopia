import { useMemo } from 'react';
import { probeOf } from '../../core';
import { causeText } from '../../i18n/causeText';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { useGame, useUi } from '../common/hooks';

export function AnalyticsReadout() {
  const layer = useUi(store => store.analyticsLayer);
  const category = useUi(store => store.analyticsCategory);
  const tile = useUi(store => store.analyticsProbe);
  const state = useGame(store => store.state);
  const probe = useMemo(() => (layer && tile ? probeOf(state, layer, category, tile) : null), [state, layer, category, tile]);

  if (!layer || layer === 'movement.flows') return null;
  if (!tile) return <p className="analytics-readout analytics-readout-hint">{t('analytics.probe.empty')}</p>;
  return (
    <section className="analytics-readout" aria-label={t('analytics.probe.title')}>
      <h4>{t('analytics.probe.title')} ({tile.x}, {tile.y})</h4>
      {probe === null ? <p>–</p> : (
        <>
          <ul>
            {probe.lines.map(line => <li key={line.key}>{t(line.key as MessageKey)}{line.value === null ? '' : `: ${line.value}${line.suffix ?? ''}`}</li>)}
          </ul>
          {probe.causes.length > 0 && (
            <>
              <h5>{t('analytics.probe.causes')}</h5>
              <ul>{probe.causes.map(cause => <li key={cause.key}>{causeText(cause)}</li>)}</ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
