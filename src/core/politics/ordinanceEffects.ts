import type { GameState } from '../engine/state';
import type { OrdinanceEffect } from './ordinanceSchema';
import { ordinanceById } from './ordinances';
import { isPoliticsActive } from './politicsGate';

type EffectOfKind<Kind extends OrdinanceEffect['kind']> = Extract<OrdinanceEffect, { kind: Kind }>;

function effectsOf<Kind extends OrdinanceEffect['kind']>(state: GameState, kind: Kind): EffectOfKind<Kind>[] {
  if (!state.politics?.adopted.length || !isPoliticsActive(state)) return [];
  return state.politics.adopted.flatMap(id => {
    const { effect } = ordinanceById(id);
    return effect.kind === kind ? [effect as EffectOfKind<Kind>] : [];
  });
}

const product = (values: readonly number[]): number => values.reduce((total, value) => total * value, 1);

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

// Shares combine as the share that remains: two cuts of 10 % leave 81 %.
const combined = (shares: readonly number[]): number => 1 - product(shares.map(share => 1 - share));

export const taxMultiplierOf = (state: GameState): number => product(effectsOf(state, 'taxMultiplier').map(effect => effect.multiplier));

export const wasteReductionOf = (state: GameState): number => combined(effectsOf(state, 'wasteSorting').map(effect => effect.reduction));

export const greenBeltBonusOf = (state: GameState): number => sum(effectsOf(state, 'greenBelt').map(effect => effect.wellbeingBonus));

export const congestionReliefOf = (state: GameState): number => combined(effectsOf(state, 'transitSubsidy').map(effect => effect.congestionRelief));

export const energySavingOf = (state: GameState): number => combined(effectsOf(state, 'energySaving').map(effect => effect.demandReduction));

export const officeYieldMultiplierOf = (state: GameState): number => product(effectsOf(state, 'officeRelief').map(effect => effect.yieldMultiplier));

export const esteemBonusOf = (state: GameState): number => sum(effectsOf(state, 'culturalFestival').map(effect => effect.esteemBonus));
