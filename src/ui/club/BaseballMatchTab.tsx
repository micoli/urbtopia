import { useMemo } from 'react';
import { BASEBALL, fixtureSeedOf, nextFixture, playBaseball, type Building } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { BaseballFeed } from './BaseballFeed';
import { BaseballField } from './BaseballField';
import { BaseballMatchControls } from './BaseballMatchControls';
import { ClubMatchBar } from './ClubMatchBar';
import { useLiveMatch } from './useLiveMatch';

const TICK_MS = 1200;
const LAST_INNING = BASEBALL.innings + BASEBALL.extraInnings;

export function BaseballMatchTab({ building }: { building: Building }) {
  const club = building.club!;
  const now = useGame(store => store.state.lastSeen);
  const live = useLiveMatch(building.id, LAST_INNING, TICK_MS);
  const fixture = club.championship && nextFixture(club.championship);
  const index = fixture ? club.championship!.fixtures.indexOf(fixture) : -1;
  const opponent = fixture ? club.championship!.opponents[fixture.opponent]! : null;
  const state = useMemo(() => (fixture && opponent ? playBaseball(club, opponent, fixtureSeedOf(club, index), live.decisions, live.step) : null), [club, fixture, opponent, index, live.decisions, live.step]);

  if (!fixture || !opponent || !state) return <p className="note note--muted">{t('club.match.none')}</p>;
  if (now < fixture.at) return <p className="note note--muted">{t('club.match.next').replace('{opponent}', opponent.name).replace('{hours}', `${Math.ceil((fixture.at - now) / 3_600_000)}`)}</p>;
  return (
    <>
      <h3>{state.sides[0].name} {state.score[0]} – {state.score[1]} {opponent.name}</h3>
      <p>{t('club.match.inning').replace('{inning}', `${state.inning}`)}</p>
      <ClubMatchBar live={live} finished={state.over} />
      <BaseballField state={state} seed={fixtureSeedOf(club, index)} />
      {state.over ? null : <BaseballMatchControls state={state} onDecide={live.decide} />}
      <BaseballFeed events={state.events} />
    </>
  );
}
