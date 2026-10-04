import type { Building, CasinoGame } from '../../core';
import { BlackjackGame } from './games/blackJack/BlackjackGame.tsx';
import { BlockmatchGame } from './games/blockMatch/BlockmatchGame.tsx';
import { SlotMachineGame } from './games/slotMachineGame/SlotMachineGame.tsx';

interface CasinoGameViewProps {
  game: CasinoGame;
  casino: Building;
}

export function CasinoGameView({ game, casino }: CasinoGameViewProps) {
  if (game === 'slotMachine') return <SlotMachineGame casino={casino} />;
  if (game === 'blackjack') return <BlackjackGame casino={casino} />;
  return <BlockmatchGame casino={casino} />;
}
