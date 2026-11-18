import { knitLabels as l, knitPiece as p, knitScenario } from './knitwearCity';
export const knitwearFactorySimple = knitScenario('simple', [
  p('knitter', 'knitwearKnitter', 0, 0, 0, l.knitter, l.knitterInfo), p('knitter-motor', 'knitwearMotor', 1, 0, 1, l.motor, l.motorInfo),
  p('finisher', 'knitwearFinisher', 0, 1, 0, l.finisher, l.finisherInfo), p('finisher-motor', 'knitwearMotor', 1, 1, 1, l.motor, l.motorInfo),
  p('counter', 'knitwearCounter', 0, 2, 2, l.counter, l.counterInfo),
]);
