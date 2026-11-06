import { useMemo } from 'react';
import { useStore } from 'zustand';
import { FOOTBALL, effectiveLineup, fixtureSeedOf, isFormation, nextFixture, playUntil, startMatch, type Building } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { ClubMatchControls } from './ClubMatchControls';
import { ClubMatchFeed } from './ClubMatchFeed';
import { ClubMatchPlayback } from './ClubMatchPlayback';
import { ClubMatchRecord } from './ClubMatchRecord';
import { FootballPitch } from './FootballPitch';
import { MatchGuide, type MatchPhase } from './MatchGuide';
import { MatchStep } from './MatchStep';
import { footballJerseys } from './jerseyNumbers';
import { useLiveMatch } from './useLiveMatch';

const MINUTE_MS = 1_000;

const phaseOf = (live: ReturnType<typeof useLiveMatch>): MatchPhase => (live.finished ? 'finished' : live.playing ? 'playing' : live.step > 0 ? 'paused' : 'ready');

const formationOf = (club: NonNullable<Building['club']>) => {
  const { formation } = effectiveLineup(club);
  return isFormation(formation) ? formation : FOOTBALL.defaultFormation;
};

export function ClubMatchTab({ building }: { building: Building }) {
  const club = building.club!;
  const now = useGame(store => store.state.lastSeen);
  const minuteMs = MINUTE_MS / useStore(prefsStore, store => store.matchSpeed);
  const live = useLiveMatch(building.id, FOOTBALL.minutes, minuteMs);
  const fixture = club.championship && nextFixture(club.championship);
  const index = fixture ? club.championship!.fixtures.indexOf(fixture) : -1;
  const opponent = fixture ? club.championship!.opponents[fixture.opponent]! : null;
  const state = useMemo(() => (fixture && opponent ? playUntil(club, opponent, fixtureSeedOf(club, index), live.decisions, live.step) : null), [club, fixture, opponent, index, live.decisions, live.step]);

  const jerseys = useMemo(() => (fixture && opponent ? footballJerseys(startMatch(club, opponent, fixtureSeedOf(club, index))) : new Map<number, number>()), [club, fixture, opponent, index]);

  if (!fixture || !opponent || !state) return <p className="note note--muted">{t('club.match.none')}</p>;
  if (now < fixture.at) return <p className="note note--muted">{t('club.match.next').replace('{opponent}', opponent.name).replace('{hours}', `${Math.ceil((fixture.at - now) / 3_600_000)}`)}</p>;
  return (
    <>
      <MatchGuide phase={phaseOf(live)} sport="football" recorded={live.recorded} />
      <h3>{state.sides[0].name} {state.score[0]} – {state.score[1]} {opponent.name}</h3>
      <p>{t('club.match.minute').replace('{minute}', `${state.minute}`)}</p>
      <FootballPitch state={state} formation={formationOf(club)} seed={fixtureSeedOf(club, index)} minuteMs={minuteMs} jerseys={jerseys} />
      <MatchStep number={1} title={t('club.step.watch')}>
        <ClubMatchPlayback live={live} durationMs={FOOTBALL.minutes * minuteMs} lastStep={FOOTBALL.minutes} />
      </MatchStep>
      <MatchStep number={2} title={t('club.step.decide')} hint={t(live.finished ? 'club.match.decideClosed' : 'club.match.decideHintFootball')}>
        {live.finished ? null : <ClubMatchControls state={state} jerseys={jerseys} onDecide={live.decide} />}
      </MatchStep>
      <MatchStep number={3} title={t('club.step.record')} hint={t('club.match.recordHint')}>
        <ClubMatchRecord live={live} />
      </MatchStep>
      <ClubMatchFeed events={state.events} />
    </>
  );
}
