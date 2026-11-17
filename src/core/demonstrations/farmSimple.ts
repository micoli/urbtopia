import { farmLabels as l, farmPiece as p, farmScenario } from './farmCity';

export const farmSimple = farmScenario('simple', [
  p('intake', 'farmIntake', 0, 0, 0, l.intake, l.intakeInfo), p('pump-motor', 'farmMotor', 1, 0, 0, l.motor, l.motorInfo),
  p('pump', 'farmPumpLeft', 1, 1, 1, l.pump, l.pumpInfo), p('tank', 'farmTank', 2, 1, 1, l.tank, l.tankInfo),
  p('washer', 'farmWasher', 0, 1, 0, l.washer, l.washerInfo), p('thresher', 'farmThresher', 0, 2, 0, l.thresher, l.thresherInfo), p('thresher-motor', 'farmMotor', 1, 2, 1, l.motor, l.motorInfo),
  p('grader', 'farmGrader', 0, 3, 0, l.grader, l.graderInfo), p('grader-motor', 'farmMotor', 1, 3, 1, l.motor, l.motorInfo),
  p('bin', 'farmHarvestBin', 0, 4, 2, l.bin, l.binInfo),
], 'farmhand');
