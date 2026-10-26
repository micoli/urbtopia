import { useMemo } from 'react';
import { flowEndpointsOf, type FlowEndpoint } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { FLOW_COLORS } from '../../scene/analyticsRamps';
import { useGame, useUi } from '../common/hooks';

interface FlowListProps {
  title: MessageKey;
  endpoints: readonly FlowEndpoint[];
  color: string;
}

function FlowList({ title, endpoints, color }: FlowListProps) {
  const showTile = useUi(store => store.showTile);
  if (endpoints.length === 0) return null;
  return (
    <section className="analytics-flow-list">
      <h4><span className="analytics-legend-swatch" aria-hidden="true" style={{ background: color }} />{t(title)}</h4>
      <ul>
        {endpoints.map(endpoint => (
          <li key={endpoint.id}>
            <button type="button" aria-label={`${t(`building.${endpoint.type}` as MessageKey)}: ${t('analytics.flows.show')}`} onClick={() => showTile({ x: endpoint.x, y: endpoint.y })}>
              {t(`building.${endpoint.type}` as MessageKey)} ({endpoint.x}, {endpoint.y})
            </button>
            <span>{endpoint.volume}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AnalyticsFlows() {
  const layer = useUi(store => store.analyticsLayer);
  const state = useGame(store => store.state);
  const flows = useMemo(() => (layer ? flowEndpointsOf(state, layer) : null), [state, layer]);
  if (!flows || (flows.origins.length === 0 && flows.destinations.length === 0)) return null;
  return (
    <div className="analytics-flows">
      <FlowList title="analytics.flows.origins" endpoints={flows.origins} color={FLOW_COLORS.origins} />
      <FlowList title="analytics.flows.destinations" endpoints={flows.destinations} color={FLOW_COLORS.destinations} />
    </div>
  );
}
