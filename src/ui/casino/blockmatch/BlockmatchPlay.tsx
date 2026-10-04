import { useEffect, useMemo, useRef, useState } from 'react';
import { blockmatchLevelNumber, blockmatchSeed, generateBlockmatchLevel } from '../../../core';
import type { Move } from '../../../core/leisure/blockmatch/types';
import { gameStore } from '../../../store/gameStore';
import { BlockmatchBoard } from './BlockmatchBoard';
import { BlockmatchHud } from './BlockmatchHud';
import { useBlockmatch } from './useBlockmatch';

const HINT_DELAY_MS = 5000;

interface BlockmatchPlayProps {
  buildingId: number;
  tier: number;
  roundSeed: number;
}

export function BlockmatchPlay({ buildingId, tier, roundSeed }: BlockmatchPlayProps) {
  const level = useMemo(() => generateBlockmatchLevel(blockmatchSeed(roundSeed), blockmatchLevelNumber(tier)), [roundSeed, tier]);
  return <BlockmatchRound key={roundSeed} buildingId={buildingId} level={level} />;
}

interface BlockmatchRoundProps {
  buildingId: number;
  level: ReturnType<typeof generateBlockmatchLevel>;
}

function BlockmatchRound({ buildingId, level }: BlockmatchRoundProps) {
  const game = useBlockmatch(level);
  const [hint, setHint] = useState<Move | null>(null);
  const settled = useRef(false);
  useEffect(() => {
    setHint(null);
    if (game.busy || game.status !== 'playing') return undefined;
    const timer = setTimeout(() => setHint(game.hint()), HINT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [game.board, game.busy, game.status]);
  useEffect(() => {
    if (game.status === 'playing' || settled.current) return;
    settled.current = true;
    gameStore.getState().send({ type: 'SettleBlockmatch', buildingId, stars: game.status === 'won' ? game.stars : 0 });
  }, [game.status, game.stars, buildingId]);

  return (
    <div className="blockmatch casino-game">
      <BlockmatchHud movesLeft={game.movesLeft} goals={game.goals} />
      <BlockmatchBoard board={game.board} hint={hint} effects={game.effects} speed={1} disabled={game.busy || game.status !== 'playing'} onSwap={game.swap} onActivate={game.activate} />
    </div>
  );
}
