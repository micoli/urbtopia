import { dispatch, type Command } from '../core';
import { gameStore } from '../store/gameStore';
import { describeProgress, isGoalReached, playTurn, type Player } from './autoplayer';

const FRAME_BUDGET_MS = 12;
const MAX_TURNS = 200_000;

export function installSimulation(): void {
  const overlay = document.createElement('div');
  overlay.className = 'sim-overlay';
  document.body.appendChild(overlay);

  let state = gameStore.getState().state;
  const now = state.lastSeen;
  const player: Player = {
    state: () => state,
    send: (command: Command) => {
      const result = dispatch(state, command, now);
      if (!result.ok) return result.error.key;
      state = result.state;
      return null;
    },
  };

  let turns = 0;
  let hours = 0;
  const report = (label: string) => {
    overlay.textContent = `${label} · ${hours.toFixed(0)} game h · ${turns} turns · ${describeProgress(state)}`;
  };

  const frame = (): void => {
    const deadline = performance.now() + FRAME_BUDGET_MS;
    while (!isGoalReached(state) && turns < MAX_TURNS && performance.now() < deadline) {
      hours += playTurn(player);
      turns++;
    }
    gameStore.getState().replaceState(state, 'command');
    if (isGoalReached(state)) return report('Simulation done');
    if (turns >= MAX_TURNS) return report('Simulation stuck');
    report('Simulating');
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
