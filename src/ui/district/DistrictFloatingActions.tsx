import { useStore } from 'zustand';
import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { districtStore } from '../../store/districtStore';
import { gameStore } from '../../store/gameStore';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';
import type { DistrictView } from './useDistrictGame';

interface DistrictFloatingActionsProps {
  building: Building;
  view: DistrictView;
  // The pixel below the picked cell, on the board.
  anchor: { x: number; y: number } | null;
}

// Turn and place, floating under the Hex that is picked.
export function DistrictFloatingActions({ building, view, anchor }: DistrictFloatingActionsProps) {
  const rotation = useStore(districtStore, store => store.rotation);
  if (!anchor || !view.picked) return null;
  const place = () => {
    if (!view.picked?.valid) return;
    gameStore.getState().send({ type: 'PlaceDistrictHex', buildingId: building.id, cell: view.picked.cell, rotation });
    districtStore.getState().clearDraft();
  };
  return (
    <div className="district-floating" style={{ left: anchor.x, top: anchor.y }}>
      <IconButton size="md" tone="light" label={t('district.rotate')} onClick={() => districtStore.getState().rotate()}>
        <Icon name="rotateLeft" />
      </IconButton>
      <IconButton size="md" tone="accent" label={t('district.place')} disabled={!view.picked.valid} onClick={place}>
        <Icon name="check" />
      </IconButton>
      <IconButton size="md" tone="light" label={t('district.rotateBack')} onClick={() => districtStore.getState().rotateBack()}>
        <Icon name="rotateRight" />
      </IconButton>
    </div>
  );
}
