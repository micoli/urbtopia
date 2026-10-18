import { useMemo, useRef } from 'react';
import { t } from '../../../../i18n/t.ts';
import { ActionButton } from '../../../common/ActionButton.tsx';
import { TransportMapLayers } from './TransportMapLayers.tsx';
import { TransportMapLine } from './TransportMapLine.tsx';
import { TransportMapNode } from './TransportMapNode.tsx';
import { mergeBounds, type MapLine, type TransportMapModel } from './transportMapModel.ts';
import type { MapSelection } from './selection.ts';
import { isLineDimmed, isNodeDimmed } from './selection.ts';
import { visibleLabelIds } from './labelLayout.ts';
import { useElementSize } from './useElementSize.ts';
import { useMapViewport } from './useMapViewport.ts';

interface TransportMapCanvasProps {
  model: TransportMapModel;
  lines: readonly MapLine[];
  selection: MapSelection;
  roads: boolean;
  pedestrianWays: boolean;
  onSelect: (selection: MapSelection) => void;
}

// The roads and the Pedestrian ways have a real shape: with one of them, the stops stand where they really are; without, the sub-networks are brought together.
export function TransportMapCanvas({ model, lines, selection, roads, pedestrianWays, onSelect }: TransportMapCanvasProps) {
  const svg = useRef<SVGSVGElement>(null);
  const real = roads || pedestrianWays;
  const placedNodes = useMemo(() => (real ? model.nodes.map(node => ({ ...node, x: node.realX, y: node.realY })) : model.nodes), [model.nodes, real]);
  const bounds = useMemo(() => mergeBounds(real ? model.realBounds : model.bounds, roads ? model.roadBounds : null, pedestrianWays ? model.pedestrianBounds : null), [model, real, roads, pedestrianWays]);
  const { view, fit, handlers } = useMapViewport(bounds, svg);
  const size = useElementSize(svg);
  const unit = 1 / Math.min(size.width / view.width, size.height / view.height);
  const nodes = useMemo(() => new Map(placedNodes.map(node => [node.id, node])), [placedNodes]);
  const shown = new Set(lines.flatMap(line => line.stops));
  const shownNodes = placedNodes.filter(node => shown.has(node.id));
  const labelled = visibleLabelIds(shownNodes, selection, view, size);
  return <div className="transport-map-canvas">
    <svg
      ref={svg}
      role="img"
      aria-label={t('eco.transportMap')}
      viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
      onClick={() => onSelect(null)}
      {...handlers}
    >
      {real && <TransportMapLayers model={model} nodes={nodes} roads={roads} pedestrianWays={pedestrianWays} unit={unit} />}
      {model.transfers.filter(transfer => shown.has(transfer.from) && shown.has(transfer.to)).map(transfer => {
        const from = nodes.get(transfer.from)!, to = nodes.get(transfer.to)!;
        return <line key={`${transfer.from}-${transfer.to}`} className="transport-map-transfer" x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="currentColor" strokeWidth={2} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" opacity={0.7} />;
      })}
      {lines.map(line => <TransportMapLine
        key={line.id}
        line={line}
        nodes={nodes}
        unit={unit}
        dimmed={isLineDimmed(selection, line)}
        selected={selection?.kind === 'line' && selection.id === line.id}
        onSelect={() => onSelect({ kind: 'line', id: line.id })}
      />)}
      {shownNodes.map(node => <TransportMapNode
        key={node.id}
        node={node}
        unit={unit}
        labelled={labelled.has(node.id)}
        dimmed={isNodeDimmed(selection, node, lines)}
        selected={selection?.kind === 'stop' && selection.id === node.id}
        onSelect={() => onSelect({ kind: 'stop', id: node.id })}
      />)}
    </svg>
    <ActionButton onClick={fit}>{t('transportMap.fit')}</ActionButton>
  </div>;
}
