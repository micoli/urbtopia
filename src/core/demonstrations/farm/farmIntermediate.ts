import { farmLabels as l, farmPiece as p, farmScenario } from './farmCity';

export const farmIntermediate = farmScenario('intermediate', [
  p('tank', 'farmTank', 0, 1, 3, l.tank, l.tankInfo), p('pump-motor', 'farmMotor', 1, 0, 0, l.motor, l.motorInfo), p('pump', 'farmPump', 1, 1, 3, l.pump, l.pumpInfo),
  p('sprinkler', 'farmSprinklerLeft', 2, 1, 0, l.sprinkler, ['The left-handed sprinkler takes water on its left, from the pump that faces it.', 'L’arroseur gaucher reçoit l’eau à gauche, de la pompe qui lui fait face.']),
], 'irrigator');
