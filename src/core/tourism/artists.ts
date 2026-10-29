import artistData from '../../../assets/defs/tourism/artists.json' with { type: 'json' };
import { citizensOf } from '../buildings/city';
import { isHomeType } from '../buildings/buildingDefinitions';
import type { Building, GameState } from '../engine/state';
import { cityBenefits } from '../environment/wellbeing';
import { hashSeed, nextRandom } from '../engine/random';
import type { Artist } from './artistSchema';

export const ARTISTS: readonly Artist[] = artistData.artists as Artist[];

export const MAX_FAME = 5;

export const ARTIST_OFFER_SIZE = 3;

export const ARTIST_RULES = {
  // Citizens at which the population alone allows the highest Fame.
  populationForMaxFame: 8000,
  // How much a Fame above 1 raises the crowd, the Ticket and the fee.
  ticketPerFame: 0.15,
  feePerFame: 0.5,
  feeBase: 100,
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const artistById = (id: string): Artist | undefined => ARTISTS.find(artist => artist.id === id);

// The highest Fame the city draws: the larger and the happier it is, the bigger the names that come.
export function fameCeiling(state: GameState): number {
  const citizens = state.buildings.reduce((total, building) => total + (isHomeType(building.type) ? citizensOf(building.tier) : 0), 0);
  const score = 0.5 * clamp01(cityBenefits(state).wellbeing / 100) + 0.5 * clamp01(citizens / ARTIST_RULES.populationForMaxFame);
  return Math.min(MAX_FAME, 1 + Math.floor(score * MAX_FAME));
}

// Three distinct Artists at or under the ceiling, drawn from the building and the number of Shows it has held.
export function artistOffer(state: GameState, building: Pick<Building, 'id' | 'attraction'>): Artist[] {
  const ceiling = fameCeiling(state);
  const pool = ARTISTS.filter(artist => artist.fame <= ceiling);
  let rng = hashSeed(`artists:${building.id}:${building.attraction?.shows ?? 0}`);
  const offer: Artist[] = [];
  while (offer.length < Math.min(ARTIST_OFFER_SIZE, pool.length)) {
    const draw = nextRandom(rng);
    rng = draw.rngState;
    const artist = pool[Math.floor(draw.value * pool.length)]!;
    if (!offer.includes(artist)) offer.push(artist);
  }
  return offer.sort((a, b) => a.id.localeCompare(b.id));
}

export const qualityOfFame = (fame: number): number => (fame - 1) / (MAX_FAME - 1);

export const ticketBoostOfFame = (fame: number): number => 1 + ARTIST_RULES.ticketPerFame * (fame - 1);

export const feeOfArtist = (artist: Artist): number => Math.ceil(ARTIST_RULES.feeBase * (1 + ARTIST_RULES.feePerFame * (artist.fame - 1)) * artist.fame);
