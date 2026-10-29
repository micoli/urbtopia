import { useMemo } from 'react';
import { FOOTBALL, fixtureSeedOf, nextFixture, playUntil, type Building } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { ClubMatchBar } from './ClubMatchBar';
import { ClubMatchControls } from './ClubMatchControls';
import { ClubMatchFeed } from './ClubMatchFeed';
import { useLiveMatch } from './useLiveMatch';

const TICK_MS = 120;

export function ClubMatchTab({ building }: { building: Building }) {
  const club = building.club!;
  const now = useGame(store => store.state.lastSeen);
  const live = useLiveMatch(building.id, FOOTBALL.minutes, TICK_MS);
  const fixture = club.championship && nextFixture(club.championship);
  const index = fixture ? club.championship!.fixtures.indexOf(fixture) : -1;
  const opponent = fixture ? club.championship!.opponents[fixture.opponent]! : null;
  const state = useMemo(() => (fixture && opponent ? playUntil(club, opponent, fixtureSeedOf(club, index), live.decisions, live.step) : null), [club, fixture, opponent, index, live.decisions, live.step]);

  if (!fixture || !opponent || !state) return <p className="note note--muted">{t('club.match.none')}</p>;
  if (now < fixture.at) return <p className="note note--muted">{t('club.match.next').replace('{opponent}', opponent.name).replace('{hours}', `${Math.ceil((fixture.at - now) / 3_600_000)}`)}</p>;
  return (
    <>
      <h3>{state.sides[0].name} {state.score[0]} – {state.score[1]} {opponent.name}</h3>
      <p>{t('club.match.minute').replace('{minute}', `${state.minute}`)}</p>
      <ClubMatchBar live={live} />
      {live.finished ? null : <ClubMatchControls state={state} onDecide={live.decide} />}
      <ClubMatchFeed events={state.events} />
    </>
  );
}
