import { labels as l, piece, recyclingScenario } from './recyclingCity';

export const recyclingPlantAdvanced = recyclingScenario('advanced', [
  piece('intake', 'recyclingPlantIntake', 1, 0, 0, l.intake, l.intakeDescription),
  piece('intake-motor', 'recyclingPlantMotor', 2, 0, 1, l.motor, l.motorDescription),
  piece('sorter', 'recyclingPlantSorter', 1, 1, 0, l.sorter, l.sorterDescription),
  piece('sorter-motor', 'recyclingPlantMotor', 2, 1, 0, l.motor, ['This motor deliberately faces away from the sorter.', 'Ce moteur est volontairement tourné à l’opposé du trieur.']),
  piece('shredder', 'recyclingPlantShredder', 1, 2, 0, l.shredder, l.recyclerDescription),
  piece('shredder-motor', 'recyclingPlantMotor', 2, 2, 1, l.motor, l.motorDescription),
  piece('conveyor', 'recyclingPlantConveyor', 1, 3, 0, l.conveyor, l.conveyorDescription),
  piece('exit', 'recyclingPlantExit', 1, 4, 2, l.exit, l.exitDescription),
], true);
