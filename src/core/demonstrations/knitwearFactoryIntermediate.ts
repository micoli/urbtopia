import { linePathsOf } from '../factory/factoryInterior';
import { roomOf } from './lineInterior';
import { knitLabels as l, knitPiece as p, knitScenario } from './knitwearCity';
const scenario = knitScenario('intermediate', [
  p('knitter', 'knitwearKnitterLeft', 2, 0, 0, l.knitter, ['The left-handed knitter takes drive on its left.', 'La tricoteuse gauchère reçoit la force à gauche.']), p('knitter-motor', 'knitwearMotor', 1, 0, 3, l.motor, l.motorInfo),
  p('conveyor', 'knitwearConveyor', 2, 1, 0, l.conveyor, l.conveyorInfo), p('finisher', 'knitwearFinisherLeft', 2, 2, 0, l.finisher, ['The left-handed finisher takes drive on its left.', 'La finisseuse gauchère reçoit la force à gauche.']),
  p('finisher-motor', 'knitwearMotor', 1, 2, 3, l.motor, l.motorInfo),
  p('split', 'knitwearConveyorSplitStraightRight', 2, 3, 0, ['a splitting conveyor', 'un tapis séparateur'], ['The splitter sends garments straight ahead and to the right.', 'Le séparateur envoie les vêtements tout droit et vers la droite.']),
  p('elbow', 'knitwearConveyorElbowRight', 3, 3, 3, ['an elbow conveyor', 'un tapis coudé'], ['The elbow turns the side branch toward its counter.', 'Le coude tourne la branche latérale vers son comptoir.']),
  p('counter', 'knitwearCounter', 2, 4, 2, l.counter, l.counterInfo), p('second-counter', 'knitwearCounter', 3, 4, 2, ['a second counter', 'un second comptoir'], ['The second counter receives the branch from the splitter.', 'Le second comptoir reçoit la branche du séparateur.']),
]);
export const knitwearFactoryIntermediate = { ...scenario, steps: scenario.steps.map(step => step.id === 'second-counter' ? { ...step, check: (state: Parameters<typeof roomOf>[0]) => { step.check(state); if (linePathsOf(roomOf(state).interior!.fixtures).length !== 2) throw new Error('expected two knitwear paths'); } } : step) };
