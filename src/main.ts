import { newGame } from './core';

const now = Date.now();
const state = newGame({ now });
document.getElementById('app')!.textContent = `Urbtopia: ${state.urbs} Urbs (${state.seed})`;
