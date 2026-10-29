import { useState } from 'react';
import { APPROACHES, baseballAutoStarters, baseballLineup, baseballLineupIssue, type Building, type Player } from '../../core';
import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { PlayerRow } from './PlayerRow';

export function BaseballLineupTab({ building }: { building: Building }) {
  const club = building.club!;
  const lineup = baseballLineup(club);
  const [picked, setPicked] = useState<number | null>(null);
  const send = (starters: number[], tactic: string) => gameStore.getState().send({ type: 'SetLineup', buildingId: building.id, formation: lineup.formation, starters, tactic });
  const byId = (id: number) => club.squad.find(player => player.id === id) as Player;
  const [pitcherId, ...hitterIds] = lineup.starters;
  const bench = club.squad.filter(player => !lineup.starters.includes(player.id));
  const kindOf = (player: Player) => (player.position === 'pitcher' ? 'pitcher' : 'hitter');
  const swap = (benchPlayer: Player) => {
    const out = picked === null ? undefined : byId(picked);
    if (!out || kindOf(out) !== kindOf(benchPlayer)) return;
    const starters = lineup.starters.map(id => (id === out.id ? benchPlayer.id : id));
    if (baseballLineupIssue(club.squad, starters) === null) send(starters, lineup.tactic);
    setPicked(null);
  };
  return (
    <>
      <RadioChipGroup label={t('club.approach')} options={APPROACHES.map(id => ({ value: id, label: t(`club.approach.${id}` as MessageKey) }))} value={lineup.tactic as (typeof APPROACHES)[number]} onChange={tactic => send(lineup.starters, tactic)} />
      <ActionButton variant="default" onClick={() => send(baseballAutoStarters(club.squad), lineup.tactic)}>{t('club.bestLineup')}</ActionButton>
      <p className="note note--muted">{t('club.swapHintBaseball')}</p>
      <h3>{t('club.pitcher')}</h3>
      <ul className="club-list">
        <PlayerRow player={byId(pitcherId!)} selected={picked === pitcherId} onSelect={() => setPicked(picked === pitcherId ? null : pitcherId!)} />
      </ul>
      <h3>{t('club.battingOrder')}</h3>
      <ol className="club-list">
        {hitterIds.map(id => <PlayerRow key={id} player={byId(id)} selected={picked === id} onSelect={() => setPicked(picked === id ? null : id)} />)}
      </ol>
      <h3>{t('club.bench')}</h3>
      <ul className="club-list">
        {bench.map(player => <PlayerRow key={player.id} player={player} onSelect={() => swap(player)} />)}
      </ul>
    </>
  );
}
