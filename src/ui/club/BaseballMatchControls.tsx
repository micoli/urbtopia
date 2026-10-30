import { APPROACHES, BASEBALL, type BaseballState, type MatchDecision } from '../../core';
import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';
import { ActionButton } from '../common/ActionButton';
import { RadioChipGroup } from '../common/RadioChipGroup';

interface BaseballMatchControlsProps {
  state: BaseballState;
  onDecide: (decision: MatchDecision) => void;
}

// The decisions are taken before the next inning begins.
export function BaseballMatchControls({ state, onDecide }: BaseballMatchControlsProps) {
  const [mine] = state.sides;
  const left = BASEBALL.maxPitcherChanges - mine.changes;
  const minute = state.inning;
  return (
    <div className="club-controls">
      <RadioChipGroup className="choice-chips" label={t('club.approach')} options={APPROACHES.map(id => ({ value: id, label: t(`club.approach.${id}` as MessageKey) }))} value={mine.approach} onChange={tactic => onDecide({ minute, kind: 'tactic', tactic })} />
      <p>{t('club.match.changesLeft').replace('{count}', `${left}`)}</p>
      <ul className="club-chips" aria-label={t('club.match.bullpen')}>
        {mine.bullpen.map(player => (
          <li key={player.id}>
            <ActionButton variant="default" disabled={left === 0} onClick={() => { onDecide({ minute, kind: 'substitute', out: mine.pitcher.id, in: player.id }); }}>
              {t('club.match.changePitcher')} · {player.name} ({player.rating})
            </ActionButton>
          </li>
        ))}
      </ul>
    </div>
  );
}
