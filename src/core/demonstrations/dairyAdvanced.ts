import { dairyLabels as l, dairyPiece as p, dairyScenario } from './dairyCity';
export const dairyAdvanced = dairyScenario('advanced', [
  p('vat', 'dairyMilkVat', 4, 0, 0, l.vat, l.vatInfo), p('pump', 'dairyPump', 5, 0, 1, l.pump, l.pumpInfo),
  p('tank', 'dairyTank', 6, 0, 1, l.tank, l.tankInfo), p('motor', 'dairyMotor', 5, 1, 0, l.motor, ['The motor deliberately faces away from the pump.', 'Le moteur est volontairement tourné à l’opposé de la pompe.']),
  p('counter', 'dairyCounter', 4, 1, 2, l.counter, l.counterInfo),
], 2, true);
