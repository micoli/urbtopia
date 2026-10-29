import type { GoalProgress } from '../../../../core/leisure/blockmatch/types.ts';
import { Icon } from '../../../common/Icon';
import { GoalIcon } from './GoalIcon.tsx';

export const GoalItem = ({ goal }: { goal: GoalProgress }) => (
  <li className={`goal ${goal.remaining === 0 ? 'goal--done' : ''}`}>
    <span className="goal__icon">
      <GoalIcon goal={goal} />
    </span>
    <span className="goal__count">{goal.remaining === 0 ? <Icon name="check" /> : goal.remaining}</span>
  </li>
);
