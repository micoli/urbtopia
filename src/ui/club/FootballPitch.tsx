import type { Formation, MatchState } from '../../core';
import { t } from '../../i18n/t';
import { PITCH, ballSpot, pitchPlayers } from './pitchLayout';

interface FootballPitchProps {
  state: MatchState;
  formation: Formation;
  seed: number;
}

const GOAL_DEPTH = 2;
const BOX = { depth: 16.5, height: 40.3 };
const CENTRE_RADIUS = 9.15;

export function FootballPitch({ state, formation, seed }: FootballPitchProps) {
  const ball = ballSpot(state, seed);
  const scoring = state.events.some(event => event.type === 'goal' && event.minute === state.minute);
  return (
    <svg className="club-pitch" viewBox={`${-GOAL_DEPTH} 0 ${PITCH.width + 2 * GOAL_DEPTH} ${PITCH.height}`} role="img" aria-label={t('club.pitch')}>
      <rect className="club-pitch__grass" x={-GOAL_DEPTH} y={0} width={PITCH.width + 2 * GOAL_DEPTH} height={PITCH.height} />
      {Array.from({ length: 7 }, (_, index) => <rect key={index} className="club-pitch__stripe" x={(index * 2 * PITCH.width) / 14} y={0} width={PITCH.width / 14} height={PITCH.height} />)}
      <g className="club-pitch__lines">
        <rect x={0} y={0} width={PITCH.width} height={PITCH.height} />
        <line x1={PITCH.width / 2} y1={0} x2={PITCH.width / 2} y2={PITCH.height} />
        <circle cx={PITCH.width / 2} cy={PITCH.height / 2} r={CENTRE_RADIUS} />
        <rect x={0} y={(PITCH.height - BOX.height) / 2} width={BOX.depth} height={BOX.height} />
        <rect x={PITCH.width - BOX.depth} y={(PITCH.height - BOX.height) / 2} width={BOX.depth} height={BOX.height} />
        <rect x={-GOAL_DEPTH} y={PITCH.height / 2 - 3.66} width={GOAL_DEPTH} height={7.32} />
        <rect x={PITCH.width} y={PITCH.height / 2 - 3.66} width={GOAL_DEPTH} height={7.32} />
      </g>
      {pitchPlayers(state, formation, seed).map(player => (
        <g key={`${player.side}-${player.number}`} className={`club-pitch__player club-pitch__player--${player.side === 0 ? 'home' : 'away'}`} style={{ transform: `translate(${player.x}px, ${player.y}px)` }}>
          <title>{player.name}</title>
          <circle r={1.9} />
          <text y={0.7}>{player.number}</text>
        </g>
      ))}
      <circle className={scoring ? 'club-pitch__ball club-pitch__ball--goal' : 'club-pitch__ball'} style={{ transform: `translate(${ball.x}px, ${ball.y}px)` }} r={0.9} />
    </svg>
  );
}
