import { useState } from 'react';
import type { Building } from '../../core';
import { districtStore } from '../../store/districtStore';
import { t } from '../../i18n/t';
import { Dialog } from '../common/Dialog';
import { DistrictCanvas } from './DistrictCanvas';
import { DistrictCloseButton } from './DistrictCloseButton';
import { DistrictControls } from './DistrictControls';
import { DistrictFloatingActions } from './DistrictFloatingActions';
import { DistrictHand } from './DistrictHand';
import { DistrictHud } from './DistrictHud';
import { DistrictViewButtons } from './DistrictViewButtons';
import { useDistrictGame } from './useDistrictGame';

interface DistrictScreenProps {
  building: Building;
}

export function DistrictScreen({ building }: DistrictScreenProps) {
  const view = useDistrictGame(building);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  return (
    <Dialog className="district-backdrop">
      <Dialog.Title>{t('district.title')}</Dialog.Title>
      <Dialog.Body>
        <div className="district-screen">
          <DistrictCloseButton onClick={() => districtStore.getState().close()} />
          <DistrictHud view={view} />
          <div className="district-stage">
            <DistrictCanvas board={view.board} candidates={view.candidates} picked={view.picked} interactive onAnchor={setAnchor} />
            <DistrictFloatingActions building={building} view={view} anchor={anchor} />
            <DistrictViewButtons />
          </div>
          <DistrictHand current={view.current} upcoming={view.upcoming} />
          <p className="district-hint">{view.game === undefined ? t('district.start') : view.over ? t('district.gameOver') : t('district.hint')}</p>
        </div>
      </Dialog.Body>
      <Dialog.Actions>
        <DistrictControls building={building} view={view} />
      </Dialog.Actions>
    </Dialog>
  );
}
