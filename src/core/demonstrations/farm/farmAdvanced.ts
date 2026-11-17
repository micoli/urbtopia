import { farmLabels as l, farmPiece as p, farmScenario } from './farmCity';

export const farmAdvanced = farmScenario('advanced', [
  p('intake', 'farmIntake', 0, 0, 0, l.intake, l.intakeInfo), p('pump-motor', 'farmMotor', 1, 0, 2, l.motor, ['The motor deliberately faces away from the pump.', 'Le moteur est volontairement tourné à l’opposé de la pompe.']),
  p('pump', 'farmPumpLeft', 1, 1, 1, l.pump, l.pumpInfo), p('tank', 'farmTank', 2, 1, 1, l.tank, l.tankInfo),
  p('thresher', 'farmThresher', 0, 2, 0, l.thresher, l.thresherInfo), p('thresher-motor', 'farmMotor', 1, 2, 1, l.motor, l.motorInfo),
  p('grader', 'farmGrader', 0, 3, 0, l.grader, l.graderInfo), p('grader-motor', 'farmMotor', 1, 3, 1, l.motor, l.motorInfo),
  p('bin', 'farmHarvestBin', 0, 4, 2, l.bin, l.binInfo),
  p('washer', 'farmWasher', 0, 1, 0, l.washer, ['The washer is the last piece, and it gets no water: the pump has no drive.', 'La laveuse est la dernière pièce, et elle ne reçoit pas d’eau : la pompe n’a pas de force.']),
], 'farmhand', true);
