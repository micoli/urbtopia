import { MARKET } from './economy';
import { GOODS, type GoodId } from './items';
import type { GameState } from './state';

export function marketPoints(state: GameState, good: GoodId, now: number): number {
  const price = state.market[good];
  if (!price) return MARKET.fullPoints;
  const recovered = ((MARKET.fullPoints - MARKET.floorPoints) * Math.max(0, now - price.updatedAt)) / MARKET.recoveryMs;
  return Math.min(MARKET.fullPoints, price.points + recovered);
}

export function marketQuote(state: GameState, good: GoodId, quantity: number, now: number): { total: number; endPoints: number } {
  let points = marketPoints(state, good, now);
  let sumOfPoints = 0;
  for (let unit = 0; unit < quantity; unit++) {
    sumOfPoints += points;
    points = Math.max(MARKET.floorPoints, points - MARKET.pointsLostPerUnit);
  }
  return { total: Math.floor((GOODS[good].value * sumOfPoints) / 100), endPoints: points };
}
