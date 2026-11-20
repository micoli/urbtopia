import { NumberStepper } from '../../../src/ui/common/NumberStepper.tsx';
import { t } from './i18n.ts';
import { MAX_FLOORS, addFloor, removeFloor, type Plan } from './model.ts';

interface FloorCountPanelProps {
  plan: Plan;
  edit: (mutate: (plan: Plan) => void) => void;
}

// The shape is chosen when the plan is created; only the number of floors stays editable.
export function FloorCountPanel({ plan, edit }: FloorCountPanelProps) {
  const setFloorCount = (count: number) =>
    edit((draft) => {
      while (draft.floors.length < count) addFloor(draft);
      while (draft.floors.length > count) removeFloor(draft);
    });
  return <NumberStepper label={t('architect.floors')} value={plan.floors.length} min={1} max={MAX_FLOORS} onChange={setFloorCount} />;
}
