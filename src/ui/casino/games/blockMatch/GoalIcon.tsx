import type { Goal } from '../../../core/leisure/blockmatch/types';
import { Gem } from './Gem';

export const GoalIcon = ({ goal }: { goal: Goal }) => {
  if (goal.type === 'color') return <Gem color={goal.color} />;
  return <span className={`goal-icon goal-icon--${goal.type}`} />;
};
