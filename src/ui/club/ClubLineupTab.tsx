import { useState } from 'react';
import { FORMATION_IDS, TACTICS, autoStarters, effectiveLineup, lineupIssue, type Building, type Player } from '../../core';
import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { PlayerRow } from './PlayerRow';

export function ClubLineupTab({ building }: { building: Building }) {
  const club = building.club!;
  const lineup = effectiveLineup(club);
  const [picked, setPicked] = useState<number | null>(null);
  const send = (formation: string, starters: number[], tactic: string) => gameStore.getState().send({ type: 'SetLineup', buildingId: building.id, formation, starters, tactic });
  const byId = (id: number) => club.squad.find(player => player.id === id) as Player;
  const bench = club.squad.filter(player => !lineup.starters.includes(player.id));
  const swap = (benchPlayer: Player) => {
    const out = picked === null ? undefined : byId(picked);
    if (!out || out.position !== benchPlayer.position) return;
    const starters = lineup.starters.map(id => (id === out.id ? benchPlayer.id : id));
    if (lineupIssue(club.squad, lineup.formation, starters) === null) send(lineup.formation, starters, lineup.tactic);
    setPicked(null);
  };
  return (
    <>
      <RadioChipGroup className="choice-chips" label={t('club.formation')} options={FORMATION_IDS.map(id => ({ value: id, label: id }))} value={lineup.formation as (typeof FORMATION_IDS)[number]} onChange={formation => send(formation, autoStarters(club.squad, formation), lineup.tactic)} />
      <RadioChipGroup className="choice-chips" label={t('club.tactic')} options={TACTICS.map(id => ({ value: id, label: t(`club.tactic.${id}` as MessageKey) }))} value={lineup.tactic as (typeof TACTICS)[number]} onChange={tactic => send(lineup.formation, lineup.starters, tactic)} />
      <ActionButton variant="default" onClick={() => send(lineup.formation, autoStarters(club.squad, lineup.formation as (typeof FORMATION_IDS)[number]), lineup.tactic)}>{t('club.bestEleven')}</ActionButton>
      <p className="note note--muted">{t('club.swapHint')}</p>
      <h3>{t('club.starters')}</h3>
      <ul className="club-list">
        {lineup.starters.map(id => <PlayerRow key={id} player={byId(id)} selected={picked === id} onSelect={() => setPicked(picked === id ? null : id)} />)}
      </ul>
      <h3>{t('club.bench')}</h3>
      <ul className="club-list">
        {bench.map(player => <PlayerRow key={player.id} player={player} onSelect={() => swap(player)} />)}
      </ul>
    </>
  );
}
