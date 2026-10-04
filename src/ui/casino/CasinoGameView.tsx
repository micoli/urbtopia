import type { Building, CasinoGame } from '../../core';
import { BlackjackGame } from './BlackjackGame';
import { BlockmatchGame } from './BlockmatchGame';
import { SlotMachineGame } from './SlotMachineGame';

interface CasinoGameViewProps {
  game: CasinoGame;
  casino: Building;
}

export function CasinoGameView({ game, casino }: CasinoGameViewProps) {
  if (game === 'slotMachine') return <SlotMachineGame casino={casino} />;
  if (game === 'blackjack') return <BlackjackGame casino={casino} />;
  return <BlockmatchGame casino={casino} />;
}
