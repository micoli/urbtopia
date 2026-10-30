import { useMemo } from 'react';
import { useStore } from 'zustand';
import { BASEBALL, fixtureSeedOf, nextFixture, playBaseball, type Building } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { BaseballFeed } from './BaseballFeed';
import { BaseballField } from './BaseballField';
import { BaseballMatchControls } from './BaseballMatchControls';
import { ClubMatchBar } from './ClubMatchBar';
import { isPlay, replayUpTo } from './fieldLayout';
import { useEventCursor } from './useEventCursor';
import { useLiveMatch } from './useLiveMatch';

const INNING_MS = 10_000;
const PLAY_MS = 1_000;
const LAST_INNING = BASEBALL.innings + BASEBALL.extraInnings;

export function BaseballMatchTab({ building }: { building: Building }) {
  const club = building.club!;
  const now = useGame(store => store.state.lastSeen);
  const speed = useStore(prefsStore, store => store.matchSpeed);
  const inningMs = INNING_MS / speed;
  const live = useLiveMatch(building.id, LAST_INNING, inningMs);
  const fixture = club.championship && nextFixture(club.championship);
  const index = fixture ? club.championship!.fixtures.indexOf(fixture) : -1;
  const opponent = fixture ? club.championship!.opponents[fixture.opponent]! : null;
  const state = useMemo(() => (fixture && opponent ? playBaseball(club, opponent, fixtureSeedOf(club, index), live.decisions, live.step) : null), [club, fixture, opponent, index, live.decisions, live.step]);
  const total = state ? state.events.filter(isPlay).length : 0;
  const cursor = useEventCursor(total, PLAY_MS / speed, live.playing || live.finished);
  const shown = live.skipped ? total : cursor;

  if (!fixture || !opponent || !state) return <p className="note note--muted">{t('club.match.none')}</p>;
  if (now < fixture.at) return <p className="note note--muted">{t('club.match.next').replace('{opponent}', opponent.name).replace('{hours}', `${Math.ceil((fixture.at - now) / 3_600_000)}`)}</p>;
  const replay = replayUpTo(state, shown);
  return (
    <>
      <h3>{state.sides[0].name} {replay.score[0]} – {replay.score[1]} {opponent.name}</h3>
      <p>{t('club.match.inning').replace('{inning}', `${replay.inning}`)}</p>
      <ClubMatchBar live={live} durationMs={BASEBALL.innings * inningMs} finished={state.over && shown >= total} />
      <BaseballField state={state} seed={fixtureSeedOf(club, index)} shown={shown} />
      {state.over ? null : <BaseballMatchControls state={state} onDecide={live.decide} />}
      <BaseballFeed events={replay.events} />
    </>
  );
}
