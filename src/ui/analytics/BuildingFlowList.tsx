import type { ReactNode } from 'react';
import type { BuildingFlow } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { MODE_COLORS } from '../../scene/analyticsRamps';
import { useUi } from '../common/hooks';

const MODES = ['car', 'walk', 'cycle'] as const;

const sharesOf = (flow: BuildingFlow) => MODES
  .map(mode => ({ mode, percent: Math.round(100 * flow.modes[mode] / (flow.modes.car + flow.modes.walk + flow.modes.cycle)) }))
  .filter(({ percent }) => percent > 0);

interface BuildingFlowListProps {
  title: MessageKey;
  flows: readonly BuildingFlow[];
  color: string;
  // The selected building, titling the first list.
  heading?: ReactNode;
}

export function BuildingFlowList({ title, flows, color, heading }: BuildingFlowListProps) {
  const showBuilding = useUi(store => store.showBuilding);
  if (flows.length === 0) return null;
  return (
    <section className="analytics-flow-list">
      {heading}
      <h4><span className="analytics-legend-swatch" aria-hidden="true" style={{ background: color }} />{t(title)}</h4>
      <ul>
        {flows.map(flow => (
          <li key={flow.id}>
            <button type="button" aria-label={`${t(`building.${flow.type}` as MessageKey)}: ${t('analytics.flows.show')}`} onClick={() => showBuilding(flow.id)}>
              {t(`building.${flow.type}` as MessageKey)} ({flow.x}, {flow.y})
            </button>
            <span>{flow.volume}</span>
            <span className="analytics-flow-modes">
              {sharesOf(flow).map(({ mode, percent }) => (
                <span key={mode}><i aria-hidden="true" style={{ background: MODE_COLORS[mode] }} />{t(`analytics.building.mode.${mode}` as MessageKey)} {percent} %</span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
