import type { CSSProperties } from 'react';
import type { BasketballState } from '../../core';
import { t } from '../../i18n/t';
import { COURT, HOOP_X, ballSpot, courtPlayers, isScoreEvent } from './courtLayout';
import type { Jerseys } from './jerseyNumbers';

interface BasketballCourtProps {
  state: BasketballState;
  seed: number;
  minuteMs: number;
  jerseys: Jerseys;
}

const KEY = { depth: 19, width: 16 };
const CIRCLE_RADIUS = 6;
const THREE_RADIUS = 23.75;

export function BasketballCourt({ state, seed, minuteMs, jerseys }: BasketballCourtProps) {
  const ball = ballSpot(state, seed);
  const scoring = state.events.some(event => event.minute === state.minute && isScoreEvent(event));
  return (
    <svg className="club-court" viewBox={`0 0 ${COURT.width} ${COURT.height}`} role="img" aria-label={t('club.court')} style={{ '--club-minute': `${minuteMs}ms` } as CSSProperties}>
      <rect className="club-court__floor" x={0} y={0} width={COURT.width} height={COURT.height} />
      {[0, 1].map(end => {
        const sign = end === 0 ? 1 : -1;
        const edge = end === 0 ? 0 : COURT.width;
        return (
          <g key={end}>
            <rect className="club-court__key" x={end === 0 ? 0 : COURT.width - KEY.depth} y={(COURT.height - KEY.width) / 2} width={KEY.depth} height={KEY.width} />
            <path className="club-court__lines" d={`M ${edge + sign * HOOP_X} ${COURT.height / 2 - THREE_RADIUS} A ${THREE_RADIUS} ${THREE_RADIUS} 0 0 ${end === 0 ? 1 : 0} ${edge + sign * HOOP_X} ${COURT.height / 2 + THREE_RADIUS}`} />
            <circle className="club-court__lines" cx={edge + sign * KEY.depth} cy={COURT.height / 2} r={CIRCLE_RADIUS} />
            <circle className="club-court__hoop" cx={edge + sign * HOOP_X} cy={COURT.height / 2} r={0.9} />
          </g>
        );
      })}
      <g className="club-court__lines">
        <rect x={0} y={0} width={COURT.width} height={COURT.height} />
        <line x1={COURT.width / 2} y1={0} x2={COURT.width / 2} y2={COURT.height} />
        <circle cx={COURT.width / 2} cy={COURT.height / 2} r={CIRCLE_RADIUS} />
      </g>
      {courtPlayers(state, seed, jerseys).map(player => (
        <g key={`${player.side}-${player.slot}`} className={`club-court__player club-court__player--${player.side === 0 ? 'home' : 'away'}`} style={{ transform: `translate(${player.x}px, ${player.y}px)` }}>
          <title>{player.name}</title>
          <circle r={2.2} />
          <text y={0.8}>{player.number}</text>
        </g>
      ))}
      <circle className={scoring ? 'club-court__ball club-court__ball--score' : 'club-court__ball'} style={{ transform: `translate(${ball.x}px, ${ball.y}px)` }} r={1.1} />
    </svg>
  );
}
