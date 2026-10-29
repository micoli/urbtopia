import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type Building, type GameState } from '../index';
import { ARTISTS, ARTIST_OFFER_SIZE, MAX_FAME, artistById, artistOffer, fameCeiling, feeOfArtist, qualityOfFame, ticketBoostOfFame } from './artists';

const homes = (count: number): Building[] => Array.from({ length: count }, (_, index) => ({ ...createBuilding(10 + index, 'home', 30 + 4 * (index % 20), 30 + 4 * Math.floor(index / 20), 0), tier: 8 }));
const city = (count: number): GameState => ({ ...newGame({ seed: 'artists', now: 0 }), buildings: [createBuilding(1, 'concertHall', 60, 60, 0), ...homes(count)] });
const hall = (state: GameState) => state.buildings[0]!;

describe('Artists data', () => {
  it('lists 100 distinct invented names, solo and groups, of Fame 1 to 5', () => {
    expect(ARTISTS).toHaveLength(100);
    expect(new Set(ARTISTS.map(artist => artist.name.toLowerCase())).size).toBe(100);
    expect(new Set(ARTISTS.map(artist => artist.id)).size).toBe(100);
    expect(ARTISTS.every(artist => artist.fame >= 1 && artist.fame <= MAX_FAME)).toBe(true);
    expect(ARTISTS.filter(artist => artist.kind === 'solo')).toHaveLength(50);
    expect(ARTISTS.filter(artist => artist.fame === MAX_FAME).length).toBeGreaterThanOrEqual(3);
  });

  it('finds an Artist by id', () => {
    expect(artistById('artist-001')?.id).toBe('artist-001');
    expect(artistById('nobody')).toBeUndefined();
  });
});

describe('Fame ceiling', () => {
  it('stays within 1 and the maximum, and grows with the population', () => {
    const ceilings = [0, 20, 100, 400].map(count => fameCeiling(city(count)));
    expect(ceilings[0]).toBeGreaterThanOrEqual(1);
    expect(ceilings.at(-1)).toBeLessThanOrEqual(MAX_FAME);
    expect(ceilings).toEqual([...ceilings].sort((a, b) => a - b));
    expect(ceilings.at(-1)).toBeGreaterThan(ceilings[0]!);
  });
});

describe('Artist offer', () => {
  it('has three distinct Artists, none above the ceiling', () => {
    for (const count of [0, 100, 400]) {
      const state = city(count);
      const offer = artistOffer(state, hall(state));
      expect(offer).toHaveLength(ARTIST_OFFER_SIZE);
      expect(new Set(offer.map(artist => artist.id)).size).toBe(ARTIST_OFFER_SIZE);
      expect(offer.every(artist => artist.fame <= fameCeiling(state))).toBe(true);
    }
  });

  it('is the same for the same building and Show count, and changes with the next Show', () => {
    const state = city(100);
    expect(artistOffer(state, hall(state)).map(artist => artist.id)).toEqual(artistOffer(state, hall(state)).map(artist => artist.id));
    const later = { ...hall(state), attraction: { takings: 0, shows: 1 } };
    expect(artistOffer(state, later).map(artist => artist.id)).not.toEqual(artistOffer(state, hall(state)).map(artist => artist.id));
  });
});

describe('Fame effects', () => {
  it('raises the quality, the Ticket and the fee with Fame', () => {
    const [low, high] = [ARTISTS.find(artist => artist.fame === 1)!, ARTISTS.find(artist => artist.fame === 5)!];
    expect(qualityOfFame(5)).toBeGreaterThan(qualityOfFame(1));
    expect(ticketBoostOfFame(5)).toBeGreaterThan(ticketBoostOfFame(1));
    expect(feeOfArtist(high)).toBeGreaterThan(feeOfArtist(low));
  });
});
