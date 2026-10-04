import type { GoalProgress } from '../../../core/leisure/blockmatch/types';
import { t } from '../../../i18n/t';
import { GoalItem } from './GoalItem';

interface BlockmatchHudProps {
  movesLeft: number;
  goals: GoalProgress[];
}

export function BlockmatchHud({ movesLeft, goals }: BlockmatchHudProps) {
  return (
    <div className="blockmatch-hud">
      <div className="blockmatch-moves">
        <strong>{movesLeft}</strong>
        <small>{t('casino.moves')}</small>
      </div>
      <ul className="blockmatch-goals">
        {goals.map((goal, index) => <GoalItem key={index} goal={goal} />)}
      </ul>
    </div>
  );
}
