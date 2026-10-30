import { useState } from 'react';
import { FOOTBALL, TACTICS, type MatchDecision, type MatchState } from '../../core';
import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';
import { ActionButton } from '../common/ActionButton';
import { RadioChipGroup } from '../common/RadioChipGroup';

interface ClubMatchControlsProps {
  state: MatchState;
  onDecide: (decision: MatchDecision) => void;
}

export function ClubMatchControls({ state, onDecide }: ClubMatchControlsProps) {
  const [out, setOut] = useState<number | null>(null);
  const [mine] = state.sides;
  const left = FOOTBALL.maxSubstitutions - mine.substitutions;
  const substitute = (incoming: number) => {
    if (out === null) return;
    onDecide({ minute: state.minute, kind: 'substitute', out, in: incoming });
    setOut(null);
  };
  return (
    <div className="club-controls">
      <RadioChipGroup className="choice-chips" label={t('club.tactic')} options={TACTICS.map(id => ({ value: id, label: t(`club.tactic.${id}` as MessageKey) }))} value={mine.tactic} onChange={tactic => onDecide({ minute: state.minute, kind: 'tactic', tactic })} />
      <p>{t('club.match.subsLeft').replace('{count}', `${left}`)}</p>
      <ul className="club-chips" aria-label={t('club.starters')}>
        {mine.pitch.map(player => <li key={player.id}><button type="button" aria-pressed={out === player.id} disabled={left === 0} onClick={() => setOut(out === player.id ? null : player.id)}>{player.name}</button></li>)}
      </ul>
      <ul className="club-chips" aria-label={t('club.bench')}>
        {mine.bench.map(player => <li key={player.id}><ActionButton variant="default" disabled={out === null || left === 0} onClick={() => substitute(player.id)}>{t('club.match.substitute')} · {player.name}</ActionButton></li>)}
      </ul>
    </div>
  );
}
