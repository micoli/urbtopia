import { memo, useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { Building, Command, attractionTakingsOf, isAttraction, isShopType, isVenue, itemModelOf, taxDue, takingsDue, isHomeType, isOfficeType, officeUrbsDue } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { gameStore } from '../../store/gameStore';
import { useProjectedPosition } from '../common/useProjectedPosition';
import { ItemThumbnail } from './ItemThumbnail';
import { registerCollector, startSweep } from './collectSweep';
import { radialBadgeSize, radialOffsets } from './radialLayout';
import {UrbsAmount} from "../common/UrbsAmount.tsx";

const BADGE_HEIGHT = 1.8;
const MAX_PREVIEWS = 6;

interface CollectBadgeProps {
  worldX: number;
  worldZ: number;
  label: string|number;
  command: Command;
  models?: readonly string[];
}
export function collectBadgeLabel(building: Building, officeYield = 1): string | number | null {
  if (isShopType(building.type)) {
    const earned = building.stacks.reduce((total, stack) => total + stack.earned, 0);
    return earned > 0 ? earned : null;
  }
  if (isHomeType(building.type)) {
    const due = taxDue(building);
    return due > 0 ? due : null;
  }
  if (isOfficeType(building.type)) {
    const due = officeUrbsDue(building, officeYield);
    return due > 0 ? due : null;
  }
  if (isVenue(building)) {
    const due = takingsDue(building.venue);
    return due > 0 ? due : null;
  }
  if (isAttraction(building)) {
    const due = Math.floor(attractionTakingsOf(building));
    return due > 0 ? due : null;
  }
  const ready = building.queue.filter((entry) => entry.done).length;
  const earned = building.stacks.reduce((total, stack) => total + stack.earned, 0);
  if (ready > 0) return earned > 0 ? `✓ ${ready} · ${earned}` : `✓ ${ready}`;
  return earned > 0 ? earned : null;
}

export function readyItemModels(building: Building): string[] {
  const models = building.queue.flatMap((entry) => {
    const model = entry.done ? itemModelOf(entry.item) : null;
    return model ? [model] : [];
  });
  return models.slice(0, MAX_PREVIEWS);
}

function sameBadgeProps(a: CollectBadgeProps, b: CollectBadgeProps): boolean {
  return a.worldX === b.worldX && a.worldZ === b.worldZ && a.label === b.label && (a.models ?? []).join() === (b.models ?? []).join() && JSON.stringify(a.command) === JSON.stringify(b.command);
}

export const CollectBadge = memo(function CollectBadge({ worldX, worldZ, label, command, models = [] }: CollectBadgeProps) {
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
      {showPreview
          ? models.map((model, index) => <ItemThumbnail
              key={index}
              model={model}
              offset={offsets[index]!}/>)
          : (typeof label === "number"
                  ? <UrbsAmount value={label}/>
                  : label
          )
      }
    </button>
  );
}, sameBadgeProps);
