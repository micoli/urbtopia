import { hasServiceInterior, type Building } from '../../core';
import { ProductionIndicators } from './ProductionIndicators';
import { ServiceIndicators } from './ServiceIndicators';

interface InteriorIndicatorsProps {
  factory: Building;
}

// The indicators of the box at the top of the main menu, written out in full at the top of the Management panel.
export function InteriorIndicators({ factory }: InteriorIndicatorsProps) {
  return hasServiceInterior(factory) ? <ServiceIndicators building={factory} /> : <ProductionIndicators factory={factory} />;
}
