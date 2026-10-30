import type { BaseballState } from '../../core';
import { t } from '../../i18n/t';
import { baseballEventText } from './BaseballFeed';
import { BASES, FIELD, HOME, MOUND, ballSpot, fieldersOf, isPlay, runnerSpots } from './fieldLayout';

interface BaseballFieldProps {
  state: BaseballState;
  seed: number;
  shown: number;
}

const place = ({ x, y }: { x: number; y: number }) => ({ transform: `translate(${x}px, ${y}px)` });

export function BaseballField({ state, seed, shown }: BaseballFieldProps) {
  const plays = state.events.filter(isPlay);
  const play = shown > 0 ? plays[shown - 1] : undefined;
  const batting = play?.side ?? 1;
  const defence = state.sides[batting === 0 ? 1 : 0];
  const ball = ballSpot(play, seed, shown);
  const fielders = fieldersOf(defence, ball, seed, shown);
  const runners = runnerSpots(play?.bases ?? []);
  return (
    <figure className="club-field">
      <svg viewBox={`0 0 ${FIELD} ${FIELD}`} role="img" aria-label={t('club.field')}>
        <rect className="club-field__grass" width={FIELD} height={FIELD} />
        <path className="club-field__fence" d="M 4 62 A 62 62 0 0 1 96 62" />
        <polygon className="club-field__dirt" points={`${HOME.x},${HOME.y + 6} ${BASES[0]!.x + 8},${BASES[0]!.y} ${BASES[1]!.x},${BASES[1]!.y - 8} ${BASES[2]!.x - 8},${BASES[2]!.y}`} />
        <polygon className="club-field__infield" points={`${HOME.x},${HOME.y} ${BASES[0]!.x},${BASES[0]!.y} ${BASES[1]!.x},${BASES[1]!.y} ${BASES[2]!.x},${BASES[2]!.y}`} />
        <circle className="club-field__mound" cx={MOUND.x} cy={MOUND.y} r={3} />
        {BASES.map((base, index) => <rect key={index} className={runners.includes(base) ? 'club-field__base club-field__base--taken' : 'club-field__base'} x={base.x - 1.8} y={base.y - 1.8} width={3.6} height={3.6} transform={`rotate(45 ${base.x} ${base.y})`} />)}
        <polygon className="club-field__base" points={`${HOME.x - 1.8},${HOME.y - 1.2} ${HOME.x + 1.8},${HOME.y - 1.2} ${HOME.x + 1.8},${HOME.y + 0.6} ${HOME.x},${HOME.y + 2} ${HOME.x - 1.8},${HOME.y + 0.6}`} />
        {fielders.map(player => (
          <g key={player.number} className={`club-field__player club-field__player--${batting === 0 ? 'away' : 'home'}`} style={place(player)}>
            <title>{player.name}</title>
            <circle r={2.4} />
            <text y={0.9}>{player.number}</text>
          </g>
        ))}
        {runners.map((runner, index) => <circle key={index} className={`club-field__runner club-field__runner--${batting === 0 ? 'home' : 'away'}`} style={place({ x: runner.x, y: runner.y + 4 })} r={2} />)}
        {play ? <circle className={`club-field__batter club-field__runner--${batting === 0 ? 'home' : 'away'}`} style={place({ x: HOME.x - 5, y: HOME.y + 1 })} r={2} /> : null}
        <circle className={play?.type === 'homer' ? 'club-field__ball club-field__ball--homer' : 'club-field__ball'} style={place(ball)} r={1.2} />
      </svg>
      <figcaption>
        {play ? <>{play.inning}{play.half === 0 ? '▲' : '▼'} · {t('club.outs').replace('{count}', `${play.outs}`)} · {baseballEventText(play)}</> : t('club.field.empty')}
      </figcaption>
    </figure>
  );
}
