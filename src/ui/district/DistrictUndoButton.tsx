import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { districtStore } from '../../store/districtStore';
import { gameStore } from '../../store/gameStore';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';
import type { DistrictView } from './useDistrictGame';

interface DistrictUndoButtonProps {
  building: Building;
  view: DistrictView;
}

// Takes back the last Hex placed, down to the Start hex.
export function DistrictUndoButton({ building, view }: DistrictUndoButtonProps) {
  const canUndo = view.game !== undefined && view.game.placements.length > 1;
  const undo = () => {
    gameStore.getState().send({ type: 'UndoDistrictHex', buildingId: building.id });
    districtStore.getState().clearDraft();
  };
  return (
    <IconButton size="md" tone="light" label={t('district.undo')} disabled={!canUndo} onClick={undo}>
      <Icon name="undo" />
    </IconButton>
  );
}
