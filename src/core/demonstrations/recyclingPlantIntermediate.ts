import { labels as l, piece, recyclingScenario } from './recyclingCity';
import { recyclingGainsOf } from '../factory/recyclingGains';
import { roomOf } from './lineInterior';

const scenario = recyclingScenario('intermediate', [
  piece('intake', 'recyclingPlantIntakeLeft', 2, 0, 0, l.intake, ['This left-handed intake takes drive on its left.', 'Cette entrée gauchère reçoit la force à gauche.']),
  piece('intake-motor', 'recyclingPlantMotor', 1, 0, 3, l.motor, l.motorDescription),
  piece('sorter', 'recyclingPlantSorterLeft', 2, 1, 0, l.sorter, ['This left-handed sorter takes drive on its left and must precede the recycler.', 'Ce trieur gaucher reçoit la force à gauche et doit précéder la machine de recyclage.']),
  piece('sorter-motor', 'recyclingPlantMotor', 1, 1, 3, l.motor, l.motorDescription),
  piece('crusher', 'recyclingPlantCrusherLeft', 2, 2, 0, l.crusher, ['The left-handed crusher receives drive on its left and processes the sorted material.', 'Le concasseur gaucher reçoit la force à gauche et traite les matières triées.']),
  piece('crusher-motor', 'recyclingPlantMotor', 1, 2, 3, l.motor, l.motorDescription),
  piece('split', 'recyclingPlantConveyorSplitStraightRight', 2, 3, 0, ['a splitting conveyor', 'un tapis séparateur'], ['The splitter sends material forward and to the right.', 'Le séparateur envoie les matières vers l’avant et vers la droite.']),
  piece('elbow', 'recyclingPlantConveyorElbowRight', 3, 3, 3, ['an elbow conveyor', 'un tapis coudé'], ['The elbow turns the side branch toward its exit.', 'Le coude tourne la branche latérale vers sa sortie.']),
  piece('conveyor', 'recyclingPlantConveyor', 2, 4, 0, l.conveyor, l.conveyorDescription), piece('second-conveyor', 'recyclingPlantConveyor', 3, 4, 0, l.conveyor, l.conveyorDescription),
  piece('exit', 'recyclingPlantExit', 2, 5, 2, l.exit, l.exitDescription), piece('second-exit', 'recyclingPlantExit', 3, 5, 2, ['a second exit', 'une seconde sortie'], l.exitDescription),
], false, 2);
export const recyclingPlantIntermediate = { ...scenario, steps: scenario.steps.map(step => step.id === 'second-exit' ? { ...step, check: (state: Parameters<typeof roomOf>[0]) => { step.check(state); if (recyclingGainsOf(roomOf(state)).exits !== 2) throw new Error('expected two recycling exits'); } } : step) };
