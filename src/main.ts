import { generateSeed, newGame } from './core';

const now = Date.now();
const state = newGame({ seed: generateSeed(now), now });
document.getElementById('app')!.textContent = `Urbtopia: ${state.urbs} Urbs (${state.seed})`;
