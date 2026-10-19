import type { CommandGateway } from './commandGateway';
import { casinoStore } from './casinoStore';
import { harvestEffects } from './harvestEffects';

export function installEventEffects(gateway: CommandGateway): () => void {
  const disposers = [
    gateway.onEvent('CropsHarvested', (event) => harvestEffects.getState().show(event.tiles)),
    gateway.onEvent('SlotSpun', (event) => {
      casinoStore.getState().record(event.stake, event.payout);
      casinoStore.getState().showSpin(event);
    }),
    gateway.onEvent('CasinoRoundStarted', (event) => {
      casinoStore.getState().record(event.stake, 0);
      casinoStore.getState().startRound(event);
    }),
    gateway.onEvent('BlackjackSettled', (event) => {
      casinoStore.getState().record(event.doubled ? event.stake : 0, event.payout);
      casinoStore.getState().settleRound(event);
    }),
    gateway.onEvent('BlockmatchSettled', (event) => {
      casinoStore.getState().record(0, event.payout);
      casinoStore.getState().settleRound(event);
    }),
  ];
  return () => disposers.forEach((dispose) => dispose());
}
