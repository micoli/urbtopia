import { livestockLabels as l, livestockPiece as p, livestockScenario } from './livestockCity';
import { linePathsOf } from '../factory/factoryInterior';
import { roomOf } from './lineInterior';
const scenario = livestockScenario('intermediate', [
  p('intake', 'livestockFeedIntakeLeft', 2, 0, 0, l.intake, ['The left-handed intake takes drive on its left.', 'L’entrée gauchère reçoit la force à gauche.']), p('intake-motor', 'livestockMotor', 1, 0, 3, l.motor, l.motorInfo),
  p('feeder', 'livestockFeeder', 2, 1, 2, l.feeder, l.feederInfo), p('pen', 'livestockPen', 2, 2, 0, l.pen, l.penInfo),
  p('packer', 'livestockPackerLeft', 2, 3, 0, l.packer, ['The left-handed packer takes drive on its left.', 'L’emballeuse gauchère reçoit la force à gauche.']), p('packer-motor', 'livestockMotor', 1, 3, 3, l.motor, l.motorInfo),
  p('split', 'livestockConveyorSplitStraightRight', 2, 4, 0, ['a splitting conveyor', 'un tapis séparateur'], ['The splitter sends production forward and to the right.', 'Le séparateur envoie la production vers l’avant et vers la droite.']),
  p('elbow', 'livestockConveyorElbowRight', 3, 4, 3, ['an elbow conveyor', 'un tapis coudé'], ['The elbow turns the side branch toward its exit.', 'Le coude tourne la branche latérale vers sa sortie.']),
  p('exit', 'livestockCollectionExit', 2, 5, 2, l.exit, l.exitInfo), p('second-exit', 'livestockCollectionExit', 3, 5, 2, ['a second collection exit', 'une seconde sortie de collecte'], l.exitInfo),
]);
export const livestockFarmIntermediate = { ...scenario, steps: scenario.steps.map(step => step.id === 'second-exit' ? { ...step, check: (state: Parameters<typeof roomOf>[0]) => { step.check(state); if (linePathsOf(roomOf(state).interior!.fixtures).length !== 2) throw new Error('expected two collection paths'); } } : step) };
