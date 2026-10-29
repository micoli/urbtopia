import { useEffect, useMemo, useState } from 'react';
import { FOOTBALL, fixtureSeedOf, nextFixture, playUntil, type Building, type MatchDecision } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { useGame } from '../common/hooks';
import { ClubMatchControls } from './ClubMatchControls';
import { ClubMatchFeed } from './ClubMatchFeed';

const TICK_MS = 120;

export function ClubMatchTab({ building }: { building: Building }) {
  const club = building.club!;
  const now = useGame(store => store.state.lastSeen);
  const [minute, setMinute] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [decisions, setDecisions] = useState<MatchDecision[]>([]);
  const [recorded, setRecorded] = useState(false);
  const fixture = club.championship && nextFixture(club.championship);
  const index = fixture ? club.championship!.fixtures.indexOf(fixture) : -1;
  const opponent = fixture ? club.championship!.opponents[fixture.opponent]! : null;
  const state = useMemo(() => (fixture && opponent ? playUntil(club, opponent, fixtureSeedOf(club, index), decisions, minute) : null), [club, fixture, opponent, index, decisions, minute]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setMinute(current => Math.min(FOOTBALL.minutes, current + 1)), TICK_MS);
    return () => clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (minute >= FOOTBALL.minutes) setPlaying(false);
  }, [minute]);

  if (!fixture || !opponent || !state) return <p className="note note--muted">{t('club.match.none')}</p>;
  if (now < fixture.at) return <p className="note note--muted">{t('club.match.next').replace('{opponent}', opponent.name).replace('{hours}', `${Math.ceil((fixture.at - now) / 3_600_000)}`)}</p>;
  return (
    <>
      <h3>{state.sides[0].name} {state.score[0]} – {state.score[1]} {opponent.name}</h3>
      <p>{t('club.match.minute').replace('{minute}', `${state.minute}`)}</p>
      <div className="club-actions">
        <ActionButton variant="primary" disabled={minute >= FOOTBALL.minutes} onClick={() => setPlaying(!playing)}>{playing ? t('club.match.pause') : t('club.match.play')}</ActionButton>
        <ActionButton variant="default" disabled={minute >= FOOTBALL.minutes} onClick={() => setMinute(FOOTBALL.minutes)}>{t('club.match.skip')}</ActionButton>
        <ActionButton variant="default" disabled={recorded || decisions.length === 0} onClick={() => { gameStore.getState().send({ type: 'PlayMatch', buildingId: building.id, decisions }); setRecorded(true); }}>{t('club.match.record')}</ActionButton>
      </div>
      {recorded ? <p className="note note--muted">{t('club.match.recorded')}</p> : null}
      {minute < FOOTBALL.minutes ? <ClubMatchControls state={state} onDecide={decision => { setRecorded(false); setDecisions([...decisions, decision]); }} /> : null}
      <ClubMatchFeed events={state.events} />
    </>
  );
}
