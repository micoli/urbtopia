import { useEffect, useMemo } from 'react';
import { useStore } from 'zustand';
import { BASKETBALL, fixtureSeedOf, nextFixture, playBasketball, startBasketball, type Building } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { BasketballCourt } from './BasketballCourt';
import { BasketballFeed } from './BasketballFeed';
import { BasketballMatchControls } from './BasketballMatchControls';
import { ClubMatchPlayback } from './ClubMatchPlayback';
import { ClubMatchRecord } from './ClubMatchRecord';
import { MatchGuide, type MatchPhase } from './MatchGuide';
import { MatchStep } from './MatchStep';
import { basketballJerseys } from './jerseyNumbers';
import { useLiveMatch } from './useLiveMatch';

const MINUTE_MS = 1_800;
const QUARTER_MINUTES = BASKETBALL.minutes / 4;
const LAST_STEP = BASKETBALL.minutes + BASKETBALL.maxOvertimes * BASKETBALL.overtimeMinutes;

const clockText = (minute: number): string => {
  if (minute <= BASKETBALL.minutes) return t('club.match.quarter').replace('{quarter}', `${Math.max(1, Math.ceil(minute / QUARTER_MINUTES))}`).replace('{minute}', `${minute}`);
  return t('club.match.overtime').replace('{number}', `${Math.ceil((minute - BASKETBALL.minutes) / BASKETBALL.overtimeMinutes)}`).replace('{minute}', `${minute}`);
};

export function BasketballMatchTab({ building }: { building: Building }) {
  const club = building.club!;
  const now = useGame(store => store.state.lastSeen);
  const minuteMs = MINUTE_MS / useStore(prefsStore, store => store.matchSpeed);
  const live = useLiveMatch(building.id, LAST_STEP, minuteMs);
  const fixture = club.championship && nextFixture(club.championship);
  const index = fixture ? club.championship!.fixtures.indexOf(fixture) : -1;
  const opponent = fixture ? club.championship!.opponents[fixture.opponent]! : null;
  const state = useMemo(() => (fixture && opponent ? playBasketball(club, opponent, fixtureSeedOf(club, index), live.decisions, live.step) : null), [club, fixture, opponent, index, live.decisions, live.step]);
  const jerseys = useMemo(() => (fixture && opponent ? basketballJerseys(startBasketball(club, opponent, fixtureSeedOf(club, index))) : new Map<number, number>()), [club, fixture, opponent, index]);
  const over = state?.over ?? false;
  const { playing, skip } = live;

  useEffect(() => {
    if (over && playing) skip();
  }, [over, playing, skip]);

  if (!fixture || !opponent || !state) return <p className="note note--muted">{t('club.match.none')}</p>;
  if (now < fixture.at) return <p className="note note--muted">{t('club.match.next').replace('{opponent}', opponent.name).replace('{hours}', `${Math.ceil((fixture.at - now) / 3_600_000)}`)}</p>;
  const phase: MatchPhase = over ? 'finished' : live.playing ? 'playing' : live.step > 0 ? 'paused' : 'ready';
  return (
    <>
      <MatchGuide phase={phase} sport="basketball" recorded={live.recorded} />
      <h3>{state.sides[0].name} {state.score[0]} – {state.score[1]} {opponent.name}</h3>
      <p>{clockText(state.minute)}</p>
      <BasketballCourt state={state} seed={fixtureSeedOf(club, index)} minuteMs={minuteMs} jerseys={jerseys} />
      <MatchStep number={1} title={t('club.step.watch')}>
        <ClubMatchPlayback live={live} durationMs={BASKETBALL.minutes * minuteMs} finished={over} lastStep={BASKETBALL.minutes} />
      </MatchStep>
      <MatchStep number={2} title={t('club.step.decide')} hint={t(over ? 'club.match.decideClosed' : 'club.match.decideHintBasketball')}>
        {over ? null : <BasketballMatchControls state={state} jerseys={jerseys} onDecide={live.decide} />}
      </MatchStep>
      <MatchStep number={3} title={t('club.step.record')} hint={t('club.match.recordHint')}>
        <ClubMatchRecord live={live} />
      </MatchStep>
      <BasketballFeed events={state.events} />
    </>
  );
}
