import { useMemo } from 'react';
import { buildingFlowsOf } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { FLOW_COLORS } from '../../scene/analyticsRamps';
import { useGame, useUi } from '../common/hooks';
import { BuildingFlowList } from './BuildingFlowList';

export function BuildingFlowsPanel() {
  const buildingId = useUi(store => store.analyticsBuildingId);
  const state = useGame(store => store.state);
  const flows = useMemo(() => (buildingId === null ? null : buildingFlowsOf(state, buildingId)), [state, buildingId]);
  if (!flows) return <p className="analytics-flow-list">{t('analytics.building.hint')}</p>;
  const { building, arrivals, departures } = flows;
  const heading = (
    <h3 className="analytics-flow-building">
      <span className="analytics-legend-swatch" aria-hidden="true" style={{ background: FLOW_COLORS.selected }} />{t(`building.${building.type}` as MessageKey)} ({building.x}, {building.y})
    </h3>
  );
  if (arrivals.length === 0 && departures.length === 0) {
    return <section className="analytics-flow-list">{heading}<p>{t('analytics.building.none')}</p></section>;
  }
  return (
    <div className="analytics-flows">
      <BuildingFlowList title="analytics.building.arrivals" flows={arrivals} color={FLOW_COLORS.origins} heading={heading} />
      <BuildingFlowList title="analytics.building.departures" flows={departures} color={FLOW_COLORS.destinations} heading={arrivals.length === 0 ? heading : undefined} />
    </div>
  );
}
