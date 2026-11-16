import { labels as l, piece, recyclingScenario } from './recyclingCity';

export const recyclingPlantSimple = recyclingScenario('simple', [
  piece('intake', 'recyclingPlantIntake', 0, 0, 0, l.intake, l.intakeDescription),
  piece('intake-motor', 'recyclingPlantMotor', 1, 0, 1, l.motor, l.motorDescription),
  piece('sorter', 'recyclingPlantSorter', 0, 1, 0, l.sorter, l.sorterDescription),
  piece('sorter-motor', 'recyclingPlantMotor', 1, 1, 1, l.motor, l.motorDescription),
  piece('shredder', 'recyclingPlantShredder', 0, 2, 0, l.shredder, l.recyclerDescription),
  piece('shredder-motor', 'recyclingPlantMotor', 1, 2, 1, l.motor, l.motorDescription),
  piece('conveyor', 'recyclingPlantConveyor', 0, 3, 0, l.conveyor, l.conveyorDescription),
  piece('exit', 'recyclingPlantExit', 0, 4, 2, l.exit, l.exitDescription),
]);
