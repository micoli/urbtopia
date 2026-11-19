import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { Dialog } from '../common/Dialog';
import { DistrictCanvas } from './DistrictCanvas';
import { DistrictControls } from './DistrictControls';
import { DistrictHand } from './DistrictHand';
import { DistrictHud } from './DistrictHud';
import { useDistrictGame } from './useDistrictGame';

interface DistrictScreenProps {
  building: Building;
}

export function DistrictScreen({ building }: DistrictScreenProps) {
  const view = useDistrictGame(building);
  return (
    <Dialog className="district-backdrop">
      <Dialog.Title>{t('district.title')}</Dialog.Title>
      <Dialog.Body>
        <div className="district-screen">
          <DistrictHud view={view} />
          <DistrictCanvas board={view.board} candidates={view.candidates} picked={view.picked} interactive />
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
