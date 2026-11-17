import { knitLabels as l, knitPiece as p, knitScenario } from './knitwearCity';
export const knitwearFactoryAdvanced = knitScenario('advanced', [
  p('knitter', 'knitwearKnitter', 4, 0, 0, l.knitter, l.knitterInfo), p('knitter-motor', 'knitwearMotor', 5, 0, 1, l.motor, l.motorInfo),
  p('finisher', 'knitwearFinisher', 4, 1, 0, l.finisher, l.finisherInfo), p('finisher-motor', 'knitwearMotor', 5, 1, 0, l.motor, ['This motor deliberately faces away from the finisher.', 'Ce moteur est volontairement tourné à l’opposé de la finisseuse.']),
  p('counter', 'knitwearCounter', 4, 2, 2, l.counter, l.counterInfo),
], true);
