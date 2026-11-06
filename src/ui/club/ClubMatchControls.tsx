import { useState } from 'react';
import { FOOTBALL, TACTICS, type MatchDecision, type MatchState } from '../../core';
import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';
import { RadioChipGroup } from '../common/RadioChipGroup';

interface ClubMatchControlsProps {
  state: MatchState;
  onDecide: (decision: MatchDecision) => void;
}

export function ClubMatchControls({ state, onDecide }: ClubMatchControlsProps) {
  const [out, setOut] = useState<number | null>(null);
  const [mine] = state.sides;
  const left = FOOTBALL.maxSubstitutions - mine.substitutions;
  const leaving = mine.pitch.find(player => player.id === out);
  const eligible = leaving ? mine.bench.filter(player => player.position === leaving.position) : mine.bench;
  const substitute = (incoming: number) => {
    if (out === null) return;
    onDecide({ minute: state.minute, kind: 'substitute', out, in: incoming });
    setOut(null);
  };
  return (
    <div className="club-controls">
      <RadioChipGroup className="choice-chips" label={t('club.tactic')} options={TACTICS.map(id => ({ value: id, label: t(`club.tactic.${id}` as MessageKey) }))} value={mine.tactic} onChange={tactic => onDecide({ minute: state.minute, kind: 'tactic', tactic })} />
      <p>{t('club.match.subsLeft').replace('{count}', `${left}`)}</p>
      <div className="club-subs">
        <ul className="club-subs__list" aria-label={t('club.starters')}>
          {mine.pitch.map(player => (
            <li key={player.id}>
              <button type="button" className="club-subs__player" aria-pressed={out === player.id} disabled={left === 0} onClick={() => setOut(out === player.id ? null : player.id)}>
                <span>{player.name}</span>
                <span>{t(`club.position.${player.position}` as MessageKey)}</span>
                <span title={t('club.player.rating')}>{player.rating}</span>
              </button>
            </li>
          ))}
        </ul>
        <ul className="club-subs__list" aria-label={t('club.bench')}>
          {leaving && eligible.length === 0 && <li className="note note--muted">{t('club.match.noEligible')}</li>}
          {eligible.map(player => (
            <li key={player.id}>
              <button type="button" className="club-subs__player" disabled={out === null || left === 0} onClick={() => substitute(player.id)}>
                <span>{player.name}</span>
                <span>{t(`club.position.${player.position}` as MessageKey)}</span>
                <span title={t('club.player.rating')}>{player.rating}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
