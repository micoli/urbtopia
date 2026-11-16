import { dairyLabels as l, dairyPiece as p, dairyScenario } from './dairyCity';
import { linePathsOf } from '../factory/interiorLine';
import { interiorBonusOfBuilding } from '../factory/interiorBonus';
import { BUILDING_ID, roomOf } from './lineInterior';
const scenario = dairyScenario('intermediate', [
  p('vat', 'dairyMilkVat', 4, 0, 0, l.vat, l.vatInfo), p('pump', 'dairyPump', 5, 0, 1, l.pump, l.pumpInfo),
  p('tank', 'dairyTank', 6, 0, 1, l.tank, l.tankInfo), p('motor', 'dairyMotor', 5, 1, 2, l.motor, l.motorInfo),
  p('conveyor', 'dairyConveyor', 4, 1, 0, l.conveyor, l.conveyorInfo), p('pasteurizer', 'dairyPasteurizer', 4, 2, 0, l.pasteurizer, ['This pasteuriser takes milk on its left and needs a separate pump circuit.', 'Ce pasteurisateur reçoit le lait à gauche et nécessite un circuit de pompe séparé.']),
  p('second-pump', 'dairyPump', 3, 2, 3, l.pump, l.pumpInfo), p('second-tank', 'dairyTank', 2, 2, 3, l.tank, l.tankInfo),
  p('second-motor', 'dairyMotor', 3, 1, 0, l.motor, l.motorInfo),
  p('split', 'dairyConveyorSplitStraightRight', 4, 3, 0, ['a splitting conveyor', 'un tapis séparateur'], ['The splitter sends products straight ahead and to the right.', 'Le séparateur envoie les produits tout droit et vers la droite.']),
  p('elbow', 'dairyConveyorElbowRight', 5, 3, 3, ['an elbow conveyor', 'un tapis coudé'], ['The elbow turns the side branch toward its counter.', 'Le coude tourne la branche latérale vers son comptoir.']),
  p('counter', 'dairyCounter', 4, 4, 2, l.counter, l.counterInfo), p('second-counter', 'dairyCounter', 5, 4, 2, ['a second counter', 'un second comptoir'], l.counterInfo),
], 3);
export const dairyIntermediate = { ...scenario, steps: [...scenario.steps, {
  id: 'cream-maker', title: ['Hire a cream maker', 'Embaucher un crémier'] as const,
  objective: ['Activate the cream yield bonus.', 'Activer le bonus de rendement de la crème.'] as const,
  action: ['Hire a cream maker.', 'Embauche un crémier.'] as const,
  explanation: ['A cream maker delivers the yield bonus from the connected pasteuriser.', 'Un crémier apporte le bonus de rendement du pasteurisateur raccordé.'] as const,
  result: ['The dairy gains a cream yield bonus.', 'La laiterie gagne un bonus de rendement pour la crème.'] as const,
  commands: [{ type: 'HireInteriorStaff' as const, buildingId: BUILDING_ID, role: 'creamMaker' as const }],
  check: (state: Parameters<typeof roomOf>[0]) => { scenario.steps.at(-1)!.check(state); if (linePathsOf(roomOf(state).interior!.fixtures).length !== 2) throw new Error('expected two dairy paths'); if (interiorBonusOfBuilding(roomOf(state), 'cream').yield <= 0) throw new Error('expected cream yield bonus'); },
}] };
