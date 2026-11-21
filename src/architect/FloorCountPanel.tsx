import { NumberStepper } from '../ui/common/NumberStepper.tsx';
import { t } from '../i18n/t';
import { maxFloorsOf } from '../core/architect/architectTiers.ts';
import { useStudioTier } from './studioTier.ts';
import { addFloor, removeFloor, type Plan } from '../core/architect/housePlan.ts';

interface FloorCountPanelProps {
  plan: Plan;
  edit: (mutate: (plan: Plan) => void) => void;
}

// The shape is chosen when the plan is created; only the number of floors stays editable.
export function FloorCountPanel({ plan, edit }: FloorCountPanelProps) {
  const tier = useStudioTier();
  const setFloorCount = (count: number) =>
    edit((draft) => {
      while (draft.floors.length < count) addFloor(draft);
      while (draft.floors.length > count) removeFloor(draft);
    });
  return <NumberStepper label={t('architect.floors')} value={plan.floors.length} min={1} max={maxFloorsOf(tier)} onChange={setFloorCount} />;
}
