import type { GameState } from '../engine/state';
import type { AnalyticsLayerId } from './layers';
import { pedestrianCrossingsField, sidewalkField } from './pedestrianFields';
import { carsField, congestionField } from './roadFields';
import { coverageField } from './coverageField';
import { landValueField } from './landValueField';
import { odorField } from './odorField';
import { wellbeingField } from './wellbeingField';
import { pollutionField } from './pollutionField';
import { LAYER_SCALES, type RampId } from './scales';
import type { TileField } from './tileField';
import type { ServiceCategory } from '../services/facilities';

export interface LayerField {
  field: TileField;
  ramp: RampId;
}

function fieldsOf(state: GameState, layer: AnalyticsLayerId, category: ServiceCategory): readonly TileField[] {
  switch (layer) {
    case 'data.coverage': return [coverageField(state, category)];
    case 'data.pollution': return [pollutionField(state)];
    case 'data.odor': return [odorField(state)];
    case 'data.wellbeing': return [wellbeingField(state)];
    case 'data.landValue': return [landValueField(state)];
    case 'data.congestion': return [congestionField(state)];
    case 'movement.cars': return [carsField(state)];
    case 'movement.pedestrians': return [sidewalkField(state), pedestrianCrossingsField(state)];
    case 'movement.all': return [carsField(state), sidewalkField(state), pedestrianCrossingsField(state)];
    default: return [];
  }
}

// The tile fields a Layer draws, each with its colour ramp; Layers read per Home or not yet built have none.
export function layerFieldsOf(state: GameState, layer: AnalyticsLayerId, category: ServiceCategory): LayerField[] {
  const scales = LAYER_SCALES[layer] ?? [];
  return fieldsOf(state, layer, category).map((field, index) => ({ field, ramp: scales[index]!.ramp }));
}
