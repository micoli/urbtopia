import { useMemo, useRef } from 'react';
import { t } from '../../../../i18n/t.ts';
import { ActionButton } from '../../../common/ActionButton.tsx';
import { TransportMapLine } from './TransportMapLine.tsx';
import { TransportMapNode } from './TransportMapNode.tsx';
import type { MapLine, TransportMapModel } from './transportMapModel.ts';
import type { MapSelection } from './selection.ts';
import { isLineDimmed, isNodeDimmed } from './selection.ts';
import { useMapViewport } from './useMapViewport.ts';

interface TransportMapCanvasProps {
  model: TransportMapModel;
  lines: readonly MapLine[];
  selection: MapSelection;
  onSelect: (selection: MapSelection) => void;
}

export function TransportMapCanvas({ model, lines, selection, onSelect }: TransportMapCanvasProps) {
  const svg = useRef<SVGSVGElement>(null);
  const { view, fit, handlers } = useMapViewport(model.bounds, svg);
  const nodes = useMemo(() => new Map(model.nodes.map(node => [node.id, node])), [model.nodes]);
  const shown = new Set(lines.flatMap(line => line.stops));
  return <div className="transport-map-canvas">
    <svg
      ref={svg}
      role="img"
      aria-label={t('eco.transportMap')}
      viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
      onClick={() => onSelect(null)}
      {...handlers}
    >
      {model.transfers.filter(transfer => shown.has(transfer.from) && shown.has(transfer.to)).map(transfer => {
        const from = nodes.get(transfer.from)!, to = nodes.get(transfer.to)!;
        return <line key={`${transfer.from}-${transfer.to}`} className="transport-map-transfer" x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="currentColor" strokeWidth={2} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" opacity={0.7} />;
      })}
      {lines.map(line => <TransportMapLine
        key={line.id}
        line={line}
        nodes={nodes}
        dimmed={isLineDimmed(selection, line)}
        selected={selection?.kind === 'line' && selection.id === line.id}
        onSelect={() => onSelect({ kind: 'line', id: line.id })}
      />)}
      {model.nodes.filter(node => shown.has(node.id)).map(node => <TransportMapNode
        key={node.id}
        node={node}
        dimmed={isNodeDimmed(selection, node, lines)}
        selected={selection?.kind === 'stop' && selection.id === node.id}
        onSelect={() => onSelect({ kind: 'stop', id: node.id })}
      />)}
    </svg>
    <ActionButton onClick={fit}>{t('transportMap.fit')}</ActionButton>
  </div>;
}
