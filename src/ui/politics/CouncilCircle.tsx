import { FACTION_IDS, type FactionId, type FactionVote } from '../../core';
import { t } from '../../i18n/t';
import { seatFactions, seatPositions } from './councilSeats';

interface CouncilCircleProps {
  seats: Readonly<Record<FactionId, number>>;
  // When given, a seat that votes against is drawn hollow.
  votes?: readonly FactionVote[];
  size?: number;
}

const RADIUS = 36;
const SEAT_SIZE = 7;
const CENTER = 50;

function Seat({ faction, x, y, hollow }: { faction: FactionId; x: number; y: number; hollow: boolean }) {
  const common = { 'data-faction': faction, 'data-vote': hollow ? 'against' : 'for', className: 'council-seat' };
  if (faction === 'economy') return <circle {...common} cx={x} cy={y} r={SEAT_SIZE / 2} />;
  if (faction === 'environment') return <rect {...common} x={x - SEAT_SIZE / 2} y={y - SEAT_SIZE / 2} width={SEAT_SIZE} height={SEAT_SIZE} />;
  const half = SEAT_SIZE / 2;
  return <polygon {...common} points={`${x},${y - half - 0.5} ${x + half + 0.5},${y + half} ${x - half - 0.5},${y + half}`} />;
}

export function CouncilCircle({ seats, votes, size = 160 }: CouncilCircleProps) {
  const factions = seatFactions(seats);
  const positions = seatPositions(factions.length, RADIUS);
  const voteOf = (faction: FactionId) => votes?.find(vote => vote.faction === faction)?.vote;
  const detail = FACTION_IDS.map(faction => `${t(`faction.${faction}`)} ${seats[faction]}`).join(', ');
  return (
    <svg className="council-circle" viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={t('politics.council.label').replace('{seats}', String(factions.length)).replace('{detail}', detail)}>
      <circle className="council-ring" cx={CENTER} cy={CENTER} r={RADIUS} />
      <g transform={`translate(${CENTER} ${CENTER})`}>
        {factions.map((faction, index) => <Seat key={index} faction={faction} x={positions[index]!.x} y={positions[index]!.y} hollow={voteOf(faction) === 'against'} />)}
      </g>
    </svg>
  );
}
