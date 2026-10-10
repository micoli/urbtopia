import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { Building, Command, isShopType, isVenue, itemModelOf, taxDue, takingsDue } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { gameStore } from '../../store/gameStore';
import { useProjectedPosition } from '../common/useProjectedPosition';
import { ItemThumbnail } from './ItemThumbnail';
import { registerCollector, startSweep } from './collectSweep';
import { radialBadgeSize, radialOffsets } from './radialLayout';

const BADGE_HEIGHT = 1.8;
const MAX_PREVIEWS = 6;

interface CollectBadgeProps {
  worldX: number;
  worldZ: number;
  label: string;
  command: Command;
  models?: readonly string[];
}
export function collectBadgeLabel(building: Building): string | null {
  if (isShopType(building.type)) {
    const earned = building.stacks.reduce((total, stack) => total + stack.earned, 0);
    return earned > 0 ? `+${earned}` : null;
  }
  if (building.type === 'home') {
    const due = taxDue(building);
    return due > 0 ? `+${due}` : null;
  }
  if (isVenue(building)) {
    const due = takingsDue(building.venue);
    return due > 0 ? `+${due}` : null;
  }
  const ready = building.queue.filter((entry) => entry.done).length;
  return ready > 0 ? `✓ ${ready}` : null;
}

export function readyItemModels(building: Building): string[] {
  const models = building.queue.flatMap((entry) => {
    const model = entry.done ? itemModelOf(entry.item) : null;
    return model ? [model] : [];
  });
  return models.slice(0, MAX_PREVIEWS);
}

export function CollectBadge({ worldX, worldZ, label, command, models = [] }: CollectBadgeProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const previewEnabled = useStore(prefsStore, (store) => store.showProductionPreview);
  const showPreview = previewEnabled && models.length > 0;
  const offsets = radialOffsets(models.length);
  const size = radialBadgeSize(models.length);

  useProjectedPosition(ref, worldX, BADGE_HEIGHT, worldZ, 'above');

  const collect = () => gameStore.getState().send(command);

  useEffect(() => (ref.current ? registerCollector(ref.current, collect) : undefined));

  return (
    <button
      ref={ref}
      type="button"
      className={showPreview ? 'collect-badge collect-badge-radial' : 'collect-badge'}
      style={showPreview ? { width: size, height: size } : undefined}
      onPointerDown={(event) => {
        event.currentTarget.releasePointerCapture(event.pointerId);
        startSweep();
        collect();
      }}
      onClick={(event) => {
        if (event.detail === 0) collect();
      }}
    >
      {showPreview ? models.map((model, index) => <ItemThumbnail key={index} model={model} offset={offsets[index]!} />) : label}
    </button>
  );
}
