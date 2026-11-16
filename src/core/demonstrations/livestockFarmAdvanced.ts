import { livestockLabels as l, livestockPiece as p, livestockScenario } from './livestockCity';
export const livestockFarmAdvanced = livestockScenario('advanced', [
  p('intake', 'livestockFeedIntake', 4, 0, 0, l.intake, l.intakeInfo), p('intake-motor', 'livestockMotor', 5, 0, 1, l.motor, l.motorInfo),
  p('feeder', 'livestockFeeder', 4, 1, 2, l.feeder, l.feederInfo), p('pen', 'livestockPen', 4, 2, 0, l.pen, l.penInfo),
  p('packer', 'livestockPacker', 4, 3, 0, l.packer, l.packerInfo), p('packer-motor', 'livestockMotor', 5, 3, 0, l.motor, ['The motor deliberately faces away from the packer.', 'Le moteur est volontairement tourné à l’opposé de l’emballeuse.']),
  p('exit', 'livestockCollectionExit', 4, 4, 2, l.exit, l.exitInfo),
], true);
