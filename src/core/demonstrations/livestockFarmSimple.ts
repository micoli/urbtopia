import { livestockLabels as l, livestockPiece as p, livestockScenario } from './livestockCity';
export const livestockFarmSimple = livestockScenario('simple', [
  p('intake', 'livestockFeedIntake', 0, 0, 0, l.intake, l.intakeInfo), p('intake-motor', 'livestockMotor', 1, 0, 1, l.motor, l.motorInfo),
  p('feeder', 'livestockFeeder', 0, 1, 2, l.feeder, l.feederInfo), p('pen', 'livestockPen', 0, 2, 0, l.pen, l.penInfo),
  p('packer', 'livestockPacker', 0, 3, 0, l.packer, l.packerInfo), p('packer-motor', 'livestockMotor', 1, 3, 1, l.motor, l.motorInfo),
  p('exit', 'livestockCollectionExit', 0, 4, 2, l.exit, l.exitInfo),
]);
