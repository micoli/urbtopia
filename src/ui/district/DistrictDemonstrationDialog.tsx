import { useMemo, useState } from 'react';
import { districtBoardOf } from '../../core';
import { compileDemonstration, type DemonstrationText } from '../../core/demonstrations/scenario';
import { districtDemonstration } from '../../core/districtPlan/districtDemonstration';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { Dialog } from '../common/Dialog';
import { DistrictCanvas } from './DistrictCanvas';

interface DistrictDemonstrationDialogProps {
  onClose: () => void;
}

const NO_CELLS: never[] = [];

const textOf = (text: DemonstrationText): string => text[prefsStore.getState().language === 'fr' ? 1 : 0];

const PHASES = [
  ['objective', 'demo.objective'],
  ['action', 'demo.action'],
  ['explanation', 'demo.why'],
  ['result', 'demo.result'],
] as const;

// The lesson of the District plan: its steps are played by the game's own rules on a city of its own, and the player moves through them by hand.
export function DistrictDemonstrationDialog({ onClose }: DistrictDemonstrationDialogProps) {
  const checkpoints = useMemo(() => compileDemonstration(districtDemonstration), []);
  const [index, setIndex] = useState(0);
  const { step, state } = checkpoints[index]!;
  const game = state.buildings.find(building => building.id === districtDemonstration.buildingId)?.district?.game;
  const board = useMemo(() => (game ? districtBoardOf({ seed: state.seed, officeId: districtDemonstration.buildingId }, game) : []), [game, state.seed]);
  return (
    <Dialog>
      <Dialog.Title>{textOf(districtDemonstration.title)}</Dialog.Title>
      <Dialog.Body>
        <div className="district-screen">
          <p className="district-demo__step">{index + 1} / {checkpoints.length} · <strong>{textOf(step.title)}</strong></p>
          <DistrictCanvas board={board} candidates={NO_CELLS} picked={null} interactive={false} />
          <dl className="district-demo__phases">
            {PHASES.map(([phase, label]) => (
              <div key={phase}>
                <dt>{t(label)}</dt>
                <dd>{textOf(step[phase])}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Dialog.Body>
      <Dialog.Actions>
        <ActionButton disabled={index === 0} onClick={() => setIndex(index - 1)}>{t('demo.previous')}</ActionButton>
        <ActionButton variant="primary" disabled={index === checkpoints.length - 1} onClick={() => setIndex(index + 1)}>{t('demo.next')}</ActionButton>
        <ActionButton onClick={onClose}>{t('district.close')}</ActionButton>
      </Dialog.Actions>
    </Dialog>
  );
}
