import { useState } from 'react';
import { BASKETBALL, BASKETBALL_TACTICS, type BasketballState, type MatchDecision } from '../../core';
import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';
import { RadioChipGroup } from '../common/RadioChipGroup';
import type { Jerseys } from './jerseyNumbers';

interface BasketballMatchControlsProps {
  state: BasketballState;
  jerseys: Jerseys;
  onDecide: (decision: MatchDecision) => void;
}

export function BasketballMatchControls({ state, jerseys, onDecide }: BasketballMatchControlsProps) {
  const [out, setOut] = useState<number | null>(null);
  const [mine] = state.sides;
  const left = BASKETBALL.maxSubstitutions - mine.substitutions;
  const substitute = (incoming: number) => {
    if (out === null) return;
    onDecide({ minute: state.minute, kind: 'substitute', out, in: incoming });
    setOut(null);
  };
  const row = (player: (typeof mine.court)[number]) => (
    <>
      <span className="club-subs__number">{jerseys.get(player.id)}</span>
      <span>{player.name}</span>
      <span>{t(`club.position.${player.position}` as MessageKey)}</span>
      <span title={t('club.player.rating')}>{player.rating}</span>
    </>
  );
  return (
    <div className="club-controls">
      <RadioChipGroup className="choice-chips" label={t('club.tactic')} options={BASKETBALL_TACTICS.map(id => ({ value: id, label: t(`club.tactic.${id}` as MessageKey) }))} value={mine.tactic} onChange={tactic => onDecide({ minute: state.minute, kind: 'tactic', tactic })} />
      <p>{t('club.match.subsLeft').replace('{count}', `${left}`)}</p>
      {left > 0 && <p className="note note--muted">{t(out === null ? 'club.match.pickStarter' : 'club.match.pickReplacement')}</p>}
      <div className="club-subs">
        <ul className="club-subs__list" aria-label={t('club.starters')}>
          {mine.court.map(player => (
            <li key={player.id}>
              <button type="button" className="club-subs__player" aria-pressed={out === player.id} disabled={left === 0} onClick={() => setOut(out === player.id ? null : player.id)}>{row(player)}</button>
            </li>
          ))}
        </ul>
        <ul className="club-subs__list" aria-label={t('club.bench')}>
          {mine.bench.map(player => (
            <li key={player.id}>
              <button type="button" className="club-subs__player" disabled={out === null || left === 0} onClick={() => substitute(player.id)}>{row(player)}</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
