import { useState } from 'react';
import type { Building } from '../../core';
import { districtStore } from '../../store/districtStore';
import { t } from '../../i18n/t';
import { Dialog } from '../common/Dialog';
import { DistrictCanvas } from './DistrictCanvas';
import { DistrictCloseButton } from './DistrictCloseButton';
import { DistrictFloatingActions } from './DistrictFloatingActions';
import { DistrictGameButtons } from './DistrictGameButtons';
import { DistrictHand } from './DistrictHand';
import { DistrictHud } from './DistrictHud';
import { DistrictLessonButton } from './DistrictLessonButton';
import { DistrictUndoButton } from './DistrictUndoButton';
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
          <DistrictCloseButton onClick={() => districtStore.getState().close()}><DistrictLessonButton /></DistrictCloseButton>
          <DistrictHud view={view} actions={<DistrictGameButtons building={building} view={view} />} />
          <div className="district-stage">
            <DistrictCanvas board={view.board} candidates={view.candidates} picked={view.picked} interactive onAnchor={setAnchor} />
            <DistrictFloatingActions building={building} view={view} anchor={anchor} />
            <DistrictViewButtons />
          </div>
          {view.game ? <DistrictHand current={view.current} upcoming={view.upcoming}><DistrictUndoButton building={building} view={view} /></DistrictHand> : null}
          <p className="district-hint">{view.game === undefined ? t('district.start') : view.over ? t('district.gameOver') : t('district.hint')}</p>
        </div>
      </Dialog.Body>
    </Dialog>
  );
}
