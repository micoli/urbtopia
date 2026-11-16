import { dairyLabels as l, dairyPiece as p, dairyScenario } from './dairyCity';
export const dairySimple = dairyScenario('simple', [
  p('vat', 'dairyMilkVat', 0, 0, 0, l.vat, l.vatInfo), p('pump', 'dairyPump', 1, 0, 1, l.pump, l.pumpInfo),
  p('tank', 'dairyTank', 2, 0, 1, l.tank, l.tankInfo), p('motor', 'dairyMotor', 1, 1, 2, l.motor, l.motorInfo),
  p('counter', 'dairyCounter', 0, 1, 2, l.counter, l.counterInfo),
], 1);
